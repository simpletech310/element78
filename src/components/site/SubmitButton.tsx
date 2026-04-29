"use client";

import { useFormStatus } from "react-dom";
import type { CSSProperties, ReactNode } from "react";

/**
 * Form submit button with built-in pending state. Sits inside any
 * `<form action={serverAction}>` and reads `useFormStatus()` so it can
 * disable + swap label while the action is in flight.
 *
 * Usage:
 *   <form action={saveProfileAction}>
 *     ...
 *     <SubmitButton>SAVE</SubmitButton>
 *   </form>
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "sky",
  style,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "sky" | "ghost" | "rose";
  style?: CSSProperties;
}) {
  const { pending } = useFormStatus();
  const className =
    variant === "ghost" ? "btn"
    : variant === "rose" ? "btn"
    : "btn btn-sky";
  const variantStyle: CSSProperties =
    variant === "ghost"
      ? { background: "transparent", color: "rgba(242,238,232,0.7)", border: "1px solid rgba(143,184,214,0.25)" }
      : variant === "rose"
        ? { background: "transparent", color: "var(--rose)", border: "1px solid rgba(232,181,168,0.4)" }
        : {};

  const label = pending ? (pendingLabel ?? "SAVING…") : children;

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      style={{
        padding: "12px 22px",
        ...variantStyle,
        ...style,
        opacity: pending ? 0.65 : 1,
        cursor: pending ? "wait" : "pointer",
        transition: "opacity 120ms ease",
      }}
      aria-busy={pending || undefined}
    >
      {label}
    </button>
  );
}
