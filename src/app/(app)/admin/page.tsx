import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

function fmt(cents: number) { return `$${(cents / 100).toFixed(0)}`; }

export default async function AdminHomePage() {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/home?error=admin_only");

  const sb = createClient();
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();

  const [usersRes, subsRes, purchasesRes, refundsRes, pendingRes, trainersRes] = await Promise.all([
    sb.from("profiles").select("id", { count: "exact", head: true }),
    sb.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing"]),
    sb.from("purchases").select("amount_cents").eq("status", "paid").gte("created_at", monthStart),
    sb.from("purchases").select("amount_cents").eq("status", "refunded").gte("created_at", monthStart),
    sb.from("trainer_bookings").select("id", { count: "exact", head: true }).eq("status", "pending_trainer"),
    sb.from("trainers").select("id", { count: "exact", head: true }).eq("payout_status", "active"),
  ]);

  const usersCount = usersRes.count ?? 0;
  const activeSubs = subsRes.count ?? 0;
  const monthGross = ((purchasesRes.data as Array<{ amount_cents: number }> | null) ?? []).reduce((s, r) => s + r.amount_cents, 0);
  const monthRefunds = ((refundsRes.data as Array<{ amount_cents: number }> | null) ?? []).reduce((s, r) => s + r.amount_cents, 0);
  const pendingBookings = pendingRes.count ?? 0;
  const activeTrainers = trainersRes.count ?? 0;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 22px 80px" }}>
        <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>ADMIN · {admin.display_name?.toUpperCase() ?? "OPS"}</div>
        <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92, marginTop: 8 }}>OVERVIEW.</h1>

        <section style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
          <Card label="USERS" value={usersCount.toString()} />
          <Card label="ACTIVE SUBS" value={activeSubs.toString()} />
          <Card label="ACTIVE TRAINERS" value={activeTrainers.toString()} />
          <Card label="THIS MONTH GROSS" value={fmt(monthGross)} />
          <Card label="THIS MONTH REFUNDS" value={fmt(monthRefunds)} />
          <Card label="PENDING BOOKINGS" value={pendingBookings.toString()} />
        </section>

        <section style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <NavTile href="/admin/users" label="USERS" hint="Search · ban · grant admin" />
          <NavTile href="/admin/purchases" label="PURCHASES" hint="Filter · refund · audit" />
          <NavTile href="/admin/payouts" label="PAYOUTS" hint="Coach payouts ledger" />
          <NavTile href="/admin/posts" label="POSTS" hint="Wall moderation" />
          <NavTile href="/admin/coaches" label="COACH APPLICATIONS" hint="Review pending coach applications" />
          <NavTile href="/admin/audit" label="AUDIT LOG" hint="What admins did" />
        </section>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
      <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.2em" }}>{label}</div>
      <div style={{ marginTop: 8, fontFamily: "var(--font-display)", fontSize: 28 }}>{value}</div>
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
