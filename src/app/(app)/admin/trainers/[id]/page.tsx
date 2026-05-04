import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/site/AdminShell";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { updateTrainerAction, setTrainerSplitAction, archiveTrainerAction } from "@/lib/admin-actions";
import { PLATFORM_FEE_BPS } from "@/lib/connect";
import { listLocations } from "@/lib/data/queries";
import type { Trainer } from "@/lib/data/types";

export const dynamic = "force-dynamic";

type TrainerRow = Trainer & { payout_split_bps: number | null };

export default async function AdminTrainerDetail({ params, searchParams }: { params: { id: string }; searchParams: { created?: string; updated?: string; split_updated?: string; error?: string } }) {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/login?next=/admin/trainers");
  const sb = createClient();
  const { data } = await sb.from("trainers").select("*").eq("id", params.id).maybeSingle();
  if (!data) redirect("/admin/trainers?error=not_found");
  const t = data as TrainerRow;
  const locations = await listLocations();

  // Recent payout/earning summary
  const { data: payouts } = await sb
    .from("payouts")
    .select("gross_cents, trainer_cents, platform_fee_cents, status, created_at")
    .eq("trainer_id", t.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const totalEarned = ((payouts ?? []) as Array<{ trainer_cents: number; status: string }>)
    .filter(p => p.status === "sent")
    .reduce((s, p) => s + p.trainer_cents, 0);

  return (
    <AdminShell pathname="/admin/trainers" title={t.name} subtitle={`/${t.slug}${t.is_ai ? " · AI" : ""}`}>
      {(searchParams.created || searchParams.updated || searchParams.split_updated) && (
        <div className="e-mono" style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(143,184,214,0.12)", border: "1px solid rgba(143,184,214,0.4)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.16em" }}>
          {searchParams.split_updated ? "SPLIT UPDATED." : searchParams.created ? "COACH CREATED." : "SAVED."}
        </div>
      )}

      {/* Earnings snapshot */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 22 }}>
        <Stat label="LIFETIME EARNED" value={`$${(totalEarned / 100).toFixed(2)}`} />
        <Stat label="PAYOUT STATUS" value={(t.payout_status ?? "unverified").toUpperCase()} />
        <Stat label="STRIPE ACCT" value={t.stripe_account_id ? `…${t.stripe_account_id.slice(-6)}` : "—"} />
        <Stat label="CURRENT SPLIT" value={t.payout_split_bps == null ? `${(PLATFORM_FEE_BPS / 100).toFixed(0)}% (default)` : `${(t.payout_split_bps / 100).toFixed(1)}%`} />
      </div>

      {/* Payout split */}
      <Section title="PAYOUT SPLIT">
        <p style={{ color: "rgba(242,238,232,0.65)", fontSize: 13, lineHeight: 1.55, marginTop: 6 }}>
          Platform fee in basis points (0–10000). 2000 = 20% platform / 80% coach (the global default). Lower it to give this coach a better cut, raise it to take more. Leave blank to revert to the global default.
        </p>
        <form action={setTrainerSplitAction} style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input type="hidden" name="trainer_id" value={t.id} />
          <input
            name="payout_split_bps"
            type="number"
            min={0}
            max={10000}
            defaultValue={t.payout_split_bps ?? ""}
            placeholder={String(PLATFORM_FEE_BPS)}
            className="ta-input"
            style={{ maxWidth: 200 }}
          />
          <button type="submit" className="btn btn-sky" style={{ padding: "10px 16px" }}>UPDATE SPLIT →</button>
        </form>
      </Section>

      {/* Profile */}
      <Section title="PROFILE">
        <form action={updateTrainerAction} style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 14 }}>
          <input type="hidden" name="trainer_id" value={t.id} />
          <Field label="HEADLINE"><input name="headline" defaultValue={t.headline ?? ""} className="ta-input" /></Field>
          <Field label="BIO"><textarea name="bio" rows={4} defaultValue={t.bio ?? ""} className="ta-input" style={{ resize: "vertical" }} /></Field>
          <Field label="SPECIALTIES (comma-separated)"><input name="specialties" defaultValue={t.specialties.join(", ")} className="ta-input" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="CERT"><input name="cert" defaultValue={t.cert ?? ""} className="ta-input" /></Field>
            <Field label="YEARS"><input type="number" name="years_experience" defaultValue={t.years_experience ?? ""} className="ta-input" /></Field>
          </div>
          <Field label="HOME LOCATION">
            <select name="home_location_id" defaultValue={t.home_location_id ?? ""} className="ta-input">
              <option value="">— none —</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name} · {l.city}, {l.state}</option>)}
            </select>
          </Field>
          <label className="e-mono" style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 10, color: "rgba(242,238,232,0.6)", letterSpacing: "0.2em" }}>
            <input type="checkbox" name="is_ai" defaultChecked={t.is_ai} /> AI AVATAR
          </label>
          <div><button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>SAVE →</button></div>
        </form>
      </Section>

      {/* Recent payouts */}
      <Section title={`RECENT PAYOUTS · ${(payouts ?? []).length}`}>
        {(payouts ?? []).length === 0 ? (
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 11, letterSpacing: "0.16em", marginTop: 8 }}>NO PAYOUTS YET.</div>
        ) : (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {((payouts ?? []) as Array<{ gross_cents: number; trainer_cents: number; platform_fee_cents: number; status: string; created_at: string }>).map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "rgba(10,14,20,0.4)", border: "1px solid rgba(143,184,214,0.15)" }}>
                <div className="e-mono" style={{ flex: 1, fontSize: 10, letterSpacing: "0.14em", color: "rgba(242,238,232,0.55)" }}>{new Date(p.created_at).toLocaleString()}</div>
                <div className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.65)" }}>${(p.gross_cents / 100).toFixed(2)} → ${(p.trainer_cents / 100).toFixed(2)}</div>
                <div className="e-mono" style={{ fontSize: 10, color: p.status === "sent" ? "var(--sky)" : "rgba(242,238,232,0.5)" }}>{p.status.toUpperCase()}</div>
              </div>
            ))}
          </div>
        )}
        <Link href="/admin/payouts" className="e-tag" style={{ marginTop: 10, display: "inline-block", padding: "8px 12px", borderRadius: 999, background: "transparent", border: "1px solid rgba(143,184,214,0.25)", color: "var(--bone)", textDecoration: "none" }}>VIEW ALL PAYOUTS →</Link>
      </Section>

      {/* Archive */}
      <Section title="DANGER">
        <form action={archiveTrainerAction} style={{ marginTop: 6 }}>
          <input type="hidden" name="trainer_id" value={t.id} />
          <button type="submit" className="e-tag" style={{ padding: "10px 16px", borderRadius: 999, background: "transparent", border: "1px solid rgba(232,181,168,0.5)", color: "var(--rose)", cursor: "pointer" }}>
            ARCHIVE COACH (unlinks auth + pauses payouts)
          </button>
        </form>
      </Section>

      <style>{`
        .ta-input { padding: 11px 13px; border-radius: 10px; background: rgba(10,14,20,0.4); border: 1px solid rgba(143,184,214,0.25); color: var(--bone); font-family: var(--font-body); font-size: 14px; width: 100%; }
        .ta-input:focus { outline: none; border-color: var(--sky); }
      `}</style>
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="e-mono" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9, color: "rgba(242,238,232,0.6)", letterSpacing: "0.2em" }}>{label}{children}</label>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 22, padding: 22, borderRadius: 16, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
      <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(242,238,232,0.6)" }}>{title}</div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 16, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
      <div className="e-mono" style={{ fontSize: 9, letterSpacing: "0.22em", color: "rgba(242,238,232,0.55)" }}>{label}</div>
      <div className="e-display" style={{ fontSize: 24, marginTop: 6 }}>{value}</div>
    </div>
  );
}
