"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { uploadImageToBucket } from "@/lib/supabase/storage";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || `c-${Date.now()}`;
}

async function gateCoach(returnPath: string) {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/trainer/dashboard?error=coach_only");
  return { user, trainer };
}

async function uploadOptionalHero(formData: FormData, userId: string): Promise<string | null> {
  const file = formData.get("hero_image_file");
  if (file instanceof File && file.size > 0) {
    const { url } = await uploadImageToBucket("program-images", file, userId);
    return url;
  }
  const url = String(formData.get("hero_image_url") ?? "").trim();
  return url || null;
}

/* -------------------------------------------------------------------------- */
/*  Challenges                                                                */
/* -------------------------------------------------------------------------- */

export async function createChallengeAction(formData: FormData) {
  const { user, trainer } = await gateCoach("/trainer/challenges/new");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect("/trainer/challenges/new?error=title_required");

  const slug = slugify(String(formData.get("slug") ?? "") || title);
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const startsAt = String(formData.get("starts_at") ?? "").trim();
  const endsAt = String(formData.get("ends_at") ?? "").trim();
  if (!startsAt || !endsAt) redirect("/trainer/challenges/new?error=dates_required");

  const tasksRaw = String(formData.get("tasks") ?? "").trim();
  const tasks = tasksRaw
    .split(/\r?\n/)
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .slice(0, 50);
  if (tasks.length === 0) redirect("/trainer/challenges/new?error=tasks_required");

  const heroImage = await uploadOptionalHero(formData, user.id);

  const sb = createClient();
  const { data: created, error } = await sb
    .from("challenges")
    .insert({
      slug,
      title,
      subtitle,
      description,
      hero_image: heroImage,
      author_trainer_id: trainer.id,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      status: "draft",
    })
    .select("id, slug")
    .maybeSingle();
  if (error || !created) redirect("/trainer/challenges/new?error=create_failed");
  const newId = (created as { id: string }).id;

  await sb.from("challenge_tasks").insert(
    tasks.map((label, i) => ({ challenge_id: newId, sort_order: i, label })),
  );

  revalidatePath("/trainer/challenges");
  redirect(`/trainer/challenges/${newId}`);
}

export async function publishChallengeAction(formData: FormData) {
  const { trainer } = await gateCoach("/trainer/challenges");
  const challengeId = String(formData.get("challenge_id") ?? "");
  if (!challengeId) return;
  const sb = createClient();

  const { data: ch } = await sb
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .eq("author_trainer_id", trainer.id)
    .maybeSingle();
  if (!ch) redirect("/trainer/challenges?error=not_found");
  const challenge = ch as { id: string; slug: string; title: string; ends_at: string; status: string; enrollment_count: number };

  if (challenge.status !== "published") {
    await sb.from("challenges").update({ status: "published", updated_at: new Date().toISOString() }).eq("id", challengeId);
  }

  // Auto-post to wall (kind=challenge). PostCard renders the event_tag overlay
  // and links to /challenges/[slug] when meta.challenge_slug is present.
  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const body = `${challenge.title} · ${daysLeft} days · join the family.`;
  await sb.from("posts").insert({
    author_id: trainer.auth_user_id ?? null,
    kind: "challenge",
    body,
    media_url: null,
    media_type: null,
    meta: {
      challenge_slug: challenge.slug,
      event_tag: `CHALLENGE · ${daysLeft} DAYS LEFT`,
      event_cta: "JOIN",
    },
  });

  revalidatePath("/wall");
  revalidatePath("/challenges");
  revalidatePath(`/challenges/${challenge.slug}`);
  redirect(`/trainer/challenges/${challenge.id}?published=1`);
}

/* -------------------------------------------------------------------------- */
/*  Events                                                                    */
/* -------------------------------------------------------------------------- */

export async function createEventAction(formData: FormData) {
  const { user, trainer } = await gateCoach("/trainer/events/new");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect("/trainer/events/new?error=title_required");

  const slug = slugify(String(formData.get("slug") ?? "") || title);
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const locationId = String(formData.get("location_id") ?? "").trim();
  if (!locationId) redirect("/trainer/events/new?error=location_required");
  const startsAt = String(formData.get("starts_at") ?? "").trim();
  if (!startsAt) redirect("/trainer/events/new?error=starts_required");
  const endsAt = String(formData.get("ends_at") ?? "").trim();
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const capacity = capacityRaw ? Math.max(1, Number(capacityRaw)) : null;
  const priceDollars = Number(formData.get("price_dollars") ?? 0);
  const priceCents = Math.round(Math.max(0, priceDollars) * 100);

  const heroImage = await uploadOptionalHero(formData, user.id);

  const sb = createClient();
  const { data: created, error } = await sb
    .from("events")
    .insert({
      slug,
      title,
      subtitle,
      description,
      hero_image: heroImage,
      author_trainer_id: trainer.id,
      location_id: locationId,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      capacity,
      price_cents: priceCents,
      status: "draft",
    })
    .select("id, slug")
    .maybeSingle();
  if (error || !created) redirect("/trainer/events/new?error=create_failed");

  revalidatePath("/trainer/events");
  redirect(`/trainer/events/${(created as { id: string }).id}`);
}

export async function publishEventAction(formData: FormData) {
  const { trainer } = await gateCoach("/trainer/events");
  const eventId = String(formData.get("event_id") ?? "");
  if (!eventId) return;
  const sb = createClient();

  const { data: ev } = await sb
    .from("events")
    .select("*, location:locations!events_location_id_fkey(name, city, state)")
    .eq("id", eventId)
    .eq("author_trainer_id", trainer.id)
    .maybeSingle();
  if (!ev) redirect("/trainer/events?error=not_found");
  const event = ev as {
    id: string; slug: string; title: string; starts_at: string; price_cents: number; status: string;
    location: { name: string; city: string; state: string } | null;
  };

  if (event.status !== "published") {
    await sb.from("events").update({ status: "published", updated_at: new Date().toISOString() }).eq("id", eventId);
  }

  const when = new Date(event.starts_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const where = event.location ? `${event.location.name}` : "the gym";
  const cta = event.price_cents > 0 ? "BUY TICKET" : "RSVP";
  const body = `${event.title} · ${when} · ${where}.`;
  await sb.from("posts").insert({
    author_id: trainer.auth_user_id ?? null,
    kind: "event",
    body,
    media_url: null,
    media_type: null,
    meta: {
      event_slug: event.slug,
      event_tag: `EVENT · ${when.toUpperCase()}`,
      event_cta: cta,
    },
  });

  revalidatePath("/wall");
  revalidatePath("/gym");
  revalidatePath(`/events/${event.slug}`);
  redirect(`/trainer/events/${event.id}?published=1`);
}
