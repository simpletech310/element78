"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminForCurrentUser, logAdminAction } from "@/lib/admin-auth";

export async function submitCoachApplicationAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/coach/apply");

  const display_name = String(formData.get("display_name") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const specialtiesRaw = String(formData.get("specialties") ?? "").trim();
  const specialties = specialtiesRaw ? specialtiesRaw.split(",").map(s => s.trim()).filter(Boolean) : [];
  const certifications = String(formData.get("certifications") ?? "").trim() || null;
  const yrs = formData.get("years_experience");
  const years_experience = yrs ? Math.max(0, Number(yrs)) : null;
  const sample_video_url = String(formData.get("sample_video_url") ?? "").trim() || null;

  if (!display_name) redirect("/coach/apply?error=name_required");

  const sb = createClient();
  const { error } = await sb.from("coach_applications").insert({
    user_id: user.id,
    display_name,
    headline,
    bio,
    specialties,
    certifications,
    years_experience,
    sample_video_url,
  });
  if (error) {
    if (error.code === "23505") redirect("/coach/apply?error=already_pending");
    redirect(`/coach/apply?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/coach/apply?submitted=1");
}

export async function withdrawCoachApplicationAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/coach/apply");
  const sb = createClient();
  await sb.from("coach_applications").update({ status: "withdrawn", updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  redirect("/coach/apply?withdrawn=1");
}

/* -------------------------------------------------------------------------- */
/*  Admin-only review actions                                                 */
/* -------------------------------------------------------------------------- */

export async function approveCoachApplicationAction(formData: FormData) {
  const adminProfile = await getAdminForCurrentUser();
  if (!adminProfile) redirect("/home?error=admin_only");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin/coaches?error=missing_id");

  const admin = createAdminClient();
  const { data: appRow } = await admin.from("coach_applications").select("*").eq("id", id).maybeSingle();
  const app = appRow as { id: string; user_id: string; display_name: string; headline: string | null; bio: string | null; specialties: string[]; certifications: string | null; years_experience: number | null } | null;
  if (!app) redirect("/admin/coaches?error=not_found");

  // Generate a slug from display name; ensure uniqueness.
  const baseSlug = app.display_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "coach";
  let slug = baseSlug;
  for (let i = 2; i < 50; i++) {
    const { data: clash } = await admin.from("trainers").select("id").eq("slug", slug).maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${i}`;
  }

  const { data: insertedTrainer, error: trErr } = await admin.from("trainers").insert({
    slug,
    name: app.display_name,
    headline: app.headline,
    bio: app.bio,
    specialties: app.specialties,
    cert: app.certifications,
    years_experience: app.years_experience,
    rating: 5.0,
    is_ai: false,
    auth_user_id: app.user_id,
  }).select("id").single();
  if (trErr || !insertedTrainer) {
    redirect(`/admin/coaches?error=${encodeURIComponent(trErr?.message ?? "trainer_insert_failed")}`);
  }

  await admin.from("coach_applications").update({
    status: "approved",
    reviewer_id: adminProfile.id,
    reviewed_at: new Date().toISOString(),
    trainer_id: (insertedTrainer as { id: string }).id,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  await logAdminAction({ adminUserId: adminProfile.id, action: "approve_coach_application", targetType: "coach_application", targetId: id, details: { trainer_id: (insertedTrainer as { id: string }).id, slug } });
  revalidatePath("/admin/coaches");
  redirect(`/admin/coaches?approved=${id}`);
}

export async function rejectCoachApplicationAction(formData: FormData) {
  const adminProfile = await getAdminForCurrentUser();
  if (!adminProfile) redirect("/home?error=admin_only");
  const id = String(formData.get("id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!id) redirect("/admin/coaches?error=missing_id");

  const admin = createAdminClient();
  await admin.from("coach_applications").update({
    status: "rejected",
    reviewer_id: adminProfile.id,
    reviewed_at: new Date().toISOString(),
    rejection_reason: reason,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  await logAdminAction({ adminUserId: adminProfile.id, action: "reject_coach_application", targetType: "coach_application", targetId: id, details: { reason } });
  revalidatePath("/admin/coaches");
  redirect(`/admin/coaches?rejected=${id}`);
}
