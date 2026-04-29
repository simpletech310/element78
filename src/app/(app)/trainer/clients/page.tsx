import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { listTrainerClientsAggregate } from "@/lib/data/queries";

export default async function TrainerClientsPage() {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/clients");

  const clients = await listTrainerClientsAggregate(trainer.id);

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/trainer/dashboard" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>DASHBOARD</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>TRAINER · {trainer.name.toUpperCase()}</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92, marginTop: 8 }}>YOUR CLIENTS.</h1>
          <p style={{ marginTop: 14, fontSize: 13, color: "rgba(242,238,232,0.6)", lineHeight: 1.6 }}>
            Everyone you've trained — 1-on-1, in your programs, or in your classes. Click anyone to see their full picture.
          </p>
        </div>

        <div style={{ marginTop: 28 }}>
          {clients.length === 0 ? (
            <div style={{ padding: "18px 22px", borderRadius: 14, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>
              No clients yet. They'll show up here as soon as someone books, enrolls, or takes one of your classes.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {clients.map(c => (
                <Link
                  key={c.user_id}
                  href={`/trainer/clients/${c.user_id}`}
                  className="lift"
                  style={{
                    display: "flex", gap: 14, padding: 14, borderRadius: 14,
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
                      {c.oneOnOneCount > 0 ? `${c.oneOnOneCount} 1-ON-1` : ""}
                      {c.programCount > 0 ? `${c.oneOnOneCount > 0 ? " · " : ""}${c.programCount} PROGRAM${c.programCount > 1 ? "S" : ""}` : ""}
                      {c.classCount > 0 ? `${c.oneOnOneCount + c.programCount > 0 ? " · " : ""}${c.classCount} CLASS${c.classCount > 1 ? "ES" : ""}` : ""}
                    </div>
                  </div>
                  {c.lastInteractionAt && (
                    <div className="e-mono" style={{ color: "rgba(242,238,232,0.45)", fontSize: 10, letterSpacing: "0.16em" }}>
                      LAST · {new Date(c.lastInteractionAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase()}
                    </div>
                  )}
                  <Icon name="chevron" size={18} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
