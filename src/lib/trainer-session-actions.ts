"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { getVideoProvider } from "@/lib/video/provider";
import { getTrainerSessionRow } from "@/lib/data/queries";
import { createPurchaseAndCheckout, refundPurchase } from "@/lib/purchases";
import { notifyLiveCallStarted } from "@/lib/notifications";
import type { TrainerSessionMode } from "@/lib/data/types";

/**
 * Trainer creates a new GROUP session. Members can join up to capacity, and
 * everyone shares one Daily room (provisioned lazily on first join).
 */
export async function createGroupSessionAction(formData: FormData) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/sessions/new");

  const startsAtRaw = String(formData.get("starts_at") ?? "").trim();
  const endsAtRaw = String(formData.get("ends_at") ?? "").trim();
  const mode = String(formData.get("mode") ?? "video") as TrainerSessionMode;
  const capacity = Math.max(2, Number(formData.get("capacity") ?? 2));
  // Accept dollar input (preferred), fall back to cents for back-compat.
  const priceDollarsRaw = formData.get("price_dollars");
  const priceCents = priceDollarsRaw != null
    ? Math.max(0, Math.round(Number(priceDollarsRaw) * 100))
    : Math.max(0, Number(formData.get("price_cents") ?? 0));
  const title = String(formData.get("title") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const routineSlug = String(formData.get("routine_slug") ?? "").trim() || null;

  if (!startsAtRaw || !endsAtRaw) {
    redirect(`/trainer/sessions/new?error=${encodeURIComponent("Start and end time required")}`);
  }

  // <input type="datetime-local"> values are local-naive (no timezone).
  // new Date(...) parses them in the runtime's local zone — same convention
  // as the rest of trainer scheduling (see trainer-availability.ts header).
  const startsAt = new Date(startsAtRaw).toISOString();
  const endsAt = new Date(endsAtRaw).toISOString();
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    redirect(`/trainer/sessions/new?error=${encodeURIComponent("End must be after start")}`);
  }

  const sb = createClient();
  const insert = await sb
    .from("trainer_sessions")
    .insert({
      trainer_id: trainer.id,
      starts_at: startsAt,
      ends_at: endsAt,
      mode,
      capacity,
      price_cents: priceCents,
      status: "open",
      is_group: true,
      title,
      description,
      routine_slug: routineSlug,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data) {
    const msg = insert.error?.message?.includes("duplicate") || insert.error?.code === "23505"
      ? "You already have a session at that start time."
      : "Could not create session. Please try again.";
    redirect(`/trainer/sessions/new?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/trainer/dashboard");
  revalidatePath(`/trainers/${trainer.slug}`);
  revalidatePath(`/trainers/${trainer.slug}/book`);
  redirect("/trainer/dashboard?group_created=1");
}

/**
 * Trainer cancels a group session. All confirmed/pending bookings get
 * refunded and flipped to cancelled; the Daily room (if provisioned) is
 * destroyed. Idempotent on the room teardown.
 */
export async function cancelGroupSessionAction(formData: FormData) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/dashboard");

  const sessionId = String(formData.get("session_id") ?? "");
  if (!sessionId) redirect("/trainer/dashboard?error=missing_id");

  const session = await getTrainerSessionRow(sessionId);
  if (!session || session.trainer_id !== trainer.id) {
    redirect("/trainer/dashboard?error=unauthorized");
  }

  const sb = createClient();
  const admin = createAdminClient();

  // Mark the session cancelled first so the slot frees up for new bookings.
  await sb
    .from("trainer_sessions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  // Refund + cancel every active attendee.
  const { data: bookings } = await sb
    .from("trainer_bookings")
    .select("*")
    .eq("session_id", sessionId)
    .in("status", ["pending_trainer", "confirmed"]);

  for (const b of (bookings as Array<{ id: string; paid_status: string }>) ?? []) {
    if (b.paid_status === "paid") {
      const { data: purchase } = await admin
        .from("purchases")
        .select("id")
        .eq("trainer_booking_id", b.id)
        .maybeSingle();
      if (purchase) {
        await refundPurchase((purchase as { id: string }).id, { reason: "requested_by_customer" });
      }
    }
    await sb
      .from("trainer_bookings")
      .update({
        status: "cancelled",
        paid_status: b.paid_status === "paid" ? "refunded" : b.paid_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", b.id);
  }

  if (session.video_room_name) {
    await getVideoProvider().destroyRoom(session.video_room_name);
  }

  revalidatePath("/trainer/dashboard");
  revalidatePath(`/trainers/${trainer.slug}/book`);
  revalidatePath("/account/sessions");
  redirect("/trainer/dashboard?group_cancelled=1");
}

/**
 * Member joins a group session. Auto-confirms (no per-attendee accept), then
 * funnels through Stripe via createPurchaseAndCheckout. The Daily room is
 * provisioned lazily on the first attendee — subsequent attendees reuse it.
 */
export async function joinGroupSessionAction(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  const trainerSlug = String(formData.get("trainer_slug") ?? "");
  const goals = String(formData.get("goals") ?? "").trim() || null;

  if (!sessionId) {
    redirect(`/trainers/${trainerSlug}/book?error=${encodeURIComponent("Missing session id")}`);
  }

  const user = await getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/trainers/${trainerSlug}/book`)}`);
  }

  const sb = createClient();
  const session = await getTrainerSessionRow(sessionId);
  if (!session || !session.is_group || session.status !== "open") {
    redirect(`/trainers/${trainerSlug}/book?error=${encodeURIComponent("Session not available")}`);
  }

  // Capacity gate. Counted against pending+confirmed, same set the unique
  // index `idx_trainer_bookings_one_per_user_per_session` enforces against.
  const { data: existing } = await sb
    .from("trainer_bookings")
    .select("id, user_id, status")
    .eq("session_id", sessionId)
    .in("status", ["pending_trainer", "confirmed"]);
  const rows = (existing as Array<{ id: string; user_id: string; status: string }>) ?? [];
  if (rows.length >= session!.capacity) {
    redirect(`/trainers/${trainerSlug}/book?error=${encodeURIComponent("Session is full")}`);
  }
  if (rows.some(r => r.user_id === user!.id)) {
    redirect(`/trainers/${trainerSlug}/book?error=${encodeURIComponent("You already booked this session")}`);
  }

  const requiresPayment = session!.price_cents > 0;
  const paid_status = requiresPayment ? "pending" : "free";

  const insert = await sb
    .from("trainer_bookings")
    .insert({
      trainer_id: session!.trainer_id,
      user_id: user!.id,
      session_id: session!.id,
      starts_at: session!.starts_at,
      ends_at: session!.ends_at,
      mode: session!.mode,
      location_id: session!.location_id,
      // Group sessions auto-confirm — no per-attendee accept/reject loop.
      status: "confirmed",
      paid_status,
      price_cents: session!.price_cents,
      client_goals: goals,
      routine_slug: session!.routine_slug,
    })
    .select("*")
    .single();

  if (insert.error || !insert.data) {
    redirect(`/trainers/${trainerSlug}/book?error=${encodeURIComponent("Could not join session.")}`);
  }
  const booking = insert.data as { id: string };

  // Lazy room provisioning: only the first joiner triggers the Daily call.
  if (session!.mode === "video" && !session!.video_room_url) {
    const room = await getVideoProvider().createRoom({
      bookingId: session!.id,
      startsAt: new Date(session!.starts_at),
      endsAt: new Date(session!.ends_at),
      label: `Element 78 Group Session`,
    });
    await sb
      .from("trainer_sessions")
      .update({
        video_provider: room.provider,
        video_room_url: room.url,
        video_room_name: room.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session!.id);
  }

  // If the new booking exactly fills the session, flip it to full so the
  // booking page stops listing it. The trainer can still cancel.
  if (rows.length + 1 >= session!.capacity) {
    await sb
      .from("trainer_sessions")
      .update({ status: "full", updated_at: new Date().toISOString() })
      .eq("id", session!.id);
  }

  revalidatePath(`/trainers/${trainerSlug}/book`);
  revalidatePath("/trainer/dashboard");
  revalidatePath("/account/sessions");

  if (!requiresPayment) {
    redirect(`/account/sessions?booked=${booking.id}`);
  }

  const { checkoutUrl } = await createPurchaseAndCheckout({
    userId: user!.id,
    kind: "trainer_booking",
    amountCents: session!.price_cents,
    description: `Group session · ${session!.title ?? "trainer-led"}`,
    refIds: { trainer_booking_id: booking.id },
    successPath: `/account/sessions?booked=${booking.id}`,
    cancelPath: `/trainers/${trainerSlug}/book`,
    trainerId: session!.trainer_id,
  });
  redirect(checkoutUrl);
}

/**
 * Trainer hits START SESSION on a group. Provisions the Daily room if it
 * isn't already there, stamps `live_started_at = now()` on the parent and
 * fans the same timestamp out to every attendee booking — that's the signal
 * the member's IncomingCallAlert is subscribed to. Idempotent: if a session
 * was already started, just refreshes the timestamp without resetting room
 * state. Redirects the coach into the embedded session room.
 */
export async function startGroupSessionAction(formData: FormData) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/dashboard");

  const sessionId = String(formData.get("session_id") ?? "");
  if (!sessionId) redirect("/trainer/dashboard?error=missing_id");

  const session = await getTrainerSessionRow(sessionId);
  if (!session || session.trainer_id !== trainer.id) {
    redirect("/trainer/dashboard?error=unauthorized");
  }

  const sb = createClient();

  // Provision the Daily room if no attendee has triggered the lazy create yet.
  let videoFields: { video_provider: string | null; video_room_url: string | null; video_room_name: string | null } | null = null;
  if (session.mode === "video" && !session.video_room_url) {
    const room = await getVideoProvider().createRoom({
      bookingId: session.id,
      startsAt: new Date(session.starts_at),
      endsAt: new Date(session.ends_at),
      label: `Element 78 Group Session`,
    });
    videoFields = { video_provider: room.provider, video_room_url: room.url, video_room_name: room.name };
  }

  const liveStartedAt = new Date().toISOString();
  await sb
    .from("trainer_sessions")
    .update({
      live_started_at: liveStartedAt,
      updated_at: liveStartedAt,
      ...(videoFields ?? {}),
    })
    .eq("id", sessionId);

  // Fan out the start timestamp to every active attendee so members
  // subscribed to trainer_bookings get the realtime alert.
  await sb
    .from("trainer_bookings")
    .update({ live_started_at: liveStartedAt, updated_at: liveStartedAt })
    .eq("session_id", sessionId)
    .in("status", ["confirmed", "pending_trainer"]);

  // Persist a notification row per attendee so members without an open tab
  // still see the live call when they next open the app. The realtime
  // IncomingCallAlert handles the in-tab modal; this is the durable surface.
  const { data: attendees } = await sb
    .from("trainer_bookings")
    .select("id, user_id")
    .eq("session_id", sessionId)
    .in("status", ["confirmed", "pending_trainer"]);
  for (const a of (attendees as Array<{ id: string; user_id: string }> | null) ?? []) {
    await notifyLiveCallStarted({
      userId: a.user_id,
      bookingId: a.id,
      trainerName: trainer.name,
      sessionTitle: session.title ?? null,
    });
  }

  revalidatePath("/trainer/dashboard");
  revalidatePath(`/trainer/sessions/${sessionId}`);
  revalidatePath("/account/sessions");
  redirect(`/trainer/sessions/${sessionId}`);
}

/**
 * Trainer marks a group session complete. Flips parent session + every
 * attendee booking to completed, bridges program progress for any 1-on-1
 * program-session links, and tears down the Daily room.
 */
export async function completeGroupSessionAction(formData: FormData) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/dashboard");

  const sessionId = String(formData.get("session_id") ?? "");
  if (!sessionId) redirect("/trainer/dashboard?error=missing_id");

  const session = await getTrainerSessionRow(sessionId);
  if (!session || session.trainer_id !== trainer.id) {
    redirect("/trainer/dashboard?error=unauthorized");
  }

  const sb = createClient();
  const admin = createAdminClient();

  await sb
    .from("trainer_sessions")
    .update({ status: "completed", live_started_at: null, updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  const { data: bookings } = await sb
    .from("trainer_bookings")
    .select("*")
    .eq("session_id", sessionId)
    .in("status", ["confirmed", "pending_trainer"]);

  for (const b of (bookings as Array<{ id: string; user_id: string; trainer_id: string; program_session_id: string | null }>) ?? []) {
    await sb
      .from("trainer_bookings")
      .update({ status: "completed", live_started_at: null, updated_at: new Date().toISOString() })
      .eq("id", b.id);

    // Bridge to program completions (mirrors completeTrainerBookingAction).
    if (b.program_session_id) {
      const { data: ps } = await admin.from("program_sessions").select("program_id").eq("id", b.program_session_id).maybeSingle();
      const programId = (ps as { program_id?: string } | null)?.program_id;
      if (programId) {
        const { data: en } = await admin
          .from("program_enrollments")
          .select("id")
          .eq("user_id", b.user_id)
          .eq("program_id", programId)
          .eq("status", "active")
          .maybeSingle();
        if (en) {
          await admin.from("program_completions").upsert({
            enrollment_id: (en as { id: string }).id,
            session_id: b.program_session_id,
            source: "trainer_1on1",
            surface: "gym",
            trainer_booking_id: b.id,
          }, { onConflict: "enrollment_id,session_id" });
        }
      }
    }
  }

  if (session.video_room_name) {
    await getVideoProvider().destroyRoom(session.video_room_name);
  }

  revalidatePath("/trainer/dashboard");
  revalidatePath(`/trainer/sessions/${sessionId}`);
  revalidatePath("/account/sessions");
  revalidatePath("/account/history");
  redirect(`/trainer/dashboard?completed=${sessionId}`);
}
