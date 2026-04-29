import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";
import { changeEmailAction, changePasswordAction } from "@/lib/account-security-actions";

export default async function AccountSecurityPage({ searchParams }: { searchParams: { error?: string; email_change_sent?: string; password_changed?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/security");

  const flash = searchParams.email_change_sent ? "EMAIL CHANGE REQUESTED · CHECK YOUR INBOX TO CONFIRM"
              : searchParams.password_changed ? "PASSWORD UPDATED"
              : searchParams.error ? `ERROR: ${searchParams.error.replace(/_/g, " ").toUpperCase()}`
              : null;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/account" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ACCOUNT</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>SECURITY</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 52px)", lineHeight: 0.92, marginTop: 8 }}>SIGN-IN.</h1>
        </div>

        {flash && (
          <div className="e-mono" style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: searchParams.error ? "rgba(232,181,168,0.12)" : "rgba(143,184,214,0.1)", border: `1px solid ${searchParams.error ? "var(--rose)" : "var(--sky)"}`, color: searchParams.error ? "var(--rose)" : "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
            ✓ {flash}
          </div>
        )}

        <section style={{ marginTop: 22 }}>
          <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>EMAIL</div>
          <p style={{ marginTop: 8, fontSize: 13, color: "rgba(242,238,232,0.65)", lineHeight: 1.55 }}>
            Currently <strong>{user.email}</strong>. We'll send a confirmation link to the new address before switching.
          </p>
          <form action={changeEmailAction} style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10, padding: 16, borderRadius: 12, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
            <input type="email" name="email" required placeholder="new@email.com" className="ta-input" />
            <button type="submit" className="btn btn-sky" style={{ alignSelf: "flex-start", padding: "10px 18px" }}>UPDATE EMAIL</button>
          </form>
        </section>

        <section style={{ marginTop: 28 }}>
          <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>PASSWORD</div>
          <form action={changePasswordAction} style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10, padding: 16, borderRadius: 12, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
            <input type="password" name="password" required minLength={8} placeholder="new password (8+ chars)" className="ta-input" autoComplete="new-password" />
            <input type="password" name="confirm" required minLength={8} placeholder="confirm new password" className="ta-input" autoComplete="new-password" />
            <button type="submit" className="btn btn-sky" style={{ alignSelf: "flex-start", padding: "10px 18px" }}>UPDATE PASSWORD</button>
          </form>
        </section>
      </div>

      <style>{`
        .ta-input { padding: 10px 12px; border-radius: 8px; background: rgba(10,14,20,0.4); border: 1px solid rgba(143,184,214,0.25); color: var(--bone); font-family: var(--font-body); font-size: 14px; width: 100%; }
      `}</style>
    </div>
  );
}
