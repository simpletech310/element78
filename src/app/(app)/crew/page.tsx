import Link from "next/link";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { listPosts } from "@/lib/data/queries";

export default async function CrewScreen() {
  const posts = await listPosts();
  const stories = [
    { name: "YOU", img: "/assets/blue-hair-selfie.jpg", add: true },
    { name: "KAI", img: "/assets/blue-hair-gym.jpg", live: true },
    { name: "TASHA", img: "/assets/pilates-pink.jpg" },
    { name: "IMANI", img: "/assets/blue-set-rooftop.jpg" },
    { name: "AALIYAH", img: "/assets/dumbbell-street.jpg" },
    { name: "SHAY", img: "/assets/hoodie-grey-blonde.jpg" },
  ];

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <StatusBar />
      <div className="app-scroll app-top" style={{ paddingBottom: 100 }}>
        <div style={{ padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>FAMILY · 1,408</div>
            <div className="e-display" style={{ fontSize: 36, marginTop: 2 }}>THE CREW</div>
          </div>
          <button style={{ width: 40, height: 40, borderRadius: 999, background: "var(--ink)", color: "var(--bone)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="bell" size={18} />
          </button>
        </div>

        <div className="no-scrollbar" style={{ display: "flex", gap: 12, padding: "6px 22px 16px", overflowX: "auto" }}>
          {stories.map((s, i) => (
            <div key={i} style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%", padding: 2,
                background: s.live ? "linear-gradient(135deg, var(--electric), var(--rose))"
                          : s.add ? "transparent"
                          : "linear-gradient(135deg, var(--sky), var(--bone-3))",
                border: s.add ? "1.5px dashed rgba(10,14,20,0.3)" : "none",
                position: "relative",
              }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--bone)" }}>
                  <Photo src={s.img} alt={s.name} style={{ width: "100%", height: "100%" }} />
                </div>
                {s.live && <div style={{ position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)", background: "var(--electric)", color: "var(--ink)", padding: "1px 6px", borderRadius: 4, fontSize: 8, fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.1em" }}>LIVE</div>}
                {s.add && <div style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, background: "var(--ink)", color: "var(--bone)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bone)" }}><Icon name="plus" size={12} /></div>}
              </div>
              <div className="e-mono" style={{ fontSize: 9, marginTop: 6 }}>{s.name}</div>
            </div>
          ))}
        </div>

        {/* Pinned event */}
        <div style={{ padding: "0 22px 12px" }}>
          <Link href="/crew/timeline" style={{ borderRadius: 18, overflow: "hidden", background: "var(--ink)", color: "var(--bone)", display: "block" }}>
            <div style={{ position: "relative", height: 180 }}>
              <Photo src="/assets/dumbbell-street.jpg" alt="" style={{ position: "absolute", inset: 0, opacity: 0.6 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(10,14,20,0.4), rgba(10,14,20,0.85))" }} />
              <div style={{ position: "absolute", top: 12, left: 12 }}>
                <span className="e-tag" style={{ background: "var(--sky)", color: "var(--ink)", padding: "4px 8px", borderRadius: 3 }}>EVENT · PINNED</span>
              </div>
              <div style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
                <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 4 }}>SAT · MAY 03 · 7AM</div>
                <div className="e-display" style={{ fontSize: 26, lineHeight: 0.95 }}>SUNRISE RUN<br/>+ COFFEE MEET</div>
              </div>
            </div>
            <div style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex" }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ width: 26, height: 26, borderRadius: "50%", background: ["var(--sky)","var(--rose)","var(--electric)","var(--bone-3)"][i], marginLeft: i ? -8 : 0, border: "2px solid var(--ink)" }} />
                ))}
                <span className="e-mono" style={{ marginLeft: 8, alignSelf: "center", color: "rgba(242,238,232,0.6)" }}>+42 GOING</span>
              </div>
              <span className="btn btn-sky" style={{ padding: "10px 18px" }}>RSVP</span>
            </div>
          </Link>
        </div>

        {/* Posts */}
        <div style={{ padding: "6px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {posts.slice(0, 3).map((p) => {
            const meta = p.meta as { author?: string; tag?: string };
            return (
              <div key={p.id} style={{ borderRadius: 16, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)", overflow: "hidden" }}>
                <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: "var(--bone-2)" }}>
                    {p.media_url && <Photo src={p.media_url} alt="" style={{ width: "100%", height: "100%" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 14, letterSpacing: "0.02em" }}>{meta.author ?? "MEMBER"}</span>
                      {meta.tag && <span className="e-mono" style={{ background: "var(--sky)", color: "var(--ink)", padding: "1px 5px", borderRadius: 3, fontSize: 8 }}>{meta.tag}</span>}
                    </div>
                    <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", marginTop: 2 }}>{new Date(p.created_at).toLocaleString()}</div>
                  </div>
                  <Icon name="chevron" size={18} />
                </div>
                <div style={{ padding: "0 14px 12px", fontSize: 14, lineHeight: 1.5 }}>{p.body}</div>
                {p.media_url && (
                  <div style={{ height: 240, position: "relative" }}>
                    <Photo src={p.media_url} alt="" style={{ position: "absolute", inset: 0 }} />
                  </div>
                )}
                <div style={{ padding: "12px 14px", display: "flex", gap: 16, alignItems: "center", borderTop: "1px solid rgba(10,14,20,0.06)" }}>
                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    <Icon name="heart" size={16} />
                    <span className="e-mono" style={{ fontSize: 10 }}>—</span>
                  </div>
                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    <Icon name="crew" size={16} />
                    <span className="e-mono" style={{ fontSize: 10 }}>—</span>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <Icon name="arrowUpRight" size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <TabBar />
      <HomeIndicator />
    </div>
  );
}
