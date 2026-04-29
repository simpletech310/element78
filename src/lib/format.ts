/**
 * Shared formatters. Time displays default to the viewer's locale + timezone
 * (server side: en-US 12-hour wallclock; client side: full Intl). All booking
 * times are stored as UTC ISO strings so a member in CA and a coach in ATL
 * each see their own local time.
 */

export function fmtTime12(input: Date | string): string {
  return new Date(input).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function fmtDate(input: Date | string, opts?: { withYear?: boolean; long?: boolean }): string {
  const d = new Date(input);
  return d.toLocaleDateString("en-US", {
    weekday: opts?.long ? "long" : "short",
    month: opts?.long ? "long" : "short",
    day: "2-digit",
    ...(opts?.withYear ? { year: "numeric" } : {}),
  }).toUpperCase();
}

export function fmtDateTime(input: Date | string): string {
  return `${fmtDate(input)} · ${fmtTime12(input)}`;
}

/** "MAR 14" style — used for compact list rows. */
export function fmtDateShort(input: Date | string): string {
  return new Date(input).toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase();
}

/** Whole-dollar string. Pass true to keep cents (price tables). */
export function fmtDollars(cents: number, withCents = false): string {
  const dollars = cents / 100;
  return withCents ? `$${dollars.toFixed(2)}` : `$${dollars.toFixed(0)}`;
}

/** Convert a string from a `<input type="number" step="0.01">` into integer cents. */
export function dollarsToCents(input: FormDataEntryValue | string | number | null | undefined): number {
  if (input == null) return 0;
  const n = typeof input === "number" ? input : parseFloat(String(input));
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}

/** Wallclock minutes-from-midnight → "9:30 AM". */
export function fmtMinutes12(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const mm = (minutes % 60).toString().padStart(2, "0");
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${h12}:${mm} ${period}`;
}

/** Duration in minutes → "45M" / "1H 30M". */
export function fmtDurationMin(min: number): string {
  if (min < 60) return `${min}M`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}H` : `${h}H ${m}M`;
}
