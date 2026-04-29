/**
 * Refund eligibility policy.
 *
 * Centralizes the "is this purchase still refundable?" question so the
 * /account/purchases page, the cancel-flow buttons, and any future admin
 * tooling all agree on the same windows.
 *
 * Windows are policy-in-code (not config) on purpose: the rules are short,
 * tightly tied to product behavior, and we want changes to them to land in
 * a reviewable PR rather than a runtime toggle.
 *
 *   class_booking      → refundable up until the class's `starts_at`.
 *                        Once the class has begun there's nothing to refund.
 *   trainer_booking    → refundable up to 24h before the session.
 *                        Coaches block out their day; late cancels eat a slot
 *                        someone else could have booked, so we route those to
 *                        a human ("contact your coach") rather than auto-refund.
 *   program_enrollment → 7-day grace window after the program starts. Mirrors
 *                        the standard "cooling-off" period for ongoing memberships.
 *   shop_order         → 30-day return window, but only while unfulfilled.
 *                        Once fulfilled_at is set the package has shipped and
 *                        we need a human to issue an RMA.
 *   guest_pass         → refundable up until the visit_date if one was picked,
 *                        otherwise a 7-day window from purchase.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { Purchase } from "@/lib/purchases";

export type RefundEligibility = { eligible: boolean; reason?: string };

const DAY_MS = 24 * 60 * 60 * 1000;

export async function isRefundable(purchase: Purchase): Promise<RefundEligibility> {
  // Only paid purchases are candidates. Pending/failed have nothing to refund;
  // refunded/cancelled have already been handled.
  if (purchase.status !== "paid") {
    if (purchase.status === "refunded") return { eligible: false, reason: "Already refunded" };
    if (purchase.status === "pending") return { eligible: false, reason: "Payment still pending" };
    if (purchase.status === "failed") return { eligible: false, reason: "Payment failed" };
    if (purchase.status === "cancelled") return { eligible: false, reason: "Already cancelled" };
    return { eligible: false, reason: "Not paid" };
  }

  const sb = createAdminClient();
  const now = Date.now();
  const createdAt = new Date(purchase.created_at).getTime();

  switch (purchase.kind) {
    case "class_booking": {
      if (!purchase.class_booking_id) return { eligible: false, reason: "Missing booking reference" };
      const { data: booking } = await sb
        .from("bookings")
        .select("class_id")
        .eq("id", purchase.class_booking_id)
        .maybeSingle();
      const classId = (booking as { class_id?: string | null } | null)?.class_id;
      if (!classId) return { eligible: false, reason: "Class not found" };
      const { data: cls } = await sb
        .from("classes")
        .select("starts_at")
        .eq("id", classId)
        .maybeSingle();
      const startsAt = (cls as { starts_at?: string | null } | null)?.starts_at;
      if (!startsAt) return { eligible: false, reason: "Class has no start time" };
      if (new Date(startsAt).getTime() <= now) {
        return { eligible: false, reason: "Class already started" };
      }
      return { eligible: true };
    }

    case "trainer_booking": {
      if (!purchase.trainer_booking_id) return { eligible: false, reason: "Missing booking reference" };
      const { data: tb } = await sb
        .from("trainer_bookings")
        .select("session_id")
        .eq("id", purchase.trainer_booking_id)
        .maybeSingle();
      const sessionId = (tb as { session_id?: string | null } | null)?.session_id;
      if (!sessionId) return { eligible: false, reason: "Session not found" };
      const { data: session } = await sb
        .from("trainer_sessions")
        .select("starts_at")
        .eq("id", sessionId)
        .maybeSingle();
      const startsAt = (session as { starts_at?: string | null } | null)?.starts_at;
      if (!startsAt) return { eligible: false, reason: "Session has no start time" };
      const startMs = new Date(startsAt).getTime();
      // 24h cushion: coaches block their day for the slot, so late cancels
      // need a human-in-the-loop rather than a self-serve refund.
      if (startMs - now < DAY_MS) {
        return { eligible: false, reason: "Within 24h of session — contact your coach" };
      }
      return { eligible: true };
    }

    case "program_enrollment": {
      if (!purchase.program_enrollment_id) return { eligible: false, reason: "Missing enrollment reference" };
      const { data: enr } = await sb
        .from("program_enrollments")
        .select("started_at, created_at")
        .eq("id", purchase.program_enrollment_id)
        .maybeSingle();
      const row = enr as { started_at?: string | null; created_at?: string | null } | null;
      const anchor = row?.started_at ?? row?.created_at ?? purchase.created_at;
      const anchorMs = new Date(anchor).getTime();
      // 7-day cooling-off period for memberships.
      if (now - anchorMs > 7 * DAY_MS) {
        return { eligible: false, reason: "Outside 7-day refund window" };
      }
      return { eligible: true };
    }

    case "shop_order": {
      if (!purchase.order_id) return { eligible: false, reason: "Missing order reference" };
      const { data: order } = await sb
        .from("orders")
        .select("fulfilled_at")
        .eq("id", purchase.order_id)
        .maybeSingle();
      const fulfilledAt = (order as { fulfilled_at?: string | null } | null)?.fulfilled_at;
      // Once shipped we can't pull the package back; route to support for an RMA.
      if (fulfilledAt) {
        return { eligible: false, reason: "Order has shipped — contact support" };
      }
      // 30-day window from purchase mirrors standard ecom return policy.
      if (now - createdAt > 30 * DAY_MS) {
        return { eligible: false, reason: "Outside 30-day return window" };
      }
      return { eligible: true };
    }

    case "guest_pass": {
      // guest_id lives on the purchase row (added in 0011).
      const sb2 = createAdminClient();
      const { data: pRow } = await sb2.from("purchases").select("guest_id").eq("id", purchase.id).maybeSingle();
      const guestId = (pRow as { guest_id?: string | null } | null)?.guest_id;
      if (guestId) {
        const { data: guest } = await sb2
          .from("guests")
          .select("visit_date")
          .eq("id", guestId)
          .maybeSingle();
        const visitDate = (guest as { visit_date?: string | null } | null)?.visit_date;
        if (visitDate) {
          if (new Date(visitDate).getTime() <= now) {
            return { eligible: false, reason: "Visit date has passed" };
          }
          return { eligible: true };
        }
      }
      // No visit booked yet → fall back to a 7-day window from purchase.
      if (now - createdAt > 7 * DAY_MS) {
        return { eligible: false, reason: "Outside 7-day refund window" };
      }
      return { eligible: true };
    }

    default:
      return { eligible: false, reason: "Unknown purchase kind" };
  }
}
