import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { banUserAction, unbanUserAction, setAdminAction, refundPurchaseAction } from "@/lib/admin-actions";

function fmt(c: number) { return `$${(c / 100).toFixed(2)}`; }

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/home?error=admin_only");

  const sb = createAdminClient();
  const [profileRes, purchasesRes, bookingsRes, enrollmentsRes] = await Promise.all([
    sb.from("profiles").select("*").eq("id", params.id).maybeSingle(),
    sb.from("purchases").select("*").eq("user_id", params.id).order("created_at", { ascending: false }).limit(50),
    sb.from("trainer_bookings").select("*").eq("user_id", params.id).order("starts_at", { ascending: false }).limit(20),
    sb.from("program_enrollments").select("*, programs:program_id(name)").eq("user_id", params.id).order("started_at", { ascending: false }),
  ]);
  const profile = profileRes.data as { id: string; display_name: string | null; handle: string | null; membership_tier: string | null; is_admin: boolean; is_banned: boolean; banned_reason: string | null } | null;
  if (!profile) notFound();

  const purchases = (purchasesRes.data as Array<{ id: string; kind: string; amount_cents: number; status: string; description: string | null; created_at: string }>) ?? [];
  const bookings = (bookingsRes.data as Array<{ id: string; starts_at: string; mode: string; status: string }>) ?? [];
  const enrollments = (enrollmentsRes.data as Array<{ id: string; status: string; current_day: number; programs: { name: string } | null; started_at: string }>) ?? [];
  const totalSpent = purchases.filter(p => p.status === "paid").reduce((s, p) => s + p.amount_cents, 0);

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/admin/users" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>USERS</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.25em" }}>
            USER · {profile.is_admin ? "ADMIN · " : ""}{profile.is_banned ? "BANNED · " : ""}{(profile.membership_tier ?? "free").toUpperCase()}
          </div>
          <h1 className="e-display" style={{ fontSize: "clamp(28px, 5vw, 40px)", lineHeight: 0.95, marginTop: 6 }}>
            {(profile.display_name ?? "Member").toUpperCase()}
          </h1>
          <div className="e-mono" style={{ marginTop: 8, fontSize: 10, color: "rgba(242,238,232,0.55)", letterSpacing: "0.18em" }}>
            ID {profile.id.slice(0, 8)}… · @{profile.handle ?? "—"} · TOTAL {fmt(totalSpent)}
          </div>
        </div>

        <section style={{ marginTop: 22, padding: 16, borderRadius: 12, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)", display: "flex", gap: 10, flexWrap: "wrap" }}>
          {profile.is_banned ? (
            <form action={unbanUserAction}>
              <input type="hidden" name="user_id" value={profile.id} />
              <button type="submit" className="btn btn-sky" style={{ padding: "8px 14px", fontSize: 11 }}>UNBAN</button>
            </form>
          ) : (
            <form action={banUserAction} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <input type="hidden" name="user_id" value={profile.id} />
              <input name="reason" placeholder="reason" className="ta-input" style={{ minWidth: 200 }} />
              <button type="submit" className="btn" style={{ padding: "8px 14px", fontSize: 11, background: "transparent", color: "var(--rose)", border: "1px solid rgba(232,181,168,0.4)" }}>BAN</button>
            </form>
          )}
          <form action={setAdminAction}>
            <input type="hidden" name="user_id" value={profile.id} />
            <input type="hidden" name="value" value={profile.is_admin ? "false" : "true"} />
            <button type="submit" className="btn" style={{ padding: "8px 14px", fontSize: 11, background: "transparent", color: "var(--sky)", border: "1px solid rgba(143,184,214,0.4)" }}>
              {profile.is_admin ? "REVOKE ADMIN" : "GRANT ADMIN"}
            </button>
          </form>
        </section>

        <Section title={`PURCHASES · ${purchases.length}`}>
          {purchases.length === 0 ? <Empty body="No purchases." /> : purchases.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.12)", flexWrap: "wrap", gap: 8 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{p.description ?? p.kind}</div>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, letterSpacing: "0.16em", marginTop: 3 }}>
                  {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "2-digit" }).toUpperCase()} · {p.kind.toUpperCase()} · {p.status.toUpperCase()}
                </div>
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
        </Section>

        <Section title={`1-ON-1 BOOKINGS · ${bookings.length}`}>
          {bookings.length === 0 ? <Empty body="None." /> : bookings.map(b => (
            <div key={b.id} className="e-mono" style={{ padding: "8px 12px", borderRadius: 8, background: "var(--haze)", fontSize: 11, letterSpacing: "0.14em", color: "rgba(242,238,232,0.7)" }}>
              {new Date(b.starts_at).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })} · {b.mode.toUpperCase()} · {b.status.replace(/_/g, " ").toUpperCase()}
            </div>
          ))}
        </Section>

        <Section title={`PROGRAM ENROLLMENTS · ${enrollments.length}`}>
          {enrollments.length === 0 ? <Empty body="None." /> : enrollments.map(e => (
            <div key={e.id} className="e-mono" style={{ padding: "8px 12px", borderRadius: 8, background: "var(--haze)", fontSize: 11, letterSpacing: "0.14em", color: "rgba(242,238,232,0.7)" }}>
              {(e.programs?.name ?? "—").toUpperCase()} · DAY {e.current_day} · {e.status.toUpperCase()}
            </div>
          ))}
        </Section>
      </div>

      <style>{`
        .ta-input { padding: 8px 10px; border-radius: 8px; background: rgba(10,14,20,0.4); border: 1px solid rgba(232,181,168,0.3); color: var(--bone); font-size: 12px; font-family: var(--font-body); }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 24 }}>
      <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>{title}</div>
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
    </section>
  );
}

function Empty({ body }: { body: string }) {
  return <div style={{ padding: 12, fontSize: 12, color: "rgba(242,238,232,0.5)" }}>{body}</div>;
}
