import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { EnablePushButton } from "@/components/site/PushSetup";
import { InstallHint } from "@/components/site/InstallHint";

export const dynamic = "force-dynamic";

export default async function WelcomePage({ searchParams }: { searchParams: { from?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/welcome");
  const trainer = await getTrainerForCurrentUser();
  const role: "coach" | "member" = trainer ? "coach" : "member";
  const homeHref = role === "coach" ? "/trainer/dashboard" : "/home";
  const nextSteps = role === "coach"
    ? [
        { i: "cal", t: "SET YOUR HOURS", s: "Tell us when you're open. Members only see what you allow.", href: "/trainer/availability" },
        { i: "spark",    t: "PRICE & MODES",   s: "Pick 1-on-1 price, set video / in-person, link a gym.", href: "/trainer/availability" },
        { i: "play",     t: "STRIPE PAYOUTS",  s: "Verify with Stripe. Sessions stay paused until this clears.", href: "/trainer/onboarding/connect" },
        { i: "user",     t: "POLISH PROFILE",  s: "Bio, headshot, specialties. The first impression members see.", href: "/trainer/profile" },
      ] as const
    : [
        { i: "play",     t: "FIND A SESSION",      s: "Group sessions across every coach — open the live ones.", href: "/train/groups" },
        { i: "user",     t: "PICK A COACH",        s: "1-on-1 with someone whose vibe matches yours.", href: "/trainers" },
        { i: "cal", t: "BUILD A ROUTINE",     s: "Studio + AI workouts you can start any time.", href: "/train" },
        { i: "spark",    t: "JOIN A PROGRAM",      s: "Multi-week programs that level you up.", href: "/programs" },
      ] as const;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", minHeight: "100dvh", fontFamily: "var(--font-body)" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 22px 80px" }}>

        <div className="e-mono" style={{ color: "var(--sky)", fontSize: 11, letterSpacing: "0.28em" }}>
          {role === "coach" ? "WELCOME, COACH" : "WELCOME TO ELEMENT 78"}
        </div>
        <h1 className="e-display glow" style={{ marginTop: 10, fontSize: "clamp(40px, 9vw, 72px)", lineHeight: 0.92 }}>
          {role === "coach" ? <>YOU&apos;RE IN.<br/>LET&apos;S GET<br/>YOU LIVE.</> : <>YOU&apos;RE IN.<br/>LET&apos;S MAKE<br/>IT YOURS.</>}
        </h1>
        <p style={{ marginTop: 14, fontSize: 15, color: "rgba(242,238,232,0.7)", lineHeight: 1.6, maxWidth: 560 }}>
          {role === "coach"
            ? "Two minutes to set up: install the coach app, turn on alerts so member bookings ping you the moment they land, and finish the four steps below."
            : "Two minutes to set up: install the app, turn on alerts so a coach calling you actually reaches you, and pick where you want to start."}
        </p>

        {searchParams.from === "reminder" && (
          <div className="e-mono" style={{ marginTop: 18, padding: "10px 14px", borderRadius: 10, background: "rgba(143,184,214,0.08)", border: "1px solid rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.7)", fontSize: 10, letterSpacing: "0.2em" }}>
            ← BACK FROM THE REMINDER · FINISH SETUP HERE
          </div>
        )}

        <Step
          number="01"
          title={role === "coach" ? "ADD COACH TO YOUR HOME SCREEN" : "ADD ELEMENT 78 TO YOUR HOME SCREEN"}
          body={
            role === "coach"
              ? "iOS Safari and Chrome both support installing this — you'll get a real app tile on your phone with the coach mark, fullscreen launch, and faster reopen."
              : "iOS Safari and Chrome both support installing this — you'll get a real app tile on your phone, fullscreen launch, and faster reopen."
          }
        >
          <InstallHint role={role} />
        </Step>

        <Step
          number="02"
          title="ENABLE PUSH NOTIFICATIONS"
          body={
            role === "coach"
              ? "We'll ring you when a member books, accepts a reschedule, or you have a session about to start — even when the app is closed. Tap once to allow."
              : "We'll ring you when your coach starts your session live, when a request gets accepted, and when payouts settle. Tap once to allow."
          }
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <EnablePushButton />
            <span className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)", letterSpacing: "0.2em" }}>
              YOU CAN CHANGE THIS ANY TIME IN /ACCOUNT
            </span>
          </div>
        </Step>

        <Step
          number="03"
          title={role === "coach" ? "FOUR THINGS TO DO BEFORE YOU GO LIVE" : "PICK WHERE YOU WANT TO START"}
          body=""
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginTop: 6 }}>
            {nextSteps.map(({ i, t, s, href }) => (
              <Link key={t} href={href} className="lift" style={{
                display: "block", padding: 14, borderRadius: 14,
                background: "linear-gradient(135deg, rgba(143,184,214,0.14), rgba(46,127,176,0.04))",
                border: "1px solid rgba(143,184,214,0.28)",
                color: "var(--bone)", textDecoration: "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, background: "rgba(143,184,214,0.16)", color: "var(--sky)" }}>
                    <Icon name={i} size={14} />
                  </span>
                  <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>{t}</div>
                </div>
                <p style={{ marginTop: 8, fontSize: 13, color: "rgba(242,238,232,0.75)", lineHeight: 1.5 }}>{s}</p>
                <div className="e-mono" style={{ marginTop: 10, fontSize: 9, color: "rgba(242,238,232,0.55)", letterSpacing: "0.18em" }}>OPEN →</div>
              </Link>
            ))}
          </div>
        </Step>

        <div style={{ marginTop: 36, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <Link href={homeHref} className="btn btn-sky" style={{ padding: "12px 22px" }}>
            {role === "coach" ? "GO TO YOUR DASHBOARD →" : "ENTER THE APP →"}
          </Link>
          <Link href={homeHref} className="e-mono" style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(242,238,232,0.55)" }}>
            SKIP FOR NOW
          </Link>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, body, children }: { number: string; title: string; body: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 32, padding: 22, borderRadius: 16, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
      <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.28em" }}>{number}</div>
      <h2 className="e-display" style={{ marginTop: 8, fontSize: "clamp(22px, 4vw, 32px)", lineHeight: 1 }}>{title}</h2>
      {body && <p style={{ marginTop: 10, fontSize: 14, color: "rgba(242,238,232,0.7)", lineHeight: 1.6, maxWidth: 560 }}>{body}</p>}
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  );
}
