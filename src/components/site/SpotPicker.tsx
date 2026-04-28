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
};

function fmtPrice(cents: number) {
  if (!cents) return "FREE";
  return `$${(cents / 100).toFixed(0)}`;
}

export function SpotPicker({ classId, capacity, taken, ownSpot, requiresPayment, priceCents, isReserved, returnTo }: Props) {
  const takenSet = new Set(taken);
  const [selected, setSelected] = useState<number | null>(ownSpot);

  const open = capacity - taken.length;
  const isFull = open <= 0 && !isReserved;

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
        <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", textAlign: "center", marginBottom: 12, letterSpacing: "0.18em" }}>— FRONT (MIRROR) —</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {Array.from({ length: capacity }).map((_, i) => {
            const seat = i + 1;
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
                  aspectRatio: "1.3", borderRadius: 8,
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
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
                  cursor: disabled || isReserved ? "not-allowed" : "pointer",
                  transition: "transform .15s ease, background .15s ease",
                  transform: isSelected ? "scale(1.04)" : "none",
                  boxShadow: isMine ? "0 0 0 2px rgba(143,184,214,0.3)" : "none",
                }}
              >
                {seat}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }} className="e-mono">
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
