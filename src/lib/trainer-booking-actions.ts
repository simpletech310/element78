"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getTrainerForCurrentUser, getTrainerOwningBooking } from "@/lib/trainer-auth";
import { getPaymentProvider } from "@/lib/payments/provider";
import { getVideoProvider } from "@/lib/video/provider";
import {
  notifyTrainerOfBooking,
  notifyClientOfBookingDecision,
  notifyPaymentReceived,
} from "@/lib/notifications";
import { getTrainerBooking, getTrainerSessionSettings } from "@/lib/data/queries";
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

  const insert = await sb
    .from("trainer_bookings")
    .insert({
      trainer_id: trainerId,
      user_id: user!.id,
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
    // The unique partial index on (trainer_id, starts_at) WHERE status in
    // (pending,confirmed) prevents duplicate bookings for the same slot.
    const msg = insert.error?.message?.includes("duplicate") || insert.error?.code === "23505"
      ? "Sorry, that slot was just taken. Please pick another."
      : "Booking failed. Please try again.";
    redirect(`/trainers/${trainerSlug}/book?error=${encodeURIComponent(msg)}`);
  }

  const booking = insert.data;
  await notifyTrainerOfBooking(booking);

  revalidatePath(`/trainers/${trainerSlug}`);
  revalidatePath(`/account/sessions`);
  revalidatePath(`/trainer/dashboard`);

  if (!requiresPayment) {
    redirect(`/account/sessions?booked=${booking.id}`);
  }

  // Redirect to whichever payment provider is configured.
  const payments = getPaymentProvider();
  const intent = await payments.createCheckoutIntent({
    amountCents: settings.price_cents,
    bookingId: booking.id,
    successUrl: `/account/sessions?booked=${booking.id}`,
    cancelUrl: `/trainers/${trainerSlug}/book`,
    description: `1-on-1 session`,
  });
  redirect(intent.url);
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
  await sb
    .from("trainer_bookings")
    .update({
      status: "cancelled",
      paid_status: wasPaid ? "refunded" : (booking as { paid_status: string }).paid_status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

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
