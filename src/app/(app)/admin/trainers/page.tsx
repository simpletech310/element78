import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/site/AdminShell";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { PLATFORM_FEE_BPS } from "@/lib/connect";
import type { Trainer } from "@/lib/data/types";

export const dynamic = "force-dynamic";

type TrainerRow = Trainer & { payout_split_bps: number | null };

export default async function AdminTrainersPage({ searchParams }: { searchParams: { archived?: string } }) {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/login?next=/admin/trainers");
  const sb = createClient();
  const { data } = await sb.from("trainers").select("*").order("name");
  const trainers = (data as TrainerRow[]) ?? [];

  return (
    <AdminShell
      pathname="/admin/trainers"
      title="COACHES"
      subtitle={`${trainers.length} TRAINERS · GLOBAL SPLIT ${(PLATFORM_FEE_BPS / 100).toFixed(0)}%`}
      actions={<Link href="/admin/trainers/new" className="btn btn-sky" style={{ padding: "10px 16px" }}>+ NEW COACH</Link>}
    >
      {searchParams.archived && (
        <div className="e-mono" style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(143,184,214,0.12)", border: "1px solid rgba(143,184,214,0.4)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.16em" }}>
          COACH ARCHIVED.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {trainers.map(t => {
          const splitBps = t.payout_split_bps;
          const splitLabel = splitBps == null
            ? `${(PLATFORM_FEE_BPS / 100).toFixed(0)}% (default)`
            : `${(splitBps / 100).toFixed(1)}% override`;
          return (
            <Link key={t.id} href={`/admin/trainers/${t.id}`} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 16px", borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)", textDecoration: "none", color: "var(--bone)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{t.name}{t.is_ai ? " · AI" : ""}</div>
                <div className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.55)", letterSpacing: "0.16em", marginTop: 4 }}>
                  /{t.slug} · {t.specialties.slice(0, 3).join(", ") || "—"}
                </div>
              </div>
              <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: splitBps == null ? "rgba(242,238,232,0.5)" : "var(--sky)" }}>
                FEE · {splitLabel}
              </div>
              <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: t.payout_status === "active" ? "var(--sky)" : "rgba(242,238,232,0.5)" }}>
                {(t.payout_status ?? "unverified").toUpperCase()}
              </div>
            </Link>
          );
        })}
      </div>
    </AdminShell>
  );
}
