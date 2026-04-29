/**
 * Lazy completion materializer — converts implicit progress (a class booking
 * whose start time has passed; a 1-on-1 the trainer marked done) into rows in
 * `program_completions`. Called on dashboard page loads so users see fresh
 * progress without us running a cron job.
 *
 * Ground truth:
 *   - "routine" sessions: written by `markRoutineSessionCompleteAction` when
 *     RoutinePlayer reaches phase=done. (Eager.)
 *   - "class_kind" sessions: a class.starts_at < now AND user has a reserved
 *     booking with the matching class.slug. (Lazy — written here.)
 *   - "trainer_1on1" sessions: a trainer_bookings.status='completed' for the
 *     same trainer_id. (Eager via completeTrainerBookingAction, but we
 *     re-check here in case the eager write missed.)
 */

import { createClient } from "@/lib/supabase/server";
import type { ProgramSession, TrainerBooking, Booking, ClassRow } from "@/lib/data/types";

export async function materializeAutoCompletions(userId: string): Promise<void> {
  const sb = createClient();

  // 1. Active enrollments for this user.
  const { data: enrollments } = await sb
    .from("program_enrollments")
    .select("id, program_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!enrollments || enrollments.length === 0) return;

  for (const enrollment of enrollments as Array<{ id: string; program_id: string }>) {
    await materializeForEnrollment(sb, userId, enrollment);
  }
}

async function materializeForEnrollment(
  sb: ReturnType<typeof createClient>,
  userId: string,
  enrollment: { id: string; program_id: string },
) {
  // All sessions in this program.
  const { data: sessionRows } = await sb
    .from("program_sessions")
    .select("*")
    .eq("program_id", enrollment.program_id);
  const sessions = (sessionRows as ProgramSession[] | null) ?? [];

  // What's already completed for this enrollment.
  const { data: existing } = await sb
    .from("program_completions")
    .select("session_id")
    .eq("enrollment_id", enrollment.id);
  const doneIds = new Set(((existing as Array<{ session_id: string }> | null) ?? []).map(r => r.session_id));

  // Pre-fetch user's class bookings (with class.starts_at + slug) and
  // trainer bookings — once per enrollment loop so we avoid N+1.
  const [classBookings, trainerBookings] = await Promise.all([
    sb.from("bookings").select("*, class:classes(*)").eq("user_id", userId).eq("status", "reserved"),
    sb.from("trainer_bookings").select("*").eq("user_id", userId).eq("status", "completed"),
  ]);

  const classRows = ((classBookings.data as Array<Booking & { class: ClassRow }> | null) ?? []);
  const trainerRows = (trainerBookings.data as TrainerBooking[] | null) ?? [];

  const now = Date.now();
  const inserts: Array<Record<string, unknown>> = [];

  for (const s of sessions) {
    if (doneIds.has(s.id)) continue;

    if (s.ref_kind === "class_kind" && s.class_slug) {
      // Find any past reserved class booking with matching slug.
      const match = classRows.find(b =>
        b.class?.slug === s.class_slug &&
        b.class?.starts_at &&
        new Date(b.class.starts_at).getTime() <= now,
      );
      if (match) {
        inserts.push({
          enrollment_id: enrollment.id,
          session_id: s.id,
          surface: "class",
          source: "class",
          class_booking_id: match.id,
          duration_actual_min: match.class?.duration_min ?? null,
        });
      }
    } else if (s.ref_kind === "trainer_1on1" && s.trainer_id_for_1on1) {
      const match = trainerRows.find(t => t.trainer_id === s.trainer_id_for_1on1);
      if (match) {
        inserts.push({
          enrollment_id: enrollment.id,
          session_id: s.id,
          surface: "gym",
          source: "trainer_1on1",
          trainer_booking_id: match.id,
          duration_actual_min: match.duration_actual_min,
        });
      }
    }
  }

  if (inserts.length === 0) return;

  // upsert with conflict on (enrollment_id, session_id) — idempotent.
  await sb.from("program_completions").upsert(inserts, { onConflict: "enrollment_id,session_id" });
}
