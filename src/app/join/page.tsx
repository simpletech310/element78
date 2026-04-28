import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { Icon, IconName } from "@/components/ui/Icon";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { signUpAction } from "@/lib/auth-actions";
import { getUser } from "@/lib/auth";
import { listClasses, listTrainers } from "@/lib/data/queries";
import { redirect } from "next/navigation";

export default async function JoinPage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await getUser();
  if (user) redirect("/home");

  const [allClasses, trainers] = await Promise.all([listClasses(), listTrainers()]);
  const trainerMap = new Map(trainers.map(t => [t.id, t]));
  const now = Date.now();
  const upcoming = allClasses
    .filter(c => new Date(c.starts_at).getTime() >= now)
    .slice(0, 4);

  const pillars: { i: IconName; t: string; s: string }[] = [
    { i: "pin", t: "THE FLAGSHIP", s: "Atlanta · 24-hour access · classes · 1:1" },
    { i: "play", t: "AI + HUMAN COACHES", s: "Live avatar coaching, real trainers on the floor" },
    { i: "bag", t: "THE STORE", s: "Wear it. Train in it. Leave the house in it." },
  ];
  const proofs = [
    "/assets/blue-hair-selfie.jpg",
    "/assets/dumbbell-street.jpg",
    "/assets/blue-set-rooftop.jpg",
    "/assets/pilates-pink.jpg",
  ];

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={false} />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: 560 }}>
        <Photo src="/assets/blue-set-rooftop.jpg" alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.7 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.05) 25%, rgba(10,14,20,0.9) 80%, var(--ink) 100%)" }} />

        <div style={{ position: "relative", padding: "60px 22px 48px", maxWidth: 720, margin: "0 auto" }}>
          <div className="e-mono reveal" style={{ color: "var(--sky)" }}>◉ FROM ATLANTA · 24/7</div>
          <h1 className="e-display glow reveal reveal-d1" style={{ fontSize: "clamp(56px, 11vw, 96px)", lineHeight: 0.88, marginTop: 14 }}>
            BE IN<br/>YOUR<br/>ELEMENT.
          </h1>
          <p className="reveal reveal-d2" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "clamp(20px, 3.5vw, 28px)", marginTop: 22, lineHeight: 1.2, color: "var(--bone)", maxWidth: 420 }}>
            However you need to move — we got you.
          </p>
          <p className="reveal reveal-d3" style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.7)", maxWidth: 420, lineHeight: 1.6 }}>
            Lift, flow, run, recover. Trainers — human and AI — top of the game. The wellness industry forgot us, so we built our own.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section style={{ padding: "32px 22px 24px", maxWidth: 720, margin: "0 auto" }}>
        {/* Pillars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pillars.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, background: "rgba(143,184,214,0.06)", border: "1px solid rgba(143,184,214,0.18)" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(143,184,214,0.18)", color: "var(--sky)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={p.i} size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18, letterSpacing: "0.02em" }}>{p.t}</div>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginTop: 4, letterSpacing: "0.18em" }}>{p.s}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex" }}>
            {proofs.map((s, i) => (
              <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--ink)", marginLeft: i ? -10 : 0 }}>
                <Photo src={s} alt="" style={{ width: "100%", height: "100%" }} />
              </div>
            ))}
          </div>
          <div className="e-mono" style={{ fontSize: 11, color: "rgba(242,238,232,0.6)", letterSpacing: "0.18em" }}>1,408 WOMEN ALREADY IN.</div>
        </div>

        {/* Form */}
        <form action={signUpAction} style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.25em", marginBottom: 4 }}>◉ START FREE — 7 DAYS</div>
          {searchParams?.error && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(232,181,168,0.08)", border: "1px solid rgba(232,181,168,0.3)", fontSize: 12, color: "var(--rose)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
              {searchParams.error}
            </div>
          )}
          <div>
            <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginBottom: 8, letterSpacing: "0.2em" }}>YOUR NAME</div>
            <input name="display_name" placeholder="HOW WE GREET YOU" required autoComplete="name" className="field-input" />
          </div>
          <div>
            <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginBottom: 8, letterSpacing: "0.2em" }}>EMAIL</div>
            <input name="email" type="email" placeholder="YOU@SOMEWHERE.COM" required autoComplete="email" className="field-input" />
          </div>
          <div>
            <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginBottom: 8, letterSpacing: "0.2em" }}>PASSWORD · MIN 6</div>
            <input name="password" type="password" placeholder="••••••••" required minLength={6} autoComplete="new-password" className="field-input" />
          </div>
          <button type="submit" className="btn btn-sky" style={{ marginTop: 8, padding: "18px 22px" }}>
            JOIN ELEMENT
          </button>
          <div className="e-mono" style={{ textAlign: "center", fontSize: 9, color: "rgba(242,238,232,0.45)", letterSpacing: "0.2em", marginTop: 4 }}>
            7 DAYS FREE · CANCEL ANYTIME · NO CARD UP FRONT
          </div>
          <div style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "rgba(242,238,232,0.55)" }}>
            Already in?{" "}
            <Link href="/login" style={{ color: "var(--sky)", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", fontSize: 11 }}>
              SIGN IN →
            </Link>
          </div>
        </form>
      </section>

      {/* CLASSES PREVIEW — drop into one to test-drive */}
      {upcoming.length > 0 && (
        <section style={{ padding: "60px 22px 80px", maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em" }}>NOT READY YET? · DROP INTO A CLASS</div>
              <h3 className="e-display" style={{ fontSize: "clamp(28px, 5vw, 40px)", marginTop: 10, lineHeight: 0.95 }}>
                THIS WEEK ON THE FLOOR.
              </h3>
            </div>
            <Link href="/classes" className="e-mono" style={{ color: "var(--sky)", display: "inline-flex", alignItems: "center", gap: 6 }}>
              FULL SCHEDULE <Icon name="arrowUpRight" size={14} />
            </Link>
          </div>

          <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {upcoming.map(c => {
              const dt = new Date(c.starts_at);
              const day = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
              const time = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
              const trainer = c.trainer_id ? trainerMap.get(c.trainer_id) : undefined;
              const price = c.price_cents > 0 ? `$${(c.price_cents / 100).toFixed(0)}` : "FREE";
              return (
                <Link key={c.id} href={`/classes/${c.id}`} className="lift" style={{
                  display: "flex", flexDirection: "column", gap: 10,
                  padding: 18, borderRadius: 16,
                  background: "rgba(143,184,214,0.05)",
                  border: "1px solid rgba(143,184,214,0.18)",
                  color: "var(--bone)", textDecoration: "none",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
                    <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>{day} · {time}</div>
                    <span className="e-mono" style={{
                      fontSize: 9, letterSpacing: "0.18em",
                      padding: "3px 8px", borderRadius: 999,
                      background: c.price_cents > 0 ? "rgba(143,184,214,0.16)" : "rgba(143,184,214,0.06)",
                      color: c.price_cents > 0 ? "var(--sky)" : "rgba(242,238,232,0.7)",
                    }}>{price}</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, letterSpacing: "0.02em" }}>{c.name}</div>
                  <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.18em" }}>
                    {c.kind?.toUpperCase()} · {c.duration_min} MIN · {c.room ?? ""}
                  </div>
                  {trainer && (
                    <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                        <Photo src={trainer.avatar_url ?? trainer.hero_image ?? ""} alt={trainer.name} style={{ width: "100%", height: "100%" }} />
                      </div>
                      <div className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.7)", letterSpacing: "0.14em" }}>WITH {trainer.name.toUpperCase()}</div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
