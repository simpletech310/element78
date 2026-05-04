import type {
  GeneratedSlot,
  TrainerAvailabilityBlock,
  TrainerAvailabilityRule,
  TrainerBooking,
  TrainerSessionMode,
  TrainerSessionRow,
  TrainerSessionSettings,
} from "@/lib/data/types";

/**
 * Expand recurring weekly availability rules into concrete bookable slots,
 * minus any blocks and any active bookings.
 *
 * Notes on time:
 * - `start_minute` / `end_minute` on a rule are interpreted as the trainer's
 *   *local wall-clock* minutes from midnight. We anchor to the local timezone
 *   of the runtime here — fine for V1 since the gym is in Atlanta and the
 *   server runs in UTC for Vercel, but we apply the offset using the Date
 *   constructor in local time. When trainers in other zones come online we'll
 *   add a `timezone` column on `trainers` and use Intl.DateTimeFormat.
 *
 * - The slot generator emits a candidate every `SLOT_STEP_MIN` minutes (30
 *   by default — half-hour increments), each lasting `settings.duration_min`
 *   (60 by default). Adjacent candidate starts overlap; the generator filters
 *   any candidate whose [start, end) range collides with existing bookings,
 *   group sessions, or blocks. So if two members back-to-back book 1:30–2:30
 *   and 2:30–3:30, the 2:00 candidate disappears (it would overlap 1:30) and
 *   the 3:00 candidate is also gone (overlaps 2:30) — the next available
 *   start is 3:30. `buffer_min` is no longer used and is left intact for
 *   back-compat / future per-coach overrides.
 */
const SLOT_STEP_MIN = 30;
export type GenerateSlotsInput = {
  rules: TrainerAvailabilityRule[];
  blocks: TrainerAvailabilityBlock[];
  existingBookings: TrainerBooking[];
  /** Active parent trainer_sessions rows in the window. Group sessions live
   *  here even when nobody has booked a seat yet, so the slot generator must
   *  also subtract these to avoid double-booking the trainer. */
  existingSessions?: TrainerSessionRow[];
  settings: TrainerSessionSettings;
  fromUtc: Date;
  toUtc: Date;
  /** Filter: 'video' only shows video slots, 'in_person' only shows in-person.
   * Pass undefined to include both.  */
  preferredMode?: TrainerSessionMode;
};

export function generateSlots(input: GenerateSlotsInput): GeneratedSlot[] {
  const { rules, blocks, existingBookings, existingSessions, settings, fromUtc, toUtc, preferredMode } = input;
  if (rules.length === 0) return [];

  const slotMs = settings.duration_min * 60 * 1000;
  const stepMs = SLOT_STEP_MIN * 60 * 1000;
  const out: GeneratedSlot[] = [];

  // Walk day-by-day across the window.
  const cursor = new Date(fromUtc);
  cursor.setHours(0, 0, 0, 0);
  const endMs = toUtc.getTime();

  while (cursor.getTime() <= endMs) {
    const weekday = cursor.getDay();
    const dayRules = rules.filter(r => r.is_active && r.weekday === weekday);

    for (const rule of dayRules) {
      const ruleModes = expandRuleModes(rule.mode);

      // Anchor the wall-clock minutes onto this calendar day.
      const dayStart = new Date(cursor);
      dayStart.setHours(0, 0, 0, 0);
      const winStart = new Date(dayStart.getTime() + rule.start_minute * 60_000);
      const winEnd = new Date(dayStart.getTime() + rule.end_minute * 60_000);

      // Emit candidate every `stepMs`, each lasting `slotMs`. Trailing
      // candidates whose end exceeds the rule window are dropped.
      let slotStart = winStart.getTime();
      while (slotStart + slotMs <= winEnd.getTime()) {
        const slotEnd = slotStart + slotMs;

        // Skip past slots; honor "from".
        if (slotEnd <= fromUtc.getTime()) {
          slotStart += stepMs;
          continue;
        }
        if (slotStart >= toUtc.getTime()) break;

        for (const mode of ruleModes) {
          if (preferredMode && mode !== preferredMode) continue;
          if (overlapsBlock(slotStart, slotEnd, blocks)) continue;
          if (overlapsBooking(slotStart, slotEnd, existingBookings)) continue;
          if (existingSessions && overlapsSession(slotStart, slotEnd, existingSessions)) continue;
          out.push({
            starts_at: new Date(slotStart).toISOString(),
            ends_at: new Date(slotEnd).toISOString(),
            mode,
          });
        }
        slotStart += stepMs;
      }
    }

    // Next day.
    cursor.setDate(cursor.getDate() + 1);
  }

  // Stable sort by time.
  out.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return out;
}

function expandRuleModes(mode: TrainerAvailabilityRule["mode"]): TrainerSessionMode[] {
  if (mode === "both") return ["video", "in_person"];
  return [mode];
}

function overlapsBlock(startMs: number, endMs: number, blocks: TrainerAvailabilityBlock[]): boolean {
  for (const b of blocks) {
    const bs = new Date(b.starts_at).getTime();
    const be = new Date(b.ends_at).getTime();
    if (startMs < be && endMs > bs) return true;
  }
  return false;
}

function overlapsBooking(startMs: number, endMs: number, bookings: TrainerBooking[]): boolean {
  for (const b of bookings) {
    const bs = new Date(b.starts_at).getTime();
    const be = new Date(b.ends_at).getTime();
    if (startMs < be && endMs > bs) return true;
  }
  return false;
}

function overlapsSession(startMs: number, endMs: number, sessions: TrainerSessionRow[]): boolean {
  for (const s of sessions) {
    const ss = new Date(s.starts_at).getTime();
    const se = new Date(s.ends_at).getTime();
    if (startMs < se && endMs > ss) return true;
  }
  return false;
}
