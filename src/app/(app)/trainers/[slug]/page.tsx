import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingTabBar } from "@/components/site/FloatingTabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import {
  getTrainer,
  listFlowsByTrainer,
  listProgramsByTrainer,
  listClassesByTrainer,
} from "@/lib/data/queries";
import { getSavedKindRefs } from "@/lib/data/saved-queries";
import { SaveButton } from "@/components/site/SaveButton";
import { getUser } from "@/lib/auth";
import { startThreadAction } from "@/lib/messaging-actions";

function fmtPrice(cents: number) {
  if (!cents) return "FREE";
  return `$${(cents / 100).toFixed(0)}`;
}

export default async function TrainerProfile({ params }: { params: { slug: string } }) {
  const [t, user] = await Promise.all([getTrainer(params.slug), getUser()]);
  if (!t) notFound();
  const isAuthed = !!user;
  const isAI = !!t.is_ai;

  // Flows + programs are gated; classes are always public-viewable so we
  // never block the click — anonymous visitors can browse the schedule.
  const [flows, programs, classes, savedTrainerIds] = await Promise.all([
    listFlowsByTrainer(t.id),
    listProgramsByTrainer(t.id),
    listClassesByTrainer(t.id, 6),
    user ? getSavedKindRefs(user.id, "trainer") : Promise.resolve(new Set<string>()),
  ]);
  const isSaved = savedTrainerIds.has(t.id);

  // Auth-aware href: gated routes redirect through /login with `next`.
  // Classes pass through directly since the schedule is public.
  const gated = (target: string) =>
    isAuthed ? target : `/login?next=${encodeURIComponent(target)}`;

  const firstName = t.name.split(" ")[0] ?? t.name;
  const lastName = t.name.split(" ").slice(1).join(" ");

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={isAuthed} />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: 520 }}>
        <Photo src={t.hero_image ?? t.avatar_url ?? ""} alt={t.name} className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.85 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.05) 25%, rgba(10,14,20,0.55) 60%, var(--ink) 100%)" }} />

        <div style={{ position: "relative", padding: "32px 22px 40px", maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", minHeight: 520 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <Link href="/trainers" className="e-mono" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(242,238,232,0.7)", textDecoration: "none" }}>
              <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={14} /></span>
              ALL TRAINERS
            </Link>
            <SaveButton
              kind="trainer"
              ref_id={t.id}
              ref_slug={t.slug}
              ref_name={t.name}
              ref_image={t.avatar_url}
              isSaved={isSaved}
              return_to={`/trainers/${t.slug}`}
            />
          </div>

          <div style={{ marginTop: "auto" }}>
            {/* AI / human badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 999, background: isAI ? "var(--sky)" : "rgba(143,184,214,0.18)", color: isAI ? "var(--ink)" : "var(--sky)", border: isAI ? "none" : "1px solid rgba(143,184,214,0.4)" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: isAI ? "var(--ink)" : "var(--sky)" }} />
              <span className="e-mono" style={{ fontSize: 10, letterSpacing: "0.22em" }}>{isAI ? "STUDIO COACH · 24/7" : "COACH · ATLANTA"}</span>
            </div>

            <h1 className="e-display glow" style={{ fontSize: "clamp(56px, 12vw, 112px)", lineHeight: 0.86, marginTop: 14 }}>
              {firstName.toUpperCase()}{lastName && (<><br/>{lastName.toUpperCase()}</>)}
            </h1>

            {t.headline && (
              <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "clamp(18px, 3vw, 24px)", marginTop: 14, color: "rgba(242,238,232,0.85)", maxWidth: 540 }}>
                {t.headline}
              </p>
            )}

            <div style={{ display: "flex", gap: 28, marginTop: 18, flexWrap: "wrap" }}>
              <Stat label="RATING" value={`★ ${t.rating}`} />
              {isAI ? (
                <Stat label="MODEL" value={t.cert ?? "v3.2"} />
              ) : t.years_experience ? (
                <Stat label="EXPERIENCE" value={`${t.years_experience} YR`} />
              ) : null}
              {t.cert && !isAI && <Stat label="CERTIFIED" value={t.cert} />}
              <Stat label="FLOWS" value={String(flows.length)} />
            </div>
          </div>
        </div>
      </section>

      {/* SPECIALTIES + BIO */}
      <section style={{ padding: "40px 22px 0", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {t.specialties.map(s => (
            <span key={s} className="e-tag" style={{ padding: "7px 12px", borderRadius: 999, background: "rgba(143,184,214,0.06)", border: "1px solid rgba(143,184,214,0.28)", color: "var(--sky)" }}>{s.toUpperCase()}</span>
          ))}
        </div>

        {t.bio && (
          <div style={{ marginTop: 22, maxWidth: 720 }}>
            <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>BIO</div>
            <p style={{ marginTop: 10, fontSize: 16, lineHeight: 1.65, color: "rgba(242,238,232,0.82)" }}>{t.bio}</p>
          </div>
        )}
      </section>

      {/* FLOWS — gated */}
      {flows.length > 0 && (
        <section style={{ padding: "60px 22px 4px", maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>SIGNATURE FLOWS · {flows.length}</div>
              <h2 className="e-display" style={{ fontSize: "clamp(28px, 5vw, 44px)", marginTop: 10, lineHeight: 0.95 }}>
                {isAI ? "RUN A SESSION." : "FLOWS BY " + firstName.toUpperCase() + "."}
              </h2>
            </div>
            {!isAuthed && (
              <Link href={`/login?next=/trainers/${t.slug}`} className="e-mono" style={{ color: "var(--sky)" }}>
                SIGN IN TO PLAY →
              </Link>
            )}
          </div>

          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {flows.map(f => (
              <Link
                key={f.id}
                href={gated(`/train/player?flow=${f.slug}`)}
                className="lift"
                style={{
                  position: "relative", borderRadius: 16, overflow: "hidden",
                  aspectRatio: "0.82", display: "block",
                  color: "var(--bone)", textDecoration: "none",
                  border: "1px solid rgba(143,184,214,0.12)",
                  background: "var(--haze)",
                }}
              >
                <Photo src={f.hero_image} alt={f.name} className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 35%, rgba(10,14,20,0.95) 100%)" }} />

                {/* play orb */}
                <div style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", background: "var(--electric)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="play" size={12} />
                </div>

                <div style={{ position: "absolute", top: 12, left: 12, padding: "3px 8px", borderRadius: 999, background: "rgba(10,14,20,0.7)", backdropFilter: "blur(8px)" }}>
                  <span className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.22em" }}>{f.kind.toUpperCase()}</span>
                </div>

                <div style={{ position: "absolute", left: 14, right: 14, bottom: 14 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 0.95, letterSpacing: "0.02em" }}>{f.name}</div>
                  <div className="e-mono" style={{ color: "rgba(242,238,232,0.6)", marginTop: 6, fontSize: 9, letterSpacing: "0.18em" }}>{f.duration_min} MIN · {f.intensity} INTENSITY</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* PROGRAMS — gated */}
      {programs.length > 0 && (
        <section style={{ padding: "60px 22px 4px", maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>PROGRAMS · {programs.length}</div>
              <h2 className="e-display" style={{ fontSize: "clamp(28px, 5vw, 44px)", marginTop: 10, lineHeight: 0.95 }}>
                MULTI-WEEK SERIES.
              </h2>
            </div>
            {!isAuthed && (
              <Link href={`/login?next=/trainers/${t.slug}`} className="e-mono" style={{ color: "var(--sky)" }}>
                SIGN IN TO ENROLL →
              </Link>
            )}
          </div>

          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {programs.map(p => (
              <Link
                key={p.id}
                href={gated(`/programs/${p.slug}`)}
                className="lift"
                style={{
                  position: "relative", borderRadius: 18, overflow: "hidden",
                  aspectRatio: "1.4", display: "block",
                  color: "var(--bone)", textDecoration: "none",
                  border: "1px solid rgba(143,184,214,0.18)",
                }}
              >
                <Photo src={p.hero_image ?? ""} alt={p.name} className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(10,14,20,0.95) 100%)" }} />

                <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 6 }}>
                  <span className="e-mono" style={{ padding: "4px 9px", borderRadius: 999, background: "rgba(10,14,20,0.7)", backdropFilter: "blur(8px)", color: "var(--sky)", fontSize: 9, letterSpacing: "0.22em" }}>
                    {p.duration_label}
                  </span>
                  {p.requires_payment && (
                    <span className="e-mono" style={{ padding: "4px 9px", borderRadius: 999, background: "var(--sky)", color: "var(--ink)", fontSize: 9, letterSpacing: "0.22em" }}>
                      {fmtPrice(p.price_cents)}
                    </span>
                  )}
                </div>

                <div style={{ position: "absolute", top: 14, right: 14, width: 32, height: 32, borderRadius: "50%", background: "rgba(10,14,20,0.55)", backdropFilter: "blur(8px)", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(143,184,214,0.25)" }}>
                  <Icon name="arrowUpRight" size={14} />
                </div>

                <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 3.5vw, 32px)", lineHeight: 0.95 }}>{p.name}</div>
                  {p.subtitle && <div className="e-mono" style={{ color: "rgba(242,238,232,0.7)", marginTop: 6, fontSize: 10, letterSpacing: "0.18em" }}>{p.subtitle.toUpperCase()}</div>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CLASSES — public, no gate */}
      {classes.length > 0 && (
        <section style={{ padding: "60px 22px 4px", maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>UPCOMING CLASSES</div>
              <h2 className="e-display" style={{ fontSize: "clamp(28px, 5vw, 44px)", marginTop: 10, lineHeight: 0.95 }}>
                ON THE SCHEDULE.
              </h2>
            </div>
            <Link href="/classes" className="e-mono" style={{ color: "var(--sky)" }}>FULL CALENDAR →</Link>
          </div>

          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {classes.map(c => {
              const dt = new Date(c.starts_at);
              const day = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
              const time = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
              const open = c.capacity - c.booked;
              const full = open <= 0;
              return (
                <Link
                  key={c.id}
                  href={`/classes/${c.id}`}
                  className="lift"
                  style={{
                    display: "flex", flexDirection: "column", gap: 10,
                    padding: 18, borderRadius: 16,
                    background: "rgba(143,184,214,0.05)",
                    border: "1px solid rgba(143,184,214,0.18)",
                    color: "var(--bone)", textDecoration: "none",
                    opacity: full ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
                    <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>{day} · {time}</div>
                    <span className="e-mono" style={{
                      fontSize: 9, letterSpacing: "0.18em",
                      padding: "3px 8px", borderRadius: 999,
                      background: c.price_cents > 0 ? "rgba(143,184,214,0.16)" : "rgba(143,184,214,0.06)",
                      color: c.price_cents > 0 ? "var(--sky)" : "rgba(242,238,232,0.7)",
                    }}>{fmtPrice(c.price_cents)}</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, letterSpacing: "0.02em" }}>{c.name}</div>
                  <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.18em" }}>
                    {c.kind?.toUpperCase()} · {c.duration_min} MIN · {c.room ?? ""}
                  </div>
                  <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span className="e-mono" style={{ fontSize: 9, color: full ? "var(--rose)" : "rgba(242,238,232,0.6)", letterSpacing: "0.18em" }}>
                      {full ? "WAITLIST" : `${open} OF ${c.capacity} OPEN`}
                    </span>
                    <span className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.18em" }}>BOOK →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ padding: "60px 22px 96px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{
          padding: "32px 24px", borderRadius: 22,
          background: "linear-gradient(135deg, rgba(143,184,214,0.16), rgba(46,127,176,0.04))",
          border: "1px solid rgba(143,184,214,0.32)",
          display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start",
        }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>
            {isAI ? "READY TO MOVE?" : `WORK WITH ${firstName.toUpperCase()}`}
          </div>
          <h3 className="e-display" style={{ fontSize: "clamp(28px, 5vw, 40px)", lineHeight: 0.95 }}>
            {isAI ? "OPEN THE STUDIO." : "BOOK A 1-ON-1, OR DROP INTO A CLASS."}
          </h3>
          <p style={{ fontSize: 14, color: "rgba(242,238,232,0.72)", lineHeight: 1.6, maxWidth: 560 }}>
            {isAI
              ? "Live AI coaching, in the app or at the gym booths. Pair with a human trainer when you want hands-on."
              : `Privates run 60 minutes. Group classes run on the schedule above. Either way, ${firstName} will meet you where you actually are today.`}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
            {isAI ? (
              <Link href={gated("/train")} className="btn btn-sky">START A SESSION</Link>
            ) : (
              <>
                <Link href={isAuthed ? `/trainers/${t.slug}/book` : `/login?next=${encodeURIComponent(`/trainers/${t.slug}/book`)}`} className="btn btn-sky">{isAuthed ? "BOOK 1-ON-1" : "JOIN ELEMENT"}</Link>
                {isAuthed && t.auth_user_id ? (
                  <form action={startThreadAction}>
                    <input type="hidden" name="other_user_id" value={t.auth_user_id} />
                    <button type="submit" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.3)" }}>MESSAGE {firstName.toUpperCase()}</button>
                  </form>
                ) : (
                  <Link href="/contact" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.3)" }}>MESSAGE {firstName.toUpperCase()}</Link>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
      {isAuthed && <FloatingTabBar />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--sky)" }}>{value}</div>
      <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginTop: 4, letterSpacing: "0.2em" }}>{label}</div>
    </div>
  );
}
