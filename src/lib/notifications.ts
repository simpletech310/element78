/**
 * Notification stubs. Today these just log; tomorrow swap the body for Resend
 * (email) or Twilio (SMS). All call sites pass enough context that the real
 * implementations won't need any new data plumbing.
 */

import type { TrainerBooking } from "@/lib/data/types";

type RecipientHint = {
  user_id?: string | null;
  trainer_id?: string | null;
  email?: string | null;
};

function logEvent(event: string, payload: Record<string, unknown>) {
  // Intentionally minimal — keeps server logs scannable.
  // eslint-disable-next-line no-console
  console.log(`[notify] ${event}`, payload);
}

export async function notifyTrainerOfBooking(booking: TrainerBooking, recipient?: RecipientHint) {
  logEvent("trainer.booking.requested", {
    booking_id: booking.id,
    trainer_id: booking.trainer_id,
    starts_at: booking.starts_at,
    mode: booking.mode,
    recipient,
  });
}

export async function notifyClientOfBookingDecision(booking: TrainerBooking, recipient?: RecipientHint) {
  logEvent("trainer.booking.decision", {
    booking_id: booking.id,
    user_id: booking.user_id,
    status: booking.status,
    recipient,
  });
}

export async function notifySessionStartingSoon(booking: TrainerBooking) {
  logEvent("trainer.session.starting_soon", {
    booking_id: booking.id,
    starts_at: booking.starts_at,
  });
}

export async function notifyPaymentReceived(booking: TrainerBooking) {
  logEvent("trainer.booking.paid", {
    booking_id: booking.id,
    price_cents: booking.price_cents,
  });
}
