"use client";

import { useState } from "react";
import { bookClassAction } from "@/lib/class-actions";

type Props = {
  classId: string;
  capacity: number;
  taken: number[];
  ownSpot: number | null;
  requiresPayment: boolean;
  priceCents: number;
  isReserved: boolean;
  returnTo: string;
  /** Reformer-style layout: two rows facing each other across a center
   *  mirror. Top row = seats 1..L, bottom row = L+1..capacity, where
   *  L = ceil(capacity/2). Each reformer faces inward toward the mirror. */
  mirrored?: boolean;
};

function fmtPrice(cents: number) {
  if (!cents) return "FREE";
  return `$${(cents / 100).toFixed(0)}`;
}

export function SpotPicker({ classId, capacity, taken, ownSpot, requiresPayment, priceCents, isReserved, returnTo, mirrored = false }: Props) {
  const takenSet = new Set(taken);
  const [selected, setSelected] = useState<number | null>(ownSpot);

  const open = capacity - taken.length;
  const isFull = open <= 0 && !isReserved;

  // Two-row mirrored layout: top row = seats 1..L, bottom row = L+1..capacity.
  // Reformers in the top row face DOWN toward the mirror; bottom row faces UP.
  // We render the bottom row in the same column order so seat (L+1) sits
  // directly across from seat 1 — pairs of partners across the mirror.
  const leftCount = Math.ceil(capacity / 2);
  const rightCount = capacity - leftCount;
  const cols = Math.max(leftCount, rightCount, 1);

  const seatButton = (seat: number, facing: "down" | "up" | "front" = "front") => {
    const isTaken = takenSet.has(seat) && seat !== ownSpot;
    const isMine = seat === ownSpot;
    const isSelected = seat === selected;
    const disabled = isTaken;
    return (
      <button
        key={seat}
        type="button"
        disabled={disabled || isReserved}
        onClick={() => !disabled && !isReserved && setSelected(prev => (prev === seat ? null : seat))}
        aria-label={`Spot ${seat}${isTaken ? " (taken)" : isMine ? " (your spot)" : ""}`}
        aria-pressed={isSelected}
        style={{
          aspectRatio: mirrored ? "0.85" : "1.3", borderRadius: 8,
          background:
            isMine ? "var(--sky)" :
            isSelected ? "var(--electric)" :
            isTaken ? "rgba(10,14,20,0.18)" :
            "transparent",
          color:
            isMine ? "var(--ink)" :
            isSelected ? "var(--ink)" :
            isTaken ? "rgba(10,14,20,0.4)" :
            "var(--ink)",
          border:
            isMine ? "none" :
            isSelected ? "none" :
            "1px solid rgba(10,14,20,0.15)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
          fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
          cursor: disabled || isReserved ? "not-allowed" : "pointer",
          transition: "transform .15s ease, background .15s ease",
          transform: isSelected ? "scale(1.04)" : "none",
          boxShadow: isMine ? "0 0 0 2px rgba(143,184,214,0.3)" : "none",
          padding: 4,
        }}
      >
        {/* Tiny indicator showing which way the reformer faces — purely for
            the mirrored layout, so you can see the "facing the mirror" idea. */}
        {mirrored && (
          <span aria-hidden style={{ fontSize: 8, opacity: isMine || isSelected ? 0.7 : 0.35, lineHeight: 1 }}>
            {facing === "down" ? "▼" : facing === "up" ? "▲" : "·"}
          </span>
        )}
        <span>{seat}</span>
      </button>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>
          {isReserved ? "YOUR SPOT" : "PICK YOUR SPOT"}
        </div>
        <div className="e-mono" style={{ color: isFull ? "var(--rose)" : "var(--electric-deep)" }}>
          {isFull ? "WAITLIST" : `${open} OPEN / ${capacity}`}
        </div>
      </div>

      <div style={{ marginTop: 12, padding: 16, borderRadius: 14, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)" }}>
        {mirrored ? (
          <>
            {/* Top row — reformers facing DOWN toward the mirror in the middle */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, marginBottom: 4 }}>
              {Array.from({ length: leftCount }).map((_, i) => seatButton(i + 1, "down"))}
              {/* Pad with empties if rows are uneven (cap is odd) */}
              {Array.from({ length: cols - leftCount }).map((_, i) => <div key={`pad-top-${i}`} />)}
            </div>

            {/* Mirror divider */}
            <div style={{
              position: "relative", height: 28, margin: "10px 0",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                position: "absolute", left: 0, right: 0, top: "50%",
                height: 2, transform: "translateY(-50%)",
                background: "linear-gradient(90deg, transparent 0%, rgba(143,184,214,0.7) 15%, rgba(143,184,214,0.7) 85%, transparent 100%)",
                boxShadow: "0 0 12px rgba(143,184,214,0.4)",
              }} />
              <span className="e-mono" style={{
                position: "relative", padding: "2px 10px",
                background: "var(--paper)",
                color: "var(--electric-deep)",
                fontSize: 9, letterSpacing: "0.32em",
              }}>
                ▽  MIRROR  △
              </span>
            </div>

            {/* Bottom row — reformers facing UP toward the mirror */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, marginTop: 4 }}>
              {Array.from({ length: rightCount }).map((_, i) => seatButton(leftCount + i + 1, "up"))}
              {Array.from({ length: cols - rightCount }).map((_, i) => <div key={`pad-bot-${i}`} />)}
            </div>
          </>
        ) : (
          <>
            <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", textAlign: "center", marginBottom: 12, letterSpacing: "0.18em" }}>— FRONT (MIRROR) —</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {Array.from({ length: capacity }).map((_, i) => seatButton(i + 1, "front"))}
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }} className="e-mono">
          <span style={{ display: "inline-flex", alignItems: "center" }}><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--sky)", borderRadius: 2, marginRight: 6 }} />YOU</span>
          <span style={{ display: "inline-flex", alignItems: "center" }}><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--electric)", borderRadius: 2, marginRight: 6 }} />PICKED</span>
          <span style={{ display: "inline-flex", alignItems: "center" }}><span style={{ display: "inline-block", width: 10, height: 10, background: "rgba(10,14,20,0.18)", borderRadius: 2, marginRight: 6 }} />TAKEN</span>
          <span style={{ display: "inline-flex", alignItems: "center" }}><span style={{ display: "inline-block", width: 10, height: 10, border: "1px solid rgba(10,14,20,0.3)", borderRadius: 2, marginRight: 6 }} />OPEN</span>
        </div>
      </div>

      {/* CTA / sticky-ish action row */}
      <div style={{ marginTop: 18, padding: "16px 18px", borderRadius: 14, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.08)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", letterSpacing: "0.2em" }}>
            {isReserved ? "RESERVED" : selected ? `SPOT ${selected}` : "NO SPOT YET"}
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink)", marginTop: 2 }}>
            {fmtPrice(priceCents)}{requiresPayment ? <span style={{ fontSize: 11, color: "rgba(10,14,20,0.55)", marginLeft: 6 }}>· PAY AT CHECK-IN</span> : null}
          </div>
        </div>
        <form action={bookClassAction} style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input type="hidden" name="class_id" value={classId} />
          <input type="hidden" name="requires_payment" value={String(requiresPayment)} />
          <input type="hidden" name="price_cents" value={priceCents} />
          <input type="hidden" name="return_to" value={returnTo} />
          {selected !== null && <input type="hidden" name="spot_number" value={selected} />}
          <button
            type="submit"
            className="btn btn-ink"
            disabled={isReserved || isFull || selected === null}
            style={{
              minWidth: 200,
              opacity: isReserved || isFull || selected === null ? 0.55 : 1,
              cursor: isReserved || isFull || selected === null ? "not-allowed" : "pointer",
            }}
          >
            {isReserved
              ? "ALREADY BOOKED"
              : isFull
                ? "WAITLIST"
                : selected === null
                  ? "PICK A SPOT"
                  : requiresPayment
                    ? `RESERVE SPOT ${selected} · ${fmtPrice(priceCents)}`
                    : `RESERVE SPOT ${selected}`}
          </button>
        </form>
      </div>
    </div>
  );
}
