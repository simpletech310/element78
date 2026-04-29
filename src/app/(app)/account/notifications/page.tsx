import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { saveNotificationPrefsAction } from "@/lib/account-security-actions";

const TOGGLES: Array<{ key: string; label: string; hint: string; defaultOn: boolean }> = [
  { key: "email_booking_confirmations", label: "BOOKING CONFIRMATIONS", hint: "When a class or 1-on-1 is confirmed.", defaultOn: true },
  { key: "email_class_reminders", label: "CLASS REMINDERS", hint: "Day-of and 1-hour-before reminders.", defaultOn: true },
  { key: "email_program_announcements", label: "PROGRAM ANNOUNCEMENTS", hint: "When your coach posts updates.", defaultOn: true },
  { key: "email_messages", label: "DIRECT MESSAGES", hint: "When a coach or client sends you a DM.", defaultOn: true },
  { key: "email_marketing", label: "PRODUCT NEWS", hint: "Occasional updates about new features.", defaultOn: false },
];

export default async function NotificationsPage({ searchParams }: { searchParams: { saved?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/notifications");

  const sb = createClient();
  const { data } = await sb.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle();
  const prefs = (data as Record<string, boolean | string> | null) ?? null;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/account" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ACCOUNT</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>SETTINGS</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 52px)", lineHeight: 0.92, marginTop: 8 }}>NOTIFICATIONS.</h1>
          <p style={{ marginTop: 12, fontSize: 13, color: "rgba(242,238,232,0.6)", lineHeight: 1.55 }}>
            Email-only for now; SMS and push come later.
          </p>
        </div>

        {searchParams.saved && (
          <div className="e-mono" style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
            ✓ PREFERENCES SAVED
          </div>
        )}

        <form action={saveNotificationPrefsAction} style={{ marginTop: 22, padding: 16, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)", display: "flex", flexDirection: "column", gap: 10 }}>
          {TOGGLES.map(t => {
            const on = prefs ? Boolean(prefs[t.key]) : t.defaultOn;
            return (
              <label key={t.key} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(143,184,214,0.08)" }}>
                <input type="checkbox" name={t.key} defaultChecked={on} style={{ marginTop: 4 }} />
                <div>
                  <div className="e-mono" style={{ fontSize: 11, letterSpacing: "0.18em" }}>{t.label}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "rgba(242,238,232,0.6)" }}>{t.hint}</div>
                </div>
              </label>
            );
          })}
          <button type="submit" className="btn btn-sky" style={{ alignSelf: "flex-start", marginTop: 10, padding: "10px 18px" }}>SAVE</button>
        </form>
      </div>
    </div>
  );
}
