"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toggleTaskCompletionAction } from "@/lib/challenge-actions";
import type { ChallengeTask } from "@/lib/data/types";

export function TaskList({
  challengeId,
  slug,
  tasks,
  initialDoneIds,
  enrolled,
}: {
  challengeId: string;
  slug: string;
  tasks: ChallengeTask[];
  initialDoneIds: string[];
  enrolled: boolean;
}) {
  const [done, setDone] = useState(new Set(initialDoneIds));
  const [optimistic, setOptimistic] = useOptimistic(done, (state, taskId: string) => {
    const next = new Set(state);
    if (next.has(taskId)) next.delete(taskId);
    else next.add(taskId);
    return next;
  });
  const [, startTransition] = useTransition();

  function toggle(taskId: string) {
    if (!enrolled) return;
    startTransition(async () => {
      setOptimistic(taskId);
      try {
        const res = await toggleTaskCompletionAction(taskId, challengeId, slug);
        const next = new Set(done);
        if (res.done) next.add(taskId);
        else next.delete(taskId);
        setDone(next);
      } catch {
        // revert by leaving 'done' as-is; useOptimistic snaps back on render
      }
    });
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {tasks.map(t => {
        const isDone = optimistic.has(t.id);
        return (
          <li
            key={t.id}
            onClick={() => toggle(t.id)}
            style={{
              display: "flex", gap: 12, alignItems: "center",
              padding: "14px 16px", borderRadius: 12,
              background: isDone ? "rgba(77,169,214,0.14)" : "var(--paper)",
              border: `1px solid ${isDone ? "rgba(77,169,214,0.4)" : "rgba(10,14,20,0.08)"}`,
              cursor: enrolled ? "pointer" : "default",
              opacity: enrolled ? 1 : 0.7,
              transition: "background 120ms ease, border-color 120ms ease",
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: isDone ? "var(--electric)" : "transparent",
              border: `2px solid ${isDone ? "var(--electric)" : "rgba(10,14,20,0.3)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              color: "var(--ink)",
              fontSize: 14,
              fontWeight: 700,
            }}>
              {isDone ? "✓" : ""}
            </div>
            <div style={{ flex: 1, fontSize: 14, lineHeight: 1.45, textDecoration: isDone ? "line-through" : "none", color: isDone ? "rgba(10,14,20,0.6)" : "var(--ink)" }}>
              {t.label}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
