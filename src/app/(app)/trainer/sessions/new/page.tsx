import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { createGroupSessionAction } from "@/lib/trainer-session-actions";
import { routines } from "@/lib/data/routines";

export default async function NewGroupSessionPage({ searchParams }: { searchParams: { error?: string } }) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/sessions/new");

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/trainer/dashboard" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>DASHBOARD</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>NEW GROUP SESSION</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 52px)", lineHeight: 0.92, marginTop: 8 }}>RUN A GROUP.</h1>
          <p style={{ marginTop: 14, fontSize: 13, color: "rgba(242,238,232,0.6)", maxWidth: 480, lineHeight: 1.6 }}>
            Multiple attendees share one Daily room. Per-person pricing — each member checks out separately. Auto-confirm: no per-attendee accept loop.
          </p>
        </div>

        {searchParams.error && (
          <div className="e-mono" style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
            {searchParams.error}
          </div>
        )}

        <form action={createGroupSessionAction} style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
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
          <Field label="PRICE PER PERSON (CENTS · 0 = FREE) *">
            <input name="price_cents" type="number" min={0} defaultValue={2500} required className="ta-input" />
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
        .ta-input {
          padding: 10px 12px;
          border-radius: 8px;
          background: rgba(10,14,20,0.4);
          border: 1px solid rgba(143,184,214,0.25);
          color: var(--bone);
          font-family: var(--font-body);
          font-size: 13px;
          width: 100%;
        }
      `}</style>
    </div>
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
