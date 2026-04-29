"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { getTrainerForCurrentUser, getTrainerOwningBooking } from "@/lib/trainer-auth";
import { getVideoProvider } from "@/lib/video/provider";
import {
  notifyTrainerOfBooking,
  notifyClientOfBookingDecision,
  notifyPaymentReceived,
} from "@/lib/notifications";
import { getTrainerBooking, getTrainerSessionSettings } from "@/lib/data/queries";
import { createPurchaseAndCheckout, refundPurchase } from "@/lib/purchases";
import type { TrainerSessionMode } from "@/lib/data/types";

function parseTimeOrMinutes(timeVal: FormDataEntryValue | null, minuteVal: FormDataEntryValue | null): number {
  if (typeof timeVal === "string" && /^\d{2}:\d{2}$/.test(timeVal)) {
    const [hh, mm] = timeVal.split(":").map(Number);
    return hh * 60 + mm;
  }
  if (minuteVal != null) {
    const n = Number(minuteVal);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

/**
 * Step 1: client requests a booking. We create the row with paid_status='pending'
 * and immediately redirect to the payment provider's checkout URL.
 */
export async function requestTrainerBookingAction(formData: FormData) {
  const trainerId = String(formData.get("trainer_id") ?? "");
  const trainerSlug = String(formData.get("trainer_slug") ?? "");
  // The slot picker submits a single "slot" field as "<startsAtIso>|<endsAtIso>"
  // because radio buttons can't bind to two form fields at once.
  const slotRaw = String(formData.get("slot") ?? "");
  const [startsAt = "", endsAt = ""] = slotRaw.split("|");
  const mode = String(formData.get("mode") ?? "video") as TrainerSessionMode;
  const goals = String(formData.get("goals") ?? "").trim() || null;
  const routineSlug = String(formData.get("routine_slug") ?? "").trim() || null;
  const programSessionId = String(formData.get("program_session_id") ?? "").trim() || null;

  if (!trainerId || !startsAt || !endsAt) {
    redirect(`/trainers/${trainerSlug}/book?error=${encodeURIComponent("Missing booking details")}`);
  }

  const user = await getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/trainers/${trainerSlug}/book`)}`);
  }

  const sb = createClient();
  const settings = await getTrainerSessionSettings(trainerId);
  if (!settings) {
    redirect(`/trainers/${trainerSlug}?error=${encodeURIComponent("This trainer isn't accepting 1-on-1 yet")}`);
  }

  const requiresPayment = settings.price_cents > 0;
  const paid_status = requiresPayment ? "pending" : "free";

  // Phase 3: every booking is a seat in a parent trainer_sessions row. For
  // private 1-on-1s we create a fresh capacity=1 session each time. The
  // unique partial index on trainer_sessions(trainer_id, starts_at) WHERE
  // status in (open,full,confirmed) is what now prevents the trainer from
  // being double-booked at the same instant.
  //
  // The trainer_sessions RLS only lets the trainer themselves write — so
  // we use the admin client here (we've already auth-checked the member
  // above; they're allowed to claim any open trainer slot).
  const admin = createAdminClient();
  const sessionInsert = await admin
    .from("trainer_sessions")
    .insert({
      trainer_id: trainerId,
      starts_at: startsAt,
      ends_at: endsAt,
      mode,
      location_id: mode === "in_person" ? settings.in_person_location_id : null,
      capacity: 1,
      price_cents: settings.price_cents,
      status: "open",
      is_group: false,
      routine_slug: routineSlug,
    })
    .select("id")
    .single();

  if (sessionInsert.error || !sessionInsert.data) {
    const msg = sessionInsert.error?.message?.includes("duplicate") || sessionInsert.error?.code === "23505"
      ? "Sorry, that slot was just taken. Please pick another."
      : "Booking failed. Please try again.";
    redirect(`/trainers/${trainerSlug}/book?error=${encodeURIComponent(msg)}`);
  }
  const sessionId = (sessionInsert.data as { id: string }).id;

  // Insert the booking via the user's session client so RLS confirms
  // auth.uid() = user_id; if anything goes wrong (FK / constraint), the
  // orphaned trainer_sessions row gets rolled back via admin below.
  const insert = await sb
    .from("trainer_bookings")
    .insert({
      trainer_id: trainerId,
      user_id: user!.id,
      session_id: sessionId,
      starts_at: startsAt,
      ends_at: endsAt,
      mode,
      location_id: mode === "in_person" ? settings.in_person_location_id : null,
      status: "pending_trainer",
      paid_status,
      price_cents: settings.price_cents,
      client_goals: goals,
      routine_slug: routineSlug,
      program_session_id: programSessionId,
    })
    .select("*")
    .single();

  if (insert.error || !insert.data) {
    await admin.from("trainer_sessions").delete().eq("id", sessionId);
    const errMsg = insert.error?.message ?? "unknown error";
    // eslint-disable-next-line no-console
    console.error("[trainer-booking] insert failed:", errMsg, insert.error);
    redirect(`/trainers/${trainerSlug}/book?error=${encodeURIComponent("Booking failed. Please try again.")}`);
  }

  const booking = insert.data;
  await notifyTrainerOfBooking(booking);

  revalidatePath(`/trainers/${trainerSlug}`);
  revalidatePath(`/account/sessions`);
  revalidatePath(`/trainer/dashboard`);

  if (!requiresPayment) {
    redirect(`/account/sessions?booked=${booking.id}`);
  }

  // Funnel through the unified purchases ledger. The webhook will flip both
  // the purchase row and the booking's paid_status when Stripe confirms.
  const { checkoutUrl } = await createPurchaseAndCheckout({
    userId: user!.id,
    kind: "trainer_booking",
    amountCents: settings.price_cents,
    description: `1-on-1 session with ${trainerSlug.replace(/-/g, " ")}`,
    refIds: { trainer_booking_id: booking.id },
    successPath: `/account/sessions?booked=${booking.id}`,
    cancelPath: `/trainers/${trainerSlug}/book`,
  });
  redirect(checkoutUrl);
}

/**
 * Mock-checkout completion. Real Stripe will replace this with a webhook
 * handler that flips paid_status on `checkout.session.completed`.
 */
export async function payTrainerBookingAction(formData: FormData) {
  const bookingId = String(formData.get("booking_id") ?? "");
  const user = await getUser();
  if (!user) redirect("/login");

  const sb = createClient();
  const { data: booking } = await sb
    .from("trainer_bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!booking) redirect("/account/sessions?error=not_found");

  await sb
    .from("trainer_bookings")
    .update({ paid_status: "paid", updated_at: new Date().toISOString() })
    .eq("id", bookingId);

  await notifyPaymentReceived(booking);

  revalidatePath(`/account/sessions`);
  revalidatePath(`/trainer/dashboard`);
  redirect(`/account/sessions?booked=${bookingId}&paid=1`);
}

/**
 * Trainer accepts a pending booking. Creates the video room (mock or daily)
 * if the booking is video, then flips status to 'confirmed'.
 */
export async function acceptTrainerBookingAction(formData: FormData) {
  const bookingId = String(formData.get("booking_id") ?? "");
  const trainer = await getTrainerOwningBooking(bookingId);
  if (!trainer) redirect("/trainer/dashboard?error=unauthorized");

  const booking = await getTrainerBooking(bookingId);
  if (!booking) redirect("/trainer/dashboard?error=not_found");

  let videoFields: { video_provider: string | null; video_room_url: string | null; video_room_name: string | null } = {
    video_provider: null,
    video_room_url: null,
    video_room_name: null,
  };

  if (booking.mode === "video") {
    const room = await getVideoProvider().createRoom({
      bookingId: booking.id,
      startsAt: new Date(booking.starts_at),
      endsAt: new Date(booking.ends_at),
      label: `Element 78 1-on-1`,
    });
    videoFields = { video_provider: room.provider, video_room_url: room.url, video_room_name: room.name };
  }

  const sb = createClient();
  await sb
    .from("trainer_bookings")
    .update({
      status: "confirmed",
      ...videoFields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  // Mirror the video fields onto the parent session so future group attendees
  // share the same Daily room. For private 1-on-1 it's the same effect.
  if (booking.session_id && (videoFields.video_room_url || videoFields.video_room_name)) {
    await sb
      .from("trainer_sessions")
      .update({
        ...videoFields,
        status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.session_id);
  } else if (booking.session_id) {
    await sb
      .from("trainer_sessions")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", booking.session_id);
  }

  await notifyClientOfBookingDecision({ ...booking, status: "confirmed" });
  revalidatePath("/trainer/dashboard");
  revalidatePath("/account/sessions");
  redirect(`/trainer/dashboard?accepted=${bookingId}`);
}

export async function rejectTrainerBookingAction(formData: FormData) {
  const bookingId = String(formData.get("booking_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const trainer = await getTrainerOwningBooking(bookingId);
  if (!trainer) redirect("/trainer/dashboard?error=unauthorized");

  const booking = await getTrainerBooking(bookingId);
  if (!booking) redirect("/trainer/dashboard?error=not_found");

  const sb = createClient();
  await sb
    .from("trainer_bookings")
    .update({
      status: "rejected",
      rejected_reason: reason,
      paid_status: booking.paid_status === "paid" ? "refunded" : booking.paid_status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  // If the user already paid (rare for reject, but possible if accept races),
  // hit Stripe's refund API and flip the purchase ledger.
  if (booking.paid_status === "paid") {
    const admin = createAdminClient();
    const { data: purchase } = await admin.from("purchases").select("id").eq("trainer_booking_id", bookingId).maybeSingle();
    if (purchase) {
      await refundPurchase((purchase as { id: string }).id, { reason: "requested_by_customer" });
    }
  }

  await notifyClientOfBookingDecision({ ...booking, status: "rejected" });
  revalidatePath("/trainer/dashboard");
  revalidatePath("/account/sessions");
  redirect(`/trainer/dashboard?rejected=${bookingId}`);
}

/**
 * Either side can cancel. Refund-on-cancel for paid bookings.
 */
export async function cancelTrainerBookingAction(formData: FormData) {
  const bookingId = String(formData.get("booking_id") ?? "");
  const returnTo = String(formData.get("return_to") ?? "/account/sessions");
  const user = await getUser();
  if (!user) redirect("/login");

  const sb = createClient();
  const { data: booking } = await sb.from("trainer_bookings").select("*").eq("id", bookingId).maybeSingle();
  if (!booking) redirect(`${returnTo}?error=not_found`);

  // Authorize: must be the booking's user or the trainer behind the trainer_id.
  const trainer = await getTrainerForCurrentUser();
  const isOwner = (booking as { user_id: string }).user_id === user.id;
  const isTrainer = trainer && trainer.id === (booking as { trainer_id: string }).trainer_id;
  if (!isOwner && !isTrainer) redirect(`${returnTo}?error=unauthorized`);

  const wasPaid = (booking as { paid_status: string }).paid_status === "paid";
  // Prefer the session-level room (post-Phase 3 source of truth); fall back
  // to the legacy per-booking column for rows created before migration 0009.
  const sessionId = (booking as { session_id: string | null }).session_id;
  let roomName: string | null = null;
  if (sessionId) {
    const { data: sessRow } = await sb
      .from("trainer_sessions")
      .select("video_room_name")
      .eq("id", sessionId)
      .maybeSingle();
    roomName = (sessRow as { video_room_name: string | null } | null)?.video_room_name ?? null;
  }
  if (!roomName) {
    roomName = (booking as { video_room_name: string | null }).video_room_name;
  }

  await sb
    .from("trainer_bookings")
    .update({
      status: "cancelled",
      paid_status: wasPaid ? "refunded" : (booking as { paid_status: string }).paid_status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  // Auto-refund via Stripe API + flip the linked purchase row.
  if (wasPaid) {
    const admin = createAdminClient();
    const { data: purchase } = await admin.from("purchases").select("id").eq("trainer_booking_id", bookingId).maybeSingle();
    if (purchase) {
      await refundPurchase((purchase as { id: string }).id, { reason: "requested_by_customer" });
    }
  }

  // Tear down any provisioned video room so we don't leave a zombie sitting
  // in Daily until exp passes.
  if (roomName) {
    await getVideoProvider().destroyRoom(roomName);
  }

  revalidatePath("/trainer/dashboard");
  revalidatePath("/account/sessions");
  redirect(`${returnTo}?cancelled=${bookingId}`);
}

/**
 * Trainer marks a session done after the call wraps up. This is what flows
 * the booking into the client's /account/history page.
 */
export async function completeTrainerBookingAction(formData: FormData) {
  const bookingId = String(formData.get("booking_id") ?? "");
  const durationRaw = formData.get("duration_actual_min");
  const notes = String(formData.get("trainer_notes") ?? "").trim() || null;
  const trainer = await getTrainerOwningBooking(bookingId);
  if (!trainer) redirect("/trainer/dashboard?error=unauthorized");

  const sb = createClient();
  await sb
    .from("trainer_bookings")
    .update({
      status: "completed",
      duration_actual_min: durationRaw ? Number(durationRaw) : null,
      trainer_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  // Bridge into program progress. Two paths:
  //   1. Booking has a `program_session_id` (set when the user booked from
  //      inside a program day) — use that directly. Most accurate.
  //   2. Otherwise, fall back to the legacy "find any trainer_1on1 session
  //      for this trainer in any active enrollment" lookup.
  const { data: booking } = await sb.from("trainer_bookings").select("*").eq("id", bookingId).maybeSingle();
  if (booking) {
    const userId = (booking as { user_id: string }).user_id;
    const trainerId = (booking as { trainer_id: string }).trainer_id;
    const linkedSessionId = (booking as { program_session_id: string | null }).program_session_id;

    if (linkedSessionId) {
      // Path 1 — direct link. Look up the enrollment for this user + program.
      const { data: ps } = await sb.from("program_sessions").select("program_id").eq("id", linkedSessionId).maybeSingle();
      const programId = (ps as { program_id?: string } | null)?.program_id;
      if (programId) {
        const { data: en } = await sb
          .from("program_enrollments")
          .select("id")
          .eq("user_id", userId)
          .eq("program_id", programId)
          .eq("status", "active")
          .maybeSingle();
        if (en) {
          await sb.from("program_completions").upsert({
            enrollment_id: (en as { id: string }).id,
            session_id: linkedSessionId,
            source: "trainer_1on1",
            surface: "gym",
            trainer_booking_id: bookingId,
            duration_actual_min: durationRaw ? Number(durationRaw) : null,
          }, { onConflict: "enrollment_id,session_id" });
        }
      }
    } else {
      // Path 2 — legacy fallback.
      const { data: enrollments } = await sb
        .from("program_enrollments")
        .select("id, program_id")
        .eq("user_id", userId)
        .eq("status", "active");
      for (const en of (enrollments as Array<{ id: string; program_id: string }> | null) ?? []) {
        const { data: matchSession } = await sb
          .from("program_sessions")
          .select("id")
          .eq("program_id", en.program_id)
          .eq("ref_kind", "trainer_1on1")
          .eq("trainer_id_for_1on1", trainerId)
          .limit(1)
          .maybeSingle();
        if (matchSession) {
          await sb.from("program_completions").upsert({
            enrollment_id: en.id,
            session_id: (matchSession as { id: string }).id,
            source: "trainer_1on1",
            surface: "gym",
            trainer_booking_id: bookingId,
            duration_actual_min: durationRaw ? Number(durationRaw) : null,
          }, { onConflict: "enrollment_id,session_id" });
        }
      }
    }
  }

  // Tear down the Daily room so it doesn't sit around as a zombie until exp.
  // Session is the source of truth post-Phase 3; legacy per-booking column
  // is the fallback for rows created before migration 0009.
  if (booking) {
    const sessionId = (booking as { session_id: string | null }).session_id;
    let roomName: string | null = null;
    if (sessionId) {
      const { data: sessRow } = await sb
        .from("trainer_sessions")
        .select("video_room_name")
        .eq("id", sessionId)
        .maybeSingle();
      roomName = (sessRow as { video_room_name: string | null } | null)?.video_room_name ?? null;
    }
    if (!roomName) {
      roomName = (booking as { video_room_name: string | null }).video_room_name;
    }
    if (roomName) {
      await getVideoProvider().destroyRoom(roomName);
    }
  }

  revalidatePath("/trainer/dashboard");
  revalidatePath("/account/sessions");
  revalidatePath("/account/history");
  redirect(`/trainer/dashboard?completed=${bookingId}`);
}

/* -------------------------------------------------------------------------- */
/*  Availability management (trainer-only)                                    */
/* -------------------------------------------------------------------------- */

export async function upsertAvailabilityRuleAction(formData: FormData) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const weekday = Number(formData.get("weekday") ?? 0);
  const mode = String(formData.get("mode") ?? "both");
  const isActive = formData.get("is_active") !== "false";

  // Accept either explicit start_minute/end_minute OR HH:MM time strings.
  const startMinute = parseTimeOrMinutes(formData.get("start_time"), formData.get("start_minute"));
  const endMinute = parseTimeOrMinutes(formData.get("end_time"), formData.get("end_minute"));

  if (endMinute <= startMinute) redirect("/trainer/availability?error=invalid_range");

  const sb = createClient();
  if (id) {
    await sb
      .from("trainer_availability_rules")
      .update({ weekday, start_minute: startMinute, end_minute: endMinute, mode, is_active: isActive })
      .eq("id", id)
      .eq("trainer_id", trainer.id);
  } else {
    await sb.from("trainer_availability_rules").insert({
      trainer_id: trainer.id,
      weekday,
      start_minute: startMinute,
      end_minute: endMinute,
      mode,
      is_active: isActive,
    });
  }
  revalidatePath("/trainer/availability");
  revalidatePath(`/trainers/${trainer.slug}/book`);
  redirect("/trainer/availability?saved=1");
}

export async function deleteAvailabilityRuleAction(formData: FormData) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login");
  const id = String(formData.get("id") ?? "");
  const sb = createClient();
  await sb.from("trainer_availability_rules").delete().eq("id", id).eq("trainer_id", trainer.id);
  revalidatePath("/trainer/availability");
  revalidatePath(`/trainers/${trainer.slug}/book`);
  redirect("/trainer/availability?deleted=1");
}

export async function upsertSessionSettingsAction(formData: FormData) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login");

  const priceCents = Number(formData.get("price_cents") ?? 0);
  const durationMin = Number(formData.get("duration_min") ?? 45);
  const bufferMin = Number(formData.get("buffer_min") ?? 15);
  const modesRaw = formData.getAll("modes").map(String);
  const modes = modesRaw.length > 0 ? modesRaw : ["video", "in_person"];
  const inPersonLocation = String(formData.get("in_person_location_id") ?? "").trim() || null;
  const bio = String(formData.get("bio_for_1on1") ?? "").trim() || null;

  const sb = createClient();
  await sb
    .from("trainer_session_settings")
    .upsert({
      trainer_id: trainer.id,
      price_cents: priceCents,
      duration_min: durationMin,
      buffer_min: bufferMin,
      modes,
      in_person_location_id: inPersonLocation,
      bio_for_1on1: bio,
      updated_at: new Date().toISOString(),
    });

  revalidatePath("/trainer/availability");
  revalidatePath(`/trainers/${trainer.slug}`);
  revalidatePath(`/trainers/${trainer.slug}/book`);
  redirect("/trainer/availability?settings_saved=1");
}
