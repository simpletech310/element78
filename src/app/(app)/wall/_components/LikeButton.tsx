"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { togglePostLikeAction } from "@/lib/wall-actions";

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [, startTransition] = useTransition();

  function onClick() {
    const nextLiked = !liked;
    const nextCount = Math.max(0, count + (nextLiked ? 1 : -1));
    setLiked(nextLiked);
    setCount(nextCount);
    startTransition(async () => {
      try {
        const res = await togglePostLikeAction(postId);
        // Reconcile to whatever the server actually decided.
        setLiked(res.liked);
      } catch {
        // Revert on failure.
        setLiked(!nextLiked);
        setCount(count);
      }
    });
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      style={{
        display: "flex",
        gap: 5,
        alignItems: "center",
        background: "transparent",
        border: "none",
        color: liked ? "var(--electric)" : "var(--ink)",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <span style={{ display: "inline-flex", filter: liked ? "none" : "none" }}>
        <Icon name="heart" size={16} />
      </span>
      <span className="e-mono" style={{ fontSize: 10 }}>{count}</span>
    </button>
  );
}
