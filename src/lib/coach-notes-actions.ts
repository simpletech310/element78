"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { createClient } from "@/lib/supabase/server";

export async function saveCoachClientNoteAction(formData: FormData) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/clients");
  const clientUserId = String(formData.get("client_user_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim().slice(0, 8000);
  if (!clientUserId) redirect("/trainer/clients?error=missing_id");

  const sb = createClient();
  await sb.from("coach_client_notes").upsert(
    {
      coach_trainer_id: trainer.id,
      client_user_id: clientUserId,
      body,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "coach_trainer_id,client_user_id" },
  );

  revalidatePath(`/trainer/clients/${clientUserId}`);
  redirect(`/trainer/clients/${clientUserId}?note_saved=1`);
}
