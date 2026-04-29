import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { getProgramById, listClassKinds, listTrainers } from "@/lib/data/queries";
import { routines } from "@/lib/data/routines";
import {
  updateProgramAction,
  archiveProgramAction,
  addProgramSessionAction,
} from "@/lib/program-builder-actions";
import type { ProgramSession } from "@/lib/data/types";
import { DndDayList } from "@/components/site/DndDayList";

export default async function EditProgramPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { saved?: string; deleted?: string; day?: string };
}) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect(`/login?next=/trainer/programs/${params.id}`);

  const data = await getProgramById(params.id);
  if (!data) notFound();
  const { program, sessions } = data;

  const owns = program.author_trainer_id === trainer.id || program.trainer_id === trainer.id;
  if (!owns) redirect("/trainer/programs?error=unauthorized");

  const [classKinds, allTrainers] = await Promise.all([
    listClassKinds(),
    listTrainers(),
  ]);
  const humanTrainers = allTrainers.filter(t => !t.is_ai);

  // Group sessions by day_index for rendering.
  const byDay = new Map<number, ProgramSession[]>();
  for (const s of sessions) {
    if (!byDay.has(s.day_index)) byDay.set(s.day_index, []);
    byDay.get(s.day_index)!.push(s);
  }
  const days = Array.from({ length: program.total_sessions }, (_, i) => i + 1);

  const flash = searchParams.saved ? "PROGRAM SAVED" : searchParams.deleted ? "SESSION DELETED" : null;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 22px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <Link href="/trainer/programs" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
            <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>YOUR PROGRAMS</span>
          </Link>
          <Link href={`/programs/${program.slug}`} className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em", textDecoration: "none" }}>
            VIEW PUBLIC PAGE →
          </Link>
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>EDIT · {program.status?.toUpperCase() ?? "PUBLISHED"}</div>
          <h1 className="e-display" style={{ fontSize: "clamp(32px, 6vw, 48px)", lineHeight: 0.92, marginTop: 6 }}>{program.name}</h1>
        </div>

        {flash && (
          <div className="e-mono" style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
            ✓ {flash}
          </div>
        )}

        {/* SECTION 1 — METADATA */}
        <section style={{ marginTop: 28 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>01 / DETAILS</div>
          <form action={updateProgramAction} encType="multipart/form-data" style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
            <input type="hidden" name="program_id" value={program.id} />
            <Field label="NAME *"><input name="name" defaultValue={program.name} required className="ta-input" /></Field>
            <Field label="SUBTITLE"><input name="subtitle" defaultValue={program.subtitle ?? ""} className="ta-input" /></Field>
            <Field label="HERO IMAGE · UPLOAD (LEAVE BLANK TO KEEP CURRENT)" full>
              <input type="file" name="hero_image_file" accept="image/*" className="ta-input" />
            </Field>
            <Field label="OR HERO IMAGE URL" full>
              <input name="hero_image_url" defaultValue={program.hero_image ?? ""} placeholder="https://… or /assets/..." className="ta-input" />
            </Field>
            <Field label="DESCRIPTION" full><textarea name="description" rows={3} defaultValue={program.description ?? ""} className="ta-input" style={{ resize: "vertical" }} /></Field>
            <Field label="DURATION LABEL"><input name="duration_label" defaultValue={program.duration_label ?? ""} className="ta-input" /></Field>
            <Field label="TOTAL SESSIONS *"><input name="total_sessions" type="number" min={1} max={365} defaultValue={program.total_sessions} required className="ta-input" /></Field>
            <Field label="INTENSITY">
              <select name="intensity" defaultValue={program.intensity ?? "All levels"} className="ta-input">
                <option>All levels</option>
                <option>Beginner</option>
                <option>Beginner → Intermediate</option>
                <option>Intermediate</option>
                <option>Intermediate → Advanced</option>
                <option>Advanced</option>
              </select>
            </Field>
            <Field label="KIND">
              <select name="kind" defaultValue={program.kind} className="ta-input">
                <option value="in_app">In App</option>
                <option value="in_person">In Person</option>
                <option value="both">Both</option>
              </select>
            </Field>
            <Field label="STATUS">
              <select name="status" defaultValue={program.status ?? "published"} className="ta-input">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="PRICE (CENTS)"><input name="price_cents" type="number" min={0} defaultValue={program.price_cents} className="ta-input" /></Field>
            <Field label="SURFACES" full>
              <div style={{ display: "flex", gap: 14, paddingTop: 6 }}>
                {(["app", "gym", "class"] as const).map(s => (
                  <label key={s} className="e-mono" style={{ fontSize: 11, letterSpacing: "0.14em" }}>
                    <input type="checkbox" name="surfaces" value={s} defaultChecked={program.surfaces?.includes(s)} /> {s.toUpperCase()}
                  </label>
                ))}
              </div>
            </Field>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
              <button type="submit" className="btn btn-sky" style={{ padding: "10px 18px" }}>SAVE</button>
            </div>
          </form>

          {program.status !== "archived" && (
            <form action={archiveProgramAction} style={{ marginTop: 10 }}>
              <input type="hidden" name="program_id" value={program.id} />
              <button type="submit" className="btn" style={{ padding: "8px 14px", fontSize: 10, background: "transparent", color: "var(--rose)", border: "1px solid rgba(232,181,168,0.35)" }}>
                ARCHIVE PROGRAM
              </button>
            </form>
          )}
        </section>

        {/* SECTION 2 — DAY-BY-DAY BUILDER */}
        <section style={{ marginTop: 32 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>02 / SCHEDULE</div>
          <p style={{ marginTop: 6, fontSize: 13, color: "rgba(242,238,232,0.55)" }}>
            Each day can hold one or more sessions. Add an AI Studio routine, a gym class type, or a 1-on-1 with a trainer.
          </p>

          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            {days.map(day => {
              const items = (byDay.get(day) ?? []).sort((a, b) => a.session_index - b.session_index);
              return (
                <div key={day} id={`day-${day}`} style={{ padding: 14, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
                  <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 11 }}>
                    DAY {day.toString().padStart(2, "0")} · {items.length} {items.length === 1 ? "SESSION" : "SESSIONS"}
                  </div>

                  {items.length > 0 && (
                    <DndDayList programId={program.id} dayIndex={day} items={items} />
                  )}

                  {/* Add session form */}
                  <details style={{ marginTop: 12 }}>
                    <summary className="e-mono" style={{ cursor: "pointer", color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em", padding: "6px 0" }}>
                      + ADD SESSION TO DAY {day}
                    </summary>
                    <AddSessionForm
                      programId={program.id}
                      dayIndex={day}
                      classKinds={classKinds}
                      humanTrainers={humanTrainers}
                    />
                  </details>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <style>{`
        .ta-input {
          padding: 10px 12px;
          border-radius: 8px;
          background: rgba(10,14,20,0.4);
          border: 1px solid rgba(143,184,214,0.25);
          color: var(--bone);
          font-family: var(--font-body);
          font-size: 13px;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

function AddSessionForm({
  programId,
  dayIndex,
  classKinds,
  humanTrainers,
}: {
  programId: string;
  dayIndex: number;
  classKinds: Array<{ slug: string; name: string }>;
  humanTrainers: Array<{ id: string; name: string; slug: string }>;
}) {
  // Server-rendered: trainer picks ref_kind via radio, fills the matching ref
  // dropdown. Server-side validation in the action ignores irrelevant fields.
  return (
    <form action={addProgramSessionAction} encType="multipart/form-data" style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10, padding: 12, borderRadius: 10, background: "rgba(10,14,20,0.3)", border: "1px solid rgba(143,184,214,0.18)" }}>
      <input type="hidden" name="program_id" value={programId} />
      <input type="hidden" name="day_index" value={dayIndex} />

      <Field label="TYPE">
        <select name="ref_kind" defaultValue="routine" className="ta-input">
          <option value="routine">AI Studio routine</option>
          <option value="class_kind">Gym class type</option>
          <option value="trainer_1on1">1-on-1 with trainer</option>
          <option value="custom">Custom (free-form)</option>
        </select>
      </Field>

      <Field label="AI ROUTINE (if type=routine)">
        <select name="routine_slug" defaultValue="" className="ta-input">
          <option value="">— pick a routine —</option>
          {routines.map(r => (
            <option key={r.slug} value={r.slug}>{r.name} · {r.duration_min}M · {r.intensity}</option>
          ))}
        </select>
      </Field>

      <Field label="CLASS TYPE (if type=class_kind)">
        <select name="class_slug" defaultValue="" className="ta-input">
          <option value="">— pick a class type —</option>
          {classKinds.map(c => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </Field>

      <Field label="TRAINER (if type=trainer_1on1)">
        <select name="trainer_id_for_1on1" defaultValue="" className="ta-input">
          <option value="">— pick a trainer —</option>
          {humanTrainers.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="DURATION (MIN)">
          <input name="duration_min" type="number" min={5} max={240} defaultValue={30} className="ta-input" />
        </Field>
        <Field label="NAME (auto if blank)">
          <input name="name" placeholder="e.g. Day 1 · Lower Body" className="ta-input" />
        </Field>
      </div>

      <Field label="DESCRIPTION">
        <textarea name="description" rows={2} placeholder="Optional notes for this session" className="ta-input" style={{ resize: "vertical" }} />
      </Field>

      <Field label="HERO IMAGE · UPLOAD (OPTIONAL)">
        <input type="file" name="hero_image_file" accept="image/*" className="ta-input" />
      </Field>
      <Field label="OR HERO IMAGE URL">
        <input name="hero_image_url" placeholder="https://… or /assets/..." className="ta-input" />
      </Field>

      <button type="submit" className="btn btn-sky" style={{ padding: "8px 14px", fontSize: 11, alignSelf: "flex-start" }}>
        ADD TO DAY {dayIndex}
      </button>
    </form>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className="e-mono" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9, color: "rgba(242,238,232,0.6)", letterSpacing: "0.2em", gridColumn: full ? "1 / -1" : undefined }}>
      {label}
      {children}
    </label>
  );
}
