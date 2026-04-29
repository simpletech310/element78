"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { uploadImageToBucket } from "@/lib/supabase/storage";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import type { ProgramSessionRefKind } from "@/lib/data/types";

/**
 * Resolve a hero image from a multipart form. Prefers an uploaded file
 * (`${prefix}_file`), falling back to the URL field (`${prefix}_url`) and the
 * legacy plain-text field (`${prefix}`). Returns `undefined` when nothing was
 * provided so update callers can leave the column untouched.
 */
async function resolveHeroImage(
  formData: FormData,
  bucket: "program-images" | "trainer-uploads",
  userId: string,
  prefix = "hero_image",
): Promise<string | null | undefined> {
  const fileField = formData.get(`${prefix}_file`);
  if (fileField instanceof File && fileField.size > 0) {
    const { url } = await uploadImageToBucket(bucket, fileField, userId);
    return url;
  }
  const urlField = String(formData.get(`${prefix}_url`) ?? "").trim();
  if (urlField) return urlField;
  const legacy = String(formData.get(prefix) ?? "").trim();
  if (legacy) return legacy;
  return undefined;
}

/**
 * Authorize: must be a trainer + must be the author/lead of the program.
 * Throws via redirect when unauthorized so callers don't have to branch.
 */
async function requireProgramOwnership(programId: string) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/programs");
  const sb = createClient();
  const { data } = await sb.from("programs").select("id, slug, trainer_id, author_trainer_id").eq("id", programId).maybeSingle();
  if (!data) redirect("/trainer/programs?error=not_found");
  const owns = (data as { trainer_id: string | null; author_trainer_id: string | null }).author_trainer_id === trainer.id
    || (data as { trainer_id: string | null }).trainer_id === trainer.id;
  if (!owns) redirect("/trainer/programs?error=unauthorized");
  return { trainer, program: data as { id: string; slug: string; trainer_id: string | null; author_trainer_id: string | null } };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || `program-${Date.now()}`;
}

/* -------------------------------------------------------------------------- */
/*  Programs                                                                  */
/* -------------------------------------------------------------------------- */

export async function createProgramAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/trainer/programs/new");
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/programs/new");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/trainer/programs/new?error=name_required");

  const slug = slugify(String(formData.get("slug") ?? "") || name);
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const resolvedHero = await resolveHeroImage(formData, "program-images", user.id);
  const heroImage = resolvedHero ?? null;
  const durationLabel = String(formData.get("duration_label") ?? "").trim() || null;
  const totalSessions = Math.max(1, Number(formData.get("total_sessions") ?? 1));
  const intensity = String(formData.get("intensity") ?? "All levels").trim();
  const kind = String(formData.get("kind") ?? "both") as "in_app" | "in_person" | "both";
  const surfacesRaw = formData.getAll("surfaces").map(String).filter(Boolean);
  const surfaces = surfacesRaw.length > 0 ? surfacesRaw : ["app"];
  const priceCents = Math.max(0, Number(formData.get("price_cents") ?? 0));
  const requiresPayment = priceCents > 0;

  const sb = createClient();
  const { data, error } = await sb.from("programs").insert({
    slug,
    name,
    subtitle,
    description,
    hero_image: heroImage,
    duration_label: durationLabel,
    total_sessions: totalSessions,
    intensity,
    kind,
    surfaces,
    sort_order: 100,
    price_cents: priceCents,
    requires_payment: requiresPayment,
    trainer_id: trainer.id,
    author_trainer_id: trainer.id,
    status: "published",
  }).select("id").single();

  if (error || !data) {
    const msg = error?.code === "23505" ? `Slug "${slug}" already exists` : "Create failed";
    redirect(`/trainer/programs/new?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/trainer/programs");
  revalidatePath("/programs");
  redirect(`/trainer/programs/${data!.id}`);
}

export async function updateProgramAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/trainer/programs");
  const programId = String(formData.get("program_id") ?? "");
  const { program } = await requireProgramOwnership(programId);

  const sb = createClient();
  const patch: Record<string, unknown> = {
    name: String(formData.get("name") ?? "").trim(),
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    duration_label: String(formData.get("duration_label") ?? "").trim() || null,
    total_sessions: Math.max(1, Number(formData.get("total_sessions") ?? 1)),
    intensity: String(formData.get("intensity") ?? "").trim(),
    kind: String(formData.get("kind") ?? "both"),
    surfaces: formData.getAll("surfaces").map(String).filter(Boolean),
    price_cents: Math.max(0, Number(formData.get("price_cents") ?? 0)),
    requires_payment: Number(formData.get("price_cents") ?? 0) > 0,
    status: String(formData.get("status") ?? "published"),
  };

  // Only patch hero_image when the trainer actually provided one — leaving
  // both file and URL inputs blank means "keep what's already there".
  const resolvedHero = await resolveHeroImage(formData, "program-images", user.id);
  if (resolvedHero !== undefined) {
    patch.hero_image = resolvedHero;
  }

  await sb.from("programs").update(patch).eq("id", programId);
  revalidatePath(`/trainer/programs/${programId}`);
  revalidatePath(`/programs/${program.slug}`);
  revalidatePath("/programs");
  redirect(`/trainer/programs/${programId}?saved=1`);
}

export async function archiveProgramAction(formData: FormData) {
  const programId = String(formData.get("program_id") ?? "");
  await requireProgramOwnership(programId);
  const sb = createClient();
  await sb.from("programs").update({ status: "archived" }).eq("id", programId);
  revalidatePath("/trainer/programs");
  revalidatePath("/programs");
  redirect("/trainer/programs?archived=1");
}

/* -------------------------------------------------------------------------- */
/*  Program sessions (the day-by-day items)                                   */
/* -------------------------------------------------------------------------- */

export async function addProgramSessionAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/trainer/programs");
  const programId = String(formData.get("program_id") ?? "");
  const { program } = await requireProgramOwnership(programId);

  const dayIndex = Math.max(1, Number(formData.get("day_index") ?? 1));
  const refKind = String(formData.get("ref_kind") ?? "custom") as ProgramSessionRefKind;
  const name = String(formData.get("name") ?? "").trim() || autoNameFor(refKind, formData);
  const durationMin = Math.max(1, Number(formData.get("duration_min") ?? 30));
  const description = String(formData.get("description") ?? "").trim() || null;
  const routineSlug = refKind === "routine" ? (String(formData.get("routine_slug") ?? "").trim() || null) : null;
  const classSlug = refKind === "class_kind" ? (String(formData.get("class_slug") ?? "").trim() || null) : null;
  const trainerIdFor1on1 = refKind === "trainer_1on1" ? (String(formData.get("trainer_id_for_1on1") ?? "").trim() || null) : null;
  const resolvedHero = await resolveHeroImage(formData, "program-images", user.id);
  const heroImage = resolvedHero ?? null;

  const sb = createClient();

  // Cache trainer slug so the program detail page can deep-link to /trainers/<slug>/book
  // without an extra query at render time.
  let trainerSlugFor1on1: string | null = null;
  if (trainerIdFor1on1) {
    const { data: tr } = await sb.from("trainers").select("slug").eq("id", trainerIdFor1on1).maybeSingle();
    trainerSlugFor1on1 = (tr as { slug?: string } | null)?.slug ?? null;
  }

  // Pick the next session_index for this day_index.
  const { data: existing } = await sb
    .from("program_sessions")
    .select("session_index")
    .eq("program_id", programId)
    .eq("day_index", dayIndex)
    .order("session_index", { ascending: false })
    .limit(1);
  const nextIndex = existing && existing.length > 0 ? Number((existing[0] as { session_index: number }).session_index) + 1 : 0;

  await sb.from("program_sessions").insert({
    program_id: programId,
    day_index: dayIndex,
    session_index: nextIndex,
    name,
    duration_min: durationMin,
    description,
    kind: refKindToLegacyKind(refKind),
    hero_image: heroImage,
    ref_kind: refKind,
    routine_slug: routineSlug,
    class_slug: classSlug,
    trainer_id_for_1on1: trainerIdFor1on1,
    trainer_slug_for_1on1: trainerSlugFor1on1,
  });

  revalidatePath(`/trainer/programs/${programId}`);
  revalidatePath(`/programs/${program.slug}`);
  redirect(`/trainer/programs/${programId}?day=${dayIndex}#day-${dayIndex}`);
}

export async function deleteProgramSessionAction(formData: FormData) {
  const programId = String(formData.get("program_id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "");
  const { program } = await requireProgramOwnership(programId);
  const sb = createClient();
  await sb.from("program_sessions").delete().eq("id", sessionId).eq("program_id", programId);
  revalidatePath(`/trainer/programs/${programId}`);
  revalidatePath(`/programs/${program.slug}`);
  redirect(`/trainer/programs/${programId}?deleted=1`);
}

/**
 * Reorder sessions within a program. The form supplies the canonical new order
 * via repeated `session_ids` inputs — each id's position in the array becomes
 * its new `session_index`. Day grouping is preserved because the client only
 * reorders within a single day at a time and we update `session_index` only.
 */
export async function reorderProgramSessionsAction(formData: FormData) {
  const programId = String(formData.get("program_id") ?? "");
  const sessionIds = formData.getAll("session_ids").map(String).filter(Boolean);
  const { program } = await requireProgramOwnership(programId);

  if (sessionIds.length === 0) {
    revalidatePath(`/trainer/programs/${programId}`);
    return;
  }

  const sb = createClient();
  // Small lists per day — issue one update per row in parallel.
  await Promise.all(
    sessionIds.map((id, idx) =>
      sb
        .from("program_sessions")
        .update({ session_index: idx })
        .eq("id", id)
        .eq("program_id", programId)
    )
  );

  revalidatePath(`/trainer/programs/${programId}`);
  revalidatePath(`/programs/${program.slug}`);
}

function refKindToLegacyKind(refKind: ProgramSessionRefKind): string {
  switch (refKind) {
    case "routine": return "ai_studio";
    case "class_kind": return "class";
    case "trainer_1on1": return "private";
    default: return "custom";
  }
}

function autoNameFor(refKind: ProgramSessionRefKind, formData: FormData): string {
  switch (refKind) {
    case "routine": return `AI Studio · ${String(formData.get("routine_slug") ?? "").replace(/-/g, " ")}`;
    case "class_kind": return `Class · ${String(formData.get("class_slug") ?? "").replace(/-/g, " ")}`;
    case "trainer_1on1": return "1-on-1 Session";
    default: return "Custom Session";
  }
}
