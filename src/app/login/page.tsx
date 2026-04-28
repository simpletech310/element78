import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { Wordmark } from "@/components/brand/Wordmark";
import { Icon } from "@/components/ui/Icon";
import { signInAction } from "@/lib/auth-actions";

export default function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  const next = searchParams?.next ?? "/home";
  return (
    <div style={{ background: "#000", minHeight: "100dvh", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0 }}>
        <Photo src="/assets/blue-hair-selfie.jpg" alt="" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.4) 0%, rgba(10,14,20,0.85) 55%, rgba(10,14,20,1) 100%)" }} />
      </div>

      <div style={{ position: "relative", minHeight: "100dvh", display: "flex", flexDirection: "column", padding: "28px 22px 40px", color: "var(--bone)", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" aria-label="Back" style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(10,14,20,0.55)", backdropFilter: "blur(10px)", border: "none", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          </Link>
          <Wordmark size={16} color="var(--bone)" />
          <div style={{ width: 40 }} />
        </div>

        <form action={signInAction} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <input type="hidden" name="next" value={next} />
          <div className="e-mono" style={{ color: "var(--sky)" }}>WELCOME BACK</div>
          <div className="e-display glow" style={{ fontSize: 52, lineHeight: 0.9, marginTop: 12 }}>STEP IN.</div>
          <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 18, marginTop: 12, color: "rgba(242,238,232,0.75)" }}>
            Your element is waiting.
          </div>

          {searchParams?.error && (
            <div style={{ marginTop: 14, fontSize: 12, color: "var(--rose)", fontFamily: "var(--font-mono)" }}>{searchParams.error}</div>
          )}

          <div style={{ marginTop: 32 }}>
            <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginBottom: 10, letterSpacing: "0.2em" }}>EMAIL</div>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue=""
              placeholder="kai@element78life.com"
              className="field-input"
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", letterSpacing: "0.2em" }}>PASSWORD</span>
              <span className="e-mono" style={{ fontSize: 9, color: "var(--sky)", letterSpacing: "0.2em", cursor: "pointer" }}>FORGOT?</span>
            </div>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              placeholder="••••••••"
              className="field-input"
            />
          </div>

          <button type="submit" className="btn btn-sky" style={{ marginTop: 22, padding: "18px 22px" }}>SIGN IN</button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 22 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(242,238,232,0.15)" }} />
            <span className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.4)" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "rgba(242,238,232,0.15)" }} />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button type="button" disabled style={{ flex: 1, padding: "13px 0", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(242,238,232,0.18)", color: "var(--bone)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", opacity: 0.5 }}>APPLE</button>
            <button type="button" disabled style={{ flex: 1, padding: "13px 0", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(242,238,232,0.18)", color: "var(--bone)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", opacity: 0.5 }}>GOOGLE</button>
          </div>

          <div style={{ marginTop: 28, textAlign: "center", fontSize: 12, color: "rgba(242,238,232,0.55)" }}>
            New here? <Link href="/join" style={{ color: "var(--sky)", fontFamily: "var(--font-mono)", letterSpacing: "0.14em" }}>JOIN ELEMENT</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
