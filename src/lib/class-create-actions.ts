"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { uploadImageToBucket } from "@/lib/supabase/storage";
import { dollarsToCents } from "@/lib/format";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || `class-${Date.now()}`;
}

const ALLOWED_KINDS = new Set([
  "pilates",
  "reformer",
  "hiit",
  "strength",
  "yoga",
  "mobility",
  "conditioning",
]);

/**
 * Trainer-side: create a new class instance. Capacity is hard-capped at 10
 * for equipment classes (mirrored reformer studio) and 30 otherwise — we
 * validate server-side so the form can't be bypassed.
 */
export async function createClassAction(formData: FormData) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/classes/new");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/trainer/classes/new?error=name_required");

  const kindRaw = String(formData.get("kind") ?? "").trim();
  const kind = ALLOWED_KINDS.has(kindRaw) ? kindRaw : "strength";

  const startsAtRaw = String(formData.get("starts_at") ?? "").trim();
  if (!startsAtRaw) redirect("/trainer/classes/new?error=starts_at_required");
  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) redirect("/trainer/classes/new?error=invalid_starts_at");

  const durationMin = Math.max(5, Math.min(180, Number(formData.get("duration_min") ?? 45)));
  const room = String(formData.get("room") ?? "").trim() || null;
  const intensity = String(formData.get("intensity") ?? "MD").trim();
  const summary = String(formData.get("summary") ?? "").trim() || null;
  const whatToBring = String(formData.get("what_to_bring") ?? "").trim() || null;
  // Image is uploaded; URL fields removed everywhere on the coach side.
  let heroImage: string | null = null;
  const heroFile = formData.get("hero_image_file") as File | null;
  if (heroFile && heroFile.size > 0) {
    try {
      const { url } = await uploadImageToBucket("trainer-uploads", heroFile, trainer.id);
      heroImage = url;
    } catch (err) {
      redirect(`/trainer/classes/new?error=${encodeURIComponent((err as Error).message)}`);
    }
  }
  const priceCents = dollarsToCents(formData.get("price_dollars") ?? formData.get("price_cents"));

  const hasEquipment = formData.get("has_equipment") === "on";
  const mirroredLayout = hasEquipment && formData.get("mirrored_layout") === "on";

  // Capacity bounds depend on whether the class uses equipment.
  let capacity = Math.max(1, Number(formData.get("capacity") ?? 10));
  const cap = hasEquipment ? 10 : 30;
  if (capacity > cap) {
    redirect(`/trainer/classes/new?error=capacity_exceeded_${cap}`);
  }
  capacity = Math.min(capacity, cap);

  const sb = createClient();

  // Default the new class to the trainer's home location (or the first one
  // available if the trainer hasn't set one yet).
  let locationId = trainer.home_location_id ?? null;
  if (!locationId) {
    const { data: anyLoc } = await sb.from("locations").select("id").limit(1).maybeSingle();
    locationId = (anyLoc as { id?: string } | null)?.id ?? null;
  }

  const { data, error } = await sb
    .from("classes")
    .insert({
      slug: slugify(name) + "-" + startsAt.toISOString().slice(0, 10),
      location_id: locationId,
      trainer_id: trainer.id,
      name,
      kind,
      starts_at: startsAt.toISOString(),
      duration_min: durationMin,
      capacity,
      booked: 0,
      intensity,
      room,
      hero_image: heroImage,
      price_cents: priceCents,
      requires_payment: priceCents > 0,
      summary,
      what_to_bring: whatToBring,
      has_equipment: hasEquipment,
      mirrored_layout: mirroredLayout,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/trainer/classes/new?error=${encodeURIComponent(error?.message ?? "Create failed")}`);
  }

  revalidatePath("/classes");
  revalidatePath("/gym");
  revalidatePath("/trainer/dashboard");
  redirect(`/classes/${data!.id}?created=1`);
}
