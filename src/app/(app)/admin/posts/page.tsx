import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hidePostAction } from "@/lib/admin-actions";

export default async function AdminPostsPage() {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/home?error=admin_only");

  const sb = createAdminClient();
  const { data } = await sb.from("posts").select("*, profiles:author_id(display_name)").order("created_at", { ascending: false }).limit(100);
  const rows = (data as Array<{ id: string; author_id: string | null; body: string | null; media_url: string | null; created_at: string; meta: Record<string, unknown> | null; profiles: { display_name: string | null } | null }>) ?? [];

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/admin" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ADMIN</span>
        </Link>
        <h1 className="e-display" style={{ fontSize: "clamp(28px, 5vw, 40px)", lineHeight: 0.95, marginTop: 14 }}>POSTS.</h1>

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.length === 0 ? (
            <div style={{ padding: "16px 18px", borderRadius: 12, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>No posts.</div>
          ) : rows.map(p => {
            const hidden = (p.meta as { hidden?: boolean } | null)?.hidden;
            return (
              <div key={p.id} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 12, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)", opacity: hidden ? 0.5 : 1, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.18em" }}>
                    {(p.profiles?.display_name ?? "Member").toUpperCase()} · {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                    {hidden ? " · HIDDEN" : ""}
                  </div>
                  <div style={{ fontSize: 14, marginTop: 6, color: "rgba(242,238,232,0.85)" }}>
                    {p.body ?? "(media post)"}
                  </div>
                </div>
                {!hidden && (
                  <form action={hidePostAction}>
                    <input type="hidden" name="post_id" value={p.id} />
                    <button type="submit" className="btn" style={{ padding: "6px 10px", fontSize: 9, background: "transparent", color: "var(--rose)", border: "1px solid rgba(232,181,168,0.3)" }}>HIDE</button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
