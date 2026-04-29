"use client";

import { useEffect, useState } from "react";

/**
 * Client-rendered time display so the viewer always sees their own timezone.
 * The server is on UTC; without this the rendered string would be UTC for
 * everyone. We hydrate with the browser's local time.
 *
 * `iso` is the canonical UTC instant. `format` picks the shape:
 *   - "time" → "3:00 PM"
 *   - "date" → "TUE, MAR 14"
 *   - "datetime" → "TUE, MAR 14 · 3:00 PM"
 *   - "weekday-time" → "TUE 3:00 PM"
 */
export function Time({
  iso,
  format = "time",
  fallback,
}: {
  iso: string;
  format?: "time" | "date" | "datetime" | "weekday-time";
  fallback?: string;
}) {
  const [text, setText] = useState<string>(fallback ?? "");

  useEffect(() => {
    const d = new Date(iso);
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const date = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    let out = time;
    if (format === "date") out = date;
    else if (format === "datetime") out = `${date} · ${time}`;
    else if (format === "weekday-time") out = `${weekday} ${time}`;
    setText(out);
  }, [iso, format]);

  // suppressHydrationWarning so the server's placeholder doesn't trip React.
  return <span suppressHydrationWarning>{text}</span>;
}
