import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requestDeletionAction, cancelDeletionAction } from "@/lib/account-actions";

export default async function AccountDeletePage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/delete");

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("account_deletions")
    .select("*")
    .eq("user_id", user.id)
    .is("completed_at", null)
    .is("cancelled_at", null)
    .maybeSingle();
  const pending = row as { scheduled_for: string; reason: string | null } | null;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/account" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ACCOUNT</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--rose)", letterSpacing: "0.25em", fontSize: 10 }}>DANGER · ACCOUNT DELETION</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 48px)", lineHeight: 0.92, marginTop: 8 }}>
            {pending ? "DELETION PENDING." : "DELETE YOUR ACCOUNT."}
          </h1>
        </div>

        {searchParams.error && (
          <div className="e-mono" style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid var(--rose)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
            {searchParams.error.replace(/_/g, " ").toUpperCase()}
          </div>
        )}

        {pending ? (
          <div style={{ marginTop: 22, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid var(--rose)" }}>
            <div className="e-mono" style={{ color: "var(--rose)", fontSize: 11, letterSpacing: "0.2em" }}>SCHEDULED</div>
            <p style={{ marginTop: 10, fontSize: 14, color: "rgba(242,238,232,0.8)", lineHeight: 1.6 }}>
              Your account is scheduled for permanent deletion on <strong>{new Date(pending.scheduled_for).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>. You can cancel anytime before then.
            </p>
            <form action={cancelDeletionAction} style={{ marginTop: 14 }}>
              <button type="submit" className="btn btn-sky" style={{ padding: "10px 18px" }}>CANCEL DELETION</button>
            </form>
          </div>
        ) : (
          <form action={requestDeletionAction} style={{ marginTop: 22, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(232,181,168,0.4)", display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 14, color: "rgba(242,238,232,0.8)", lineHeight: 1.6 }}>
              We'll keep your account in a soft-deleted state for 30 days, then permanently erase your data — bookings, programs, history, profile. You can sign back in within 30 days to cancel. After that, it's irreversible.
            </p>
            <p style={{ fontSize: 13, color: "rgba(242,238,232,0.6)" }}>
              Want a copy of your data before going? <Link href="/api/account/export" className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.16em" }}>EXPORT MY DATA →</Link>
            </p>
            <label className="e-mono" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9, color: "rgba(242,238,232,0.6)", letterSpacing: "0.2em" }}>
              REASON (OPTIONAL)
              <textarea name="reason" rows={3} className="ta-input" />
            </label>
            <label className="e-mono" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9, color: "rgba(242,238,232,0.6)", letterSpacing: "0.2em" }}>
              TYPE "DELETE" TO CONFIRM *
              <input name="confirm" required className="ta-input" />
            </label>
            <button type="submit" className="btn" style={{ padding: "12px 20px", background: "var(--rose)", color: "var(--ink)", border: "1px solid var(--rose)", fontWeight: 600, alignSelf: "flex-start" }}>
              DELETE MY ACCOUNT
            </button>
          </form>
        )}
      </div>

      <style>{`
        .ta-input {
          padding: 10px 12px; border-radius: 8px;
          background: rgba(10,14,20,0.4);
          border: 1px solid rgba(232,181,168,0.3);
          color: var(--bone); font-family: var(--font-body); font-size: 14px;
        }
      `}</style>
    </div>
  );
}
