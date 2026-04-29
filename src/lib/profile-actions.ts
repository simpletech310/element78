"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { uploadImageToBucket } from "@/lib/supabase/storage";

/**
 * Update the current user's display name + (optional) avatar. Writes to
 *   - `auth.users.user_metadata.display_name` (so JWT/`useUser` reflects it)
 *   - `public.profiles.display_name` and `avatar_url` (the source of truth
 *     for app surfaces — every read goes through profiles)
 *
 * Called from /account/edit. Avatar upload is optional; leaving it blank
 * keeps the existing image.
 */
export async function updateProfileAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/edit");

  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) redirect("/account/edit?error=name_required");

  const handle = String(formData.get("handle") ?? "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || null;

  // Optional avatar — uploaded into the trainer-uploads bucket under a
  // {userId}/ prefix so RLS scopes it to the current user.
  let avatarUrl: string | null | undefined;
  const avatarFile = formData.get("avatar_file");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const { url } = await uploadImageToBucket("trainer-uploads", avatarFile, user.id);
    avatarUrl = url;
  } else {
    const explicit = String(formData.get("avatar_url") ?? "").trim();
    if (explicit) avatarUrl = explicit;
    // else leave undefined — don't overwrite
  }

  const sb = createClient();
  const admin = createAdminClient();

  // 1. Profiles row — RLS lets the user update their own.
  const profilePatch: Record<string, unknown> = {
    display_name: displayName,
  };
  if (avatarUrl !== undefined) profilePatch.avatar_url = avatarUrl;
  if (handle) profilePatch.handle = handle;

  await sb.from("profiles").update(profilePatch).eq("id", user.id);

  // 2. Mirror name onto auth user metadata so the JWT / cookies reflect it
  //    everywhere we currently read `user_metadata.display_name`.
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      display_name: displayName,
      ...(handle ? { handle } : {}),
      ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/edit");
  revalidatePath("/home");
  redirect("/account?updated=1");
}
