import { redirect } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { CoachShell } from "@/components/site/CoachShell";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { updateCoachProfileAction } from "@/lib/coach-profile-actions";

export const dynamic = "force-dynamic";

export default async function CoachProfileEditPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/profile");

  const flash = searchParams.saved ? "PROFILE SAVED · LIVE ON YOUR PUBLIC PAGE"
              : searchParams.error ? `ERROR: ${searchParams.error.replace(/_/g, " ").toUpperCase()}`
              : null;

  return (
    <CoachShell coach={coach} pathname="/trainer/profile">
      <div style={{ maxWidth: 720 }}>
        <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92 }}>YOUR PROFILE.</h1>
        <p style={{ marginTop: 12, fontSize: 14, color: "rgba(242,238,232,0.65)", lineHeight: 1.6 }}>
          What members see when they land on your public coach page.
        </p>

        {flash && (
          <div className="e-mono" style={{ marginTop: 18, padding: "12px 14px", borderRadius: 12, background: searchParams.error ? "rgba(232,181,168,0.12)" : "rgba(143,184,214,0.1)", border: `1px solid ${searchParams.error ? "var(--rose)" : "var(--sky)"}`, color: searchParams.error ? "var(--rose)" : "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
            ✓ {flash}
          </div>
        )}

        <form action={updateCoachProfileAction} encType="multipart/form-data" style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 16, padding: 22, borderRadius: 16, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--sky)", flexShrink: 0, background: "var(--ink)" }}>
              {coach.avatar_url ? (
                <Photo src={coach.avatar_url} alt={coach.name} style={{ width: "100%", height: "100%" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(242,238,232,0.45)" }}>
                  <Icon name="user" size={32} />
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.2em" }}>CURRENT</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 6 }}>{coach.name.toUpperCase()}</div>
              <div className="e-mono" style={{ marginTop: 4, fontSize: 10, color: "rgba(242,238,232,0.5)", letterSpacing: "0.16em" }}>@{coach.slug}</div>
            </div>
          </div>

          <Field label="DISPLAY NAME *">
            <input name="name" required defaultValue={coach.name} maxLength={80} className="ta-input" />
          </Field>
          <Field label="HEADLINE">
            <input name="headline" defaultValue={coach.headline ?? ""} maxLength={140} placeholder="One line tag for the public profile" className="ta-input" />
          </Field>
          <Field label="BIO">
            <textarea name="bio" rows={5} defaultValue={coach.bio ?? ""} maxLength={2000} className="ta-input" style={{ resize: "vertical" }} />
          </Field>
          <Field label="SPECIALTIES · COMMA-SEPARATED">
            <input name="specialties" defaultValue={(coach.specialties ?? []).join(", ")} placeholder="Reformer, Mat Pilates, Mobility" className="ta-input" />
          </Field>
          <Field label="CERTIFICATIONS">
            <input name="cert" defaultValue={coach.cert ?? ""} placeholder="BASI · Polestar L2" className="ta-input" />
          </Field>
          <Field label="YEARS EXPERIENCE">
            <input name="years_experience" type="number" min={0} max={60} defaultValue={coach.years_experience ?? undefined} className="ta-input" />
          </Field>
          <Field label="NEW AVATAR · UPLOAD (LEAVE BLANK TO KEEP CURRENT)">
            <input type="file" name="avatar_file" accept="image/*" className="ta-input" />
          </Field>
          <Field label="NEW HERO IMAGE · UPLOAD (LEAVE BLANK TO KEEP CURRENT)">
            <input type="file" name="hero_file" accept="image/*" className="ta-input" />
          </Field>

          <button type="submit" className="btn btn-sky" style={{ alignSelf: "flex-start", padding: "12px 22px" }}>SAVE</button>
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
