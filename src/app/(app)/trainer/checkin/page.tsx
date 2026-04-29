import Link from "next/link";
import { redirect } from "next/navigation";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { CoachShell, CoachSection, CoachEmpty } from "@/components/site/CoachShell";
import { Time } from "@/components/site/Time";
import { AutoRefresh } from "@/components/site/AutoRefresh";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { coachCheckInAction } from "@/lib/coach-checkin-actions";

export const dynamic = "force-dynamic";

type SearchParams = {
  qr?: string;
  q?: string;
  user?: string;
  checked_in?: string;
  class?: string;
  error?: string;
};

export default async function CoachCheckInPage({ searchParams }: { searchParams: SearchParams }) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/checkin");

  // Parse a member out of either a QR payload or a manual lookup.
  let resolvedUserId: string | null = searchParams.user ?? null;
  if (!resolvedUserId && searchParams.qr) {
    const m = searchParams.qr.match(/e78:\/\/checkin\/([0-9a-f-]{36})/i);
    if (m) resolvedUserId = m[1];
  }

  const admin = createAdminClient();

  // Manual search by handle/display_name.
  let searchResults: Array<{ id: string; display_name: string | null; handle: string | null; avatar_url: string | null; membership_tier: string | null }> = [];
  if (!resolvedUserId && searchParams.q && searchParams.q.length >= 2) {
    const q = searchParams.q.trim();
    const { data } = await admin
      .from("profiles")
      .select("id, display_name, handle, avatar_url, membership_tier")
      .or(`display_name.ilike.%${q}%,handle.ilike.%${q}%`)
      .limit(8);
    searchResults = (data as typeof searchResults) ?? [];
  }

  // If we know the member, load their context (profile + upcoming bookings).
  type MemberRow = { id: string; display_name: string | null; handle: string | null; avatar_url: string | null; membership_tier: string | null };
  let member: MemberRow | null = null;
  let upcomingClasses: Array<{ booking_id: string; class_id: string; class_name: string; starts_at: string; checked_in_at: string | null }> = [];
  if (resolvedUserId) {
    const { data: p } = await admin.from("profiles").select("id, display_name, handle, avatar_url, membership_tier").eq("id", resolvedUserId).maybeSingle();
    member = (p as MemberRow | null) ?? null;

    // Member's class bookings happening within ±3 hours.
    const now = Date.now();
    const windowStart = new Date(now - 3 * 60 * 60_000).toISOString();
    const windowEnd = new Date(now + 3 * 60 * 60_000).toISOString();
    const { data: bs } = await admin
      .from("bookings")
      .select("id, class_id, checked_in_at, classes:class_id(id, name, starts_at)")
      .eq("user_id", resolvedUserId)
      .in("status", ["reserved", "confirmed", "attended"]);
    type ClsRel = { id: string; name: string; starts_at: string };
    type Joined = { id: string; class_id: string; checked_in_at: string | null; classes: ClsRel | ClsRel[] | null };
    for (const b of ((bs ?? []) as unknown as Joined[])) {
      const cls = Array.isArray(b.classes) ? b.classes[0] : b.classes;
      if (!cls) continue;
      if (cls.starts_at >= windowStart && cls.starts_at <= windowEnd) {
        upcomingClasses.push({
          booking_id: b.id,
          class_id: cls.id,
          class_name: cls.name,
          starts_at: cls.starts_at,
          checked_in_at: b.checked_in_at,
        });
      }
    }
    upcomingClasses.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }

  const flash = searchParams.checked_in ? "✓ CHECKED IN · LOGGED TO MEMBER HISTORY"
              : searchParams.error ? `✗ ${searchParams.error.replace(/_/g, " ").toUpperCase()}`
              : null;

  return (
    <CoachShell coach={coach} pathname="/trainer/checkin">
      <AutoRefresh interval={15000} />
      <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92 }}>CHECK IN.</h1>
      <p style={{ marginTop: 12, fontSize: 14, color: "rgba(242,238,232,0.65)", maxWidth: 640, lineHeight: 1.6 }}>
        Scan a member's QR (from their gym page) or look them up by name. Then mark them attended for a class or as a general gym visit.
      </p>

      {flash && (
        <div className="e-mono" style={{ marginTop: 18, padding: "12px 14px", borderRadius: 12, background: searchParams.error ? "rgba(232,181,168,0.12)" : "rgba(143,184,214,0.1)", border: `1px solid ${searchParams.error ? "var(--rose)" : "var(--sky)"}`, color: searchParams.error ? "var(--rose)" : "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
          {flash}
        </div>
      )}

      {!member && (
        <>
          <CoachSection title="01 · SCAN OR PASTE QR" hint="Paste the e78://checkin/… payload from the member's QR card.">
            <form method="get" style={{ display: "flex", flexDirection: "column", gap: 10, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
              <textarea
                name="qr"
                rows={2}
                placeholder="e78://checkin/00000000-0000-0000-0000-000000000000"
                defaultValue={searchParams.qr ?? ""}
                className="ta-input"
                style={{ resize: "vertical", fontFamily: "var(--font-mono)", fontSize: 12 }}
              />
              <button type="submit" className="btn btn-sky" style={{ alignSelf: "flex-start", padding: "10px 18px" }}>FIND MEMBER</button>
            </form>
          </CoachSection>

          <CoachSection title="02 · LOOK UP BY NAME" hint="Type a member's name or handle.">
            <form method="get" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                name="q"
                defaultValue={searchParams.q ?? ""}
                placeholder="search…"
                className="ta-input"
                style={{ flex: 1, minWidth: 220 }}
                autoFocus
              />
              <button type="submit" className="btn btn-sky" style={{ padding: "10px 18px" }}>SEARCH</button>
            </form>

            {searchParams.q && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                {searchResults.length === 0 ? (
                  <CoachEmpty body={`No matches for "${searchParams.q}".`} />
                ) : (
                  searchResults.map(r => (
                    <Link
                      key={r.id}
                      href={`/trainer/checkin?user=${r.id}`}
                      className="lift"
                      style={{
                        display: "flex", gap: 12, padding: 12, borderRadius: 12,
                        background: "var(--haze)", border: "1px solid rgba(143,184,214,0.12)",
                        color: "var(--bone)", textDecoration: "none", alignItems: "center",
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(143,184,214,0.3)", flexShrink: 0 }}>
                        {r.avatar_url ? (
                          <Photo src={r.avatar_url} alt={r.display_name ?? "Member"} style={{ width: "100%", height: "100%" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(242,238,232,0.45)" }}>
                            <Icon name="user" size={18} />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 15 }}>{(r.display_name ?? "Member").toUpperCase()}</div>
                        <div className="e-mono" style={{ marginTop: 3, color: "rgba(242,238,232,0.5)", fontSize: 9, letterSpacing: "0.16em" }}>
                          @{r.handle ?? "—"} · {(r.membership_tier ?? "free").toUpperCase()}
                        </div>
                      </div>
                      <Icon name="chevron" size={16} />
                    </Link>
                  ))
                )}
              </div>
            )}
          </CoachSection>
        </>
      )}

      {member && (
        <CoachSection title="MEMBER" action={<Link href="/trainer/checkin" className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.18em", textDecoration: "none" }}>CLEAR ←</Link>}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid var(--sky)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--sky)", flexShrink: 0 }}>
              {member.avatar_url ? (
                <Photo src={member.avatar_url} alt={member.display_name ?? "Member"} style={{ width: "100%", height: "100%" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(242,238,232,0.45)" }}>
                  <Icon name="user" size={26} />
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>{(member.display_name ?? "Member").toUpperCase()}</div>
              <div className="e-mono" style={{ marginTop: 4, color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.18em" }}>
                @{member.handle ?? "—"} · {(member.membership_tier ?? "free").toUpperCase()}
              </div>
            </div>
            <Link href={`/trainer/clients/${member.id}`} className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em", textDecoration: "none" }}>VIEW PROFILE →</Link>
          </div>

          {/* Class options happening in the ±3h window */}
          {upcomingClasses.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>CLASS BOOKING (±3 HOURS)</div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {upcomingClasses.map(c => {
                  const already = Boolean(c.checked_in_at);
                  return (
                    <form action={coachCheckInAction} key={c.booking_id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                      padding: 14, borderRadius: 12, background: "var(--haze)", border: `1px solid ${already ? "var(--sky)" : "rgba(143,184,214,0.18)"}`,
                      opacity: already ? 0.7 : 1, flexWrap: "wrap",
                    }}>
                      <input type="hidden" name="user_id" value={member.id} />
                      <input type="hidden" name="class_id" value={c.class_id} />
                      <input type="hidden" name="booking_id" value={c.booking_id} />
                      <div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{c.class_name.toUpperCase()}</div>
                        <div className="e-mono" style={{ marginTop: 4, color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.16em" }}>
                          <Time iso={c.starts_at} format="datetime" />
                          {already ? " · ✓ ALREADY ATTENDED" : ""}
                        </div>
                      </div>
                      {!already && (
                        <button type="submit" className="btn btn-sky" style={{ padding: "10px 18px" }}>CHECK IN →</button>
                      )}
                    </form>
                  );
                })}
              </div>
            </div>
          )}

          {/* General gym visit */}
          <div style={{ marginTop: 18 }}>
            <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>GENERAL GYM VISIT</div>
            <form action={coachCheckInAction} style={{ marginTop: 12, padding: 14, borderRadius: 12, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input type="hidden" name="user_id" value={member.id} />
              <input
                name="note"
                placeholder="optional note · e.g. 'open gym 9am'"
                className="ta-input"
                style={{ flex: 1, minWidth: 220 }}
              />
              <button type="submit" className="btn btn-sky" style={{ padding: "10px 18px" }}>LOG VISIT →</button>
            </form>
          </div>
        </CoachSection>
      )}

      <style>{`
        .ta-input { padding: 11px 13px; border-radius: 10px; background: rgba(10,14,20,0.4); border: 1px solid rgba(143,184,214,0.25); color: var(--bone); font-family: var(--font-body); font-size: 14px; }
        .ta-input:focus { outline: none; border-color: var(--sky); }
      `}</style>
    </CoachShell>
  );
}
