import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { refundPurchaseAction } from "@/lib/admin-actions";

function fmt(c: number) { return `$${(c / 100).toFixed(2)}`; }

export default async function AdminPurchasesPage({ searchParams }: { searchParams: { kind?: string; status?: string; refunded?: string; error?: string } }) {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/home?error=admin_only");

  const sb = createAdminClient();
  let q = sb.from("purchases").select("*, profiles:user_id(display_name)").order("created_at", { ascending: false }).limit(150);
  if (searchParams.kind) q = q.eq("kind", searchParams.kind);
  if (searchParams.status) q = q.eq("status", searchParams.status);
  const { data: rows } = await q;
  const list = (rows as Array<{ id: string; user_id: string; kind: string; amount_cents: number; status: string; description: string | null; created_at: string; profiles: { display_name: string | null } | null }>) ?? [];

  const flash = searchParams.refunded ? `REFUNDED ${searchParams.refunded.slice(0, 8)}…`
              : searchParams.error ? searchParams.error.replace(/_/g, " ").toUpperCase()
              : null;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/admin" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ADMIN</span>
        </Link>
        <h1 className="e-display" style={{ fontSize: "clamp(28px, 5vw, 40px)", lineHeight: 0.95, marginTop: 14 }}>PURCHASES.</h1>

        <form method="get" style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select name="kind" defaultValue={searchParams.kind ?? ""} className="ta-input">
            <option value="">all kinds</option>
            <option value="class_booking">class</option>
            <option value="trainer_booking">1-on-1 / group</option>
            <option value="program_enrollment">program</option>
            <option value="shop_order">shop</option>
            <option value="guest_pass">guest pass</option>
            <option value="subscription">subscription</option>
          </select>
          <select name="status" defaultValue={searchParams.status ?? ""} className="ta-input">
            <option value="">all statuses</option>
            <option value="paid">paid</option>
            <option value="refunded">refunded</option>
            <option value="pending">pending</option>
            <option value="failed">failed</option>
          </select>
          <button type="submit" className="btn btn-sky" style={{ padding: "8px 14px", fontSize: 11 }}>FILTER</button>
        </form>

        {flash && (
          <div className="e-mono" style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.16em" }}>
            ✓ {flash}
          </div>
        )}

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 6 }}>
          {list.map(p => (
            <div key={p.id} style={{ display: "flex", gap: 12, padding: "10px 12px", borderRadius: 10, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.12)", alignItems: "center", flexWrap: "wrap" }}>
              <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.16em", minWidth: 80 }}>
                {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "2-digit" }).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <Link href={`/admin/users/${p.user_id}`} style={{ color: "var(--sky)", fontSize: 12, textDecoration: "none" }}>
                  {p.profiles?.display_name ?? "Member"}
                </Link>
                <div style={{ fontSize: 13, marginTop: 2 }}>{p.description ?? p.kind}</div>
              </div>
              <div className="e-mono" style={{ fontSize: 9, letterSpacing: "0.16em", color: "rgba(242,238,232,0.55)" }}>
                {p.kind.toUpperCase()} · {p.status.toUpperCase()}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{fmt(p.amount_cents)}</div>
              {p.status === "paid" && (
                <form action={refundPurchaseAction}>
                  <input type="hidden" name="purchase_id" value={p.id} />
                  <button type="submit" className="btn" style={{ padding: "6px 10px", fontSize: 9, background: "transparent", color: "var(--rose)", border: "1px solid rgba(232,181,168,0.3)" }}>REFUND</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .ta-input { padding: 8px 10px; border-radius: 8px; background: rgba(10,14,20,0.4); border: 1px solid rgba(143,184,214,0.25); color: var(--bone); font-family: var(--font-body); font-size: 12px; }
      `}</style>
    </div>
  );
}
