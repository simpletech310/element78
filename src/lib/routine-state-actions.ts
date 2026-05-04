"use server";

import { createClient } from "@/lib/supabase/server";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";

/**
 * Coach pushes a routine state update for a live session. The parent
 * `trainer_sessions.routine_state` jsonb is the single source of truth —
 * every member's RoutinePlayer subscribes to it via Supabase realtime and
 * mirrors the coach's exercise / set / phase. Auth gate: only the coach
 * who owns the session can write.
 *
 * Best-effort: if the session ID is wrong or the writer isn't the owning
 * coach, we silently no-op so a misclick can't crash the player.
 */
export async function updateRoutineStateAction(formData: FormData): Promise<void> {
  const sessionId = String(formData.get("session_id") ?? "").trim();
  if (!sessionId) return;

  const trainer = await getTrainerForCurrentUser();
  if (!trainer) return;

  const sb = createClient();
  const { data: session } = await sb
    .from("trainer_sessions")
    .select("trainer_id")
    .eq("id", sessionId)
    .maybeSingle();
  const owner = (session as { trainer_id?: string } | null)?.trainer_id;
  if (!owner || owner !== trainer.id) return;

  const phase = String(formData.get("phase") ?? "ready");
  const validPhases = new Set(["ready", "working", "rest", "done"]);
  if (!validPhases.has(phase)) return;

  const state = {
    exerciseIdx: Math.max(0, Number(formData.get("exercise_idx") ?? 0)),
    setIdx: Math.max(0, Number(formData.get("set_idx") ?? 0)),
    phase,
    phaseStartedAt: String(formData.get("phase_started_at") ?? new Date().toISOString()),
    updatedAt: new Date().toISOString(),
  };

  await sb
    .from("trainer_sessions")
    .update({ routine_state: state, updated_at: state.updatedAt })
    .eq("id", sessionId);
}

/**
 * Coach hits END / MARK COMPLETE — clear the routine state so future
 * subscribers don't re-render the last frame.
 */
export async function clearRoutineStateAction(formData: FormData): Promise<void> {
  const sessionId = String(formData.get("session_id") ?? "").trim();
  if (!sessionId) return;
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) return;
  const sb = createClient();
  const { data: session } = await sb.from("trainer_sessions").select("trainer_id").eq("id", sessionId).maybeSingle();
  const owner = (session as { trainer_id?: string } | null)?.trainer_id;
  if (!owner || owner !== trainer.id) return;
  await sb.from("trainer_sessions").update({ routine_state: null }).eq("id", sessionId);
}
