import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { listPrograms, listTrainers, listUserEnrollments, listEnrollmentCompletions, listAllOpenGroupSessions } from "@/lib/data/queries";
import { routines } from "@/lib/data/routines";
import { getUser } from "@/lib/auth";
import { GroupSessionRail } from "@/components/site/GroupSessionRail";

export default async function TrainScreen() {
  const filters = [
    { l: "ALL", active: true }, { l: "PILATES" }, { l: "HIIT" },
    { l: "STRENGTH" }, { l: "YOGA" }, { l: "MOBILITY" },
  ];

  const now = new Date();
  const groupWindowEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [user, allPrograms, allTrainers, openGroupSessions] = await Promise.all([
    getUser(),
    listPrograms(),
    listTrainers(),
    listAllOpenGroupSessions(now.toISOString(), groupWindowEnd.toISOString()),
  ]);
  const humanTrainers = allTrainers.filter(t => !t.is_ai);
  const enrollments = user ? await listUserEnrollments(user.id) : [];
  const activePrograms = enrollments.filter(e => e.enrollment.status === "active");

  // Completion counts for each active enrollment
  const completedCounts: Record<string, number> = {};
  await Promise.all(activePrograms.map(async ({ enrollment }) => {
    const cs = await listEnrollmentCompletions(enrollment.id);
    completedCounts[enrollment.id] = cs.length;
  }));

  // Programs the user hasn't started — surfaced as "Discover" rail below.
  const enrolledIds = new Set(enrollments.map(e => e.program.id));
  const discoverPrograms = allPrograms.filter(p => !enrolledIds.has(p.id));


  return (
    <div className="app" style={{ height: "100dvh" }}>
      <StatusBar />
      <Navbar authed={true} />
      <div className="app-scroll" style={{ paddingBottom: 100 }}>
        <div style={{ padding: "14px 22px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>STUDIO</div>
            <div className="e-display" style={{ fontSize: 36, marginTop: 2 }}>TRAIN</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ width: 40, height: 40, borderRadius: 999, background: "var(--ink)", color: "var(--bone)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="search" size={18} /></button>
            <button style={{ width: 40, height: 40, borderRadius: 999, background: "var(--ink)", color: "var(--bone)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="filter" size={18} /></button>
          </div>
        </div>

        <div style={{ padding: "14px 22px" }}>
          <Link href={`/train/routine/${routines[0]?.slug ?? "lower-body-foundation"}`} style={{ position: "relative", borderRadius: 22, overflow: "hidden", height: 460, background: "#000", display: "block", color: "var(--bone)" }}>
            <Photo src="/assets/IMG_3465.jpg" alt="featured AI session" style={{ position: "absolute", inset: 0 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.5) 0%, rgba(10,14,20,0) 30%, rgba(10,14,20,0) 50%, rgba(10,14,20,0.95) 100%)" }} />
            <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(10,14,20,0.7)", padding: "6px 10px", borderRadius: 999, color: "var(--sky)", backdropFilter: "blur(10px)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--sky)" }} />
                <span className="e-tag">STUDIO · GUIDED</span>
              </div>
              <div className="e-tag" style={{ background: "rgba(10,14,20,0.7)", backdropFilter: "blur(10px)", padding: "6px 10px", borderRadius: 999, color: "var(--bone)" }}>NEW</div>
            </div>
            <div style={{ position: "absolute", top: "36%", left: "50%", transform: "translate(-50%, -50%)", width: 100, height: 100 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid rgba(143,184,214,0.6)", animation: "pulse-ring 2s ease-out infinite" }} />
              <div style={{ position: "absolute", inset: 12, borderRadius: "50%", border: "1px dashed rgba(143,184,214,0.4)" }} />
              <div style={{ position: "absolute", inset: 24, borderRadius: "50%", background: "rgba(143,184,214,0.15)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="spark" size={20} />
              </div>
            </div>
            <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
              <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 6 }}>★ AVATAR · ZURI</div>
              <div className="e-display" style={{ fontSize: 44, lineHeight: 0.92 }}>THE WEST<br/>COAST FLOW</div>
              <div style={{ fontSize: 13, color: "rgba(242,238,232,0.75)", marginTop: 10, lineHeight: 1.4, maxWidth: 280 }}>
                28-min reformer-free Pilates set. Slow tempo, hard work. Built for living rooms in LA.
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <span className="btn btn-sky" style={{ flex: 1 }}><Icon name="play" size={14} />START SESSION</span>
                <span className="btn" style={{ background: "rgba(255,255,255,0.1)", color: "var(--bone)", border: "1px solid rgba(255,255,255,0.2)", width: 50, padding: 0 }}><Icon name="heart" size={16} /></span>
              </div>
            </div>
          </Link>
        </div>

        <div className="no-scrollbar" style={{ padding: "20px 22px 6px", display: "flex", gap: 8, overflowX: "auto" }}>
          {filters.map((c) => (
            <div key={c.l} className="e-tag" style={{
              padding: "8px 14px", borderRadius: 999,
              background: c.active ? "var(--ink)" : "transparent",
              color: c.active ? "var(--bone)" : "var(--ink)",
              border: c.active ? "none" : "1px solid rgba(10,14,20,0.15)",
              whiteSpace: "nowrap",
            }}>{c.l}</div>
          ))}
        </div>

        {/* AI STUDIO — full routines. Each card opens a multi-exercise player
            that auto-advances through sets and rests. */}
        <div style={{ padding: "16px 22px 8px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div className="e-display" style={{ fontSize: 22 }}>STUDIO</div>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", fontSize: 9, marginTop: 2, letterSpacing: "0.18em" }}>{routines.length} ROUTINES · GUIDED SETS + REPS</div>
          </div>
        </div>

        {/* Featured routine — first card gets a wider, taller hero */}
        {routines[0] && (
          <div style={{ padding: "0 22px 8px" }}>
            <Link href={`/train/routine/${routines[0].slug}`} className="lift" style={{
              position: "relative", display: "block", borderRadius: 18, overflow: "hidden",
              height: 220, color: "var(--bone)", textDecoration: "none",
            }}>
              <Photo src={routines[0].hero_image} alt={routines[0].name} style={{ position: "absolute", inset: 0 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(10,14,20,0) 30%, rgba(10,14,20,0.95) 100%)" }} />
              <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
                <span className="e-tag" style={{ background: "var(--sky)", color: "var(--ink)", padding: "4px 9px", borderRadius: 4, fontSize: 9, letterSpacing: "0.22em" }}>{routines[0].category}</span>
                <span className="e-tag" style={{ background: "rgba(10,14,20,0.7)", backdropFilter: "blur(6px)", color: "var(--sky)", padding: "4px 9px", borderRadius: 4, fontSize: 9, letterSpacing: "0.22em" }}>{routines[0].duration_min} MIN</span>
              </div>
              <div style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
                <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.25em" }}>★ FEATURED · {routines[0].trainer_name}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 0.95, marginTop: 6 }}>{routines[0].name}</div>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.7)", fontSize: 9, marginTop: 6, letterSpacing: "0.18em" }}>
                  {routines[0].exercises.length} EXERCISES · {routines[0].intensity} INTENSITY
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Rest of the routines — horizontal rail */}
        <div className="no-scrollbar" style={{ display: "flex", gap: 12, padding: "0 22px 4px", overflowX: "auto" }}>
          {routines.slice(1).map((r) => (
            <Link href={`/train/routine/${r.slug}`} key={r.slug} className="lift" style={{ minWidth: 220, borderRadius: 16, overflow: "hidden", background: "var(--haze)", flexShrink: 0, color: "var(--bone)", textDecoration: "none" }}>
              <div style={{ position: "relative", height: 240 }}>
                <Photo src={r.hero_image} alt={r.name} style={{ position: "absolute", inset: 0 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.92) 100%)" }} />
                <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 5 }}>
                  <span className="e-tag" style={{ background: "rgba(10,14,20,0.65)", backdropFilter: "blur(8px)", padding: "4px 8px", borderRadius: 4, color: "var(--sky)", fontSize: 9, letterSpacing: "0.22em" }}>{r.category}</span>
                </div>
                <div style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: "50%", background: "var(--electric)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="play" size={12} />
                </div>
                <div style={{ position: "absolute", left: 12, right: 12, bottom: 10 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 0.95 }}>{r.name}</div>
                  <div className="e-mono" style={{ color: "rgba(242,238,232,0.6)", marginTop: 4, fontSize: 9, letterSpacing: "0.18em" }}>
                    {r.duration_min} MIN · {r.exercises.length} MOVES · {r.intensity}
                  </div>
                  <div className="e-mono" style={{ color: "var(--sky)", marginTop: 6, fontSize: 9, letterSpacing: "0.2em" }}>
                    WITH {r.trainer_name}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* HUMAN TRAINERS — compact rail so the page doesn't get crowded.
            Avatar + first name + 1-on-1 CTA. Tap → trainer profile, where
            programs / classes / "BOOK 1-ON-1" all live. */}
        {humanTrainers.length > 0 && (
          <div style={{ padding: "20px 22px 4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <div>
                <div className="e-display" style={{ fontSize: 22 }}>BOOK A COACH</div>
                <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", fontSize: 9, marginTop: 2, letterSpacing: "0.18em" }}>
                  {humanTrainers.length} TRAINERS · 1-ON-1 + PROGRAMS
                </div>
              </div>
              <Link href="/trainers" className="e-mono" style={{ color: "var(--electric-deep)", fontSize: 10, letterSpacing: "0.2em", textDecoration: "none" }}>
                ALL →
              </Link>
            </div>
            <div className="no-scrollbar" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {humanTrainers.slice(0, 8).map(t => (
                <Link
                  key={t.id}
                  href={`/trainers/${t.slug}`}
                  className="lift"
                  style={{
                    flexShrink: 0, width: 156, padding: 12, borderRadius: 14,
                    background: "var(--paper)", border: "1px solid rgba(10,14,20,0.08)",
                    color: "var(--ink)", textDecoration: "none",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center",
                  }}
                >
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%", overflow: "hidden",
                    background: "var(--haze)",
                    backgroundImage: t.avatar_url ? `url(${t.avatar_url})` : undefined,
                    backgroundSize: "cover", backgroundPosition: "center",
                    border: "2px solid var(--ink)",
                  }} />
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 16, lineHeight: 1, letterSpacing: "0.02em" }}>
                      {t.name.split(" ")[0].toUpperCase()}
                    </div>
                    {t.specialties && t.specialties.length > 0 && (
                      <div className="e-mono" style={{ marginTop: 4, fontSize: 8, color: "rgba(10,14,20,0.5)", letterSpacing: "0.18em" }}>
                        {t.specialties.slice(0, 2).join(" · ").toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="e-mono" style={{
                    marginTop: "auto",
                    padding: "5px 10px", borderRadius: 999,
                    background: "rgba(46,127,176,0.1)", color: "var(--electric-deep)",
                    fontSize: 9, letterSpacing: "0.18em",
                  }}>
                    BOOK 1-ON-1 →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* GROUP SESSIONS · OPEN — discovery rail across all coaches. Hidden
            when there's nothing scheduled. */}
        <GroupSessionRail items={openGroupSessions.slice(0, 8)} />

        {/* YOUR PROGRAMS — only when enrolled */}
        {activePrograms.length > 0 && (
          <div style={{ padding: "8px 22px 6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <div className="e-display" style={{ fontSize: 22 }}>YOUR PROGRAMS</div>
              <Link href="/account/history" className="e-mono" style={{ color: "var(--electric-deep)" }}>HISTORY →</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activePrograms.map(({ enrollment, program }) => {
                const c = completedCounts[enrollment.id] ?? 0;
                const pct = Math.round((c / Math.max(1, program.total_sessions)) * 100);
                return (
                  <Link key={enrollment.id} href={`/programs/${program.slug}`} className="lift" style={{
                    display: "flex", gap: 14,
                    padding: 14, borderRadius: 16,
                    background: "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(46,127,176,0.04))",
                    border: "1px solid rgba(143,184,214,0.28)",
                    color: "var(--ink)", textDecoration: "none",
                  }}>
                    <div style={{ width: 92, height: 116, borderRadius: 12, overflow: "hidden", flexShrink: 0, position: "relative" }}>
                      {program.hero_image && <Photo src={program.hero_image} alt={program.name} style={{ position: "absolute", inset: 0 }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div className="e-mono" style={{ color: "var(--electric-deep)", fontSize: 9, letterSpacing: "0.18em" }}>{program.duration_label}</div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 0.95, marginTop: 4, letterSpacing: "0.02em" }}>{program.name}</div>
                        <div className="e-mono" style={{ marginTop: 6, fontSize: 9, color: "rgba(10,14,20,0.6)", letterSpacing: "0.18em" }}>
                          DAY {enrollment.current_day}/{program.total_sessions} · {pct}%
                        </div>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: "rgba(46,127,176,0.18)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--electric)", boxShadow: "0 0 6px rgba(77,169,214,0.6)" }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ padding: "20px 22px 6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <div className="e-display" style={{ fontSize: 22 }}>{activePrograms.length > 0 ? "DISCOVER" : "SIGNATURE PROGRAMS"}</div>
            <div className="e-mono" style={{ color: "var(--electric-deep)" }}>{discoverPrograms.length}</div>
          </div>
          {discoverPrograms.map((p, i) => (
            <Link href={`/programs/${p.slug}`} key={p.id} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: i < discoverPrograms.length - 1 ? "1px solid rgba(10,14,20,0.08)" : "none", color: "var(--ink)", textDecoration: "none" }}>
              <div style={{ width: 96, height: 120, borderRadius: 10, overflow: "hidden", flexShrink: 0, position: "relative" }}>
                {p.hero_image && <Photo src={p.hero_image} alt={p.name} style={{ position: "absolute", inset: 0 }} />}
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "4px 0" }}>
                <div>
                  <div className="e-mono" style={{ color: "var(--electric-deep)", fontSize: 9 }}>{p.duration_label}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 0.95, marginTop: 4, letterSpacing: "0.02em" }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(10,14,20,0.6)", marginTop: 6 }}>{p.subtitle}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="e-mono" style={{
                    fontSize: 9, padding: "3px 8px", borderRadius: 999, letterSpacing: "0.18em",
                    background: p.price_cents > 0 ? "var(--ink)" : "rgba(143,184,214,0.18)",
                    color: p.price_cents > 0 ? "var(--sky)" : "var(--electric-deep)",
                  }}>{p.price_cents > 0 ? `$${(p.price_cents/100).toFixed(0)}` : "FREE"}</span>
                  <span className="e-mono" style={{ fontSize: 10, marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    ENROLL <Icon name="arrowUpRight" size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <TabBar />
      <HomeIndicator />
    </div>
  );
}
