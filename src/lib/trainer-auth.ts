import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import type { Trainer } from "@/lib/data/types";

/**
 * Returns the trainer row whose `auth_user_id` matches the currently
 * authenticated user, or null. Used as the gate for `/trainer/*` routes.
 */
export async function getTrainerForCurrentUser(): Promise<Trainer | null> {
  const user = await getUser();
  if (!user) return null;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const sb = createClient();
  const { data } = await sb.from("trainers").select("*").eq("auth_user_id", user.id).maybeSingle();
  return (data as Trainer) ?? null;
}

/**
 * Variant: returns the trainer row only if they own the given booking's
 * trainer_id. Used to authorize trainer-side actions like accept/reject.
 */
export async function getTrainerOwningBooking(bookingId: string): Promise<Trainer | null> {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) return null;
  const sb = createClient();
  const { data: booking } = await sb.from("trainer_bookings").select("trainer_id").eq("id", bookingId).maybeSingle();
  if (!booking || (booking as { trainer_id: string }).trainer_id !== trainer.id) return null;
  return trainer;
}
