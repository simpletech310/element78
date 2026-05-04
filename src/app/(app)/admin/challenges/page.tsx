import { redirect } from "next/navigation";
import { AdminShell } from "@/components/site/AdminShell";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { archiveChallengeAction } from "@/lib/admin-actions";
import type { Challenge } from "@/lib/data/types";

export const dynamic = "force-dynamic";

type Row = Challenge & { author: { name: string; slug: string } | null };

export default async function AdminChallengesPage({ searchParams }: { searchParams: { archived?: string } }) {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/login?next=/admin/challenges");
  const sb = createClient();
  const { data } = await sb
    .from("challenges")
    .select("*, author:trainers!challenges_author_trainer_id_fkey(name, slug)")
    .order("created_at", { ascending: false });
  const rows = (data as Row[]) ?? [];

  return (
    <AdminShell pathname="/admin/challenges" title="CHALLENGES" subtitle={`${rows.length} TOTAL · ALL COACHES`}>
      {searchParams.archived && (
        <div className="e-mono" style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(143,184,214,0.12)", border: "1px solid rgba(143,184,214,0.4)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.16em" }}>
          CHALLENGE ARCHIVED.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map(c => (
          <div key={c.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 16px", borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)", color: "var(--bone)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{c.title}</div>
              <div className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.55)", letterSpacing: "0.16em", marginTop: 4 }}>
                {new Date(c.starts_at).toLocaleDateString()} → {new Date(c.ends_at).toLocaleDateString()} · BY {c.author?.name ? c.author.name.toUpperCase() : "—"}
              </div>
            </div>
            <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(242,238,232,0.7)" }}>
              {c.enrollment_count} JOINED · {c.completion_count} DONE
            </div>
            <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: c.status === "published" ? "var(--sky)" : "rgba(242,238,232,0.5)" }}>
              {c.status.toUpperCase()}
            </div>
            {c.status !== "archived" && (
              <form action={archiveChallengeAction}>
                <input type="hidden" name="challenge_id" value={c.id} />
                <button type="submit" className="e-tag" style={{ padding: "6px 10px", borderRadius: 999, background: "transparent", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", cursor: "pointer", fontSize: 9 }}>ARCHIVE</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
