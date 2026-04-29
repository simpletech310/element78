import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function fmt(c: number) { return `$${(c / 100).toFixed(2)}`; }

export default async function AdminPayoutsPage() {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/home?error=admin_only");

  const sb = createAdminClient();
  const { data } = await sb
    .from("payouts")
    .select("*, trainers:trainer_id(name, slug)")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data as Array<{ id: string; gross_cents: number; platform_fee_cents: number; trainer_cents: number; stripe_transfer_id: string | null; status: string; created_at: string; trainers: { name: string; slug: string } | null }>) ?? [];

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/admin" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ADMIN</span>
        </Link>
        <h1 className="e-display" style={{ fontSize: "clamp(28px, 5vw, 40px)", lineHeight: 0.95, marginTop: 14 }}>PAYOUTS.</h1>

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.length === 0 ? (
            <div style={{ padding: "16px 18px", borderRadius: 12, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>No payouts yet.</div>
          ) : rows.map(r => (
            <div key={r.id} style={{ display: "grid", gridTemplateColumns: "100px 1fr auto auto", gap: 12, padding: "10px 12px", borderRadius: 10, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.12)", alignItems: "center" }}>
              <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.16em" }}>
                {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "2-digit" }).toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{(r.trainers?.name ?? "—").toUpperCase()}</div>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, letterSpacing: "0.14em", marginTop: 2 }}>
                  GROSS {fmt(r.gross_cents)} · FEE {fmt(r.platform_fee_cents)}
                  {r.stripe_transfer_id ? ` · ${r.stripe_transfer_id.slice(0, 14)}…` : ""}
                </div>
              </div>
              <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.16em", color: r.status === "sent" ? "var(--sky)" : "rgba(242,238,232,0.55)" }}>{r.status.toUpperCase()}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{fmt(r.trainer_cents)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
