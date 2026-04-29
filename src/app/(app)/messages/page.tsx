import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { getUser } from "@/lib/auth";
import { listThreadsForUser } from "@/lib/messaging";
import { listProfilesByIds } from "@/lib/data/queries";

export default async function MessagesInboxPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/messages");

  const rows = await listThreadsForUser(user.id);
  const otherIds = Array.from(new Set(rows.map(r => r.other_id)));
  const profiles = await listProfilesByIds(otherIds);

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/home" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>HOME</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>INBOX</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92, marginTop: 8 }}>MESSAGES.</h1>
        </div>

        {rows.length === 0 ? (
          <div style={{ marginTop: 28, padding: "18px 22px", borderRadius: 14, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>
            No conversations yet. Hit MESSAGE on any coach or client profile to start one.
          </div>
        ) : (
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map(({ thread, other_id, unread_count }) => {
              const profile = profiles[other_id] ?? { display_name: "Member", avatar_url: null, handle: null };
              return (
                <Link key={thread.id} href={`/messages/${thread.id}`} className="lift" style={{
                  display: "flex", gap: 14, padding: 14, borderRadius: 14,
                  background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
                  color: "var(--bone)", textDecoration: "none", alignItems: "center",
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(143,184,214,0.3)", flexShrink: 0 }}>
                    {profile.avatar_url ? (
                      <Photo src={profile.avatar_url} alt={profile.display_name ?? "Member"} style={{ width: "100%", height: "100%" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(242,238,232,0.45)" }}>
                        <Icon name="user" size={22} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>
                        {(profile.display_name ?? "Member").toUpperCase()}
                      </div>
                      {thread.last_message_at && (
                        <div className="e-mono" style={{ color: "rgba(242,238,232,0.45)", fontSize: 9, letterSpacing: "0.16em" }}>
                          {new Date(thread.last_message_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, color: unread_count > 0 ? "var(--bone)" : "rgba(242,238,232,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {thread.last_message_preview ?? "No messages yet."}
                    </div>
                  </div>
                  {unread_count > 0 && (
                    <div className="e-mono" style={{ minWidth: 22, height: 22, borderRadius: 999, background: "var(--sky)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, padding: "0 6px" }}>
                      {unread_count > 99 ? "99+" : unread_count}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
