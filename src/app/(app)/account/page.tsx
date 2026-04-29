import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { redirect } from "next/navigation";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { Wordmark } from "@/components/brand/Wordmark";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/lib/auth-actions";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";

export default async function AccountPage({ searchParams }: { searchParams?: { updated?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/account");

  // Profile data is the source of truth; user_metadata is the fallback for
  // accounts that haven't gone through the editor yet.
  const sb = createClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("display_name, handle, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const p = (profile as { display_name?: string; handle?: string; avatar_url?: string } | null) ?? {};

  const displayName = p.display_name
    ?? (user.user_metadata?.display_name as string | undefined)
    ?? user.email?.split("@")[0]
    ?? "Member";
  const email = user.email ?? "";
  const handle = p.handle
    ?? (user.user_metadata?.handle as string | undefined)
    ?? email.split("@")[0];
  const avatarUrl = p.avatar_url
    ?? (user.user_metadata?.avatar_url as string | undefined)
    ?? "/assets/blue-hair-selfie.jpg";

  // If the user is a coach, surface the coach dashboard at the top of the
  // account menu so they can hop into their working surface fast.
  const coach = await getTrainerForCurrentUser();

  const links: { label: string; href: string; icon: "cal" | "bag" | "heart" | "settings" | "fire" }[] = [
    ...(coach ? [{ label: "COACH DASHBOARD", href: "/trainer/dashboard", icon: "fire" as const }] : []),
    { label: "MESSAGES", href: "/messages", icon: "settings" },
    { label: "MEMBERSHIP", href: "/account/membership", icon: "settings" },
    { label: "ORDER HISTORY", href: "/account/purchases", icon: "bag" },
    { label: "PROGRAM HISTORY", href: "/account/history", icon: "fire" },
    { label: "1-ON-1 SESSIONS", href: "/account/sessions", icon: "cal" },
    { label: "MY BOOKINGS", href: "/gym", icon: "cal" },
    { label: "SAVED", href: "/account/saved", icon: "heart" },
    ...(coach ? [] : [{ label: "BECOME A COACH", href: "/coach/apply", icon: "fire" as const }]),
    { label: "NOTIFICATIONS", href: "/account/notifications", icon: "settings" },
    { label: "SECURITY", href: "/account/security", icon: "settings" },
    { label: "WAIVER · WELLNESS", href: "/account/waiver", icon: "heart" },
    { label: "EXPORT MY DATA", href: "/api/account/export", icon: "settings" },
    { label: "DELETE ACCOUNT", href: "/account/delete", icon: "settings" },
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

        {searchParams?.updated && (
          <div className="e-mono" style={{ margin: "14px 22px 0", padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
            ✓ PROFILE UPDATED
          </div>
        )}

        {/* Profile hero */}
        <section style={{ padding: "32px 22px 32px" }}>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <div style={{ width: 84, height: 84, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--sky)", flexShrink: 0 }}>
              <Photo src={avatarUrl} alt={displayName} style={{ width: "100%", height: "100%" }} />
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
            <Link href="/account/edit" className="e-mono" style={{ flexShrink: 0, padding: "8px 12px", borderRadius: 999, background: "rgba(143,184,214,0.12)", color: "var(--sky)", border: "1px solid rgba(143,184,214,0.3)", textDecoration: "none", fontSize: 10, letterSpacing: "0.2em" }}>
              EDIT
            </Link>
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
