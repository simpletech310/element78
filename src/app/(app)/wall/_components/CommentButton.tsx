"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { CommentSheet } from "./CommentSheet";

export function CommentButton({
  postId,
  initialCount,
}: {
  postId: string;
  initialCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Comments"
        style={{
          display: "flex",
          gap: 5,
          alignItems: "center",
          background: "transparent",
          border: "none",
          color: "var(--ink)",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <Icon name="crew" size={16} />
        <span className="e-mono" style={{ fontSize: 10 }}>{count}</span>
      </button>
      {open && (
        <CommentSheet
          postId={postId}
          onClose={() => setOpen(false)}
          onCountChange={setCount}
        />
      )}
    </>
  );
}
