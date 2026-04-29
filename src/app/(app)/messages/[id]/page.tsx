import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listMessagesInThread, markThreadRead } from "@/lib/messaging";
import { listProfilesByIds } from "@/lib/data/queries";
import { sendMessageAction } from "@/lib/messaging-actions";
import type { Thread } from "@/lib/data/types";

export default async function ThreadPage({ params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) redirect(`/login?next=/messages/${params.id}`);

  const sb = createClient();
  const { data: threadRow } = await sb.from("threads").select("*").eq("id", params.id).maybeSingle();
  const thread = threadRow as Thread | null;
  if (!thread) notFound();
  if (thread.participant_a !== user.id && thread.participant_b !== user.id) {
    redirect("/messages?error=unauthorized");
  }

  await markThreadRead(thread.id, user.id);

  const otherId = thread.participant_a === user.id ? thread.participant_b : thread.participant_a;
  const [messages, profiles] = await Promise.all([
    listMessagesInThread(thread.id),
    listProfilesByIds([otherId, user.id]),
  ]);
  const other = profiles[otherId] ?? { display_name: "Member", avatar_url: null, handle: null };

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 22px 80px", display: "flex", flexDirection: "column", minHeight: "calc(100dvh - 60px)" }}>
        <Link href="/messages" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>INBOX</span>
        </Link>

        <header style={{ marginTop: 14, display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(143,184,214,0.3)", flexShrink: 0 }}>
            {other.avatar_url ? (
              <Photo src={other.avatar_url} alt={other.display_name ?? "Member"} style={{ width: "100%", height: "100%" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(242,238,232,0.45)" }}>
                <Icon name="user" size={24} />
              </div>
            )}
          </div>
          <div>
            <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.25em" }}>DIRECT MESSAGE</div>
            <h1 className="e-display" style={{ fontSize: "clamp(22px, 4vw, 32px)", lineHeight: 1, marginTop: 6 }}>
              {(other.display_name ?? "Member").toUpperCase()}
            </h1>
          </div>
        </header>

        <div style={{ marginTop: 20, flex: 1, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", paddingBottom: 12 }}>
          {messages.length === 0 ? (
            <div style={{ padding: "20px 0", color: "rgba(242,238,232,0.5)", fontSize: 13, textAlign: "center" }}>
              Say hi.
            </div>
          ) : messages.map(m => {
            const mine = m.sender_id === user.id;
            return (
              <div key={m.id} style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "78%",
                padding: "10px 14px",
                borderRadius: 14,
                background: mine ? "var(--sky)" : "var(--haze)",
                color: mine ? "var(--ink)" : "var(--bone)",
                border: mine ? "none" : "1px solid rgba(143,184,214,0.18)",
                fontSize: 14, lineHeight: 1.45,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {m.body}
                <div className="e-mono" style={{ marginTop: 6, fontSize: 9, letterSpacing: "0.14em", color: mine ? "rgba(10,14,20,0.6)" : "rgba(242,238,232,0.45)" }}>
                  {new Date(m.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
            );
          })}
        </div>

        <form action={sendMessageAction} style={{ marginTop: "auto", paddingTop: 12, display: "flex", gap: 8, position: "sticky", bottom: 0, background: "var(--ink)" }}>
          <input type="hidden" name="thread_id" value={thread.id} />
          <input
            name="body"
            required
            maxLength={8000}
            placeholder="Send a message…"
            autoComplete="off"
            style={{
              flex: 1, padding: "12px 14px", borderRadius: 999,
              background: "var(--haze)", border: "1px solid rgba(143,184,214,0.25)",
              color: "var(--bone)", fontFamily: "var(--font-body)", fontSize: 14,
            }}
          />
          <button type="submit" className="btn btn-sky" style={{ padding: "12px 20px" }}>SEND</button>
        </form>
      </div>
    </div>
  );
}
