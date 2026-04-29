import { redirect } from "next/navigation";
import { CoachShell } from "@/components/site/CoachShell";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { createGroupSessionAction } from "@/lib/trainer-session-actions";
import { routines } from "@/lib/data/routines";

export const dynamic = "force-dynamic";

export default async function NewGroupSessionPage({ searchParams }: { searchParams: { error?: string } }) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/sessions/new");

  return (
    <CoachShell coach={coach} pathname="/trainer/sessions/new">
      <div style={{ maxWidth: 720 }}>
        <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>NEW GROUP SESSION</div>
        <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 52px)", lineHeight: 0.92, marginTop: 8 }}>RUN A GROUP.</h1>
        <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.65)", maxWidth: 560, lineHeight: 1.6 }}>
          Multiple attendees share one Daily room. Per-person pricing — each member checks out separately. Auto-confirm: no per-attendee accept loop.
        </p>

        {searchParams.error && (
          <div className="e-mono" style={{ marginTop: 18, padding: "12px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
            {searchParams.error}
          </div>
        )}

        <form action={createGroupSessionAction} style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 14, padding: 22, borderRadius: 16, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
          <Field label="TITLE">
            <input name="title" placeholder="MORNING POWER · GROUP" className="ta-input" />
          </Field>
          <Field label="DESCRIPTION">
            <textarea name="description" rows={3} placeholder="What this group session covers" className="ta-input" style={{ resize: "vertical" }} />
          </Field>
          <Field label="STARTS AT *">
            <input name="starts_at" type="datetime-local" required className="ta-input" />
          </Field>
          <Field label="ENDS AT *">
            <input name="ends_at" type="datetime-local" required className="ta-input" />
          </Field>
          <Field label="MODE">
            <select name="mode" defaultValue="video" className="ta-input">
              <option value="video">Video</option>
              <option value="in_person">In Person</option>
            </select>
          </Field>
          <Field label="CAPACITY · MIN 2 *">
            <input name="capacity" type="number" min={2} max={50} defaultValue={6} required className="ta-input" />
          </Field>
          <Field label="PRICE PER PERSON · USD (0 = FREE) *">
            <input name="price_dollars" type="number" min={0} step="0.01" defaultValue={25} required className="ta-input" placeholder="25.00" />
          </Field>
          <Field label="ROUTINE (OPTIONAL)">
            <select name="routine_slug" defaultValue="" className="ta-input">
              <option value="">— LET TRAINER CHOOSE —</option>
              {routines.map(r => (
                <option key={r.slug} value={r.slug}>
                  {r.name} · {r.duration_min}M · {r.intensity}
                </option>
              ))}
            </select>
          </Field>

          <div style={{ marginTop: 6 }}>
            <button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>CREATE GROUP SESSION →</button>
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
