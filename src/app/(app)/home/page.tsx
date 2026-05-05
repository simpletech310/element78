import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { TabBar } from "@/components/chrome/TabBar";
import { Navbar } from "@/components/site/Navbar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { listUserEnrollments, listUserBookings, listEnrollmentCompletions, listProducts, listPosts, listClientTrainerBookings } from "@/lib/data/queries";
import { getUser } from "@/lib/auth";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { isSessionJoinable } from "@/lib/video/provider";
import { createClient } from "@/lib/supabase/server";

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
  // Coaches landing on /home (e.g. via the PWA member shortcut, or because
  // they typed it) get bounced to /trainer/dashboard. The member home is
  // shopping/feed-flavored — coaches need their inbox + roster up front.
  const trainer = await getTrainerForCurrentUser();
  if (trainer) redirect("/trainer/dashboard");

  const [products, posts, user] = await Promise.all([
    listProducts(),
    listPosts(),
    getUser(),
  ]);
  const newDrops = products.slice(0, 6);

  // Pull profile (display_name + avatar_url) from public.profiles — same
  // source the /account page reads from, so the home header reflects edits
  // immediately.
  let profileDisplayName: string | null = null;
  let profileAvatarUrl: string | null = null;
  if (user) {
    const sb = createClient();
    const { data: p } = await sb
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    const row = p as { display_name?: string; avatar_url?: string } | null;
    profileDisplayName = row?.display_name ?? null;
    profileAvatarUrl = row?.avatar_url ?? null;
  }

  const displayName =
    profileDisplayName
    ?? (user?.user_metadata?.display_name as string | undefined)
    ?? (user?.email?.split("@")[0])
    ?? "MEMBER";
  const firstName = displayName.split(/\s+/)[0];
  const avatarUrl = profileAvatarUrl
    ?? (user?.user_metadata?.avatar_url as string | undefined)
    ?? "/assets/blue-hair-selfie.jpg";

  // Pull the user's active programs + upcoming bookings — drives the
  // personalized strips below the daily ritual.
  const [enrollments, bookings, trainerBookings] = user
    ? await Promise.all([
        listUserEnrollments(user.id),
        listUserBookings(user.id),
        listClientTrainerBookings(user.id),
      ])
    : [[], [], [] as Awaited<ReturnType<typeof listClientTrainerBookings>>];

  // Upcoming 1-on-1 + group attendee sessions (sorted ascending). We surface
  // these in a dedicated rail above YOUR PROGRAMS — the "what's on the
  // calendar with a coach" line of sight that members were missing before.
  const nowMs = Date.now();
  const upcomingTrainer = trainerBookings
    .filter(({ booking }) => (booking.status === "confirmed" || booking.status === "pending_trainer")
      && new Date(booking.ends_at).getTime() > nowMs - 30 * 60_000)
    .sort((a, b) => new Date(a.booking.starts_at).getTime() - new Date(b.booking.starts_at).getTime());
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

  // Personalized hero — surface the user's most recently OPENED program so
  // "PICK UP WHERE YOU LEFT OFF" is literal. listUserEnrollments already
  // orders by last_opened_at desc (with started_at as tiebreaker), so we
  // just take the first active row.
  const heroProgram = activePrograms[0] ?? null;
  const heroProgramPct = heroProgram
    ? Math.round((completedCounts[heroProgram.enrollment.id] ?? 0) / Math.max(1, heroProgram.program.total_sessions) * 100)
    : 0;

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
      <Navbar authed={true} />
      <div className="app-scroll" style={{ paddingBottom: 100 }}>
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
              <Photo src={avatarUrl} alt={displayName} style={{ width: "100%", height: "100%" }} />
            </div>
            <div style={{ position: "absolute", bottom: -2, right: -2, background: "var(--electric)", color: "var(--ink)", borderRadius: 999, padding: "1px 5px", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600, border: "2px solid var(--ink)" }}>14</div>
          </Link>
        </div>

        {/* Hero — personal "pick up where you left off" card. When the user
            has an active program, surface its current day + progress. Falls
            back to a generic studio prompt when nothing's active yet. */}
        <div style={{ padding: "0 22px" }}>
          {heroProgram ? (
            <Link href={`/programs/${heroProgram.program.slug}`} className="lift" style={{ position: "relative", borderRadius: 22, overflow: "hidden", height: 380, background: "#000", display: "block", color: "var(--bone)", textDecoration: "none" }}>
              {heroProgram.program.hero_image && (
                <Photo
                  src={heroProgram.program.hero_image}
                  alt={heroProgram.program.name}
                  className="zoom-on-hover"
                  style={{ position: "absolute", inset: 0, opacity: 0.85 }}
                />
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.1) 30%, rgba(10,14,20,0.95) 100%)" }} />
              <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between" }}>
                <div className="e-tag" style={{ background: "rgba(10,14,20,0.7)", backdropFilter: "blur(12px)", padding: "6px 10px", borderRadius: 999, color: "var(--sky)" }}>◉ PICK UP WHERE YOU LEFT OFF</div>
                <div className="e-tag" style={{ background: "rgba(10,14,20,0.7)", backdropFilter: "blur(12px)", padding: "6px 10px", borderRadius: 999 }}>{heroProgramPct}%</div>
              </div>
              <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
                <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 4 }}>
                  {(heroProgram.program.duration_label ?? "").toUpperCase() || "PROGRAM"} · DAY {heroProgram.enrollment.current_day}/{heroProgram.program.total_sessions}
                </div>
                <div className="e-display" style={{ fontSize: 38, lineHeight: 0.92 }}>
                  {heroProgram.program.name.toUpperCase()}
                </div>
                {heroProgram.program.subtitle && (
                  <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 15, color: "rgba(242,238,232,0.78)", marginTop: 8, maxWidth: 360 }}>
                    {heroProgram.program.subtitle}
                  </div>
                )}
                {/* Progress bar mirrors the one on the program detail page */}
                <div style={{ marginTop: 12, height: 4, background: "rgba(143,184,214,0.22)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${heroProgramPct}%`, height: "100%", background: "var(--sky)", boxShadow: "0 0 8px rgba(143,184,214,0.6)" }} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
                  <span className="btn btn-sky" style={{ flex: 1 }}><Icon name="play" size={14} />CONTINUE</span>
                  <span className="btn btn-ghost" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "var(--bone)" }}>PREVIEW</span>
                </div>
              </div>
            </Link>
          ) : (
            <Link href="/programs" className="lift" style={{ position: "relative", borderRadius: 22, overflow: "hidden", height: 380, background: "#000", display: "block", color: "var(--bone)", textDecoration: "none" }}>
              <Photo src="/assets/IMG_3467.jpg" alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.85 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.1) 30%, rgba(10,14,20,0.95) 100%)" }} />
              <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between" }}>
                <div className="e-tag" style={{ background: "rgba(10,14,20,0.7)", backdropFilter: "blur(12px)", padding: "6px 10px", borderRadius: 999, color: "var(--sky)" }}>◉ START THE STREAK</div>
                <div className="e-tag" style={{ background: "rgba(10,14,20,0.7)", backdropFilter: "blur(12px)", padding: "6px 10px", borderRadius: 999 }}>NO PROGRAM YET</div>
              </div>
              <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
                <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 4 }}>STUDIO + PROGRAMS</div>
                <div className="e-display" style={{ fontSize: 38, lineHeight: 0.92 }}>
                  PICK YOUR<br/>FIRST RITUAL.
                </div>
                <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 15, color: "rgba(242,238,232,0.78)", marginTop: 8, maxWidth: 360 }}>
                  Browse multi-week programs or jump into a Studio session.
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
                  <span className="btn btn-sky" style={{ flex: 1 }}><Icon name="play" size={14} />BROWSE PROGRAMS</span>
                  <Link href="/train" className="btn btn-ghost" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "var(--bone)", textDecoration: "none" }}>STUDIO</Link>
                </div>
              </div>
            </Link>
          )}
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

        {/* YOUR CLASSES — booked classes (replaces the old This Week slot) */}
        {upcomingBookings.length > 0 && (
          <>
            <div style={{ padding: "28px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="e-display" style={{ fontSize: 22 }}>YOUR CLASSES</div>
              <Link href="/classes" className="e-mono" style={{ color: "var(--sky)" }}>ALL CLASSES →</Link>
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

        {/* YOUR UPCOMING SESSIONS — coach-led 1-on-1 + group attendees.
            Sits above YOUR PROGRAMS so the next ring on the member's
            calendar is the first thing they see when they open the app. */}
        {upcomingTrainer.length > 0 && (
          <>
            <div style={{ padding: "28px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <div className="e-display" style={{ fontSize: 22 }}>UPCOMING SESSIONS</div>
                <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", fontSize: 9, marginTop: 2, letterSpacing: "0.18em" }}>
                  {upcomingTrainer.length} {upcomingTrainer.length === 1 ? "BOOKED" : "BOOKED"} · WITH A COACH
                </div>
              </div>
              <Link href="/account/sessions" className="e-mono" style={{ color: "var(--electric-deep)", fontSize: 10, letterSpacing: "0.2em", textDecoration: "none" }}>
                ALL →
              </Link>
            </div>
            <div className="no-scrollbar" style={{ display: "flex", gap: 10, padding: "0 22px", overflowX: "auto", paddingBottom: 4 }}>
              {upcomingTrainer.slice(0, 8).map(({ booking, trainer }) => {
                const dt = new Date(booking.starts_at);
                const dateStr = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
                const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                const joinable = isSessionJoinable(booking.starts_at, booking.ends_at);
                const isPending = booking.status === "pending_trainer";
                return (
                  <Link
                    key={booking.id}
                    href={joinable ? `/train/session/${booking.id}` : `/booking/${booking.id}`}
                    className="lift"
                    style={{
                      flexShrink: 0, width: 240, padding: 14, borderRadius: 16,
                      background: "var(--paper)", border: "1px solid rgba(10,14,20,0.08)",
                      color: "var(--ink)", textDecoration: "none",
                      display: "flex", flexDirection: "column", gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div className="e-mono" style={{ color: "var(--electric-deep)", fontSize: 9, letterSpacing: "0.2em" }}>{dateStr}</div>
                      <div className="e-mono" style={{ color: "rgba(10,14,20,0.55)", fontSize: 9, letterSpacing: "0.18em" }}>
                        {booking.mode === "video" ? "VIDEO" : "IN PERSON"}
                      </div>
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 26, lineHeight: 0.95 }}>{timeStr}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", overflow: "hidden",
                        background: "var(--haze)",
                        backgroundImage: trainer.avatar_url ? `url(${trainer.avatar_url})` : undefined,
                        backgroundSize: "cover", backgroundPosition: "center",
                        border: "1px solid rgba(10,14,20,0.12)", flexShrink: 0,
                      }} />
                      <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.16em", color: "rgba(10,14,20,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        WITH {trainer.name.toUpperCase()}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", gap: 8 }}>
                      <span className="e-mono" style={{
                        fontSize: 9, padding: "4px 9px", borderRadius: 999, letterSpacing: "0.18em",
                        background: isPending ? "rgba(232,181,168,0.18)" : (joinable ? "rgba(46,127,176,0.16)" : "rgba(46,127,176,0.08)"),
                        color: isPending ? "var(--rose)" : "var(--electric-deep)",
                      }}>
                        {isPending ? "PENDING COACH" : (joinable ? "LIVE NOW" : "CONFIRMED")}
                      </span>
                      <span className="e-mono" style={{ fontSize: 11, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
                        {joinable ? "JOIN →" : "DETAILS →"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

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

        {/* THE WALL — feed preview */}
        <div style={{ padding: "32px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Link href="/wall" className="e-display" style={{ fontSize: 22, color: "var(--bone)", textDecoration: "none" }}>THE WALL</Link>
          <Link href="/wall" className="e-mono" style={{ color: "var(--sky)" }}>OPEN FEED →</Link>
        </div>
        <div style={{ padding: "0 22px", display: "flex", flexDirection: "column", gap: 12 }}>
          {wallPosts.slice(0, 3).map((p, i) => (
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

        {/* NEW DROPS — shop preview (below The Wall per request) */}
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
