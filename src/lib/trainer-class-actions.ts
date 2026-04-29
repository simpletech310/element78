"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { refundPurchase } from "@/lib/purchases";

/** Trainer cancels a class. Refunds any paid attendees, marks bookings cancelled. */
export async function cancelClassAction(formData: FormData) {
  const classId = String(formData.get("class_id") ?? "");
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/classes");
  if (!classId) redirect("/trainer/classes?error=missing_id");

  const sb = createClient();
  const admin = createAdminClient();

  const { data: cls } = await sb.from("classes").select("id, trainer_id, slug").eq("id", classId).maybeSingle();
  if (!cls || (cls as { trainer_id: string | null }).trainer_id !== trainer.id) {
    redirect("/trainer/classes?error=unauthorized");
  }

  const { data: bookings } = await admin.from("bookings").select("id, paid_status").eq("class_id", classId);
  for (const b of (bookings as Array<{ id: string; paid_status: string }>) ?? []) {
    if (b.paid_status === "paid") {
      const { data: purchase } = await admin.from("purchases").select("id").eq("class_booking_id", b.id).maybeSingle();
      if (purchase) {
        try {
          await refundPurchase((purchase as { id: string }).id, { reason: "requested_by_customer" });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("[class-cancel] refund failed for booking", b.id, (err as Error).message);
        }
      }
    }
    await admin.from("bookings").update({ status: "cancelled", paid_status: b.paid_status === "paid" ? "refunded" : b.paid_status }).eq("id", b.id);
  }

  await admin
    .from("classes")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", classId);

  revalidatePath("/trainer/classes");
  revalidatePath(`/trainer/classes/${classId}`);
  revalidatePath("/classes");
  revalidatePath(`/classes/${classId}`);
  redirect(`/trainer/classes?cancelled=${classId}`);
}

/**
 * Trainer marks a class completed. Bridges program progress for any active
 * enrollment whose program references this class slug.
 */
export async function markClassCompleteAction(formData: FormData) {
  const classId = String(formData.get("class_id") ?? "");
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/classes");
  if (!classId) redirect("/trainer/classes?error=missing_id");

  const sb = createClient();
  const admin = createAdminClient();

  const { data: cls } = await sb.from("classes").select("id, slug, trainer_id, duration_min").eq("id", classId).maybeSingle();
  const c = cls as { id: string; slug: string; trainer_id: string | null; duration_min: number } | null;
  if (!c || c.trainer_id !== trainer.id) {
    redirect("/trainer/classes?error=unauthorized");
  }

  await admin
    .from("classes")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", classId);

  // Bridge to program completions: any active enrollment whose program has a
  // session referencing this class slug, for any of the booked attendees.
  const { data: bookings } = await admin
    .from("bookings")
    .select("user_id")
    .eq("class_id", classId)
    .in("status", ["confirmed", "pending"]);
  const userIds = Array.from(new Set(((bookings as Array<{ user_id: string }>) ?? []).map(b => b.user_id)));
  if (userIds.length > 0) {
    const { data: progSessions } = await admin
      .from("program_sessions")
      .select("id, program_id")
      .eq("ref_kind", "class_kind")
      .eq("class_slug", c!.slug);
    const ps = (progSessions as Array<{ id: string; program_id: string }>) ?? [];
    for (const session of ps) {
      const { data: enrollments } = await admin
        .from("program_enrollments")
        .select("id, user_id")
        .eq("program_id", session.program_id)
        .in("user_id", userIds)
        .eq("status", "active");
      for (const e of (enrollments as Array<{ id: string; user_id: string }>) ?? []) {
        await admin.from("program_completions").upsert({
          enrollment_id: e.id,
          session_id: session.id,
          source: "class",
          surface: "class",
          duration_actual_min: c!.duration_min,
        }, { onConflict: "enrollment_id,session_id" });
      }
    }
  }

  revalidatePath("/trainer/classes");
  revalidatePath(`/trainer/classes/${classId}`);
  redirect(`/trainer/classes?completed=${classId}`);
}
