import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { TabBar } from "@/components/chrome/TabBar";
import { Icon } from "@/components/ui/Icon";
import { QrCard } from "@/components/site/QrCard";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkInAction } from "@/lib/gym-actions";
import { tierLabel, type MembershipTier } from "@/lib/membership";

export default async function CheckInPage({ searchParams }: { searchParams: { checkedIn?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/gym/checkin");

  const sb = createClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("display_name, membership_tier")
    .eq("id", user.id)
    .maybeSingle();

  const memberName = ((profile as { display_name?: string } | null)?.display_name
    ?? user.email?.split("@")[0]
    ?? "Member").toUpperCase();
  const memberId = "E78-" + user.id.replace(/-/g, "").slice(0, 6).toUpperCase();
  const tier = ((profile as { membership_tier?: string } | null)?.membership_tier ?? "basic") as MembershipTier;

  const { data: recent } = await sb
    .from("gym_check_ins")
    .select("checked_in_at, source")
    .eq("user_id", user.id)
    .order("checked_in_at", { ascending: false })
    .limit(8);
  const recentRows = (recent as Array<{ checked_in_at: string; source: string }>) ?? [];

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <Navbar authed={true} />
      <div className="app-scroll" style={{ paddingBottom: 100 }}>
        <div style={{ padding: "20px 22px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/gym" aria-label="Back" style={{ color: "var(--ink)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
            <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>GYM</span>
          </Link>
        </div>

        <section style={{ padding: "20px 22px 0" }}>
          <div className="e-mono" style={{ color: "var(--electric-deep)", letterSpacing: "0.2em" }}>FRONT · DESK</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 8vw, 52px)", lineHeight: 0.92, marginTop: 12 }}>CHECK IN.</h1>
        </section>

        {searchParams.checkedIn && (
          <section style={{ padding: "14px 22px 0" }}>
            <div className="e-mono" style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(46,127,176,0.1)", border: "1px solid var(--electric-deep)", color: "var(--electric-deep)", fontSize: 11, letterSpacing: "0.18em" }}>
              ✓ CHECKED IN — HAVE A GREAT WORKOUT.
            </div>
          </section>
        )}

        <section style={{ padding: "28px 22px 0" }}>
          <QrCard
            userId={user.id}
            memberName={memberName}
            memberId={memberId}
            tierLabel={tierLabel(tier)}
          />
          <p style={{ marginTop: 18, fontSize: 13, color: "rgba(10,14,20,0.6)", textAlign: "center", maxWidth: 360, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            Show this at the desk to check in. Or skip the line and tap the button below — staff will see it in the dashboard.
          </p>
        </section>

        <section style={{ padding: "24px 22px 0", display: "flex", justifyContent: "center" }}>
          <form action={checkInAction}>
            <button type="submit" className="btn btn-ink" style={{ padding: "14px 28px", fontSize: 12, letterSpacing: "0.2em" }}>
              I&apos;M HERE · MARK ME IN
            </button>
          </form>
        </section>

        {recentRows.length > 0 && (
          <section style={{ padding: "32px 22px 60px", maxWidth: 480, margin: "0 auto" }}>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.55)", letterSpacing: "0.2em", fontSize: 10 }}>RECENT VISITS</div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {recentRows.map((r, i) => {
                const dt = new Date(r.checked_in_at);
                const date = dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", weekday: "short" }).toUpperCase();
                const time = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)" }}>
                    <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.16em" }}>{date} · {time}</span>
                    <span className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", letterSpacing: "0.18em" }}>
                      {r.source.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
      <TabBar />
    </div>
  );
}
