"use client";

import { useState, useMemo, useId } from "react";

/**
 * Split DATE + TIME into two clean inputs (each renders as a native picker
 * the OS already knows). The combined ISO value is mirrored into a hidden
 * input so server actions stay simple.
 *
 * Pass `name` to control the form field name (default: "starts_at").
 * `defaultValue` is an ISO timestamp; if absent the inputs start blank.
 */
export function DateTimeField({
  name = "starts_at",
  label,
  defaultValue,
  required = false,
}: {
  name?: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const id = useId();
  const initial = useMemo(() => {
    if (!defaultValue) return { date: "", time: "" };
    const d = new Date(defaultValue);
    if (Number.isNaN(d.getTime())) return { date: "", time: "" };
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}` };
  }, [defaultValue]);

  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);

  // Combined value submitted via the hidden field. Format: "YYYY-MM-DDTHH:MM"
  // — same shape datetime-local produces, so existing actions parse it
  // unchanged.
  const combined = date && time ? `${date}T${time}` : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.6)", letterSpacing: "0.2em" }}>
        {label}{required ? " *" : ""}
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input
          type="date"
          aria-label={`${label} date`}
          value={date}
          required={required}
          onChange={(e) => setDate(e.target.value)}
          className="ta-input"
        />
        <input
          type="time"
          aria-label={`${label} time`}
          value={time}
          required={required}
          onChange={(e) => setTime(e.target.value)}
          className="ta-input"
        />
      </div>
      <input id={id} type="hidden" name={name} value={combined} />
    </div>
  );
}
