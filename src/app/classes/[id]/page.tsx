import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { getClass, listTrainers, getUserBookingForClass } from "@/lib/data/queries";
import { getUser } from "@/lib/auth";
import { bookClassAction, cancelBookingAction } from "@/lib/class-actions";

function fmtPrice(cents: number) {
  if (!cents) return "FREE";
  return `$${(cents / 100).toFixed(0)}`;
}

export default async function ClassDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { reserved?: string; cancelled?: string; error?: string; waitlist?: string };
}) {
  const [c, trainers, user] = await Promise.all([getClass(params.id), listTrainers(), getUser()]);
  if (!c) notFound();
  const trainer = c.trainer_id ? trainers.find(t => t.id === c.trainer_id) ?? null : null;
  const booking = user ? await getUserBookingForClass(user.id, c.id) : null;
  const isReserved = booking && booking.status === "reserved";

  const dt = new Date(c.starts_at);
  const dayLabel = dt.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const dateLabel = dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase();
  const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const endStr = new Date(dt.getTime() + c.duration_min * 60_000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const open = c.capacity - c.booked;
  const isFull = open <= 0;

  const specs = [
    { l: "INTENSITY", v: c.intensity ?? "—" },
    { l: "DURATION", v: `${c.duration_min} MIN` },
    { l: "STUDIO", v: c.room ?? "—" },
    { l: "TYPE", v: c.kind?.toUpperCase() ?? "CLASS" },
  ];

  // Confirmation banner state
  const banner = searchParams.reserved === "1" ? "reserved"
              : searchParams.cancelled === "1" ? "cancelled"
              : searchParams.waitlist === "1" ? "waitlist"
              : searchParams.error ? "error"
              : null;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={!!user} />

      {banner && (
        <div style={{
          padding: "14px 22px",
          borderBottom: "1px solid rgba(143,184,214,0.18)",
          background: banner === "error" ? "rgba(232,181,168,0.08)"
                     : banner === "waitlist" ? "rgba(232,181,168,0.08)"
                     : "rgba(143,184,214,0.12)",
        }}>
          <div className="e-mono" style={{ maxWidth: 1180, margin: "0 auto", fontSize: 11, letterSpacing: "0.18em", color: banner === "error" ? "var(--rose)" : "var(--sky)" }}>
            {banner === "reserved" && (c.requires_payment ? "✓ RESERVED · PAYMENT WILL BE COLLECTED AT CHECK-IN" : "✓ RESERVED · SEE YOU IN STUDIO")}
            {banner === "cancelled" && "✓ CANCELLED · YOUR SPOT IS RELEASED"}
            {banner === "waitlist" && "↑ ON THE WAITLIST · WE'LL EMAIL IF A SPOT OPENS"}
            {banner === "error" && (searchParams.error ?? "Something went wrong.")}
          </div>
        </div>
      )}

      {/* HERO */}
      <section style={{ position: "relative", minHeight: 480 }}>
        {c.hero_image && <Photo src={c.hero_image} alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.05) 25%, rgba(10,14,20,0.95) 80%, var(--ink) 100%)" }} />
        <div style={{ position: "relative", padding: "56px 22px 48px", maxWidth: 1180, margin: "0 auto" }}>
          <Link href="/classes" className="e-mono reveal" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--sky)", letterSpacing: "0.18em" }}>
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={14} /></span>
            ALL CLASSES
          </Link>

          <div className="e-mono reveal reveal-d1" style={{ color: "var(--sky)", marginTop: 24 }}>
            {dayLabel} · {dateLabel} · {timeStr}
          </div>
          <h1 className="e-display reveal reveal-d2" style={{ fontSize: "clamp(48px, 11vw, 96px)", marginTop: 12, lineHeight: 0.92 }}>{c.name}</h1>
          {c.summary && (
            <p className="reveal reveal-d3" style={{ marginTop: 18, fontSize: "clamp(18px, 2.6vw, 22px)", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--bone)", maxWidth: 560, lineHeight: 1.4 }}>
              {c.summary}
            </p>
          )}

          {/* Price + spots strip */}
          <div className="reveal reveal-d4" style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid rgba(242,238,232,0.12)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
            <Stat label="PRICE" v={fmtPrice(c.price_cents)} accent />
            <Stat label="STARTS" v={timeStr} />
            <Stat label="ENDS" v={endStr} />
            <Stat label={isFull ? "WAITLIST" : "OPEN SPOTS"} v={isFull ? "FULL" : `${open} / ${c.capacity}`} />
          </div>

          {/* CTA cluster */}
          <div className="reveal reveal-d4" style={{ marginTop: 30, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {!user && (
              <>
                <Link href={`/login?next=/classes/${c.id}`} className="btn btn-sky" style={{ minWidth: 200 }}>SIGN IN TO RESERVE</Link>
                <Link href="/join" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.4)" }}>JOIN FREE</Link>
              </>
            )}
            {user && isReserved && (
              <>
                <span className="btn btn-ghost" style={{ color: "var(--sky)", borderColor: "rgba(143,184,214,0.4)", cursor: "default" }}>
                  ✓ RESERVED {booking?.paid_status === "pending" ? "· PAY AT CHECK-IN" : booking?.paid_status === "paid" ? "· PAID" : ""}
                </span>
                <form action={cancelBookingAction}>
                  <input type="hidden" name="booking_id" value={booking!.id} />
                  <input type="hidden" name="class_id" value={c.id} />
                  <button type="submit" className="btn btn-ghost" style={{ color: "var(--rose)", borderColor: "rgba(232,181,168,0.35)" }}>CANCEL RESERVATION</button>
                </form>
              </>
            )}
            {user && !isReserved && !isFull && (
              <form action={bookClassAction}>
                <input type="hidden" name="class_id" value={c.id} />
                <input type="hidden" name="requires_payment" value={String(c.requires_payment)} />
                <input type="hidden" name="price_cents" value={c.price_cents} />
                <button type="submit" className="btn btn-sky" style={{ minWidth: 220 }}>
                  {c.requires_payment ? `RESERVE · ${fmtPrice(c.price_cents)}` : "RESERVE · FREE"}
                </button>
              </form>
            )}
            {user && !isReserved && isFull && (
              <form action={bookClassAction}>
                <input type="hidden" name="class_id" value={c.id} />
                <input type="hidden" name="requires_payment" value={String(c.requires_payment)} />
                <input type="hidden" name="price_cents" value={c.price_cents} />
                <button type="submit" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.4)", minWidth: 200 }}>JOIN WAITLIST</button>
              </form>
            )}
          </div>

          {c.requires_payment && !isReserved && (
            <p className="e-mono" style={{ marginTop: 14, fontSize: 9, color: "rgba(242,238,232,0.5)", letterSpacing: "0.2em" }}>
              PAYMENT COLLECTED AT CHECK-IN · MEMBERS ON ELITE TIER FREE
            </p>
          )}
        </div>
      </section>

      {/* SPECS + DETAILS */}
      <section style={{ padding: "48px 22px 32px", maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>
        <div>
          <div className="e-mono" style={{ color: "var(--sky)" }}>01 / WHAT YOU&apos;RE WALKING INTO</div>
          <h2 className="e-display" style={{ fontSize: "clamp(28px, 4vw, 38px)", marginTop: 12, lineHeight: 0.95 }}>THE CLASS.</h2>

          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {specs.map(s => (
              <div key={s.l} style={{ padding: 14, borderRadius: 12, border: "1px solid rgba(143,184,214,0.18)", background: "rgba(143,184,214,0.05)" }}>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)", letterSpacing: "0.2em" }}>{s.l}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, marginTop: 6, letterSpacing: "0.02em" }}>{s.v}</div>
              </div>
            ))}
          </div>

          {c.what_to_bring && (
            <div style={{ marginTop: 18, padding: 16, borderRadius: 12, background: "rgba(143,184,214,0.05)", border: "1px solid rgba(143,184,214,0.18)" }}>
              <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.25em" }}>WHAT TO BRING</div>
              <p style={{ fontSize: 14, color: "rgba(242,238,232,0.78)", marginTop: 8, lineHeight: 1.5 }}>{c.what_to_bring}</p>
            </div>
          )}
        </div>

        <div>
          {trainer && (
            <>
              <div className="e-mono" style={{ color: "var(--sky)" }}>02 / WITH</div>
              <h2 className="e-display" style={{ fontSize: "clamp(28px, 4vw, 38px)", marginTop: 12, lineHeight: 0.95 }}>YOUR COACH.</h2>
              <Link href={`/trainers/${trainer.slug}`} className="lift" style={{ marginTop: 18, display: "flex", gap: 16, padding: 16, borderRadius: 16, background: "rgba(143,184,214,0.05)", border: "1px solid rgba(143,184,214,0.18)", color: "var(--bone)", textDecoration: "none" }}>
                <div style={{ width: 80, height: 96, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                  <Photo src={trainer.avatar_url ?? trainer.hero_image ?? ""} alt={trainer.name} style={{ width: "100%", height: "100%" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "0.02em" }}>{trainer.name.toUpperCase()}</div>
                    <span className="e-mono" style={{ color: "var(--sky)", fontSize: 11 }}>★ {trainer.rating}</span>
                  </div>
                  <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginTop: 6, letterSpacing: "0.18em" }}>
                    {trainer.specialties.slice(0, 2).join(" · ").toUpperCase()}
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(242,238,232,0.7)", marginTop: 8, lineHeight: 1.5 }}>{trainer.headline}</p>
                </div>
              </Link>
            </>
          )}

          <div style={{ marginTop: 28 }}>
            <div className="e-mono" style={{ color: "var(--sky)" }}>03 / POLICIES</div>
            <h2 className="e-display" style={{ fontSize: "clamp(28px, 4vw, 38px)", marginTop: 12, lineHeight: 0.95 }}>FINE PRINT.</h2>
            <ul style={{ marginTop: 14, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              <li style={{ display: "flex", gap: 10, fontSize: 13, color: "rgba(242,238,232,0.78)", lineHeight: 1.55 }}>
                <span style={{ color: "var(--sky)" }}>—</span>
                <span>Cancel up to <strong>2 hours before</strong> for a full refund or class credit.</span>
              </li>
              <li style={{ display: "flex", gap: 10, fontSize: 13, color: "rgba(242,238,232,0.78)", lineHeight: 1.55 }}>
                <span style={{ color: "var(--sky)" }}>—</span>
                <span>Late arrivals after <strong>5 min past start</strong> forfeit the spot to the waitlist.</span>
              </li>
              <li style={{ display: "flex", gap: 10, fontSize: 13, color: "rgba(242,238,232,0.78)", lineHeight: 1.55 }}>
                <span style={{ color: "var(--sky)" }}>—</span>
                <span>Members on the <strong>ELITE</strong> tier book any class for free; WEEKDAY tier gets free access during open hours.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 22px 96px", background: "linear-gradient(180deg, var(--ink) 0%, var(--haze) 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--sky)" }}>STARTS {dayLabel} · {timeStr}</div>
          <h2 className="e-display glow" style={{ fontSize: "clamp(36px, 7vw, 56px)", marginTop: 14, lineHeight: 0.95 }}>HOLD A SPOT.</h2>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            {!user && <Link href={`/login?next=/classes/${c.id}`} className="btn btn-sky" style={{ minWidth: 200 }}>SIGN IN TO RESERVE</Link>}
            {user && !isReserved && !isFull && (
              <form action={bookClassAction}>
                <input type="hidden" name="class_id" value={c.id} />
                <input type="hidden" name="requires_payment" value={String(c.requires_payment)} />
                <input type="hidden" name="price_cents" value={c.price_cents} />
                <button type="submit" className="btn btn-sky" style={{ minWidth: 220 }}>
                  {c.requires_payment ? `RESERVE · ${fmtPrice(c.price_cents)}` : "RESERVE · FREE"}
                </button>
              </form>
            )}
            <Link href="/classes" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.3)" }}>OTHER CLASSES</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Stat({ label, v, accent }: { label: string; v: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px, 4vw, 28px)", color: accent ? "var(--sky)" : "var(--bone)", lineHeight: 1, letterSpacing: "0.02em" }}>{v}</div>
      <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, marginTop: 6, letterSpacing: "0.2em" }}>{label}</div>
    </div>
  );
}
