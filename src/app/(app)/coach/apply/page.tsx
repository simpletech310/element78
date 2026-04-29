import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { submitCoachApplicationAction, withdrawCoachApplicationAction } from "@/lib/coach-application-actions";

export default async function CoachApplyPage({ searchParams }: { searchParams: { submitted?: string; error?: string; withdrawn?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/coach/apply");

  const sb = createClient();
  const { data } = await sb
    .from("coach_applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const latest = data as null | { id: string; status: string; rejection_reason: string | null; created_at: string; display_name: string };

  const flash = searchParams.submitted ? "APPLICATION SUBMITTED · WE'LL REVIEW WITHIN 48H"
              : searchParams.withdrawn ? "APPLICATION WITHDRAWN"
              : searchParams.error ? `ERROR: ${searchParams.error.replace(/_/g, " ").toUpperCase()}`
              : null;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/account" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ACCOUNT</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>BECOME A COACH</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92, marginTop: 8 }}>APPLY.</h1>
          <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.7)", lineHeight: 1.6 }}>
            We review every application. If approved, you'll get a coach profile, dashboard, and Stripe Connect onboarding — keep 80% of every booking.
          </p>
        </div>

        {flash && (
          <div className="e-mono" style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: searchParams.error ? "rgba(232,181,168,0.12)" : "rgba(143,184,214,0.1)", border: `1px solid ${searchParams.error ? "var(--rose)" : "var(--sky)"}`, color: searchParams.error ? "var(--rose)" : "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
            ✓ {flash}
          </div>
        )}

        {latest && latest.status === "pending" && (
          <div style={{ marginTop: 22, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid var(--sky)" }}>
            <div className="e-mono" style={{ color: "var(--sky)", fontSize: 11, letterSpacing: "0.2em" }}>PENDING REVIEW</div>
            <p style={{ marginTop: 10, fontSize: 14, color: "rgba(242,238,232,0.8)", lineHeight: 1.5 }}>
              Submitted {new Date(latest.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. We'll email when we've reviewed.
            </p>
            <form action={withdrawCoachApplicationAction} style={{ marginTop: 14 }}>
              <input type="hidden" name="id" value={latest.id} />
              <button type="submit" className="btn" style={{ padding: "8px 14px", fontSize: 11, background: "transparent", color: "rgba(242,238,232,0.7)", border: "1px solid rgba(143,184,214,0.25)" }}>WITHDRAW</button>
            </form>
          </div>
        )}

        {latest && latest.status === "approved" && (
          <div style={{ marginTop: 22, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid var(--sky)" }}>
            <div className="e-mono" style={{ color: "var(--sky)", fontSize: 11, letterSpacing: "0.2em" }}>✓ APPROVED</div>
            <p style={{ marginTop: 10, fontSize: 14, color: "rgba(242,238,232,0.85)", lineHeight: 1.5 }}>
              Welcome to Element 78. Head to your <Link href="/trainer/dashboard" className="e-mono" style={{ color: "var(--sky)" }}>COACH DASHBOARD →</Link> to set up Stripe payouts and post your first class.
            </p>
          </div>
        )}

        {latest && latest.status === "rejected" && (
          <div style={{ marginTop: 22, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid var(--rose)" }}>
            <div className="e-mono" style={{ color: "var(--rose)", fontSize: 11, letterSpacing: "0.2em" }}>NOT APPROVED</div>
            {latest.rejection_reason && (
              <p style={{ marginTop: 10, fontSize: 14, color: "rgba(242,238,232,0.8)", lineHeight: 1.5 }}>"{latest.rejection_reason}"</p>
            )}
            <p style={{ marginTop: 10, fontSize: 13, color: "rgba(242,238,232,0.6)", lineHeight: 1.5 }}>
              You can re-apply with updated info below.
            </p>
          </div>
        )}

        {(!latest || latest.status === "withdrawn" || latest.status === "rejected") && (
          <form action={submitCoachApplicationAction} style={{ marginTop: 22, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)", display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="DISPLAY NAME *">
              <input name="display_name" required maxLength={80} className="ta-input" />
            </Field>
            <Field label="HEADLINE">
              <input name="headline" maxLength={140} placeholder="e.g. 'Reformer + mat Pilates · BASI-certified'" className="ta-input" />
            </Field>
            <Field label="BIO">
              <textarea name="bio" rows={4} maxLength={2000} className="ta-input" style={{ resize: "vertical" }} />
            </Field>
            <Field label="SPECIALTIES · COMMA-SEPARATED">
              <input name="specialties" placeholder="Reformer, Mat Pilates, Mobility" className="ta-input" />
            </Field>
            <Field label="CERTIFICATIONS">
              <input name="certifications" placeholder="BASI · Polestar L2" className="ta-input" />
            </Field>
            <Field label="YEARS EXPERIENCE">
              <input name="years_experience" type="number" min={0} max={60} className="ta-input" />
            </Field>
            <Field label="SAMPLE TEACHING VIDEO · URL">
              <input name="sample_video_url" type="url" placeholder="https://…" className="ta-input" />
            </Field>
            <button type="submit" className="btn btn-sky" style={{ alignSelf: "flex-start", padding: "12px 22px" }}>SUBMIT APPLICATION</button>
          </form>
        )}
      </div>

      <style>{`
        .ta-input { padding: 10px 12px; border-radius: 8px; background: rgba(10,14,20,0.4); border: 1px solid rgba(143,184,214,0.25); color: var(--bone); font-family: var(--font-body); font-size: 13px; width: 100%; }
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
