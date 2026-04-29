import { redirect } from "next/navigation";
import { CoachShell } from "@/components/site/CoachShell";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { createClassAction } from "@/lib/class-create-actions";

export const dynamic = "force-dynamic";

const ERR_MESSAGES: Record<string, string> = {
  name_required: "Class name is required.",
  starts_at_required: "Pick a start date and time.",
  invalid_starts_at: "Invalid start date.",
  capacity_exceeded_10: "Equipment classes max out at 10 reformers (5 per side, mirrored).",
  capacity_exceeded_30: "Capacity is capped at 30.",
};

export default async function NewClassPage({ searchParams }: { searchParams: { error?: string } }) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/classes/new");

  const errMsg = searchParams.error
    ? ERR_MESSAGES[searchParams.error] ?? decodeURIComponent(searchParams.error)
    : null;

  return (
    <CoachShell coach={coach} pathname="/trainer/classes/new">
      <div style={{ maxWidth: 720 }}>
        <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>NEW CLASS</div>
        <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 52px)", lineHeight: 0.92, marginTop: 8 }}>PUT IT ON THE SCHEDULE.</h1>
        <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.65)", maxWidth: 560, lineHeight: 1.6 }}>
          Equipment classes (reformers) get a mirrored studio map — 5 spots per side facing the mirror, max 10. Open-floor classes (HIIT, mobility, etc.) are first-come capacity-only.
        </p>

        {errMsg && (
          <div className="e-mono" style={{ marginTop: 18, padding: "12px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
            {errMsg}
          </div>
        )}

        <form action={createClassAction} encType="multipart/form-data" style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 14, padding: 22, borderRadius: 16, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
          <Field label="CLASS NAME *">
            <input name="name" required placeholder="POWER PILATES" className="ta-input" />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <Field label="KIND *">
              <select name="kind" defaultValue="pilates" className="ta-input">
                <option value="pilates">Pilates</option>
                <option value="reformer">Reformer</option>
                <option value="hiit">HIIT</option>
                <option value="strength">Strength</option>
                <option value="yoga">Yoga</option>
                <option value="mobility">Mobility</option>
                <option value="conditioning">Conditioning</option>
              </select>
            </Field>
            <Field label="INTENSITY">
              <select name="intensity" defaultValue="MD" className="ta-input">
                <option value="LO">LO</option>
                <option value="MD">MD</option>
                <option value="HI">HI</option>
              </select>
            </Field>
            <Field label="DURATION (MIN) *">
              <input name="duration_min" type="number" min={5} max={180} defaultValue={45} required className="ta-input" />
            </Field>
            <Field label="STARTS AT *">
              <input name="starts_at" type="datetime-local" required className="ta-input" />
            </Field>
          </div>

          {/* Equipment toggle controls how the rest of the form behaves. We
              don't gate the UI dynamically here (server component) — the
              user just toggles and the action validates the bounds. */}
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(143,184,214,0.08)", border: "1px solid rgba(143,184,214,0.3)", display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="e-mono" style={{ fontSize: 11, letterSpacing: "0.18em", color: "var(--sky)", display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" name="has_equipment" defaultChecked={false} /> EQUIPMENT CLASS · STUDIO MAP
            </label>
            <p style={{ fontSize: 12, color: "rgba(242,238,232,0.65)", lineHeight: 1.5 }}>
              Turn this on for reformer or apparatus classes. Members will see a mirrored studio map and pick a station. Capacity capped at 10 (5 per side).
            </p>
            <label className="e-mono" style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(242,238,232,0.7)", display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" name="mirrored_layout" defaultChecked={true} /> MIRRORED LAYOUT (5 + MIRROR + 5)
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <Field label="CAPACITY (1–10 IF EQUIPMENT, 1–30 OTHERWISE) *">
              <input name="capacity" type="number" min={1} max={30} defaultValue={10} required className="ta-input" />
            </Field>
            <Field label="ROOM">
              <input name="room" placeholder="STUDIO B" className="ta-input" />
            </Field>
            <Field label="PRICE PER PERSON · USD (0 = FREE)">
              <input name="price_dollars" type="number" min={0} step="0.01" defaultValue={0} className="ta-input" placeholder="0.00" />
            </Field>
            <Field label="HERO IMAGE · UPLOAD (OPTIONAL)">
              <input type="file" name="hero_image_file" accept="image/*" className="ta-input" />
            </Field>
          </div>

          <Field label="SUMMARY">
            <textarea name="summary" rows={2} placeholder="One-liner for the catalog card." className="ta-input" style={{ resize: "vertical" }} />
          </Field>
          <Field label="WHAT TO BRING">
            <textarea name="what_to_bring" rows={2} placeholder="Grip socks · water" className="ta-input" style={{ resize: "vertical" }} />
          </Field>

          <div style={{ marginTop: 6 }}>
            <button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>PUBLISH CLASS →</button>
          </div>
        </form>
      </div>

      <style>{`
        .ta-input { padding: 11px 13px; border-radius: 10px; background: rgba(10,14,20,0.4); border: 1px solid rgba(143,184,214,0.25); color: var(--bone); font-family: var(--font-body); font-size: 14px; width: 100%; }
        .ta-input:focus { outline: none; border-color: var(--sky); }
      `}</style>
    </CoachShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="e-mono" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9, color: "rgba(242,238,232,0.6)", letterSpacing: "0.2em" }}>
      {label}
      {children}
    </label>
  );
}
