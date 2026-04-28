import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { redirect } from "next/navigation";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { Wordmark } from "@/components/brand/Wordmark";
import { getUser } from "@/lib/auth";
import { signOutAction } from "@/lib/auth-actions";

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account");

  const displayName = (user.user_metadata?.display_name as string | undefined) ?? user.email?.split("@")[0] ?? "Member";
  const email = user.email ?? "";
  const handle = (user.user_metadata?.handle as string | undefined) ?? email.split("@")[0];

  const links: { label: string; href: string; icon: "cal" | "bag" | "heart" | "settings" | "fire" }[] = [
    { label: "PROGRAM HISTORY", href: "/account/history", icon: "fire" },
    { label: "MY BOOKINGS", href: "/gym", icon: "cal" },
    { label: "ORDER HISTORY", href: "/shop", icon: "bag" },
    { label: "SAVED", href: "/shop", icon: "heart" },
  ];

  return (
    <div className="app app-dark" style={{ height: "100dvh", background: "var(--ink)" }}>
      <Navbar authed={true} />
      <div className="app-scroll" style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: "20px 22px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/home" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
            <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>BACK</span>
          </Link>
          <Wordmark size={14} color="var(--bone)" />
        </div>

        {/* Profile hero */}
        <section style={{ padding: "32px 22px 32px" }}>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <div style={{ width: 84, height: 84, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--sky)", flexShrink: 0 }}>
              <Photo src="/assets/blue-hair-selfie.jpg" alt={displayName} style={{ width: "100%", height: "100%" }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.25em" }}>MEMBER</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 32, lineHeight: 1, marginTop: 6, color: "var(--bone)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
                {displayName}
              </div>
              <div className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.5)", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                @{handle} · {email}
              </div>
            </div>
          </div>

          {/* Streak ribbon */}
          <div style={{ marginTop: 22, padding: "14px 16px", borderRadius: 14, background: "linear-gradient(135deg, rgba(143,184,214,0.15), rgba(77,169,214,0.05))", border: "1px solid rgba(143,184,214,0.25)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>YOUR ELEMENT</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, marginTop: 4 }}>14-DAY STREAK · 78% GOAL</div>
            </div>
            <Icon name="flame" size={26} />
          </div>
        </section>

        {/* Quick links */}
        <section style={{ padding: "0 22px 24px" }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 10, letterSpacing: "0.25em", marginBottom: 12 }}>YOUR STUFF</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {links.map(l => (
              <Link key={l.label} href={l.href} className="lift" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: "var(--haze)", color: "var(--bone)", textDecoration: "none", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(143,184,214,0.12)", color: "var(--sky)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={l.icon} size={18} />
                </div>
                <span style={{ flex: 1, fontFamily: "var(--font-display)", fontSize: 16, letterSpacing: "0.02em" }}>{l.label}</span>
                <Icon name="chevron" size={16} />
              </Link>
            ))}
          </div>
        </section>

        {/* Sign out */}
        <section style={{ padding: "0 22px 60px" }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 10, letterSpacing: "0.25em", marginBottom: 12 }}>SESSION</div>
          <form action={signOutAction}>
            <button type="submit" className="btn" style={{
              width: "100%", padding: "16px 22px",
              background: "transparent", color: "var(--rose)",
              border: "1px solid rgba(232,181,168,0.35)",
            }}>
              SIGN OUT
            </button>
          </form>
          <div className="e-mono" style={{ marginTop: 14, fontSize: 9, color: "rgba(242,238,232,0.35)", letterSpacing: "0.25em", textAlign: "center" }}>
            ELEMENT 78 · ATLANTA · MEMBER SINCE {new Date(user.created_at).getFullYear()}
          </div>
        </section>
      </div>
      <TabBar />
    </div>
  );
}
