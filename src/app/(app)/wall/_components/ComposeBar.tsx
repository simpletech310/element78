"use client";

import { useState } from "react";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { ComposeSheet } from "./ComposeSheet";

export function ComposeBar({
  meAvatarUrl,
  variant = "row",
}: {
  meAvatarUrl: string | null;
  /** "row" matches the inline compose at the top of the post list.
   *  "header" matches the round + button next to the bell. */
  variant?: "row" | "header";
}) {
  const [open, setOpen] = useState(false);

  if (variant === "header") {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          aria-label="New post"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: "var(--electric)",
            color: "var(--ink)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Icon name="plus" size={18} />
        </button>
        {open && <ComposeSheet onClose={() => setOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <div style={{ padding: "16px 22px 6px", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(10,14,20,0.08)" }}>
          {meAvatarUrl && <Photo src={meAvatarUrl} alt="" style={{ width: "100%", height: "100%" }} />}
        </div>
        <button
          onClick={() => setOpen(true)}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 999,
            background: "var(--paper)",
            border: "1px solid rgba(10,14,20,0.08)",
            fontSize: 13,
            color: "rgba(10,14,20,0.5)",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          Share something with the family…
        </button>
        <button
          aria-label="Live"
          title="Live (coming soon)"
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            background: "var(--ink)",
            color: "var(--bone)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "not-allowed",
            opacity: 0.7,
          }}
        >
          <Icon name="play" size={14} />
        </button>
      </div>
      {open && <ComposeSheet onClose={() => setOpen(false)} />}
    </>
  );
}
