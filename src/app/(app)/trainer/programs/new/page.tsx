import { redirect } from "next/navigation";
import { CoachShell } from "@/components/site/CoachShell";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { createProgramAction } from "@/lib/program-builder-actions";

export const dynamic = "force-dynamic";

export default async function NewProgramPage({ searchParams }: { searchParams: { error?: string } }) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/programs/new");

  return (
    <CoachShell coach={coach} pathname="/trainer/programs/new">
      <div style={{ maxWidth: 720 }}>
        <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>NEW PROGRAM</div>
        <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 52px)", lineHeight: 0.92, marginTop: 8 }}>BUILD IT.</h1>
        <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.65)", maxWidth: 560, lineHeight: 1.6 }}>
          Set the basics, then build the day-by-day on the next screen. You can add Studio routines, gym classes, and 1-on-1s to any day.
        </p>

        {searchParams.error && (
          <div className="e-mono" style={{ marginTop: 18, padding: "12px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
            {searchParams.error}
          </div>
        )}

        <form action={createProgramAction} encType="multipart/form-data" style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 14, padding: 22, borderRadius: 16, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
          <Field label="NAME *">
            <input name="name" required placeholder="WEIGHT LOSS · 8 WEEK" className="ta-input" />
          </Field>
          <Field label="SLUG">
            <input name="slug" placeholder="optional · auto-generated from name" className="ta-input" />
          </Field>
          <Field label="SUBTITLE">
            <input name="subtitle" placeholder="3 days/week · cardio + strength" className="ta-input" />
          </Field>
          <Field label="DESCRIPTION">
            <textarea name="description" rows={3} placeholder="What is this program about?" className="ta-input" style={{ resize: "vertical" }} />
          </Field>
          <Field label="HERO IMAGE · UPLOAD">
            <input type="file" name="hero_image_file" accept="image/*" className="ta-input" />
          </Field>
          <Field label="DURATION LABEL">
            <input name="duration_label" placeholder="8 WEEKS · 24 SESSIONS" className="ta-input" />
          </Field>
          <Field label="TOTAL SESSIONS *">
            <input name="total_sessions" type="number" min={1} max={365} defaultValue={24} required className="ta-input" />
          </Field>
          <Field label="INTENSITY">
            <select name="intensity" defaultValue="All levels" className="ta-input">
              <option>All levels</option>
              <option>Beginner</option>
              <option>Beginner → Intermediate</option>
              <option>Intermediate</option>
              <option>Intermediate → Advanced</option>
              <option>Advanced</option>
            </select>
          </Field>
          <Field label="KIND">
            <select name="kind" defaultValue="both" className="ta-input">
              <option value="in_app">In App</option>
              <option value="in_person">In Person</option>
              <option value="both">Both</option>
            </select>
          </Field>
          <Field label="SURFACES">
            <div style={{ display: "flex", gap: 14, paddingTop: 6 }}>
              <label className="e-mono" style={{ fontSize: 11, letterSpacing: "0.14em" }}>
                <input type="checkbox" name="surfaces" value="app" defaultChecked /> APP
              </label>
              <label className="e-mono" style={{ fontSize: 11, letterSpacing: "0.14em" }}>
                <input type="checkbox" name="surfaces" value="gym" /> GYM
              </label>
              <label className="e-mono" style={{ fontSize: 11, letterSpacing: "0.14em" }}>
                <input type="checkbox" name="surfaces" value="class" /> CLASS
              </label>
            </div>
          </Field>
          <Field label="PRICE · USD (0 = FREE)">
            <input name="price_dollars" type="number" min={0} step="0.01" defaultValue={0} className="ta-input" placeholder="0.00" />
          </Field>

          <div style={{ marginTop: 6 }}>
            <button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>CREATE PROGRAM →</button>
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
