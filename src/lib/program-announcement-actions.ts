"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { createClient } from "@/lib/supabase/server";

export async function postProgramAnnouncementAction(formData: FormData) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login");
  const programId = String(formData.get("program_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const body = String(formData.get("body") ?? "").trim().slice(0, 4000);
  if (!programId || !title || !body) redirect(`/trainer/programs/${programId}?error=missing`);

  const sb = createClient();
  // Verify the trainer owns/authored this program (RLS will also enforce).
  const { data: prog } = await sb.from("programs").select("id, author_trainer_id, trainer_id").eq("id", programId).maybeSingle();
  const p = prog as { id: string; author_trainer_id: string | null; trainer_id: string | null } | null;
  if (!p || (p.author_trainer_id !== trainer.id && p.trainer_id !== trainer.id)) {
    redirect("/trainer/programs?error=unauthorized");
  }

  const { error } = await sb.from("program_announcements").insert({
    program_id: programId,
    author_trainer_id: trainer.id,
    title,
    body,
  });
  if (error) redirect(`/trainer/programs/${programId}?error=${encodeURIComponent(error.message)}`);

  revalidatePath(`/trainer/programs/${programId}`);
  revalidatePath(`/programs`);
  redirect(`/trainer/programs/${programId}?announced=1`);
}

export async function deleteProgramAnnouncementAction(formData: FormData) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login");
  const id = String(formData.get("id") ?? "").trim();
  const programId = String(formData.get("program_id") ?? "").trim();
  if (!id) redirect(`/trainer/programs/${programId}?error=missing`);

  const sb = createClient();
  await sb.from("program_announcements").delete().eq("id", id).eq("author_trainer_id", trainer.id);
  revalidatePath(`/trainer/programs/${programId}`);
  redirect(`/trainer/programs/${programId}?deleted=1`);
}
