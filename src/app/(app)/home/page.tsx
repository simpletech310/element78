import Link from "next/link";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { listClasses, listUserEnrollments, listUserBookings, listEnrollmentCompletions, listProducts, listPrograms, listPosts } from "@/lib/data/queries";
import { getUser } from "@/lib/auth";

function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

function fmtPrice(cents: number) {
  if (!cents) return "FREE";
  return `$${(cents / 100).toFixed(0)}`;
}

export default async function HomeScreen() {
  const [classes, products, programs, posts, user] = await Promise.all([
    listClasses(),
    listProducts(),
    listPrograms(),
    listPosts(),
    getUser(),
  ]);
  const newDrops = products.slice(0, 6);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined)
    ?? (user?.email?.split("@")[0])
    ?? "MEMBER";
  const firstName = displayName.split(/\s+/)[0];

  // Pull the user's active programs + upcoming bookings — drives the
  // personalized strips below the daily ritual.
  const [enrollments, bookings] = user
    ? await Promise.all([listUserEnrollments(user.id), listUserBookings(user.id)])
    : [[], []];
  const activePrograms = enrollments.filter(e => e.enrollment.status === "active");
  const completedCounts: Record<string, number> = {};
  await Promise.all(activePrograms.map(async ({ enrollment }) => {
    const cs = await listEnrollmentCompletions(enrollment.id);
    completedCounts[enrollment.id] = cs.length;
  }));

  const now = Date.now();
  const upcomingBookings = bookings
    .filter(b => b.booking.status === "reserved" && new Date(b.class.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.class.starts_at).getTime() - new Date(b.class.starts_at).getTime());
  const bookedClassIds = new Set(upcomingBookings.map(b => b.class.id));

  // 7-day strip — group classes per day, soonest first.
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const week: { date: Date; classes: typeof classes }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfDay.getTime() + i * 86_400_000);
    const next = new Date(d.getTime() + 86_400_000);
    week.push({
      date: d,
      classes: classes
        .filter(c => {
          const t = new Date(c.starts_at);
          return t >= d && t < next;
        })
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    });
  }
  // The "Up Next" classes show after the user's reserved blocks: soonest 4
  // public classes the user has not booked.
  const upNextClasses = classes
    .filter(c => new Date(c.starts_at).getTime() >= now && !bookedClassIds.has(c.id))
    .slice(0, 4);

  // Programs: split between active enrollments and discoverable.
  const activeProgramIds = new Set(activePrograms.map(e => e.program.id));
  const explorePrograms = programs.filter(p => !activeProgramIds.has(p.id)).slice(0, 4);

  // Next-up class on the gym strip — prefer the user's first booking, fall back to schedule.
  const next = upcomingBookings[0]?.class ?? classes[0];
  const dt = next ? new Date(next.starts_at) : null;
  const dayLabel = dt?.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const dayNum = dt?.getDate();
  const time = dt?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toUpperCase();

  const studio = [
    { t: "GLUTE BRIDGE FLOW", mins: 18, lvl: "LO", img: "/assets/IMG_3467.jpg", tag: "PILATES" },
    { t: "STREET HIIT", mins: 24, lvl: "HI", img: "/assets/IMG_3465.jpg", tag: "HIIT" },
    { t: "CORE 78", mins: 30, lvl: "MD", img: "/assets/floor-mockup.png", tag: "CORE" },
  ];

  // Wall feed — pull from real posts, fall back to curated demo content
  // when Supabase is empty so the section never looks dead.
  type WallPost = {
    name: string;
    body: string;
    time: string;
    avatar: string;
    img?: string | null;
    tag?: string;
    likes: number;
    comments: number;
  };
  const fallbackWall: WallPost[] = [
    { name: "KAI · TRAINER", tag: "STAFF", body: "Dropped a new flow. Slow tempo, hard work — Studio B at 6:30P. Pull up.", time: "14m", avatar: "/assets/blue-hair-gym.jpg", img: "/assets/IMG_3465.jpg", likes: 124, comments: 18 },
    { name: "AALIYAH M.", body: "Day 14 of “In My Element” complete. Glutes are gone. Ego intact.", time: "1h", avatar: "/assets/IMG_3461.jpg", likes: 86, comments: 12 },
    { name: "TASHA · TRAINER", tag: "STAFF", body: "Sunrise Pilates is officially the move. Mats out at 6:25A sharp.", time: "3h", avatar: "/assets/editorial-1.jpg", img: "/assets/floor-mockup.png", likes: 211, comments: 24 },
    { name: "SHAY D.", body: "First time hitting the 95lb squat. The whole back row hyped me up.", time: "5h", avatar: "/assets/IMG_3469.jpg", likes: 342, comments: 41, tag: "PR" },
    { name: "ELEMENT 78", tag: "ANNOUNCE", body: "May 03 · Sunrise Run + Coffee Meet. 7AM at the lot.", time: "8h", avatar: "/assets/IMG_3471.jpg", img: "/assets/IMG_3461.jpg", likes: 88, comments: 9 },
  ];
  const wallPosts: WallPost[] = posts.length > 0
    ? posts.slice(0, 5).map(p => {
        const meta = (p.meta ?? {}) as { author?: string; tag?: string };
        const ageMs = Date.now() - new Date(p.created_at).getTime();
        const time = ageMs < 3_600_000
          ? `${Math.max(1, Math.round(ageMs / 60_000))}m`
          : ageMs < 86_400_000
            ? `${Math.round(ageMs / 3_600_000)}h`
            : `${Math.round(ageMs / 86_400_000)}d`;
        return {
          name: meta.author ?? "ELEMENT 78",
          tag: meta.tag,
          body: p.body ?? "",
          time,
          avatar: p.media_url ?? "/assets/blue-hair-gym.jpg",
          img: p.media_url,
          likes: 0,
          comments: 0,
        };
      })
    : fallbackWall;

  return (
    <div className="app app-dark" style={{ height: "100dvh" }}>
      <StatusBar dark />
      <div className="app-scroll app-top" style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: "14px 22px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()} / {(new Date().getMonth()+1).toString().padStart(2,"0")}.{new Date().getDate().toString().padStart(2,"0")} / ATL
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 30, lineHeight: 0.95, marginTop: 6, letterSpacing: "0.02em" }}>
              {greeting()},<br/><span style={{ color: "var(--sky)" }}>{firstName.toUpperCase()}.</span>
            </div>
          </div>
          <Link href="/account" aria-label="Account" style={{ position: "relative", display: "block" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "1.5px solid var(--sky)" }}>
              <Photo src="/assets/blue-hair-selfie.jpg" alt="profile" style={{ width: "100%", height: "100%" }} />
            </div>
            <div style={{ position: "absolute", bottom: -2, right: -2, background: "var(--electric)", color: "var(--ink)", borderRadius: 999, padding: "1px 5px", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600, border: "2px solid var(--ink)" }}>14</div>
          </Link>
        </div>

        {/* Hero — today's ritual */}
        <div style={{ padding: "0 22px" }}>
          <Link href="/train/player" className="lift" style={{ position: "relative", borderRadius: 22, overflow: "hidden", height: 380, background: "#000", display: "block", color: "var(--bone)", textDecoration: "none" }}>
            <Photo src="/assets/IMG_3467.jpg" alt="glute bridge flow" className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.85 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.1) 30%, rgba(10,14,20,0.95) 100%)" }} />
            <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between" }}>
              <div className="e-tag" style={{ background: "rgba(10,14,20,0.7)", backdropFilter: "blur(12px)", padding: "6px 10px", borderRadius: 999, color: "var(--sky)" }}>◉ TODAY&apos;S RITUAL</div>
              <div className="e-tag" style={{ background: "rgba(10,14,20,0.7)", backdropFilter: "blur(12px)", padding: "6px 10px", borderRadius: 999 }}>42 MIN</div>
            </div>
            <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
              <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 4 }}>SERIES 03 · DAY 14</div>
              <div className="e-display" style={{ fontSize: 38, lineHeight: 0.92 }}>
                LOW-IMPACT<br/>
                <span style={{ fontStyle: "italic", fontFamily: "var(--font-serif)", textTransform: "none", letterSpacing: 0 }}>power</span> PILATES
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
                <span className="btn btn-sky" style={{ flex: 1 }}><Icon name="play" size={14} />BEGIN</span>
                <span className="btn btn-ghost" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "var(--bone)" }}>PREVIEW</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Streak ribbon */}
        <div style={{ padding: "20px 22px 6px", display: "flex", justifyContent: "space-between", gap: 10 }}>
          {[{ k: "14", l: "DAY STREAK" }, { k: "03:42", l: "WK ACTIVE" }, { k: "78%", l: "WEEKLY GOAL" }].map((s) => (
            <div key={s.l} style={{ flex: 1, padding: "14px 12px", borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--sky)", letterSpacing: "0.02em" }}>{s.k}</div>
              <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* THIS WEEK — schedule strip. Tap a day to jump to that day's classes. */}
        <div style={{ padding: "28px 22px 10px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="e-display" style={{ fontSize: 22 }}>THIS WEEK</div>
          <Link href="/classes" className="e-mono" style={{ color: "var(--sky)" }}>FULL CALENDAR →</Link>
        </div>
        <div className="no-scrollbar" style={{ display: "flex", gap: 8, padding: "0 22px", overflowX: "auto" }}>
          {week.map(({ date, classes: dayClasses }, i) => {
            const isToday = i === 0;
            const dayLbl = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
            return (
              <Link key={dayLbl + i} href="/classes" className="lift" style={{
                flexShrink: 0, minWidth: 84,
                padding: "12px 10px", borderRadius: 14,
                background: isToday ? "linear-gradient(180deg, rgba(143,184,214,0.22), rgba(46,127,176,0.06))" : "var(--haze)",
                border: isToday ? "1px solid rgba(143,184,214,0.45)" : "1px solid rgba(255,255,255,0.06)",
                color: "var(--bone)", textDecoration: "none",
                textAlign: "center",
              }}>
                <div className="e-mono" style={{ color: isToday ? "var(--sky)" : "rgba(242,238,232,0.5)", fontSize: 9, letterSpacing: "0.2em" }}>{dayLbl}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 24, lineHeight: 1, marginTop: 4, color: isToday ? "var(--sky)" : "var(--bone)" }}>{date.getDate()}</div>
                <div className="e-mono" style={{ marginTop: 8, fontSize: 9, color: "rgba(242,238,232,0.55)", letterSpacing: "0.18em" }}>
                  {dayClasses.length === 0 ? "REST" : `${dayClasses.length} CLASS${dayClasses.length === 1 ? "" : "ES"}`}
                </div>
              </Link>
            );
          })}
        </div>

        {/* YOUR PROGRAMS — only when enrolled */}
        {activePrograms.length > 0 && (
          <>
            <div style={{ padding: "28px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="e-display" style={{ fontSize: 22 }}>YOUR PROGRAMS</div>
              <Link href="/account/history" className="e-mono" style={{ color: "var(--sky)" }}>HISTORY →</Link>
            </div>
            <div className="no-scrollbar" style={{ display: "flex", gap: 12, padding: "0 22px", overflowX: "auto" }}>
              {activePrograms.map(({ enrollment, program }) => {
                const c = completedCounts[enrollment.id] ?? 0;
                const pct = Math.round((c / Math.max(1, program.total_sessions)) * 100);
                return (
                  <Link key={enrollment.id} href={`/programs/${program.slug}`} className="lift" style={{
                    minWidth: 260, flexShrink: 0,
                    borderRadius: 16, overflow: "hidden",
                    background: "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(46,127,176,0.05))",
                    border: "1px solid rgba(143,184,214,0.3)",
                    color: "var(--bone)", textDecoration: "none",
                  }}>
                    <div style={{ position: "relative", height: 140 }}>
                      {program.hero_image && <Photo src={program.hero_image} alt="" style={{ position: "absolute", inset: 0 }} />}
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(10,14,20,0.85))" }} />
                      <div style={{ position: "absolute", top: 10, left: 10, padding: "4px 10px", borderRadius: 999, background: "var(--sky)", color: "var(--ink)" }} className="e-mono" >IN PROGRESS</div>
                      <div style={{ position: "absolute", left: 12, right: 12, bottom: 10 }}>
                        <div className="e-mono" style={{ color: "rgba(242,238,232,0.7)", fontSize: 9, letterSpacing: "0.18em" }}>{program.duration_label}</div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 0.95, marginTop: 4 }}>{program.name}</div>
                      </div>
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ height: 4, background: "rgba(143,184,214,0.18)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--sky)", boxShadow: "0 0 6px rgba(143,184,214,0.55)" }} />
                      </div>
                      <div className="e-mono" style={{ marginTop: 6, fontSize: 9, color: "rgba(242,238,232,0.6)", letterSpacing: "0.18em" }}>
                        DAY {enrollment.current_day}/{program.total_sessions} · {pct}%
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* EXPLORE PROGRAMS — programs the user hasn't enrolled in yet */}
        {explorePrograms.length > 0 && (
          <>
            <div style={{ padding: "28px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="e-display" style={{ fontSize: 22 }}>{activePrograms.length > 0 ? "EXPLORE PROGRAMS" : "PROGRAMS"}</div>
              <Link href="/programs" className="e-mono" style={{ color: "var(--sky)" }}>ALL PROGRAMS →</Link>
            </div>
            <div className="no-scrollbar" style={{ display: "flex", gap: 12, padding: "0 22px", overflowX: "auto" }}>
              {explorePrograms.map(p => (
                <Link key={p.id} href={`/programs/${p.slug}`} className="lift" style={{
                  minWidth: 220, flexShrink: 0,
                  borderRadius: 16, overflow: "hidden",
                  background: "var(--haze)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "var(--bone)", textDecoration: "none",
                }}>
                  <div style={{ position: "relative", height: 200 }}>
                    {p.hero_image && <Photo src={p.hero_image} alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(10,14,20,0.95))" }} />
                    <div style={{ position: "absolute", top: 10, left: 10, padding: "3px 8px", borderRadius: 999, background: "rgba(10,14,20,0.7)", backdropFilter: "blur(6px)" }}>
                      <span className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>{p.duration_label}</span>
                    </div>
                    {p.requires_payment && (
                      <div className="e-mono" style={{ position: "absolute", top: 10, right: 10, padding: "3px 8px", borderRadius: 999, background: "var(--sky)", color: "var(--ink)", fontSize: 9, letterSpacing: "0.2em" }}>
                        {fmtPrice(p.price_cents)}
                      </div>
                    )}
                    <div style={{ position: "absolute", left: 12, right: 12, bottom: 10 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 0.95 }}>{p.name}</div>
                      {p.subtitle && (
                        <div className="e-mono" style={{ color: "rgba(242,238,232,0.65)", fontSize: 9, marginTop: 4, letterSpacing: "0.18em" }}>{p.subtitle.toUpperCase()}</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* YOUR UPCOMING CLASSES — only when reserved */}
        {upcomingBookings.length > 0 && (
          <>
            <div style={{ padding: "28px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="e-display" style={{ fontSize: 22 }}>YOUR CLASSES</div>
              <Link href="/gym" className="e-mono" style={{ color: "var(--sky)" }}>ALL BOOKED →</Link>
            </div>
            <div style={{ padding: "0 22px", display: "flex", flexDirection: "column", gap: 10 }}>
              {upcomingBookings.slice(0, 3).map(({ booking, class: cls }) => {
                const dt2 = new Date(cls.starts_at);
                const dStr = dt2.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
                const tStr = dt2.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                const priceLabel = booking.paid_status === "free" ? "FREE"
                                : booking.paid_status === "paid" ? `PAID · $${(booking.price_cents_paid/100).toFixed(0)}`
                                : `PAY AT CHECK-IN · $${(booking.price_cents_paid/100).toFixed(0)}`;
                return (
                  <Link key={booking.id} href={`/gym/classes/${cls.id}`} className="lift" style={{
                    display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "center",
                    padding: "14px 16px", borderRadius: 14,
                    background: "linear-gradient(135deg, rgba(143,184,214,0.12), rgba(77,169,214,0.04))",
                    border: "1px solid rgba(143,184,214,0.28)",
                    color: "var(--bone)", textDecoration: "none",
                  }}>
                    <div style={{ paddingRight: 14, borderRight: "1px solid rgba(143,184,214,0.2)" }}>
                      <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.18em" }}>{dStr}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, marginTop: 2 }}>{tStr}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 17, letterSpacing: "0.02em" }}>{cls.name}</div>
                      <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, marginTop: 4, letterSpacing: "0.18em" }}>
                        {cls.kind?.toUpperCase()} · {cls.room ?? ""} · SPOT {booking.spot_number ?? "—"}
                      </div>
                      <div className="e-mono" style={{ marginTop: 6, fontSize: 9, color: "var(--sky)", letterSpacing: "0.2em" }}>{priceLabel}</div>
                    </div>
                    <Icon name="chevron" size={18} />
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* UP NEXT — browse open classes the user has not booked */}
        {upNextClasses.length > 0 && (
          <>
            <div style={{ padding: "28px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="e-display" style={{ fontSize: 22 }}>{upcomingBookings.length > 0 ? "UP NEXT" : "BOOK A CLASS"}</div>
              <Link href="/classes" className="e-mono" style={{ color: "var(--sky)" }}>SEE ALL →</Link>
            </div>
            <div className="no-scrollbar" style={{ display: "flex", gap: 12, padding: "0 22px", overflowX: "auto" }}>
              {upNextClasses.map(c => {
                const dt2 = new Date(c.starts_at);
                const day = dt2.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
                const date = dt2.getDate();
                const tm = dt2.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                const open = c.capacity - c.booked;
                const full = open <= 0;
                return (
                  <Link key={c.id} href={`/gym/classes/${c.id}`} className="lift" style={{
                    minWidth: 240, flexShrink: 0,
                    padding: 14, borderRadius: 16,
                    background: "var(--haze)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "var(--bone)", textDecoration: "none",
                    display: "flex", flexDirection: "column", gap: 10,
                    opacity: full ? 0.7 : 1,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 12px", borderRadius: 12, background: "rgba(143,184,214,0.12)", border: "1px solid rgba(143,184,214,0.22)" }}>
                        <span className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>{day}</span>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, marginTop: 2 }}>{date}</span>
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 17, lineHeight: 1, letterSpacing: "0.02em" }}>{c.name}</div>
                        <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, marginTop: 4, letterSpacing: "0.18em" }}>{tm} · {c.duration_min} MIN · {c.room ?? ""}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span className="e-mono" style={{ fontSize: 9, color: full ? "var(--rose)" : "rgba(242,238,232,0.6)", letterSpacing: "0.18em" }}>
                        {full ? "WAITLIST" : `${open} OF ${c.capacity} OPEN`}
                      </span>
                      <span className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.18em" }}>{fmtPrice(c.price_cents)} · BOOK →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* AI Studio rail */}
        <div style={{ padding: "28px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="e-display" style={{ fontSize: 22 }}>AI STUDIO</div>
          <Link href="/train" className="e-mono" style={{ color: "var(--sky)" }}>SEE ALL →</Link>
        </div>
        <div className="no-scrollbar" style={{ display: "flex", gap: 12, padding: "0 22px", overflowX: "auto" }}>
          {studio.map((c, i) => (
            <Link href="/train/player" key={i} className="lift" style={{ minWidth: 200, borderRadius: 16, overflow: "hidden", background: "var(--haze)", flexShrink: 0, color: "var(--bone)", textDecoration: "none" }}>
              <div style={{ position: "relative", height: 220 }}>
                <Photo src={c.img} alt={c.t} style={{ position: "absolute", inset: 0 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.85) 100%)" }} />
                <div style={{ position: "absolute", top: 10, left: 10 }}>
                  <span className="e-tag" style={{ background: "rgba(10,14,20,0.65)", backdropFilter: "blur(8px)", padding: "4px 8px", borderRadius: 4, color: "var(--sky)" }}>{c.tag}</span>
                </div>
                <div style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: "50%", background: "var(--electric)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="play" size={12} />
                </div>
                <div style={{ position: "absolute", left: 12, right: 12, bottom: 10 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 0.95 }}>{c.t}</div>
                  <div className="e-mono" style={{ color: "rgba(242,238,232,0.6)", marginTop: 4, fontSize: 9 }}>{c.mins} MIN · {c.lvl} INTENSITY</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Next at the gym */}
        {next && (
          <div style={{ padding: "28px 22px 12px" }}>
            <div className="e-display" style={{ fontSize: 22, marginBottom: 12 }}>NEXT AT THE GYM</div>
            <Link href={`/gym/classes/${next.id}`} style={{ borderRadius: 16, padding: 16, background: "linear-gradient(135deg, rgba(143,184,214,0.15), rgba(77,169,214,0.05))", border: "1px solid rgba(143,184,214,0.25)", display: "flex", gap: 14, color: "var(--bone)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 56, padding: "12px 0", borderRight: "1px solid rgba(143,184,214,0.2)", paddingRight: 14 }}>
                <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9 }}>{dayLabel}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 30, lineHeight: 1, marginTop: 2 }}>{dayNum}</div>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, marginTop: 2 }}>{time}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 4 }}>{next.kind?.toUpperCase()} · {next.room}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1 }}>{next.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <div style={{ display: "flex" }}>
                    {[0,1,2].map((i) => (
                      <div key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: ["var(--sky)","var(--rose)","var(--electric)"][i], marginLeft: i ? -6 : 0, border: "2px solid var(--ink)" }} />
                    ))}
                  </div>
                  <span className="e-mono" style={{ color: "rgba(242,238,232,0.6)", fontSize: 10 }}>+{next.booked} BOOKED · WITH KAI</span>
                </div>
              </div>
              <Icon name="chevron" size={20} />
            </Link>
          </div>
        )}

        {/* THE WALL — feed preview */}
        <div style={{ padding: "32px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Link href="/wall" className="e-display" style={{ fontSize: 22, color: "var(--bone)", textDecoration: "none" }}>THE WALL</Link>
          <Link href="/wall" className="e-mono" style={{ color: "var(--sky)" }}>OPEN FEED →</Link>
        </div>
        <div style={{ padding: "0 22px", display: "flex", flexDirection: "column", gap: 12 }}>
          {wallPosts.map((p, i) => (
            <Link key={i} href="/wall" className="lift" style={{
              display: "flex", flexDirection: "column", gap: 10,
              padding: 14, borderRadius: 16,
              background: "var(--haze)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "var(--bone)", textDecoration: "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                  <Photo src={p.avatar} alt={p.name} style={{ width: "100%", height: "100%" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 14, letterSpacing: "0.02em" }}>{p.name}</span>
                    {p.tag && (
                      <span className="e-mono" style={{
                        background: p.tag === "STAFF" ? "var(--sky)" : p.tag === "PR" ? "var(--electric)" : "rgba(143,184,214,0.18)",
                        color: p.tag === "STAFF" || p.tag === "PR" ? "var(--ink)" : "var(--sky)",
                        padding: "2px 6px", borderRadius: 3, fontSize: 8, letterSpacing: "0.18em",
                      }}>{p.tag}</span>
                    )}
                  </div>
                  <div className="e-mono" style={{ color: "rgba(242,238,232,0.4)", fontSize: 9, marginTop: 2 }}>{p.time} AGO</div>
                </div>
              </div>

              <div style={{ fontSize: 14, color: "rgba(242,238,232,0.85)", lineHeight: 1.55 }}>{p.body}</div>

              {p.img && (
                <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "1.7", marginTop: 2 }}>
                  <Photo src={p.img} alt="" style={{ position: "absolute", inset: 0 }} />
                </div>
              )}

              <div style={{ display: "flex", gap: 18, alignItems: "center", paddingTop: 4 }}>
                <span className="e-mono" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "rgba(242,238,232,0.55)", fontSize: 10 }}>
                  <Icon name="heart" size={13} /> {p.likes}
                </span>
                <span className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 10 }}>
                  💬 {p.comments}
                </span>
              </div>
            </Link>
          ))}
          <Link href="/wall" className="btn btn-ghost" style={{ marginTop: 4, color: "var(--bone)", borderColor: "rgba(242,238,232,0.2)" }}>
            SEE THE FULL WALL
          </Link>
        </div>

        {/* NEW DROPS — shop preview */}
        {newDrops.length > 0 && (
          <>
            <div style={{ padding: "32px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="e-display" style={{ fontSize: 22 }}>NEW DROPS</div>
              <Link href="/shop" className="e-mono" style={{ color: "var(--sky)" }}>SHOP ALL →</Link>
            </div>
            <div className="no-scrollbar" style={{ display: "flex", gap: 12, padding: "0 22px 8px", overflowX: "auto" }}>
              {newDrops.map(p => (
                <Link key={p.id} href={`/shop/${p.slug}`} className="lift" style={{
                  minWidth: 180, flexShrink: 0,
                  borderRadius: 16, overflow: "hidden",
                  background: "var(--haze)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "var(--bone)", textDecoration: "none",
                  display: "flex", flexDirection: "column",
                }}>
                  <div style={{ position: "relative", aspectRatio: "1 / 1", background: "rgba(255,255,255,0.04)" }}>
                    {p.hero_image && <Photo src={p.hero_image} alt={p.name} className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />}
                    {p.tag && (
                      <div className="e-mono" style={{ position: "absolute", top: 10, left: 10, padding: "3px 8px", borderRadius: 999, background: "var(--sky)", color: "var(--ink)", fontSize: 8, letterSpacing: "0.2em" }}>
                        {p.tag.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, letterSpacing: "0.18em" }}>{p.category?.toUpperCase()}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 16, lineHeight: 1, letterSpacing: "0.02em" }}>{p.name.toUpperCase()}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--sky)" }}>{fmtPrice(p.price_cents)}</span>
                      {p.compare_at_cents && p.compare_at_cents > p.price_cents && (
                        <span className="e-mono" style={{ color: "rgba(242,238,232,0.4)", fontSize: 9, textDecoration: "line-through" }}>{fmtPrice(p.compare_at_cents)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ padding: "10px 22px 0" }}>
              <Link href="/shop" className="btn btn-sky" style={{ width: "100%" }}>OPEN THE SHOP</Link>
            </div>
          </>
        )}
      </div>
      <TabBar />
      <HomeIndicator dark />
    </div>
  );
}
