import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { listProfilesByIds } from "@/lib/data/queries";
import { approveCoachApplicationAction, rejectCoachApplicationAction } from "@/lib/coach-application-actions";

export default async function AdminCoachApplicationsPage({ searchParams }: { searchParams: { approved?: string; rejected?: string; error?: string } }) {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/home?error=admin_only");

  const sb = createAdminClient();
  const { data } = await sb.from("coach_applications").select("*").order("created_at", { ascending: false }).limit(100);
  const apps = (data as Array<{ id: string; user_id: string; display_name: string; headline: string | null; bio: string | null; specialties: string[]; certifications: string | null; years_experience: number | null; sample_video_url: string | null; status: string; rejection_reason: string | null; created_at: string }>) ?? [];
  const profiles = await listProfilesByIds(apps.map(a => a.user_id));

  const flash = searchParams.approved ? "APPLICATION APPROVED · TRAINER ROW CREATED"
              : searchParams.rejected ? "APPLICATION REJECTED"
              : searchParams.error ? `ERROR: ${searchParams.error.replace(/_/g, " ").toUpperCase()}`
              : null;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/admin" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ADMIN</span>
        </Link>
        <h1 className="e-display" style={{ fontSize: "clamp(28px, 5vw, 40px)", lineHeight: 0.95, marginTop: 14 }}>COACH APPLICATIONS.</h1>

        {flash && (
          <div className="e-mono" style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: searchParams.error ? "rgba(232,181,168,0.12)" : "rgba(143,184,214,0.1)", border: `1px solid ${searchParams.error ? "var(--rose)" : "var(--sky)"}`, color: searchParams.error ? "var(--rose)" : "var(--sky)", fontSize: 11, letterSpacing: "0.16em" }}>
            ✓ {flash}
          </div>
        )}

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          {apps.length === 0 ? (
            <div style={{ padding: "16px 18px", borderRadius: 12, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>No applications yet.</div>
          ) : apps.map(a => {
            const p = profiles[a.user_id];
            const isPending = a.status === "pending";
            return (
              <div key={a.id} style={{ padding: 16, borderRadius: 14, background: "var(--haze)", border: `1px solid ${isPending ? "var(--sky)" : "rgba(143,184,214,0.18)"}`, opacity: isPending ? 1 : 0.7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>{a.status.toUpperCase()} · {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase()}</div>
                    <div style={{ marginTop: 6, fontFamily: "var(--font-display)", fontSize: 22 }}>{a.display_name.toUpperCase()}</div>
                    {p && <div className="e-mono" style={{ marginTop: 4, color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.16em" }}>EXISTING USER · {p.display_name ?? "—"}</div>}
                  </div>
                </div>

                {a.headline && <div style={{ marginTop: 10, fontSize: 14, color: "rgba(242,238,232,0.85)" }}>{a.headline}</div>}
                {a.bio && <p style={{ marginTop: 8, fontSize: 13, color: "rgba(242,238,232,0.7)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{a.bio}</p>}
                <div className="e-mono" style={{ marginTop: 10, fontSize: 10, color: "rgba(242,238,232,0.55)", letterSpacing: "0.14em", display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {a.specialties.length > 0 && <span>{a.specialties.join(" · ")}</span>}
                  {a.certifications && <span>CERT · {a.certifications}</span>}
                  {a.years_experience != null && <span>{a.years_experience} YR</span>}
                </div>
                {a.sample_video_url && (
                  <a href={a.sample_video_url} target="_blank" rel="noreferrer" className="e-mono" style={{ marginTop: 8, display: "inline-block", color: "var(--sky)", fontSize: 10, letterSpacing: "0.16em" }}>SAMPLE VIDEO →</a>
                )}
                {a.rejection_reason && (
                  <div className="e-mono" style={{ marginTop: 8, fontSize: 10, letterSpacing: "0.14em", color: "var(--rose)" }}>REJECTED: {a.rejection_reason}</div>
                )}

                {isPending && (
                  <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <form action={approveCoachApplicationAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="btn btn-sky" style={{ padding: "8px 14px", fontSize: 11 }}>APPROVE</button>
                    </form>
                    <form action={rejectCoachApplicationAction} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <input type="hidden" name="id" value={a.id} />
                      <input name="reason" placeholder="reason (optional)" className="ta-input" style={{ minWidth: 200 }} />
                      <button type="submit" className="btn" style={{ padding: "8px 14px", fontSize: 11, background: "transparent", color: "var(--rose)", border: "1px solid rgba(232,181,168,0.4)" }}>REJECT</button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .ta-input { padding: 8px 10px; border-radius: 8px; background: rgba(10,14,20,0.4); border: 1px solid rgba(143,184,214,0.25); color: var(--bone); font-family: var(--font-body); font-size: 12px; }
      `}</style>
    </div>
  );
}
