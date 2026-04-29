import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { listProfilesByIds } from "@/lib/data/queries";

export default async function AdminAuditPage() {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/home?error=admin_only");

  const sb = createAdminClient();
  const { data } = await sb.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(200);
  const rows = (data as Array<{ id: string; admin_user_id: string; action: string; target_type: string | null; target_id: string | null; details: Record<string, unknown> | null; created_at: string }>) ?? [];
  const adminIds = Array.from(new Set(rows.map(r => r.admin_user_id)));
  const profiles = await listProfilesByIds(adminIds);

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/admin" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ADMIN</span>
        </Link>
        <h1 className="e-display" style={{ fontSize: "clamp(28px, 5vw, 40px)", lineHeight: 0.95, marginTop: 14 }}>AUDIT LOG.</h1>

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 4 }}>
          {rows.length === 0 ? (
            <div style={{ padding: "16px 18px", borderRadius: 12, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>Nothing logged yet.</div>
          ) : rows.map(r => (
            <div key={r.id} className="e-mono" style={{ padding: "8px 12px", borderRadius: 8, background: "var(--haze)", fontSize: 11, letterSpacing: "0.14em", color: "rgba(242,238,232,0.75)", display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span style={{ color: "rgba(242,238,232,0.55)" }}>
                {new Date(r.created_at).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}
              </span>
              <span style={{ color: "var(--sky)" }}>{(profiles[r.admin_user_id]?.display_name ?? "ADMIN").toUpperCase()}</span>
              <span>{r.action.toUpperCase()}</span>
              {r.target_type && <span style={{ color: "rgba(242,238,232,0.5)" }}>{r.target_type}/{(r.target_id ?? "").slice(0, 8)}</span>}
              {r.details && <span style={{ color: "rgba(242,238,232,0.5)" }}>{JSON.stringify(r.details).slice(0, 80)}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
