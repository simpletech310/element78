"use client";

import { toggleSavedAction } from "@/lib/saved-actions";

type Kind = "program" | "class" | "product" | "trainer" | "routine";

export function SaveButton({
  kind,
  ref_id,
  ref_slug,
  ref_name,
  ref_image,
  isSaved,
  return_to,
  size = 36,
  variant = "dark",
}: {
  kind: Kind;
  ref_id: string;
  ref_slug?: string | null;
  ref_name?: string | null;
  ref_image?: string | null;
  isSaved: boolean;
  return_to?: string;
  size?: number;
  /** "dark" — for dark backgrounds (default). "light" — for bone-colored pages like /shop. */
  variant?: "dark" | "light";
}) {
  const fill = isSaved ? "var(--sky)" : "none";
  const stroke = isSaved
    ? "var(--sky)"
    : variant === "light"
      ? "rgba(10,14,20,0.55)"
      : "rgba(242,238,232,0.5)";
  const bg = variant === "light" ? "rgba(10,14,20,0.06)" : "rgba(255,255,255,0.06)";
  const border =
    variant === "light"
      ? `1px solid rgba(10,14,20,0.08)`
      : `1px solid rgba(242,238,232,0.12)`;

  return (
    <form action={toggleSavedAction} style={{ display: "inline-flex" }}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="ref_id" value={ref_id} />
      {ref_slug != null && <input type="hidden" name="ref_slug" value={ref_slug} />}
      {ref_name != null && <input type="hidden" name="ref_name" value={ref_name} />}
      {ref_image != null && <input type="hidden" name="ref_image" value={ref_image} />}
      {return_to != null && <input type="hidden" name="return_to" value={return_to} />}
      <button
        type="submit"
        aria-label={isSaved ? "Unsave" : "Save"}
        title={isSaved ? "Saved" : "Save"}
        className="lift"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: bg,
          border,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
          color: stroke,
          backdropFilter: "blur(6px)",
        }}
      >
        <svg
          width={Math.round(size * 0.5)}
          height={Math.round(size * 0.5)}
          viewBox="0 0 24 24"
          fill={fill}
          stroke={stroke}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
        </svg>
      </button>
    </form>
  );
}
