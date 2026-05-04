import { redirect } from "next/navigation";
import { CoachShell } from "@/components/site/CoachShell";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { createChallengeAction } from "@/lib/coach-actions";

export const dynamic = "force-dynamic";

export default async function NewChallengePage({ searchParams }: { searchParams: { error?: string } }) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/challenges/new");

  const today = new Date();
  const inTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const localIso = (d: Date) => {
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60 * 1000).toISOString().slice(0, 16);
  };

  return (
    <CoachShell coach={coach} pathname="/trainer/challenges/new">
      <div style={{ maxWidth: 720 }}>
        <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>NEW CHALLENGE</div>
        <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 52px)", lineHeight: 0.92, marginTop: 8 }}>SET THE BAR.</h1>
        <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.65)", maxWidth: 560, lineHeight: 1.6 }}>
          A challenge is a list of things members tick off in a window of time. First to finish hits the leaderboard. Save creates a draft you can publish from the next screen.
        </p>

        {searchParams.error && (
          <div className="e-mono" style={{ marginTop: 18, padding: "12px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
            {searchParams.error}
          </div>
        )}

        <form action={createChallengeAction} encType="multipart/form-data" style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 14, padding: 22, borderRadius: 16, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
          <Field label="TITLE *">
            <input name="title" required placeholder="21 DAYS · IN MY ELEMENT" className="ta-input" />
          </Field>
          <Field label="SLUG">
            <input name="slug" placeholder="optional · auto-generated from title" className="ta-input" />
          </Field>
          <Field label="SUBTITLE">
            <input name="subtitle" placeholder="Daily mat + breath. No excuses." className="ta-input" />
          </Field>
          <Field label="DESCRIPTION">
            <textarea name="description" rows={3} placeholder="What's the vibe? What are they signing up for?" className="ta-input" style={{ resize: "vertical" }} />
          </Field>
          <Field label="HERO IMAGE · UPLOAD">
            <input type="file" name="hero_image_file" accept="image/*" className="ta-input" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="STARTS AT *">
              <input type="datetime-local" name="starts_at" required defaultValue={localIso(today)} className="ta-input" />
            </Field>
            <Field label="ENDS AT *">
              <input type="datetime-local" name="ends_at" required defaultValue={localIso(inTwoWeeks)} className="ta-input" />
            </Field>
          </div>
          <Field label="TASKS · ONE PER LINE *">
            <textarea
              name="tasks"
              rows={6}
              required
              placeholder={"Complete 3 Pilates classes\nRun 5 miles total\nHit a new lift PR"}
              className="ta-input"
              style={{ resize: "vertical", fontFamily: "var(--font-mono)", fontSize: 13 }}
            />
          </Field>

          <div style={{ marginTop: 6 }}>
            <button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>CREATE CHALLENGE →</button>
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
