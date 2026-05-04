import Link from "next/link";
import { TabBar } from "@/components/chrome/TabBar";
import { Navbar } from "@/components/site/Navbar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWallChallenge, listPosts } from "@/lib/data/queries";
import { ComposeBar } from "./_components/ComposeBar";
import { FilterChips } from "./_components/FilterChips";
import { PostCard } from "./_components/PostCard";

export const dynamic = "force-dynamic";

const KIND_MAP: Record<string, string[]> = {
  ALL: [],
  EVENTS: ["event", "announcement"],
  WINS: ["milestone", "progress"],
  TRAINERS: ["trainer_drop"],
  CHALLENGES: ["challenge"],
  "OPEN MIC": ["open_mic"],
};

export default async function WallScreen({
  searchParams,
}: {
  searchParams?: { filter?: string };
}) {
  const user = await getUser();
  // /wall is gated by middleware; if the user is somehow null we still render
  // the read-only feed without crashing.
  let me = { id: "", display_name: null as string | null, avatar_url: null as string | null };
  if (user) {
    const sb = createClient();
    const { data } = await sb
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    if (data) me = data as typeof me;
    else me = { id: user.id, display_name: null, avatar_url: null };
  }

  const filterParam = (searchParams?.filter ?? "ALL").toUpperCase();
  const kinds = KIND_MAP[filterParam] ?? [];

  const [posts, pinnedChallenge] = await Promise.all([
    listPosts({ kinds, currentUserId: user?.id ?? null }),
    getCurrentWallChallenge(),
  ]);
  const pinnedDaysLeft = pinnedChallenge
    ? Math.max(0, Math.ceil((new Date(pinnedChallenge.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <Navbar authed={true} />
      <div className="app-scroll" style={{ paddingTop: 20, paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: "10px 22px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>FAMILY · TIMELINE · {posts.length.toString().padStart(4, "0")}</div>
            <div className="e-display" style={{ fontSize: 36, marginTop: 2 }}>THE WALL</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ width: 40, height: 40, borderRadius: 999, background: "var(--ink)", color: "var(--bone)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Notifications"><Icon name="bell" size={18} /></button>
            <ComposeBar variant="header" meAvatarUrl={me.avatar_url} />
          </div>
        </div>

        {/* Filter chips */}
        <FilterChips active={filterParam} />

        {/* Pinned challenge — most recent published+active */}
        {pinnedChallenge && (
          <div style={{ padding: "4px 22px 10px" }}>
            <Link
              href={`/challenges/${pinnedChallenge.slug}`}
              style={{ display: "block", borderRadius: 18, overflow: "hidden", background: "var(--ink)", color: "var(--bone)", position: "relative", height: 200, textDecoration: "none" }}
            >
              <Photo src={pinnedChallenge.hero_image ?? "/assets/IMG_3471.jpg"} alt="" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(46,127,176,0.7), rgba(10,14,20,0.85))" }} />
              <div style={{ position: "absolute", inset: 0, padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <span className="e-tag" style={{ background: "var(--sky)", color: "var(--ink)", padding: "5px 9px", borderRadius: 3, alignSelf: "flex-start" }}>
                  CHALLENGE · {pinnedDaysLeft} DAY{pinnedDaysLeft === 1 ? "" : "S"} LEFT
                </span>
                <div>
                  <div className="e-display" style={{ fontSize: 28, lineHeight: 0.95 }}>{pinnedChallenge.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                    <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10 }}>
                      {pinnedChallenge.enrollment_count} IN · {pinnedChallenge.completion_count} DONE
                    </div>
                    <div style={{ flex: 1 }} />
                    <span className="btn btn-sky" style={{ padding: "8px 14px" }}>I&apos;M IN</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Compose row */}
        <ComposeBar meAvatarUrl={me.avatar_url} />

        {/* Posts */}
        <div style={{ padding: "12px 22px 4px", display: "flex", flexDirection: "column", gap: 14 }}>
          {posts.length === 0 ? (
            <div style={{ padding: "40px 14px", textAlign: "center", borderRadius: 16, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)" }}>
              <div className="e-display" style={{ fontSize: 18 }}>NOTHING HERE YET</div>
              <div className="e-mono" style={{ fontSize: 11, color: "rgba(10,14,20,0.5)", marginTop: 6 }}>BE THE FIRST TO POST.</div>
            </div>
          ) : (
            posts.map(p => <PostCard key={p.id} post={p} />)
          )}
        </div>
      </div>
      <TabBar />
    </div>
  );
}
