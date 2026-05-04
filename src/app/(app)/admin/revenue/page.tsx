import { redirect } from "next/navigation";
import { AdminShell } from "@/components/site/AdminShell";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { listLocations } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

type PurchaseAgg = {
  amount_cents: number;
  platform_fee_cents: number;
  status: string;
  kind: string;
  trainer_id: string | null;
  created_at: string;
};

const RANGE_OPTIONS = [
  { v: "7d",   label: "7 DAYS",  days: 7 },
  { v: "30d",  label: "30 DAYS", days: 30 },
  { v: "90d",  label: "90 DAYS", days: 90 },
  { v: "ytd",  label: "YTD",     days: null as null | number },
  { v: "all",  label: "ALL TIME", days: null as null | number },
];

export default async function AdminRevenuePage({ searchParams }: { searchParams: { gym?: string; range?: string } }) {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/login?next=/admin/revenue");
  const sb = createClient();
  const locations = await listLocations();

  const gymSlug = searchParams.gym ?? "all";
  const rangeKey = searchParams.range ?? "30d";
  const range = RANGE_OPTIONS.find(r => r.v === rangeKey) ?? RANGE_OPTIONS[1];

  const now = new Date();
  let from: Date | null;
  if (range.v === "ytd") {
    from = new Date(now.getFullYear(), 0, 1);
  } else if (range.v === "all") {
    from = null;
  } else {
    from = new Date(now.getTime() - (range.days ?? 30) * 86_400_000);
  }

  // Resolve gym → trainer_id list (events/classes are tied to a location via
  // trainer.home_location_id; purchases reference the trainer not the gym).
  // Approximation v1: filter purchases by trainer_id whose home_location_id = gym.
  let trainerFilter: string[] | null = null;
  let activeGymName = "ALL GYMS";
  if (gymSlug !== "all") {
    const gym = locations.find(l => l.slug === gymSlug);
    if (gym) {
      activeGymName = gym.name.toUpperCase();
      const { data: ts } = await sb.from("trainers").select("id").eq("home_location_id", gym.id);
      trainerFilter = ((ts ?? []) as Array<{ id: string }>).map(t => t.id);
    }
  }

  let q = sb.from("purchases").select("amount_cents, platform_fee_cents, status, kind, trainer_id, created_at");
  if (from) q = q.gte("created_at", from.toISOString());
  if (trainerFilter !== null) {
    if (trainerFilter.length === 0) q = q.eq("trainer_id", "00000000-0000-0000-0000-000000000000"); // forces empty
    else q = q.in("trainer_id", trainerFilter);
  }
  const { data } = await q;
  const rows = (data as PurchaseAgg[]) ?? [];

  const paid = rows.filter(r => r.status === "paid");
  const refunded = rows.filter(r => r.status === "refunded");
  const grossCents = paid.reduce((s, r) => s + r.amount_cents, 0);
  const refundCents = refunded.reduce((s, r) => s + r.amount_cents, 0);
  const platformCents = paid.reduce((s, r) => s + r.platform_fee_cents, 0);
  const trainerCents = paid.reduce((s, r) => s + (r.amount_cents - r.platform_fee_cents), 0);
  const netCents = grossCents - refundCents;

  // Breakdown by kind
  const byKind = new Map<string, { count: number; gross: number }>();
  for (const r of paid) {
    const cur = byKind.get(r.kind) ?? { count: 0, gross: 0 };
    cur.count += 1;
    cur.gross += r.amount_cents;
    byKind.set(r.kind, cur);
  }

  // Member + coach counts (scoped by gym if applicable)
  let memberCount = 0;
  let coachCount = 0;
  {
    const { count: pc } = await sb.from("profiles").select("*", { count: "exact", head: true });
    memberCount = pc ?? 0;
    if (trainerFilter !== null) {
      coachCount = trainerFilter.length;
    } else {
      const { count: tc } = await sb.from("trainers").select("*", { count: "exact", head: true });
      coachCount = tc ?? 0;
    }
  }

  return (
    <AdminShell pathname="/admin/revenue" title="REVENUE" subtitle={`${activeGymName} · ${range.label}`}>
      {/* Filters */}
      <form method="get" style={{ marginBottom: 22, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <select name="gym" defaultValue={gymSlug} className="ta-input" style={{ maxWidth: 240 }}>
          <option value="all">ALL GYMS</option>
          {locations.map(l => <option key={l.id} value={l.slug}>{l.name}</option>)}
        </select>
        <select name="range" defaultValue={rangeKey} className="ta-input" style={{ maxWidth: 160 }}>
          {RANGE_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
        </select>
        <button type="submit" className="btn btn-sky" style={{ padding: "10px 16px" }}>APPLY</button>
      </form>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <Stat label="GROSS" value={`$${(grossCents / 100).toFixed(2)}`} hint={`${paid.length} PAID`} />
        <Stat label="REFUNDED" value={`$${(refundCents / 100).toFixed(2)}`} hint={`${refunded.length} REFUNDS`} />
        <Stat label="NET REVENUE" value={`$${(netCents / 100).toFixed(2)}`} hint="GROSS − REFUNDS" />
        <Stat label="PLATFORM TAKE" value={`$${(platformCents / 100).toFixed(2)}`} hint="FEES KEPT" />
        <Stat label="COACH PAYOUTS" value={`$${(trainerCents / 100).toFixed(2)}`} hint="DUE TO COACHES" />
        <Stat label="MEMBERS" value={memberCount.toLocaleString()} hint="PROFILES TOTAL" />
        <Stat label="COACHES" value={coachCount.toLocaleString()} hint={trainerFilter !== null ? "AT THIS GYM" : "PLATFORM"} />
      </div>

      {/* By kind */}
      <section style={{ marginTop: 22, padding: 22, borderRadius: 16, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
        <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(242,238,232,0.6)" }}>BY KIND</div>
        {byKind.size === 0 ? (
          <div className="e-mono" style={{ marginTop: 8, fontSize: 11, color: "rgba(242,238,232,0.5)", letterSpacing: "0.16em" }}>NO PAID PURCHASES IN THIS WINDOW.</div>
        ) : (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {Array.from(byKind.entries())
              .sort((a, b) => b[1].gross - a[1].gross)
              .map(([kind, v]) => (
                <div key={kind} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "rgba(10,14,20,0.4)", border: "1px solid rgba(143,184,214,0.15)" }}>
                  <div className="e-mono" style={{ flex: 1, fontSize: 11, letterSpacing: "0.16em" }}>{kind.toUpperCase().replace(/_/g, " ")}</div>
                  <div className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.55)" }}>{v.count} sales</div>
                  <div className="e-mono" style={{ fontSize: 11, color: "var(--sky)", letterSpacing: "0.14em" }}>${(v.gross / 100).toFixed(2)}</div>
                </div>
              ))}
          </div>
        )}
      </section>

      <style>{`
        .ta-input { padding: 11px 13px; border-radius: 10px; background: rgba(10,14,20,0.4); border: 1px solid rgba(143,184,214,0.25); color: var(--bone); font-family: var(--font-body); font-size: 14px; }
        .ta-input:focus { outline: none; border-color: var(--sky); }
      `}</style>
    </AdminShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ padding: 16, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
      <div className="e-mono" style={{ fontSize: 9, letterSpacing: "0.22em", color: "rgba(242,238,232,0.55)" }}>{label}</div>
      <div className="e-display" style={{ fontSize: 24, marginTop: 6 }}>{value}</div>
      {hint && <div className="e-mono" style={{ marginTop: 4, fontSize: 9, color: "rgba(242,238,232,0.5)", letterSpacing: "0.14em" }}>{hint}</div>}
    </div>
  );
}
