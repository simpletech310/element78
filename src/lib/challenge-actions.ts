"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function gate(returnPath = "/challenges") {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  return user;
}

export async function joinChallengeAction(formData: FormData): Promise<void> {
  const user = await gate();
  const challengeId = String(formData.get("challenge_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!challengeId) return;
  const sb = createClient();
  // Idempotent — unique (challenge_id, user_id) blocks dupes; we just ignore the conflict.
  await sb.from("challenge_enrollments").insert({ challenge_id: challengeId, user_id: user.id });
  revalidatePath(`/challenges/${slug}`);
  revalidatePath("/wall");
}

export async function leaveChallengeAction(formData: FormData): Promise<void> {
  const user = await gate();
  const challengeId = String(formData.get("challenge_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!challengeId) return;
  const sb = createClient();
  // Cascading FK delete clears their task completions automatically.
  await sb.from("challenge_enrollments").delete().eq("challenge_id", challengeId).eq("user_id", user.id);
  revalidatePath(`/challenges/${slug}`);
}

export async function toggleTaskCompletionAction(taskId: string, challengeId: string, slug: string): Promise<{ done: boolean }> {
  const user = await gate(`/challenges/${slug}`);
  if (!taskId || !challengeId) return { done: false };
  const sb = createClient();
  const { data: existing } = await sb
    .from("challenge_task_completions")
    .select("task_id")
    .eq("task_id", taskId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    await sb.from("challenge_task_completions").delete().eq("task_id", taskId).eq("user_id", user.id);
    revalidatePath(`/challenges/${slug}`);
    return { done: false };
  }
  await sb.from("challenge_task_completions").insert({ task_id: taskId, challenge_id: challengeId, user_id: user.id });
  revalidatePath(`/challenges/${slug}`);
  return { done: true };
}
