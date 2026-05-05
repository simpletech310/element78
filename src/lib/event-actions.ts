"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPurchaseAndCheckout } from "@/lib/purchases";

async function gate(returnPath = "/events") {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  return user;
}

async function loadEvent(eventId: string) {
  const sb = createClient();
  const { data } = await sb.from("events").select("*").eq("id", eventId).maybeSingle();
  return (data as null | {
    id: string; slug: string; title: string; status: string;
    capacity: number | null; price_cents: number; rsvp_count: number;
    author_trainer_id: string | null;
  });
}

export async function rsvpFreeEventAction(formData: FormData): Promise<void> {
  const user = await gate();
  const eventId = String(formData.get("event_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!eventId) return;
  const event = await loadEvent(eventId);
  if (!event || event.status !== "published") redirect(`/events/${slug}?error=not_open`);
  if (event.price_cents > 0) redirect(`/events/${slug}?error=ticketed`);
  if (event.capacity !== null && event.rsvp_count >= event.capacity) redirect(`/events/${slug}?error=sold_out`);

  const sb = createClient();
  // Upsert via insert with on-conflict do nothing — unique (event_id, user_id) guards dupes.
  // Then flip status to 'rsvp' in case they had previously cancelled.
  await sb.from("event_rsvps").upsert(
    { event_id: eventId, user_id: user.id, status: "rsvp", updated_at: new Date().toISOString() },
    { onConflict: "event_id,user_id" },
  );
  revalidatePath(`/events/${slug}`);
}

export async function cancelRsvpAction(formData: FormData): Promise<void> {
  const user = await gate();
  const eventId = String(formData.get("event_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!eventId) return;
  const sb = createClient();
  // Free RSVPs just delete; paid tickets aren't cancellable in v1 (no refund flow).
  const { data: rsvp } = await sb
    .from("event_rsvps")
    .select("status")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (rsvp && (rsvp as { status: string }).status === "rsvp") {
    await sb.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", user.id);
  }
  revalidatePath(`/events/${slug}`);
}

export async function buyEventTicketAction(formData: FormData): Promise<void> {
  const user = await gate();
  const eventId = String(formData.get("event_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!eventId) return;
  const event = await loadEvent(eventId);
  if (!event || event.status !== "published") redirect(`/events/${slug}?error=not_open`);
  if (event.price_cents <= 0) redirect(`/events/${slug}?error=free`);
  if (event.capacity !== null && event.rsvp_count >= event.capacity) redirect(`/events/${slug}?error=sold_out`);

  const admin = createAdminClient();
  if (!admin) redirect(`/events/${slug}?error=stripe_unavailable`);

  // Reserve a pending row first; webhook flips to "paid" on checkout.session.completed.
  const { data: rsvp, error: rsvpError } = await admin
    .from("event_rsvps")
    .upsert(
      { event_id: eventId, user_id: user.id, status: "pending_payment", updated_at: new Date().toISOString() },
      { onConflict: "event_id,user_id" },
    )
    .select("id")
    .maybeSingle();
  if (rsvpError || !rsvp) redirect(`/events/${slug}?error=reserve_failed`);
  const rsvpId = (rsvp as { id: string }).id;

  let checkoutUrl: string;
  try {
    // Pass RELATIVE paths — the Stripe provider prefixes them with NEXT_PUBLIC_SITE_URL
    // itself. Passing absolute URLs here doubles up the origin and breaks the
    // post-payment redirect.
    const { purchase, checkoutUrl: url } = await createPurchaseAndCheckout({
      userId: user.id,
      kind: "event_ticket",
      amountCents: event.price_cents,
      description: event.title,
      refIds: {},
      successPath: `/events/${event.slug}?paid=1`,
      cancelPath: `/events/${event.slug}?cancelled=1`,
      trainerId: event.author_trainer_id,
    });
    // Link the rsvp ↔ purchase so fulfillPurchase can flip the rsvp.
    await admin.from("event_rsvps").update({ purchase_id: purchase.id }).eq("id", rsvpId);
    await admin.from("purchases").update({ event_id: eventId, event_rsvp_id: rsvpId }).eq("id", purchase.id);
    checkoutUrl = url;
  } catch (err) {
    redirect(`/events/${slug}?error=checkout_failed`);
  }

  redirect(checkoutUrl);
}
