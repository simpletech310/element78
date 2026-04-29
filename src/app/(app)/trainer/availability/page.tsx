import { redirect } from "next/navigation";
import { CoachShell, CoachSection } from "@/components/site/CoachShell";
import { DateTimeField } from "@/components/site/DateTimeField";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import {
  getTrainerSessionSettings,
  listAllAvailabilityRules,
  listAvailabilityBlocks,
  listLocations,
} from "@/lib/data/queries";
import {
  upsertAvailabilityRuleAction,
  deleteAvailabilityRuleAction,
  upsertSessionSettingsAction,
  createAvailabilityBlockAction,
  deleteAvailabilityBlockAction,
} from "@/lib/trainer-booking-actions";
import type { TrainerAvailabilityRule } from "@/lib/data/types";
import { fmtMinutes12 } from "@/lib/format";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const dynamic = "force-dynamic";

export default async function CoachAvailabilityPage({ searchParams }: { searchParams: { saved?: string; deleted?: string; settings_saved?: string; error?: string } }) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/availability");

  const now = new Date();
  const yearAhead = new Date(now.getTime() + 365 * 24 * 60 * 60_000);
  const [settings, rules, locations, blocks] = await Promise.all([
    getTrainerSessionSettings(coach.id),
    listAllAvailabilityRules(coach.id),
    listLocations(),
    listAvailabilityBlocks(coach.id, now.toISOString(), yearAhead.toISOString()),
  ]);

  const grouped = new Map<number, TrainerAvailabilityRule[]>();
  for (const r of rules) {
    if (!grouped.has(r.weekday)) grouped.set(r.weekday, []);
    grouped.get(r.weekday)!.push(r);
  }

  const flash = searchParams.saved ? "RULE SAVED"
              : searchParams.deleted ? "RULE DELETED"
              : searchParams.settings_saved ? "SETTINGS SAVED"
              : (searchParams as { block_added?: string; block_removed?: string }).block_added ? "TIME OFF ADDED"
              : (searchParams as { block_added?: string; block_removed?: string }).block_removed ? "TIME OFF REMOVED"
              : searchParams.error ? `ERROR: ${searchParams.error}`
              : null;

  return (
    <CoachShell coach={coach} pathname="/trainer/availability">
      <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92 }}>AVAILABILITY.</h1>
      <p style={{ marginTop: 12, fontSize: 14, color: "rgba(242,238,232,0.65)", maxWidth: 560, lineHeight: 1.6 }}>
        Recurring weekly hours members can book against, plus one-off blocks for vacation, training weeks, or anything else.
      </p>

      {flash && (
        <div className="e-mono" style={{ marginTop: 18, padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
          {flash}
        </div>
      )}

        {/* SESSION SETTINGS */}
        <section style={{ marginTop: 32 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>01 / SESSION SETTINGS</div>
          <form action={upsertSessionSettingsAction} style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, padding: 16, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
            <Field label="PRICE · USD (1-ON-1 SESSION)">
              <input type="number" name="price_dollars" min={0} step="0.01" defaultValue={(settings?.price_cents ?? 7500) / 100} className="ta-input" placeholder="75.00" />
            </Field>
            <Field label="DURATION (MIN)">
              <input type="number" name="duration_min" min={15} max={180} defaultValue={settings?.duration_min ?? 45} className="ta-input" />
            </Field>
            <Field label="BUFFER (MIN)">
              <input type="number" name="buffer_min" min={0} max={120} defaultValue={settings?.buffer_min ?? 15} className="ta-input" />
            </Field>
            <Field label="MODES">
              <div style={{ display: "flex", gap: 12, paddingTop: 6 }}>
                <label className="e-mono" style={{ display: "flex", gap: 6, fontSize: 11, letterSpacing: "0.14em" }}>
                  <input type="checkbox" name="modes" value="video" defaultChecked={settings?.modes?.includes("video") ?? true} /> VIDEO
                </label>
                <label className="e-mono" style={{ display: "flex", gap: 6, fontSize: 11, letterSpacing: "0.14em" }}>
                  <input type="checkbox" name="modes" value="in_person" defaultChecked={settings?.modes?.includes("in_person") ?? true} /> IN PERSON
                </label>
              </div>
            </Field>
            <Field label="IN-PERSON LOCATION">
              <select name="in_person_location_id" defaultValue={settings?.in_person_location_id ?? ""} className="ta-input">
                <option value="">— NONE —</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </Field>
            <Field label="1-ON-1 BIO" full>
              <textarea name="bio_for_1on1" rows={2} defaultValue={settings?.bio_for_1on1 ?? ""} className="ta-input" style={{ resize: "vertical" }} placeholder="Optional pitch shown on the booking page" />
            </Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <button type="submit" className="btn btn-sky" style={{ padding: "10px 18px" }}>SAVE SETTINGS</button>
            </div>
          </form>
        </section>

        {/* WEEKLY RULES */}
        <section style={{ marginTop: 32 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>02 / WEEKLY AVAILABILITY</div>
          <p style={{ marginTop: 6, fontSize: 13, color: "rgba(242,238,232,0.55)" }}>
            Recurring rules. Times are local wall-clock minutes from midnight (e.g. 18:00 → 1080).
          </p>

          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            {WEEKDAYS.map((label, idx) => {
              const dayRules = grouped.get(idx) ?? [];
              return (
                <div key={idx} style={{ padding: 14, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
                  <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 11 }}>{label}</div>

                  {dayRules.length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                      {dayRules.map(r => (
                        <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span className="e-mono" style={{ fontSize: 12, color: r.is_active ? "var(--bone)" : "rgba(242,238,232,0.4)", letterSpacing: "0.12em" }}>
                            {fmtMinutes12(r.start_minute)} – {fmtMinutes12(r.end_minute)} · {r.mode.toUpperCase()}
                            {!r.is_active ? " · DISABLED" : ""}
                          </span>
                          <form action={deleteAvailabilityRuleAction}>
                            <input type="hidden" name="id" value={r.id} />
                            <button type="submit" className="btn" style={{ padding: "5px 10px", fontSize: 10, background: "transparent", color: "var(--rose)", border: "1px solid rgba(232,181,168,0.3)" }}>
                              REMOVE
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}

                  <form action={upsertAvailabilityRuleAction} style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <input type="hidden" name="weekday" value={idx} />
                    <label className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.55)", letterSpacing: "0.16em" }}>
                      START
                      <input type="time" name="start_time" defaultValue="09:00" required className="ta-input" style={{ marginLeft: 6 }} />
                    </label>
                    <label className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.55)", letterSpacing: "0.16em" }}>
                      END
                      <input type="time" name="end_time" defaultValue="11:00" required className="ta-input" style={{ marginLeft: 6 }} />
                    </label>
                    <select name="mode" defaultValue="both" className="ta-input">
                      <option value="both">BOTH</option>
                      <option value="video">VIDEO</option>
                      <option value="in_person">IN PERSON</option>
                    </select>
                    <button type="submit" className="btn btn-sky" style={{ padding: "8px 14px", fontSize: 11 }}>+ ADD</button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>

        {/* TIME-OFF BLOCKS */}
        <section style={{ marginTop: 32 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>03 / TIME OFF</div>
          <p style={{ marginTop: 6, fontSize: 13, color: "rgba(242,238,232,0.55)" }}>
            One-off blocks (vacation, sick day, training week). Members won't see these slots on your booking page.
          </p>

          <form action={createAvailabilityBlockAction} style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <DateTimeField name="starts_at" label="START" required />
            <DateTimeField name="ends_at" label="END" required />
            <Field label="REASON" full>
              <input name="reason" placeholder="e.g. 'Out of town' (optional)" className="ta-input" />
            </Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <button type="submit" className="btn btn-sky" style={{ padding: "8px 14px", fontSize: 11 }}>ADD TIME OFF</button>
            </div>
          </form>

          {blocks.length > 0 && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              {blocks.map(b => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.12)", flexWrap: "wrap" }}>
                  <div className="e-mono" style={{ fontSize: 11, letterSpacing: "0.14em", color: "rgba(242,238,232,0.85)", flex: 1 }}>
                    {new Date(b.starts_at).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "numeric", minute: "2-digit" })}
                    {" → "}
                    {new Date(b.ends_at).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "numeric", minute: "2-digit" })}
                    {b.reason ? ` · ${b.reason}` : ""}
                  </div>
                  <form action={deleteAvailabilityBlockAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <button type="submit" className="btn" style={{ padding: "5px 10px", fontSize: 10, background: "transparent", color: "var(--rose)", border: "1px solid rgba(232,181,168,0.3)" }}>
                      REMOVE
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>

      <style>{`
        .ta-input { padding: 11px 13px; border-radius: 10px; background: rgba(10,14,20,0.4); border: 1px solid rgba(143,184,214,0.25); color: var(--bone); font-family: var(--font-body); font-size: 14px; }
        .ta-input:focus { outline: none; border-color: var(--sky); }
      `}</style>
    </CoachShell>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className="e-mono" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9, color: "rgba(242,238,232,0.55)", letterSpacing: "0.2em", gridColumn: full ? "1 / -1" : undefined }}>
      {label}
      {children}
    </label>
  );
}

