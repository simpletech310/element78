import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/site/AdminShell";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

function fmt(cents: number) { return `$${(cents / 100).toFixed(0)}`; }

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/home?error=admin_only");

  const sb = createClient();
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();

  const [usersRes, subsRes, purchasesRes, refundsRes, pendingRes, trainersRes, productsRes, eventsRes, challengesRes, applicationsRes] = await Promise.all([
    sb.from("profiles").select("id", { count: "exact", head: true }),
    sb.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing"]),
    sb.from("purchases").select("amount_cents").eq("status", "paid").gte("created_at", monthStart),
    sb.from("purchases").select("amount_cents").eq("status", "refunded").gte("created_at", monthStart),
    sb.from("trainer_bookings").select("id", { count: "exact", head: true }).eq("status", "pending_trainer"),
    sb.from("trainers").select("id", { count: "exact", head: true }).eq("payout_status", "active"),
    sb.from("products").select("id", { count: "exact", head: true }),
    sb.from("events").select("id", { count: "exact", head: true }).eq("status", "published"),
    sb.from("challenges").select("id", { count: "exact", head: true }).eq("status", "published"),
    sb.from("coach_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const usersCount = usersRes.count ?? 0;
  const activeSubs = subsRes.count ?? 0;
  const monthGross = ((purchasesRes.data as Array<{ amount_cents: number }> | null) ?? []).reduce((s, r) => s + r.amount_cents, 0);
  const monthRefunds = ((refundsRes.data as Array<{ amount_cents: number }> | null) ?? []).reduce((s, r) => s + r.amount_cents, 0);
  const pendingBookings = pendingRes.count ?? 0;
  const activeTrainers = trainersRes.count ?? 0;
  const productsCount = productsRes.count ?? 0;
  const eventsCount = eventsRes.count ?? 0;
  const challengesCount = challengesRes.count ?? 0;
  const pendingApps = applicationsRes.count ?? 0;

  return (
    <AdminShell pathname="/admin" title="OVERVIEW" subtitle={`SIGNED IN AS ${(admin.display_name ?? "ADMIN").toUpperCase()}`}>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <Card label="MEMBERS" value={usersCount.toLocaleString()} />
        <Card label="ACTIVE SUBS" value={activeSubs.toLocaleString()} />
        <Card label="ACTIVE COACHES" value={activeTrainers.toString()} />
        <Card label="MTD GROSS" value={fmt(monthGross)} />
        <Card label="MTD REFUNDS" value={fmt(monthRefunds)} />
        <Card label="MTD NET" value={fmt(monthGross - monthRefunds)} />
        <Card label="PENDING BOOKINGS" value={pendingBookings.toString()} hint={pendingBookings > 0 ? "ATTENTION" : undefined} />
        <Card label="COACH APPLICATIONS" value={pendingApps.toString()} hint={pendingApps > 0 ? "REVIEW" : undefined} />
        <Card label="PRODUCTS" value={productsCount.toString()} />
        <Card label="LIVE EVENTS" value={eventsCount.toString()} />
        <Card label="LIVE CHALLENGES" value={challengesCount.toString()} />
      </section>

      <section style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <NavTile href="/admin/revenue" label="REVENUE" hint="Per-gym + date-range breakdown" />
        <NavTile href="/admin/users" label="MEMBERS" hint="Search · ban · reset · delete" />
        <NavTile href="/admin/trainers" label="COACHES" hint="Add · edit · per-coach payout split" />
        <NavTile href="/admin/coaches" label="APPLICATIONS" hint="Review pending coach apps" />
        <NavTile href="/admin/programs" label="PROGRAMS" hint="Oversee + archive any program" />
        <NavTile href="/admin/events" label="EVENTS" hint="Oversee + cancel any event" />
        <NavTile href="/admin/challenges" label="CHALLENGES" hint="Oversee + archive any challenge" />
        <NavTile href="/admin/products" label="SHOP" hint="CRUD products" />
        <NavTile href="/admin/purchases" label="PURCHASES" hint="Filter · refund" />
        <NavTile href="/admin/payouts" label="PAYOUTS" hint="Coach payouts ledger" />
        <NavTile href="/admin/posts" label="WALL" hint="Moderate posts" />
        <NavTile href="/admin/audit" label="AUDIT LOG" hint="Every admin action" />
      </section>
    </AdminShell>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
      <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.2em" }}>{label}</div>
      <div style={{ marginTop: 8, fontFamily: "var(--font-display)", fontSize: 28 }}>{value}</div>
      {hint && <div className="e-mono" style={{ marginTop: 4, fontSize: 9, color: "var(--rose)", letterSpacing: "0.16em" }}>{hint}</div>}
    </div>
  );
}

function NavTile({ href, label, hint }: { href: string; label: string; hint: string }) {
  return (
    <Link href={href} className="lift" style={{
      display: "block", padding: 16, borderRadius: 14,
      background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
      textDecoration: "none", color: "var(--bone)",
    }}>
      <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>{label} →</div>
      <div className="e-mono" style={{ marginTop: 6, color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.14em" }}>{hint}</div>
    </Link>
  );
}
