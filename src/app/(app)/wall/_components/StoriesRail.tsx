"use client";

import { useMemo, useState } from "react";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import type { HydratedHighlight, ProfileLite } from "@/lib/data/types";
import { HighlightUploadSheet } from "./HighlightUploadSheet";
import { HighlightPlayer } from "./HighlightPlayer";

type AuthorStack = {
  author: ProfileLite;
  highlights: HydratedHighlight[];
};

export function StoriesRail({
  highlights,
  me,
}: {
  highlights: HydratedHighlight[];
  me: { id: string; display_name: string | null; avatar_url: string | null };
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [playerStack, setPlayerStack] = useState<HydratedHighlight[] | null>(null);

  // Group highlights by author so each ring represents one person.
  const stacks = useMemo<AuthorStack[]>(() => {
    const map = new Map<string, AuthorStack>();
    for (const h of highlights) {
      if (!h.author) continue;
      const existing = map.get(h.author.id);
      if (existing) {
        existing.highlights.push(h);
      } else {
        map.set(h.author.id, { author: h.author, highlights: [h] });
      }
    }
    // Most recent author first (the array is already sorted desc by created_at).
    return Array.from(map.values());
  }, [highlights]);

  const myStack = stacks.find(s => s.author.id === me.id) ?? null;
  const others = stacks.filter(s => s.author.id !== me.id);

  return (
    <>
      <div className="no-scrollbar" style={{ display: "flex", gap: 12, padding: "12px 22px 16px", overflowX: "auto" }}>
        {/* YOU tile — opens upload sheet, OR plays your own stack if you have one (long-press could edit later). */}
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <button
            onClick={() => {
              if (myStack) setPlayerStack(myStack.highlights);
              else setUploadOpen(true);
            }}
            aria-label={myStack ? "View your highlight" : "Add a highlight"}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              padding: 2,
              background: myStack
                ? "linear-gradient(135deg, var(--electric), var(--rose))"
                : "transparent",
              border: myStack ? "none" : "1.5px dashed rgba(10,14,20,0.3)",
              position: "relative",
              cursor: "pointer",
              display: "block",
            }}
          >
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--bone)" }}>
              {me.avatar_url ? (
                <Photo src={me.avatar_url} alt="You" style={{ width: "100%", height: "100%" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "rgba(10,14,20,0.08)" }} />
              )}
            </div>
            {!myStack && (
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, background: "var(--ink)", color: "var(--bone)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bone)" }}>
                <Icon name="plus" size={12} />
              </div>
            )}
          </button>
          <div className="e-mono" style={{ fontSize: 9, marginTop: 6 }}>YOU</div>
        </div>

        {others.map((s) => {
          const isLive = false; // reserved for future live-broadcast integration
          return (
            <div key={s.author.id} style={{ textAlign: "center", flexShrink: 0 }}>
              <button
                onClick={() => setPlayerStack(s.highlights)}
                aria-label={`Play ${s.author.display_name ?? "highlight"}`}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  padding: 2,
                  background: isLive
                    ? "linear-gradient(135deg, var(--electric), var(--rose))"
                    : "linear-gradient(135deg, var(--sky), var(--bone-3, var(--bone)))",
                  border: "none",
                  position: "relative",
                  cursor: "pointer",
                  display: "block",
                }}
              >
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--bone)" }}>
                  {s.author.avatar_url ? (
                    <Photo src={s.author.avatar_url} alt="" style={{ width: "100%", height: "100%" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "rgba(10,14,20,0.08)" }} />
                  )}
                </div>
              </button>
              <div className="e-mono" style={{ fontSize: 9, marginTop: 6 }}>
                {(s.author.display_name ?? s.author.handle ?? "MEMBER").split(" ")[0]?.toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>

      {uploadOpen && <HighlightUploadSheet onClose={() => setUploadOpen(false)} />}
      {playerStack && (
        <HighlightPlayer
          stack={playerStack}
          onClose={() => setPlayerStack(null)}
        />
      )}
    </>
  );
}
