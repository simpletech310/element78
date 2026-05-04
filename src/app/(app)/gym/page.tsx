import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { TabBar } from "@/components/chrome/TabBar";
import { Wordmark } from "@/components/brand/Wordmark";
import { Photo } from "@/components/ui/Photo";
import { Icon, IconName } from "@/components/ui/Icon";
import { listClasses, listEventsForGym, listLocations, listTrainers, listUserBookings } from "@/lib/data/queries";
import { getUser } from "@/lib/auth";
import { tierLabel, type MembershipTier } from "@/lib/membership";
import { createClient } from "@/lib/supabase/server";

export default async function GymScreen({ searchParams }: { searchParams: { date?: string } }) {
  const [all, trainers, user, locations] = await Promise.all([listClasses(), listTrainers(), getUser(), listLocations()]);
  // V1 single active gym — Atlanta HQ. When more locations open, this becomes a picker.
  const activeLocation = locations.find(l => l.status === "active") ?? locations[0];
  const memberName = ((user?.user_metadata?.display_name as string | undefined)
    ?? user?.email?.split("@")[0]
    ?? "Member").toUpperCase();
  const memberId = user?.id ? "E78-" + user.id.replace(/-/g, "").slice(0, 6).toUpperCase() : "E78-XXXXXX";

  // Pull the user's actual membership tier so the card stops hard-coding "ELITE".
  let tier: MembershipTier = "basic";
  if (user) {
    const sb = createClient();
    const { data: profile } = await sb.from("profiles").select("membership_tier").eq("id", user.id).maybeSingle();
    tier = ((profile as { membership_tier?: string } | null)?.membership_tier ?? "basic") as MembershipTier;
  }

  // User's upcoming bookings drive the "Your Classes" strip + prevent
  // double-booking on the schedule below
  const bookings = user ? await listUserBookings(user.id) : [];
  const now = Date.now();
  const upcomingBookings = bookings
    .filter(b => b.booking.status === "reserved" && new Date(b.class.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.class.starts_at).getTime() - new Date(b.class.starts_at).getTime());
  const bookedClassIds = new Set(upcomingBookings.map(b => b.class.id));

  // Day strip + selection. Pages this server-render: ?date=YYYY-MM-DD picks
  // which day's classes to show. Defaults to today.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
  const selectedDate = searchParams?.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date)
    ? new Date(searchParams.date + "T00:00:00")
    : new Date(today);
  selectedDate.setHours(0, 0, 0, 0);
  const selectedDayEnd = new Date(selectedDate.getTime() + 86_400_000);

  // Per-day counts for the strip + the actual list for the selected day.
  const countsByDay = new Map<string, number>();
  for (const c of all) {
    const t = new Date(c.starts_at);
    const k = dayKey(new Date(t.getFullYear(), t.getMonth(), t.getDate()));
    countsByDay.set(k, (countsByDay.get(k) ?? 0) + 1);
  }

  const dayClasses = all
    .filter(c => {
      const t = new Date(c.starts_at);
      return t >= selectedDate && t < selectedDayEnd;
    })
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  // Events tied to this gym, both in the dedicated strip (next 14 days) and
  // interleaved into the selected day's timeline alongside classes.
  const inTwoWeeks = new Date(today.getTime() + 14 * 86_400_000);
  const eventsStrip = activeLocation
    ? await listEventsForGym(activeLocation.id, today.toISOString(), inTwoWeeks.toISOString(), user?.id ?? null)
    : [];
  const eventsForDay = eventsStrip.filter(e => {
    const t = new Date(e.starts_at);
    return t >= selectedDate && t < selectedDayEnd;
  });
  // Unified timeline: classes + events sorted by starts_at, with a discriminant.
  type TimelineRow =
    | { kind: "class"; starts_at: string; data: typeof dayClasses[number] }
    | { kind: "event"; starts_at: string; data: typeof eventsStrip[number] };
  const timeline: TimelineRow[] = [
    ...dayClasses.map(c => ({ kind: "class" as const, starts_at: c.starts_at, data: c })),
    ...eventsForDay.map(e => ({ kind: "event" as const, starts_at: e.starts_at, data: e })),
  ].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  // Trainers teaching the selected day. Dedup by trainer_id so the same human
  // teaching multiple slots only shows once. Skip AI avatars — they don't
  // staff the gym floor.
  const trainerById = new Map(trainers.map(t => [t.id, t]));
  const trainersOnFloorById = new Map<string, { trainer: typeof trainers[number]; firstAt: string; classCount: number }>();
  for (const c of dayClasses) {
    if (!c.trainer_id) continue;
    const t = trainerById.get(c.trainer_id);
    if (!t || t.is_ai) continue;
    const prev = trainersOnFloorById.get(t.id);
    if (prev) {
      prev.classCount += 1;
    } else {
      trainersOnFloorById.set(t.id, { trainer: t, firstAt: c.starts_at, classCount: 1 });
    }
  }
  const trainersOnFloor = Array.from(trainersOnFloorById.values())
    .sort((a, b) => new Date(a.firstAt).getTime() - new Date(b.firstAt).getTime());

  const actions: { l: string; i: IconName; href: string }[] = [
    { l: "CHECK IN", i: "qr", href: "/gym/checkin" },
    { l: "BRING GUEST", i: "plus", href: "/gym/guest" },
    { l: "STUDIO MAP", i: "map", href: "/locations" },
  ];

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <StatusBar />
      <Navbar authed={true} />
      <div className="app-scroll" style={{ paddingBottom: 100 }}>
        <div style={{ padding: "14px 22px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Link href="/locations" className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>HQ · ATLANTA</Link>
            <div className="e-display" style={{ fontSize: 36, marginTop: 2 }}>THE GYM</div>
          </div>
          <Link href="/gym/checkin" aria-label="Check in" style={{ width: 40, height: 40, borderRadius: 999, background: "var(--ink)", color: "var(--sky)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
            <Icon name="qr" size={18} />
          </Link>
        </div>

        {/* Membership card */}
        <div style={{ padding: "14px 22px 6px" }}>
          <div style={{
            position: "relative", borderRadius: 22, overflow: "hidden",
            background: "linear-gradient(140deg, var(--ink) 0%, var(--haze) 60%, var(--electric-deep) 130%)",
            color: "var(--bone)", padding: 20, minHeight: 180,
          }}>
            <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(143,184,214,0.35), transparent 70%)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
              <Wordmark size={20} color="var(--bone)" />
              <span className="e-tag" style={{ background: "rgba(143,184,214,0.18)", color: "var(--sky)", padding: "4px 8px", borderRadius: 4 }}>{tierLabel(tier)}</span>
            </div>
            <div style={{ marginTop: 32, position: "relative" }}>
              <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)" }}>MEMBER</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, marginTop: 4, letterSpacing: "0.03em" }}>{memberName}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, position: "relative" }}>
              <div>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9 }}>ID</div>
                <div className="e-mono" style={{ marginTop: 2 }}>{memberId}</div>
              </div>
              <div>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9 }}>RENEWS</div>
                <div className="e-mono" style={{ marginTop: 2 }}>05.27.26</div>
              </div>
              <div>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9 }}>VISITS</div>
                <div className="e-mono" style={{ marginTop: 2, color: "var(--sky)" }}>12 / MO</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ padding: "12px 22px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {actions.map(a => (
            <Link key={a.l} href={a.href} style={{
              padding: "14px 8px", borderRadius: 12, background: "var(--paper)",
              border: "1px solid rgba(10,14,20,0.08)", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 6, color: "var(--ink)", textDecoration: "none",
            }}>
              <Icon name={a.i} size={18} />
              <span className="e-mono" style={{ fontSize: 9 }}>{a.l}</span>
            </Link>
          ))}
        </div>

        {/* YOUR BOOKED CLASSES — only when reserved */}
        {upcomingBookings.length > 0 && (
          <>
            <div style={{ padding: "20px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="e-display" style={{ fontSize: 22 }}>YOUR CLASSES</div>
              <Link href="/account/history" className="e-mono" style={{ color: "var(--electric-deep)" }}>{upcomingBookings.length} BOOKED →</Link>
            </div>
            <div style={{ padding: "0 22px", display: "flex", flexDirection: "column", gap: 10 }}>
              {upcomingBookings.slice(0, 4).map(({ booking, class: cls }) => {
                const dt = new Date(cls.starts_at);
                const dStr = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
                const tStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                const priceLabel = booking.paid_status === "free" ? "FREE"
                                : booking.paid_status === "paid" ? `PAID · $${(booking.price_cents_paid / 100).toFixed(0)}`
                                : `PAY AT CHECK-IN · $${(booking.price_cents_paid / 100).toFixed(0)}`;
                return (
                  <Link key={booking.id} href={`/classes/${cls.id}`} className="lift" style={{
                    display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "center",
                    padding: "14px 16px", borderRadius: 14,
                    background: "linear-gradient(135deg, rgba(46,127,176,0.18), rgba(143,184,214,0.05))",
                    border: "1px solid rgba(46,127,176,0.35)",
                    color: "var(--ink)", textDecoration: "none",
                  }}>
                    <div style={{ paddingRight: 14, borderRight: "1px solid rgba(46,127,176,0.25)" }}>
                      <div className="e-mono" style={{ color: "var(--electric-deep)", fontSize: 9, letterSpacing: "0.18em" }}>{dStr}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, marginTop: 2 }}>{tStr}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 17, letterSpacing: "0.02em" }}>{cls.name}</div>
                      <div className="e-mono" style={{ color: "rgba(10,14,20,0.55)", fontSize: 9, marginTop: 4, letterSpacing: "0.18em" }}>
                        {cls.kind?.toUpperCase() ?? "CLASS"} · {cls.room ?? ""} · SPOT {booking.spot_number ?? "—"}
                      </div>
                      <div className="e-mono" style={{ marginTop: 6, fontSize: 9, color: "var(--electric-deep)", letterSpacing: "0.18em" }}>{priceLabel}</div>
                    </div>
                    <Icon name="chevron" size={18} />
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Day strip — selectable. Each tile rerenders the page with ?date=. */}
        <div style={{ padding: "20px 22px 8px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="e-display" style={{ fontSize: 22 }}>{upcomingBookings.length > 0 ? "MORE THIS WEEK" : "CLASSES"}</div>
          <div className="e-mono" style={{ color: "rgba(10,14,20,0.55)", fontSize: 9, letterSpacing: "0.2em" }}>
            {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "2-digit" }).toUpperCase()}
          </div>
        </div>
        <div className="no-scrollbar" style={{ display: "flex", gap: 8, padding: "0 22px", overflowX: "auto" }}>
          {week.map((d, i) => {
            const k = dayKey(d);
            const active = k === dayKey(selectedDate);
            const isToday = i === 0;
            const count = countsByDay.get(k) ?? 0;
            return (
              <Link key={i} href={`/gym?date=${k}`} replace scroll={false} style={{
                flexShrink: 0, padding: "10px 12px", borderRadius: 12, minWidth: 56, textAlign: "center",
                background: active ? "var(--ink)" : "transparent",
                color: active ? "var(--bone)" : "var(--ink)",
                border: active ? "none" : "1px solid rgba(10,14,20,0.1)",
                textDecoration: "none",
              }}>
                <div className="e-mono" style={{ fontSize: 9, color: active ? "var(--sky)" : "rgba(10,14,20,0.5)" }}>
                  {isToday ? "TODAY" : d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 2, letterSpacing: "0.02em" }}>{d.getDate()}</div>
                <div className="e-mono" style={{ fontSize: 8, marginTop: 4, color: active ? "rgba(242,238,232,0.55)" : "rgba(10,14,20,0.4)", letterSpacing: "0.18em" }}>
                  {count === 0 ? "REST" : `${count} CLASS${count === 1 ? "" : "ES"}`}
                </div>
              </Link>
            );
          })}
        </div>

        {/* TRAINERS ON THE FLOOR — only those teaching the selected day, capped
            so the gym page doesn't turn into a trainer roster. */}
        {trainersOnFloor.length > 0 && (
          <div style={{ padding: "16px 22px 4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <div className="e-mono" style={{ color: "rgba(10,14,20,0.6)", letterSpacing: "0.2em", fontSize: 10 }}>
                ON THE FLOOR · {trainersOnFloor.length}
              </div>
              <Link href="/trainers" className="e-mono" style={{ color: "var(--electric-deep)", fontSize: 10, letterSpacing: "0.2em", textDecoration: "none" }}>
                ALL TRAINERS →
              </Link>
            </div>
            <div className="no-scrollbar" style={{ display: "flex", gap: 10, overflowX: "auto" }}>
              {trainersOnFloor.slice(0, 8).map(({ trainer, firstAt, classCount }) => {
                const t = new Date(firstAt);
                const time = t.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(" ", "").toUpperCase();
                return (
                  <Link
                    key={trainer.id}
                    href={`/trainers/${trainer.slug}`}
                    style={{
                      flexShrink: 0, width: 96, padding: "12px 10px",
                      borderRadius: 14, background: "var(--paper)",
                      border: "1px solid rgba(10,14,20,0.08)",
                      color: "var(--ink)", textDecoration: "none",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center",
                    }}
                  >
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%", overflow: "hidden",
                      background: "var(--haze)",
                      backgroundImage: trainer.avatar_url ? `url(${trainer.avatar_url})` : undefined,
                      backgroundSize: "cover", backgroundPosition: "center",
                      border: "2px solid var(--ink)",
                    }} />
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 13, lineHeight: 1, letterSpacing: "0.02em" }}>
                      {trainer.name.split(" ")[0].toUpperCase()}
                    </div>
                    <div className="e-mono" style={{ fontSize: 8, color: "rgba(10,14,20,0.55)", letterSpacing: "0.18em" }}>
                      {time}{classCount > 1 ? ` · ${classCount}×` : ""}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Gym events strip — next 14 days, scoped to this gym */}
        {eventsStrip.length > 0 && (
          <div style={{ padding: "16px 22px 4px" }}>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", fontSize: 11, letterSpacing: "0.18em", marginBottom: 10 }}>
              GYM EVENTS · {eventsStrip.length}
            </div>
            <div className="no-scrollbar" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
              {eventsStrip.map(e => {
                const dt = new Date(e.starts_at);
                const when = dt.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
                return (
                  <Link key={e.id} href={`/events/${e.slug}`} style={{
                    flexShrink: 0, width: 220, borderRadius: 14, overflow: "hidden",
                    background: "var(--ink)", color: "var(--bone)", textDecoration: "none",
                    position: "relative", height: 130,
                    border: "1px solid rgba(143,184,214,0.25)",
                  }}>
                    {e.hero_image && <Photo src={e.hero_image} alt="" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(46,127,176,0.6), rgba(10,14,20,0.85))" }} />
                    <div style={{ position: "absolute", inset: 0, padding: 12, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <span className="e-tag" style={{ background: "var(--sky)", color: "var(--ink)", padding: "2px 6px", borderRadius: 3, alignSelf: "flex-start", fontSize: 9 }}>
                        {e.price_cents > 0 ? `$${(e.price_cents / 100).toFixed(0)}` : "FREE"}
                      </span>
                      <div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, lineHeight: 1.05 }}>{e.title}</div>
                        <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.14em", marginTop: 6 }}>
                          {when.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Class list for the selected day (events interleaved by start time) */}
        <div style={{ padding: "16px 22px 6px", display: "flex", flexDirection: "column", gap: 10 }}>
          {timeline.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", borderRadius: 16, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)" }}>
              <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", letterSpacing: "0.22em", fontSize: 10 }}>— REST DAY —</div>
              <div style={{ fontSize: 13, color: "rgba(10,14,20,0.55)", marginTop: 8 }}>Nothing on the floor for this day. Pick another date or run a flow.</div>
              <Link href="/train" className="btn btn-ink" style={{ marginTop: 14, padding: "10px 16px", fontSize: 10 }}>OPEN STUDIO</Link>
            </div>
          ) : timeline.map((row) => {
            if (row.kind === "event") {
              const e = row.data;
              const dt = new Date(e.starts_at);
              const time = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(" ", "").toUpperCase();
              const full = e.capacity !== null && e.rsvp_count >= e.capacity;
              return (
                <Link key={`event-${e.id}`} href={`/events/${e.slug}`} style={{
                  display: "flex", gap: 14, padding: 14, borderRadius: 16,
                  background: "linear-gradient(135deg, rgba(46,127,176,0.10), rgba(10,14,20,0.04))",
                  border: "1px solid rgba(143,184,214,0.4)", color: "var(--ink)",
                }}>
                  <div style={{ width: 60, paddingRight: 12, borderRight: "1px solid rgba(10,14,20,0.1)" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1 }}>{time}</div>
                    <div className="e-mono" style={{ fontSize: 9, color: "var(--electric-deep)", marginTop: 4 }}>EVENT</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1, letterSpacing: "0.02em" }}>{e.title}</div>
                    {e.subtitle && <div style={{ fontSize: 12, color: "rgba(10,14,20,0.6)", marginTop: 4 }}>{e.subtitle}</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                      <span className="e-mono" style={{ fontSize: 9, color: full ? "#A14040" : "var(--electric-deep)" }}>
                        {full ? "· FULL" : e.capacity ? `· ${e.capacity - e.rsvp_count} SPOTS` : `· ${e.rsvp_count} JOINED`}
                      </span>
                      <span className="e-mono" style={{
                        fontSize: 9, padding: "2px 7px", borderRadius: 999, marginLeft: "auto",
                        background: e.price_cents > 0 ? "rgba(46,127,176,0.12)" : "rgba(10,14,20,0.06)",
                        color: e.price_cents > 0 ? "var(--electric-deep)" : "rgba(10,14,20,0.55)",
                        letterSpacing: "0.18em",
                      }}>
                        {e.price_cents > 0 ? `$${(e.price_cents / 100).toFixed(0)}` : "FREE RSVP"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            }
            const c = row.data;
            const dt = new Date(c.starts_at);
            const time = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(" ", "").toUpperCase();
            const full = c.booked >= c.capacity;
            const booked = bookedClassIds.has(c.id);
            return (
              <Link key={c.id} href={`/classes/${c.id}`} style={{
                display: "flex", gap: 14, padding: 14, borderRadius: 16,
                background: booked ? "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(77,169,214,0.06))" : "var(--paper)",
                border: booked ? "1px solid rgba(143,184,214,0.4)" : "1px solid rgba(10,14,20,0.06)",
                opacity: full ? 0.55 : 1, color: "var(--ink)",
              }}>
                <div style={{ width: 60, paddingRight: 12, borderRight: "1px solid rgba(10,14,20,0.1)" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1 }}>{time}</div>
                  <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", marginTop: 4 }}>{c.duration_min}M</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1, letterSpacing: "0.02em" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(10,14,20,0.6)", marginTop: 4 }}>{c.kind?.toUpperCase()} · {c.room}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    {c.hero_image && (
                      <div style={{ width: 22, height: 22, borderRadius: "50%", overflow: "hidden" }}>
                        <Photo src={c.hero_image} alt="" style={{ width: "100%", height: "100%" }} />
                      </div>
                    )}
                    <span className="e-mono" style={{ fontSize: 9, color: full ? "#A14040" : "var(--electric-deep)" }}>
                      {full ? "· FULL · WAITLIST" : `· ${c.capacity - c.booked} SPOTS`}
                    </span>
                    <span className="e-mono" style={{
                      fontSize: 9, padding: "2px 7px", borderRadius: 999, marginLeft: "auto",
                      background: c.price_cents > 0 ? "rgba(46,127,176,0.12)" : "rgba(10,14,20,0.06)",
                      color: c.price_cents > 0 ? "var(--electric-deep)" : "rgba(10,14,20,0.55)",
                      letterSpacing: "0.18em",
                    }}>
                      {c.price_cents > 0 ? `$${(c.price_cents / 100).toFixed(0)}` : "FREE"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {booked ? (
                    <span className="e-mono" style={{ background: "var(--sky)", color: "var(--ink)", padding: "6px 10px", borderRadius: 999, fontSize: 9 }}>BOOKED</span>
                  ) : full ? (
                    <Icon name="clock" size={20} />
                  ) : (
                    <span style={{ width: 36, height: 36, borderRadius: 999, background: "var(--ink)", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="plus" size={16} />
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <TabBar />
      <HomeIndicator />
    </div>
  );
}
