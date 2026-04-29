/**
 * Coach-only persistent notes per client (CRM-style sticky notes).
 * RLS restricts read+write to the trainer who owns the row, so even via
 * the user-context client these are scoped correctly.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CoachClientNote } from "@/lib/data/types";

export async function getActiveCoachClientNote(coachTrainerId: string, clientUserId: string): Promise<CoachClientNote | null> {
  const sb = createClient();
  const { data } = await sb
    .from("coach_client_notes")
    .select("*")
    .eq("coach_trainer_id", coachTrainerId)
    .eq("client_user_id", clientUserId)
    .maybeSingle();
  return (data as CoachClientNote) ?? null;
}
