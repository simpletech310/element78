import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { CoachShell, CoachEmpty } from "@/components/site/CoachShell";
import { Time } from "@/components/site/Time";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { listTrainerClientsAggregate } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function CoachClientsPage() {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/clients");

  const clients = await listTrainerClientsAggregate(coach.id);

  return (
    <CoachShell coach={coach} pathname="/trainer/clients">
      <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92 }}>YOUR CLIENTS.</h1>
      <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.7)", lineHeight: 1.6, maxWidth: 640 }}>
        Everyone you've coached — 1-on-1, in your programs, or in your classes. Tap anyone to see their full picture and message them.
      </p>

      <div style={{ marginTop: 28 }}>
        {clients.length === 0 ? (
          <CoachEmpty body="No clients yet. They'll show up here as soon as someone books a 1-on-1, enrolls in a program, or takes one of your classes." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {clients.map(c => (
              <Link
                key={c.user_id}
                href={`/trainer/clients/${c.user_id}`}
                className="lift"
                style={{
                  display: "flex", gap: 14, padding: 16, borderRadius: 14,
                  background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
                  color: "var(--bone)", textDecoration: "none", alignItems: "center",
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(143,184,214,0.3)", flexShrink: 0 }}>
                  {c.profile.avatar_url ? (
                    <Photo src={c.profile.avatar_url} alt={c.profile.display_name ?? "Client"} style={{ width: "100%", height: "100%" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(242,238,232,0.45)" }}>
                      <Icon name="user" size={24} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{(c.profile.display_name ?? "Member").toUpperCase()}</div>
                  <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.18em", marginTop: 6 }}>
                    {[
                      c.oneOnOneCount > 0 && `${c.oneOnOneCount} 1-ON-1`,
                      c.programCount > 0 && `${c.programCount} PROGRAM${c.programCount > 1 ? "S" : ""}`,
                      c.classCount > 0 && `${c.classCount} CLASS${c.classCount > 1 ? "ES" : ""}`,
                    ].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {c.lastInteractionAt && (
                  <div className="e-mono" style={{ color: "rgba(242,238,232,0.45)", fontSize: 10, letterSpacing: "0.16em" }}>
                    LAST · <Time iso={c.lastInteractionAt} format="date" />
                  </div>
                )}
                <Icon name="chevron" size={18} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </CoachShell>
  );
}
