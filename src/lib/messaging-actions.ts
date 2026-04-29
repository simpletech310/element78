"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureThread } from "@/lib/messaging";

/** Start (or reopen) a thread with `other_user_id` and redirect to it. */
export async function startThreadAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/messages");
  const otherId = String(formData.get("other_user_id") ?? "").trim();
  if (!otherId) redirect("/messages?error=missing_target");
  const thread = await ensureThread(user.id, otherId);
  redirect(`/messages/${thread.id}`);
}

export async function sendMessageAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/messages");
  const threadId = String(formData.get("thread_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!threadId || !body) redirect(`/messages/${threadId}?error=empty`);

  const sb = createClient();
  // Insert as the user (RLS verifies sender_id = auth.uid() and they're a
  // participant of the thread).
  const { error } = await sb.from("messages").insert({
    thread_id: threadId,
    sender_id: user.id,
    body,
  });
  if (error) redirect(`/messages/${threadId}?error=${encodeURIComponent(error.message)}`);

  // Update thread snapshot so the inbox sorts correctly.
  const admin = createAdminClient();
  await admin
    .from("threads")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: body.slice(0, 200),
    })
    .eq("id", threadId);

  revalidatePath(`/messages/${threadId}`);
  revalidatePath("/messages");
  redirect(`/messages/${threadId}`);
}
