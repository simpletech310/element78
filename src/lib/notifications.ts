/**
 * Out-of-app notifications.
 *
 * The codebase doesn't have a configured email / SMS / push provider yet, so
 * for now every notify*() call persists a row to `public.notifications` via
 * the service-role admin client (see migration 0027). The member's app
 * subscribes to that table over Supabase Realtime, surfacing a bell badge /
 * toast the instant the row lands. This gives us durable, queryable history
 * without standing up Resend, Twilio, or APNS yet.
 *
 * TODO when a real provider is configured:
 *   - Set RESEND_API_KEY (email) and/or TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN
 *     + TWILIO_FROM (SMS) and/or web-push VAPID keys.
 *   - Inside `insertNotificationRow`, after the DB insert, dispatch through
 *     the provider SDK (do NOT add the SDK as a dep until you're ready). The
 *     row insert stays — it's the durable audit log + the in-app surface.
 *   - The notify*() call sites here pass enough context (booking → trainer_id,
 *     user_id, starts_at, mode) that no upstream changes are needed when
 *     wiring the real send.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TrainerBooking } from "@/lib/data/types";

type RecipientHint = {
  user_id?: string | null;
  trainer_id?: string | null;
  email?: string | null;
};

/**
 * Insert one notification row for `userId`. Uses the service-role admin
 * client so RLS doesn't block; notifications are intentionally service-only
 * to insert (see migration 0027). Failures are swallowed and logged — a
 * notification miss should never break a booking flow.
 */
export async function insertNotificationRow(
  userId: string | null | undefined,
  kind: string,
  title: string,
  body: string,
  actionUrl?: string | null,
): Promise<void> {
  if (!userId) {
    // eslint-disable-next-line no-console
    console.warn(`[notify] skipped ${kind} — no user_id`);
    return;
  }
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert({
      user_id: userId,
      kind,
      title,
      body,
      action_url: actionUrl ?? null,
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn(`[notify] insert failed for ${kind}:`, error.message);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[notify] insert threw for ${kind}:`, err);
  }
}

export async function notifyTrainerOfBooking(booking: TrainerBooking, recipient?: RecipientHint) {
  // The trainer is the recipient here. We need their auth_user_id to land
  // in their inbox. Caller may pass it via recipient.user_id; otherwise we
  // resolve it from `trainers` so existing call sites stay unchanged.
  let trainerAuthId = recipient?.user_id ?? null;
  if (!trainerAuthId) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("trainers")
        .select("auth_user_id")
        .eq("id", booking.trainer_id)
        .maybeSingle();
      trainerAuthId = (data as { auth_user_id: string | null } | null)?.auth_user_id ?? null;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[notify] trainer lookup failed:`, err);
    }
  }
  const startStr = new Date(booking.starts_at).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
  await insertNotificationRow(
    trainerAuthId,
    "booking_requested",
    "New booking request",
    `${startStr} · ${booking.mode === "video" ? "video" : "in person"} · tap to review`,
    `/trainer/dashboard`,
  );
}

export async function notifyClientOfBookingDecision(booking: TrainerBooking, recipient?: RecipientHint) {
  const accepted = booking.status === "confirmed";
  const title = accepted ? "Booking confirmed" : "Booking update";
  const startStr = new Date(booking.starts_at).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
  const body = accepted
    ? `${startStr} · your coach accepted — see details`
    : `${startStr} · status: ${booking.status}`;
  await insertNotificationRow(
    recipient?.user_id ?? booking.user_id,
    "booking_decision",
    title,
    body,
    `/account/sessions`,
  );
}

export async function notifySessionStartingSoon(booking: TrainerBooking) {
  const startStr = new Date(booking.starts_at).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });
  await insertNotificationRow(
    booking.user_id,
    "session_starting_soon",
    "Session starting soon",
    `Starts at ${startStr} · tap to prepare`,
    `/account/sessions`,
  );
}

export async function notifyPaymentReceived(booking: TrainerBooking) {
  const dollars = (booking.price_cents / 100).toFixed(2);
  await insertNotificationRow(
    booking.user_id,
    "payment_received",
    "Payment received",
    `$${dollars} · session confirmed`,
    `/account/sessions`,
  );
}

/**
 * Live-call fan-out. One row per recipient. Used by both 1-on-1
 * (initiateCallAction) and group (startGroupSessionAction). The IncomingCallAlert
 * modal still drives the in-tab UI; this row is the durable surface for members
 * who don't have the tab open.
 */
export async function notifyLiveCallStarted(args: {
  userId: string;
  bookingId: string;
  trainerName: string;
  sessionTitle: string | null;
}): Promise<void> {
  const titleStr = args.sessionTitle?.trim() || "Your session";
  await insertNotificationRow(
    args.userId,
    "live_call",
    `Live now: ${args.trainerName}`,
    `${titleStr} · tap to join`,
    `/train/session/${args.bookingId}`,
  );
}
