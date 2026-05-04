import { redirect } from "next/navigation";
import { AdminShell } from "@/components/site/AdminShell";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { archiveProgramAction } from "@/lib/admin-actions";
import type { Program } from "@/lib/data/types";

export const dynamic = "force-dynamic";

type Row = Program & { author_trainer: { name: string; slug: string } | null };

export default async function AdminProgramsPage({ searchParams }: { searchParams: { archived?: string } }) {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/login?next=/admin/programs");
  const sb = createClient();
  const { data } = await sb
    .from("programs")
    .select("*, author_trainer:trainers!programs_author_trainer_id_fkey(name, slug)")
    .order("sort_order")
    .order("created_at", { ascending: false });
  const rows = (data as Row[]) ?? [];

  return (
    <AdminShell pathname="/admin/programs" title="PROGRAMS" subtitle={`${rows.length} TOTAL · ALL COACHES`}>
      {searchParams.archived && (
        <div className="e-mono" style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(143,184,214,0.12)", border: "1px solid rgba(143,184,214,0.4)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.16em" }}>
          PROGRAM ARCHIVED.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map(p => (
          <div key={p.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 16px", borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)", color: "var(--bone)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{p.name}</div>
              <div className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.55)", letterSpacing: "0.16em", marginTop: 4 }}>
                /{p.slug} · BY {p.author_trainer ? p.author_trainer.name.toUpperCase() : "—"} · {p.total_sessions} sessions
              </div>
            </div>
            <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: p.status === "published" ? "var(--sky)" : "rgba(242,238,232,0.5)" }}>
              {(p.status ?? "draft").toUpperCase()}
            </div>
            {p.status !== "archived" && (
              <form action={archiveProgramAction}>
                <input type="hidden" name="program_id" value={p.id} />
                <button type="submit" className="e-tag" style={{ padding: "6px 10px", borderRadius: 999, background: "transparent", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", cursor: "pointer", fontSize: 9 }}>ARCHIVE</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
