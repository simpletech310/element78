/**
 * Waivers: PAR-Q (physical activity readiness) + liability. Required before
 * any first 1-on-1 booking, class booking, or program enrollment. Slice C
 * agent fills in implementations.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Waiver, WaiverKind } from "@/lib/data/types";

/** Returns the live (non-expired) waiver of a given kind for the user, or null. */
export async function getActiveWaiver(userId: string, kind: WaiverKind): Promise<Waiver | null> {
  const sb = createClient();
  const { data } = await sb
    .from("waivers")
    .select("*")
    .eq("user_id", userId)
    .eq("kind", kind)
    .is("expires_at", null)
    .maybeSingle();
  return (data as Waiver) ?? null;
}

/** True if the user has signed BOTH parq + liability. Use as booking gate. */
export async function hasSignedAllRequiredWaivers(userId: string): Promise<boolean> {
  const [parq, liability] = await Promise.all([
    getActiveWaiver(userId, "parq"),
    getActiveWaiver(userId, "liability"),
  ]);
  return Boolean(parq && liability);
}
