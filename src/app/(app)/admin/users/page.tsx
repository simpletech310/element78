import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminUsersPage({ searchParams }: { searchParams: { q?: string } }) {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/home?error=admin_only");

  const q = (searchParams.q ?? "").trim();
  const sb = createAdminClient();

  let query = sb.from("profiles").select("id, display_name, handle, avatar_url, membership_tier, is_admin, is_banned").order("display_name").limit(100);
  if (q) {
    query = query.or(`display_name.ilike.%${q}%,handle.ilike.%${q}%`);
  }
  const { data: profiles } = await query;
  const rows = (profiles as Array<{ id: string; display_name: string | null; handle: string | null; avatar_url: string | null; membership_tier: string | null; is_admin: boolean; is_banned: boolean }>) ?? [];

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/admin" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ADMIN</span>
        </Link>
        <h1 className="e-display" style={{ fontSize: "clamp(28px, 5vw, 40px)", lineHeight: 0.95, marginTop: 14 }}>USERS.</h1>

        <form method="get" style={{ marginTop: 18 }}>
          <input name="q" defaultValue={q} placeholder="search by name or handle…" className="ta-input" style={{ width: "100%", maxWidth: 420 }} />
        </form>

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.length === 0 ? (
            <div style={{ padding: "16px 18px", borderRadius: 12, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>No matches.</div>
          ) : (
            rows.map(p => (
              <Link key={p.id} href={`/admin/users/${p.id}`} className="lift" style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: 12, borderRadius: 10, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
                color: "var(--bone)", textDecoration: "none",
                opacity: p.is_banned ? 0.5 : 1,
              }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 15 }}>{(p.display_name ?? "Member").toUpperCase()}</div>
                  <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, letterSpacing: "0.16em", marginTop: 3 }}>
                    @{p.handle ?? "—"} · {(p.membership_tier ?? "free").toUpperCase()}
                    {p.is_admin ? " · ADMIN" : ""}
                    {p.is_banned ? " · BANNED" : ""}
                  </div>
                </div>
                <Icon name="chevron" size={16} />
              </Link>
            ))
          )}
        </div>
      </div>

      <style>{`
        .ta-input { padding: 10px 12px; border-radius: 8px; background: rgba(10,14,20,0.4); border: 1px solid rgba(143,184,214,0.25); color: var(--bone); font-family: var(--font-body); font-size: 13px; }
      `}</style>
    </div>
  );
}
