import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";
import { getActiveWaiver } from "@/lib/waivers";
import { signWaiversAction } from "@/lib/waiver-actions";

const PARQ_QUESTIONS: Array<{ key: string; q: string }> = [
  { key: "heart_condition", q: "Has your doctor ever said you have a heart condition?" },
  { key: "chest_pain", q: "Do you feel pain in your chest when you do physical activity?" },
  { key: "dizziness", q: "Have you lost balance because of dizziness in the past month?" },
  { key: "joint_problem", q: "Do you have a bone or joint problem that could be made worse by activity?" },
  { key: "blood_pressure_meds", q: "Is your doctor currently prescribing drugs for blood pressure or heart?" },
  { key: "doctor_says_no", q: "Do you know any reason you should not do physical activity?" },
  { key: "pregnant_postpartum", q: "Are you pregnant or postpartum (within 6 months)?" },
];

export default async function WaiverPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  const user = await getUser();
  if (!user) redirect(`/login?next=/account/waiver`);

  const [parq, liability] = await Promise.all([
    getActiveWaiver(user.id, "parq"),
    getActiveWaiver(user.id, "liability"),
  ]);
  const allSigned = Boolean(parq && liability);
  const next = searchParams.next ?? "/account";

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/account" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ACCOUNT</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>WAIVER · WELLNESS</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 48px)", lineHeight: 0.92, marginTop: 8 }}>
            {allSigned ? "ALL CLEAR." : "QUICK PAR-Q."}
          </h1>
        </div>

        {searchParams.error && (
          <div className="e-mono" style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid var(--rose)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
            {searchParams.error.replace(/_/g, " ").toUpperCase()}
          </div>
        )}

        {allSigned ? (
          <div style={{ marginTop: 22, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid var(--sky)" }}>
            <div className="e-mono" style={{ color: "var(--sky)", fontSize: 11, letterSpacing: "0.2em" }}>✓ SIGNED</div>
            <p style={{ marginTop: 10, fontSize: 14, color: "rgba(242,238,232,0.75)", lineHeight: 1.5 }}>
              PAR-Q signed {parq ? new Date(parq.signed_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : ""}.
              Liability signed {liability ? new Date(liability.signed_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : ""}.
            </p>
            <Link href={next} className="btn btn-sky" style={{ marginTop: 14, display: "inline-block", padding: "10px 18px" }}>
              CONTINUE →
            </Link>
          </div>
        ) : (
          <form action={signWaiversAction} style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 18 }}>
            <input type="hidden" name="next" value={next} />

            <section style={{ padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
              <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.25em" }}>01 / PHYSICAL ACTIVITY READINESS</div>
              <p style={{ marginTop: 10, fontSize: 13, color: "rgba(242,238,232,0.65)", lineHeight: 1.6 }}>
                Answer truthfully. Yes answers are kept private with your coach.
              </p>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {PARQ_QUESTIONS.map(q => (
                  <div key={q.key} style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 220, fontSize: 13, color: "rgba(242,238,232,0.8)" }}>{q.q}</div>
                    <div style={{ display: "flex", gap: 14, fontSize: 11 }} className="e-mono">
                      <label><input type="radio" name={`parq_${q.key}`} value="no" defaultChecked /> NO</label>
                      <label><input type="radio" name={`parq_${q.key}`} value="yes" /> YES</label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
              <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.25em" }}>02 / LIABILITY</div>
              <p style={{ marginTop: 10, fontSize: 13, color: "rgba(242,238,232,0.75)", lineHeight: 1.6 }}>
                I acknowledge that physical activity carries inherent risk. I voluntarily participate in Element 78 programs and release Element 78, its coaches, and affiliates from liability for injury, except where caused by gross negligence.
              </p>
              <label style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", fontSize: 12, color: "rgba(242,238,232,0.75)" }}>
                <input type="checkbox" name="consent" required /> I have read and agree.
              </label>
              <label className="e-mono" style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6, fontSize: 9, color: "rgba(242,238,232,0.6)", letterSpacing: "0.2em" }}>
                TYPE YOUR FULL NAME AS SIGNATURE *
                <input name="signature_text" required minLength={2} style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(10,14,20,0.4)", border: "1px solid rgba(143,184,214,0.25)", color: "var(--bone)", fontFamily: "var(--font-body)", fontSize: 14 }} />
              </label>
            </section>

            <button type="submit" className="btn btn-sky" style={{ alignSelf: "flex-start", padding: "12px 22px" }}>
              SIGN & CONTINUE
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
