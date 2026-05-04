import { redirect } from "next/navigation";
import { CoachShell } from "@/components/site/CoachShell";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { createEventAction } from "@/lib/coach-actions";
import { listLocations } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function NewEventPage({ searchParams }: { searchParams: { error?: string } }) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/events/new");
  const locations = await listLocations();
  const activeLocations = locations.filter(l => l.status === "active");
  // Default to coach's home location if it's active.
  const defaultLocation = activeLocations.find(l => l.id === coach.home_location_id) ?? activeLocations[0];

  const inOneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const localIso = (d: Date) => {
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60 * 1000).toISOString().slice(0, 16);
  };

  return (
    <CoachShell coach={coach} pathname="/trainer/events/new">
      <div style={{ maxWidth: 720 }}>
        <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>NEW EVENT</div>
        <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 52px)", lineHeight: 0.92, marginTop: 8 }}>BRING THEM TOGETHER.</h1>
        <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.65)", maxWidth: 560, lineHeight: 1.6 }}>
          Free events RSVP. Paid events checkout through Stripe and pay out 80/20 to your connected account. Save creates a draft you can publish from the next screen.
        </p>

        {searchParams.error && (
          <div className="e-mono" style={{ marginTop: 18, padding: "12px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
            {searchParams.error}
          </div>
        )}

        <form action={createEventAction} encType="multipart/form-data" style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 14, padding: 22, borderRadius: 16, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
          <Field label="TITLE *">
            <input name="title" required placeholder="SUNRISE RUN + COFFEE MEET" className="ta-input" />
          </Field>
          <Field label="SLUG">
            <input name="slug" placeholder="optional · auto-generated from title" className="ta-input" />
          </Field>
          <Field label="SUBTITLE">
            <input name="subtitle" placeholder="3 miles + recovery smoothies" className="ta-input" />
          </Field>
          <Field label="DESCRIPTION">
            <textarea name="description" rows={3} placeholder="What's the vibe?" className="ta-input" style={{ resize: "vertical" }} />
          </Field>
          <Field label="HERO IMAGE · UPLOAD">
            <input type="file" name="hero_image_file" accept="image/*" className="ta-input" />
          </Field>
          <Field label="LOCATION *">
            <select name="location_id" required defaultValue={defaultLocation?.id ?? ""} className="ta-input">
              {activeLocations.map(l => (
                <option key={l.id} value={l.id}>{l.name} · {l.city}, {l.state}</option>
              ))}
            </select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="STARTS AT *">
              <input type="datetime-local" name="starts_at" required defaultValue={localIso(inOneWeek)} className="ta-input" />
            </Field>
            <Field label="ENDS AT">
              <input type="datetime-local" name="ends_at" className="ta-input" />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="CAPACITY (BLANK = UNLIMITED)">
              <input type="number" name="capacity" min={1} placeholder="20" className="ta-input" />
            </Field>
            <Field label="PRICE · USD (0 = FREE RSVP)">
              <input type="number" name="price_dollars" min={0} step="0.01" defaultValue={0} className="ta-input" placeholder="0.00" />
            </Field>
          </div>

          <div style={{ marginTop: 6 }}>
            <button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>CREATE EVENT →</button>
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
