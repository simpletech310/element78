/**
 * Tiny VCALENDAR builder. RFC 5545 isn't fully covered — just enough for
 * single-event downloads attached to bookings. Times are UTC.
 */

function ics(s: string): string {
  // Escape commas, semicolons, newlines per RFC 5545.
  return s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function fmtUtc(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getUTCFullYear().toString();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

export type IcsEvent = {
  uid: string;
  startsAt: string;
  endsAt: string;
  summary: string;
  description?: string | null;
  location?: string | null;
  url?: string | null;
};

export function buildIcs(event: IcsEvent): string {
  const now = fmtUtc(new Date().toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Element 78//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ics(event.uid)}`,
    `DTSTAMP:${now}`,
    `DTSTART:${fmtUtc(event.startsAt)}`,
    `DTEND:${fmtUtc(event.endsAt)}`,
    `SUMMARY:${ics(event.summary)}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${ics(event.description)}`);
  if (event.location) lines.push(`LOCATION:${ics(event.location)}`);
  if (event.url) lines.push(`URL:${ics(event.url)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
