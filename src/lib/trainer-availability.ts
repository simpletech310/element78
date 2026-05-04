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
 * Time / timezone model:
 * - `start_minute` / `end_minute` on a rule are wall-clock minutes from
 *   midnight in the *trainer's* IANA timezone (e.g. "America/New_York").
 *   That timezone comes in as `trainerTimezone`. A LA coach setting
 *   "Mon 10:00–13:00" means 10am Pacific — emitted as the correct UTC
 *   instant regardless of where the server runs or the member views.
 * - The day cursor walks calendar days in the *trainer's* timezone, so DST
 *   transitions and near-midnight UTC don't drop or duplicate days.
 * - Output `starts_at` / `ends_at` are canonical UTC ISO strings. The viewer
 *   sees them in their own local timezone via the <Time> client component.
 *
 * Slotting:
 * - Emits a candidate every `SLOT_STEP_MIN` minutes (30 — half-hour
 *   increments), each lasting `settings.duration_min` (default 60).
 *   Adjacent candidates overlap; we filter any that collide with existing
 *   bookings, group sessions, or blocks. So if two members back-to-back
 *   book 1:30–2:30 and 2:30–3:30, the 2:00 candidate is gone (overlaps
 *   1:30) and the 3:00 candidate is gone (overlaps 2:30) — next available
 *   start is 3:30. `buffer_min` is no longer used; left intact in the
 *   schema for back-compat / future per-coach overrides.
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
  /** IANA timezone the trainer's wall-clock rules are anchored to.
   *  Defaults to America/New_York (the gym) for back-compat with callers
   *  that haven't been updated yet. */
  trainerTimezone?: string;
};

export function generateSlots(input: GenerateSlotsInput): GeneratedSlot[] {
  const { rules, blocks, existingBookings, existingSessions, settings, fromUtc, toUtc, preferredMode } = input;
  // Validate the trainer's timezone once. A bad value (typo, legacy null,
  // some browser-supplied string Intl can't parse) used to bubble up as a
  // RangeError from Intl.DateTimeFormat and 500 the booking page. Falling
  // back to America/New_York keeps the page usable; the warning lets us
  // notice and clean up the underlying record.
  const requestedTz = input.trainerTimezone || "America/New_York";
  const tz = isValidTimeZone(requestedTz) ? requestedTz : (() => {
    // eslint-disable-next-line no-console
    console.warn(`[trainer-availability] invalid trainer timezone "${requestedTz}", falling back to America/New_York`);
    return "America/New_York";
  })();
  if (rules.length === 0) return [];

  const slotMs = settings.duration_min * 60 * 1000;
  const stepMs = SLOT_STEP_MIN * 60 * 1000;
  const out: GeneratedSlot[] = [];

  // Walk one calendar day at a time, *in the trainer's timezone*. We start
  // from the local date that contains `fromUtc` and step until we pass
  // `toUtc`. For each local date we ask: what UTC instant corresponds to
  // 00:00 of that local date?
  const fromLocal = decomposeInTz(fromUtc, tz);
  const toLocal = decomposeInTz(toUtc, tz);
  const totalDays = daysBetween(fromLocal, toLocal) + 1;

  for (let i = 0; i <= totalDays; i++) {
    const local = addDaysLocal(fromLocal, i);
    const weekday = safeWeekdayOfLocal(local, tz);
    if (weekday < 0) continue;
    const dayRules = rules.filter(r => r.is_active && r.weekday === weekday);
    if (dayRules.length === 0) continue;

    for (const rule of dayRules) {
      const ruleModes = expandRuleModes(rule.mode);
      const winStartMs = safeLocalWallToUtcMs(local.year, local.month, local.day, rule.start_minute, tz);
      const winEndMs = safeLocalWallToUtcMs(local.year, local.month, local.day, rule.end_minute, tz);
      if (winStartMs == null || winEndMs == null) continue;

      let slotStart = winStartMs;
      while (slotStart + slotMs <= winEndMs) {
        const slotEnd = slotStart + slotMs;

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
  }

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

/* -------------------------------------------------------------------------- */
/*  Timezone helpers                                                          */
/*                                                                            */
/*  Tiny self-contained set of utilities so we can convert between a          */
/*  trainer's local wall-clock (year/month/day/minute) and the corresponding  */
/*  UTC instant — without pulling in luxon or date-fns-tz. The trick: ask     */
/*  Intl what local time a "naive UTC" instant displays as in the target     */
/*  zone, then back out the offset.                                           */
/* -------------------------------------------------------------------------- */

type LocalDate = { year: number; month: number; day: number };

function decomposeInTz(d: Date, tz: string): LocalDate {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}

function addDaysLocal(local: LocalDate, days: number): LocalDate {
  // Anchor at noon UTC to dodge DST midnight ambiguity, add days, decompose.
  const base = Date.UTC(local.year, local.month - 1, local.day, 12, 0, 0);
  const next = new Date(base + days * 24 * 60 * 60 * 1000);
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
}

function daysBetween(a: LocalDate, b: LocalDate): number {
  const ams = Date.UTC(a.year, a.month - 1, a.day);
  const bms = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((bms - ams) / (24 * 60 * 60 * 1000));
}

function weekdayOfLocal(local: LocalDate, tz: string): number {
  // Use a noon-UTC anchor, formatted in tz, to get the day-of-week.
  const noonUtc = new Date(Date.UTC(local.year, local.month - 1, local.day, 12, 0, 0));
  const w = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(noonUtc);
  // "Sun"=0, "Mon"=1, ... "Sat"=6 (matches JS Date.prototype.getDay()).
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(w);
}

/**
 * Convert a wall-clock time ("year-month-day, `minutes` from midnight") in
 * the named IANA timezone into the corresponding UTC milliseconds.
 *
 * Method: pretend the wall-clock fields are UTC fields ("naive UTC"), then
 * ask Intl what local time that naive instant appears as in `tz`. The delta
 * between assumed and reported is the timezone offset. Subtract it from the
 * naive instant to get the real UTC. Robust across DST and historic offsets;
 * undefined for the one-hour gap on spring-forward (we resolve to the later
 * instant deterministically, which is the conservative choice for booking).
 */
function localWallToUtcMs(year: number, month: number, day: number, minuteOfDay: number, tz: string): number {
  const hours = Math.floor(minuteOfDay / 60);
  const minutes = minuteOfDay % 60;
  const naive = Date.UTC(year, month - 1, day, hours, minutes, 0);

  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(naive));
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const reported = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) % 24,
    Number(map.minute),
    Number(map.second),
  );
  // offset = reported - naive  ⇒  realUtc = naive - offset = 2*naive - reported.
  return 2 * naive - reported;
}

/**
 * Defensive wrappers — a malformed `tz` (typo, null bleeding through, legacy
 * row) used to throw RangeError out of Intl and crash the whole booking page.
 * The top-level `generateSlots` now validates and falls back, but if some
 * other code path slips through, treat the bad rule as if it were anchored
 * to America/New_York instead of nuking the entire response.
 */
function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function safeLocalWallToUtcMs(
  year: number,
  month: number,
  day: number,
  minuteOfDay: number,
  tz: string,
): number | null {
  try {
    return localWallToUtcMs(year, month, day, minuteOfDay, tz);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[trainer-availability] localWallToUtcMs failed for tz="${tz}":`, err);
    try {
      return localWallToUtcMs(year, month, day, minuteOfDay, "America/New_York");
    } catch {
      return null;
    }
  }
}

function safeWeekdayOfLocal(local: LocalDate, tz: string): number {
  try {
    return weekdayOfLocal(local, tz);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[trainer-availability] weekdayOfLocal failed for tz="${tz}":`, err);
    try {
      return weekdayOfLocal(local, "America/New_York");
    } catch {
      return -1;
    }
  }
}
