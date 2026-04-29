"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function saveJournalEntryAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");

  const enrollmentId = String(formData.get("enrollment_id") ?? "").trim();
  const sessionId = String(formData.get("session_id") ?? "").trim();
  const programSlug = String(formData.get("program_slug") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim().slice(0, 4000);
  if (!enrollmentId || !sessionId) redirect(`/programs/${programSlug}?error=missing`);

  const sb = createClient();
  await sb.from("program_journal_entries").upsert(
    {
      enrollment_id: enrollmentId,
      session_id: sessionId,
      body,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "enrollment_id,session_id" },
  );

  revalidatePath(`/programs/${programSlug}`);
  redirect(`/programs/${programSlug}?journal_saved=1#day-${sessionId.slice(0, 8)}`);
}
