"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

/**
 * Enroll the current user in a program. Idempotent — re-enrolling
 * resumes a paused/left enrollment instead of creating a duplicate.
 */
export async function enrollAction(formData: FormData) {
  const programId = String(formData.get("program_id") ?? "");
  const slug = String(formData.get("program_slug") ?? "");
  const user = await getUser();
  if (!user) redirect(`/login?next=/programs/${slug}`);

  const sb = createClient();

  // Re-activate if a prior enrollment exists.
  const { data: existing } = await sb
    .from("program_enrollments")
    .select("*")
    .eq("user_id", user.id)
    .eq("program_id", programId)
    .maybeSingle();

  if (existing) {
    await sb
      .from("program_enrollments")
      .update({ status: "active", started_at: new Date().toISOString(), completed_at: null })
      .eq("id", existing.id);
  } else {
    await sb.from("program_enrollments").insert({
      user_id: user.id,
      program_id: programId,
      status: "active",
      current_day: 1,
    });
  }

  revalidatePath(`/programs/${slug}`);
  redirect(`/programs/${slug}`);
}

/** Mark today's session complete and advance current_day. */
export async function completeSessionAction(formData: FormData) {
  const enrollmentId = String(formData.get("enrollment_id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "");
  const surface = (String(formData.get("surface") ?? "app") as "app" | "gym" | "class");
  const slug = String(formData.get("program_slug") ?? "");
  const totalSessions = Number(formData.get("total_sessions") ?? 0);
  const dayIndex = Number(formData.get("day_index") ?? 0);

  const user = await getUser();
  if (!user) redirect("/login");

  const sb = createClient();

  // Insert the completion row (idempotent via unique(enrollment_id, session_id))
  await sb.from("program_completions").upsert(
    { enrollment_id: enrollmentId, session_id: sessionId, surface },
    { onConflict: "enrollment_id,session_id" },
  );

  const nextDay = Math.min(totalSessions, Math.max(dayIndex, 0) + 1);
  const completedAll = nextDay >= totalSessions && dayIndex >= totalSessions;

  await sb
    .from("program_enrollments")
    .update({
      current_day: nextDay,
      ...(completedAll ? { status: "completed", completed_at: new Date().toISOString() } : {}),
    })
    .eq("id", enrollmentId);

  revalidatePath(`/programs/${slug}`);
  revalidatePath("/account/history");
}

export async function leaveAction(formData: FormData) {
  const enrollmentId = String(formData.get("enrollment_id") ?? "");
  const slug = String(formData.get("program_slug") ?? "");
  const user = await getUser();
  if (!user) redirect("/login");

  const sb = createClient();
  await sb.from("program_enrollments").update({ status: "left" }).eq("id", enrollmentId);
  revalidatePath(`/programs/${slug}`);
  revalidatePath("/account/history");
}
