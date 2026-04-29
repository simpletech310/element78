"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { createClient } from "@/lib/supabase/server";
import { uploadImageToBucket } from "@/lib/supabase/storage";

export async function updateCoachProfileAction(formData: FormData) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/profile");

  const name = String(formData.get("name") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const specialtiesRaw = String(formData.get("specialties") ?? "").trim();
  const specialties = specialtiesRaw ? specialtiesRaw.split(",").map(s => s.trim()).filter(Boolean) : [];
  const cert = String(formData.get("cert") ?? "").trim() || null;
  const yrs = formData.get("years_experience");
  const years_experience = yrs ? Math.max(0, Number(yrs)) : null;
  if (!name) redirect("/trainer/profile?error=name_required");

  // Optional avatar upload — replaces existing avatar_url.
  let avatarUrl: string | undefined;
  const avatarFile = formData.get("avatar_file") as File | null;
  if (avatarFile && avatarFile.size > 0) {
    try {
      const { url } = await uploadImageToBucket("trainer-uploads", avatarFile, trainer.id);
      avatarUrl = url;
    } catch (err) {
      redirect(`/trainer/profile?error=${encodeURIComponent((err as Error).message)}`);
    }
  }

  // Optional hero upload.
  let heroUrl: string | undefined;
  const heroFile = formData.get("hero_file") as File | null;
  if (heroFile && heroFile.size > 0) {
    try {
      const { url } = await uploadImageToBucket("trainer-uploads", heroFile, trainer.id);
      heroUrl = url;
    } catch (err) {
      redirect(`/trainer/profile?error=${encodeURIComponent((err as Error).message)}`);
    }
  }

  const sb = createClient();
  const updates: Record<string, unknown> = { name, headline, bio, specialties, cert, years_experience };
  if (avatarUrl) updates.avatar_url = avatarUrl;
  if (heroUrl) updates.hero_image = heroUrl;

  // Use .select() so RLS rejections surface as 0 returned rows instead of
  // the misleading silent error: null. We then re-check that the new name
  // actually landed before claiming success.
  const { data: updated, error } = await sb
    .from("trainers")
    .update(updates)
    .eq("id", trainer.id)
    .select("id, name")
    .maybeSingle();
  if (error) redirect(`/trainer/profile?error=${encodeURIComponent(error.message)}`);
  if (!updated || (updated as { name?: string }).name !== name) {
    redirect("/trainer/profile?error=update_blocked_check_rls");
  }

  revalidatePath("/trainer/profile");
  revalidatePath(`/trainers/${trainer.slug}`);
  revalidatePath("/trainers");
  revalidatePath("/account");
  revalidatePath("/trainer/dashboard");
  redirect("/trainer/profile?saved=1");
}
