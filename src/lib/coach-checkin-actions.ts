"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Coach checks a member in. Either:
 *  - General gym visit (no class_id, no booking_id) — inserts gym_check_ins row.
 *  - Class attendance (class_id provided) — flips bookings.checked_in_at +
 *    checked_in_by + status='attended' AND inserts a gym_check_ins audit row.
 *
 * Accepts either:
 *  - `user_id` directly (from manual lookup)
 *  - `qr_payload` like "e78://checkin/<user_id>" (parsed)
 */
export async function coachCheckInAction(formData: FormData) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/checkin");

  let userId = String(formData.get("user_id") ?? "").trim();
  const qrPayload = String(formData.get("qr_payload") ?? "").trim();
  if (!userId && qrPayload) {
    const m = qrPayload.match(/e78:\/\/checkin\/([0-9a-f-]{36})/i);
    if (m) userId = m[1];
  }
  if (!userId) redirect("/trainer/checkin?error=no_member");

  const classId = String(formData.get("class_id") ?? "").trim() || null;
  const bookingId = String(formData.get("booking_id") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  const sb = createClient();
  const admin = createAdminClient();

  // Always log a gym_check_ins audit row (source='staff').
  await sb.from("gym_check_ins").insert({
    user_id: userId,
    source: "staff",
    note,
  });

  // If a specific class booking is targeted, mark it attended.
  if (bookingId) {
    await admin
      .from("bookings")
      .update({
        checked_in_at: new Date().toISOString(),
        checked_in_by: coach.id,
        status: "attended",
      })
      .eq("id", bookingId)
      .eq("user_id", userId);
  } else if (classId) {
    // Fallback: find the user's booking for this class and check them in.
    const { data: booking } = await sb
      .from("bookings")
      .select("id")
      .eq("class_id", classId)
      .eq("user_id", userId)
      .maybeSingle();
    if (booking) {
      await admin
        .from("bookings")
        .update({
          checked_in_at: new Date().toISOString(),
          checked_in_by: coach.id,
          status: "attended",
        })
        .eq("id", (booking as { id: string }).id);
    }
  }

  revalidatePath("/trainer/checkin");
  revalidatePath(`/trainer/clients/${userId}`);
  redirect(`/trainer/checkin?checked_in=${userId}${classId ? `&class=${classId}` : ""}`);
}
