import Link from "next/link";
import { redirect } from "next/navigation";
import { Photo } from "@/components/ui/Photo";
import { Navbar } from "@/components/site/Navbar";
import { signInAction } from "@/lib/auth-actions";
import { getUser } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  const user = await getUser();
  if (user) redirect(searchParams?.next ?? "/home");

  const next = searchParams?.next ?? "/home";

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={false} />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: 420 }}>
        <Photo src="/assets/blue-hair-selfie.jpg" alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.55, backgroundPosition: "center 25%" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.05) 25%, rgba(10,14,20,0.92) 80%, var(--ink) 100%)" }} />

        <div style={{ position: "relative", padding: "56px 22px 40px", maxWidth: 560, margin: "0 auto" }}>
          <div className="e-mono reveal" style={{ color: "var(--sky)" }}>WELCOME BACK</div>
          <h1 className="e-display glow reveal reveal-d1" style={{ fontSize: "clamp(56px, 11vw, 88px)", lineHeight: 0.9, marginTop: 12 }}>
            STEP IN.
          </h1>
          <p className="reveal reveal-d2" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "clamp(18px, 3vw, 22px)", marginTop: 18, color: "rgba(242,238,232,0.78)" }}>
            Your element is waiting.
          </p>
        </div>
      </section>

      {/* FORM */}
      <section style={{ padding: "12px 22px 80px", maxWidth: 480, margin: "0 auto" }}>
        <form action={signInAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input type="hidden" name="next" value={next} />

          {searchParams?.error && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(232,181,168,0.08)", border: "1px solid rgba(232,181,168,0.3)", fontSize: 12, color: "var(--rose)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
              {searchParams.error}
            </div>
          )}

          <div>
            <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginBottom: 8, letterSpacing: "0.2em" }}>EMAIL</div>
            <input name="email" type="email" required autoComplete="email" placeholder="YOU@SOMEWHERE.COM" className="field-input" />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", letterSpacing: "0.2em" }}>PASSWORD</span>
              <span className="e-mono" style={{ fontSize: 9, color: "var(--sky)", letterSpacing: "0.2em", cursor: "pointer" }}>FORGOT?</span>
            </div>
            <input name="password" type="password" required minLength={6} autoComplete="current-password" placeholder="••••••••" className="field-input" />
          </div>

          <button type="submit" className="btn btn-sky" style={{ marginTop: 8, padding: "18px 22px" }}>SIGN IN</button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(242,238,232,0.15)" }} />
            <span className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.4)", letterSpacing: "0.25em" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "rgba(242,238,232,0.15)" }} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" disabled style={{ flex: 1, padding: "14px 0", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(242,238,232,0.18)", color: "var(--bone)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.18em", opacity: 0.5, cursor: "not-allowed" }}>APPLE</button>
            <button type="button" disabled style={{ flex: 1, padding: "14px 0", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(242,238,232,0.18)", color: "var(--bone)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.18em", opacity: 0.5, cursor: "not-allowed" }}>GOOGLE</button>
          </div>

          <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "rgba(242,238,232,0.55)" }}>
            New here?{" "}
            <Link href="/join" style={{ color: "var(--sky)", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", fontSize: 11 }}>
              JOIN ELEMENT →
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
