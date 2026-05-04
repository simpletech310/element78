import { redirect } from "next/navigation";
import { AdminShell } from "@/components/site/AdminShell";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createTrainerAction } from "@/lib/admin-actions";
import { listLocations } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function NewTrainerPage({ searchParams }: { searchParams: { error?: string } }) {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/login?next=/admin/trainers/new");
  const locations = await listLocations();

  return (
    <AdminShell pathname="/admin/trainers" title="NEW COACH" subtitle="ADD TO ROSTER">
      {searchParams.error && (
        <div className="e-mono" style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
          {searchParams.error}
        </div>
      )}
      <form action={createTrainerAction} style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 14, padding: 22, borderRadius: 16, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
        <Field label="NAME *"><input name="name" required className="ta-input" placeholder="KAI BROOKS" /></Field>
        <Field label="SLUG"><input name="slug" className="ta-input" placeholder="optional · auto from name" /></Field>
        <Field label="HEADLINE"><input name="headline" className="ta-input" placeholder="Reformer + mat Pilates. BASI-certified." /></Field>
        <Field label="BIO"><textarea name="bio" rows={3} className="ta-input" style={{ resize: "vertical" }} /></Field>
        <Field label="SPECIALTIES (comma-separated)"><input name="specialties" className="ta-input" placeholder="Reformer, Mobility, Strength" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="CERT"><input name="cert" className="ta-input" placeholder="BASI · NSCA-CPT" /></Field>
          <Field label="YEARS EXPERIENCE"><input type="number" name="years_experience" min={0} className="ta-input" /></Field>
        </div>
        <Field label="HOME LOCATION">
          <select name="home_location_id" className="ta-input">
            <option value="">— none —</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name} · {l.city}, {l.state}</option>)}
          </select>
        </Field>
        <Field label="LINK TO USER ID (optional · paste auth user uuid)">
          <input name="link_user_id" className="ta-input" placeholder="leave blank for unlinked / AI" />
        </Field>
        <Field label="PAYOUT SPLIT · BASIS POINTS (blank = global default)">
          <input name="payout_split_bps" type="number" min={0} max={10000} className="ta-input" placeholder="e.g. 1500 = 15% platform / 85% coach" />
        </Field>
        <label className="e-mono" style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 10, color: "rgba(242,238,232,0.6)", letterSpacing: "0.2em" }}>
          <input type="checkbox" name="is_ai" /> AI AVATAR (not a real human)
        </label>
        <div><button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>CREATE COACH →</button></div>
      </form>
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
