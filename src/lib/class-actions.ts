"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { createPurchaseAndCheckout, refundPurchase } from "@/lib/purchases";
import { requireWaivers } from "@/lib/waivers";

/**
 * Reserve a spot in a class. Free classes book instantly. Paid classes
 * create a 'pending' booking, then route through the unified Stripe
 * checkout helper — the webhook flips paid_status to 'paid' on confirmation.
 */
export async function bookClassAction(formData: FormData) {
  const classId = String(formData.get("class_id") ?? "");
  const requiresPayment = String(formData.get("requires_payment") ?? "false") === "true";
  const priceCents = Number(formData.get("price_cents") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const spotRaw = formData.get("spot_number");
  const spot_number = spotRaw ? Number(spotRaw) : null;
  const returnTo = String(formData.get("return_to") ?? "");

  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo || `/classes/${classId}`)}`);

  await requireWaivers(user.id, returnTo || `/classes/${classId}`);

  const sb = createClient();

  // Capacity check before booking
  const { data: cls } = await sb
    .from("classes")
    .select("id, capacity, booked, name, trainer_id")
    .eq("id", classId)
    .single();
  if (!cls) redirect(`/classes/${classId}?error=${encodeURIComponent("Class not found")}`);
  if (cls.booked >= cls.capacity) {
    redirect(`/classes/${classId}?error=${encodeURIComponent("Class is full — added to waitlist instead")}&waitlist=1`);
  }

  const paid_status = requiresPayment ? "pending" : "free";

  // Idempotent: re-booking the same class just refreshes the existing row
  const { data: existing } = await sb
    .from("bookings")
    .select("*")
    .eq("user_id", user.id)
    .eq("class_id", classId)
    .maybeSingle();

  // Track the booking id + whether this was a brand-new insert (only new
  // inserts trigger Stripe checkout; spot-update on a confirmed booking does not).
  let bookingId: string | null = null;
  let newlyCreated = false;

  if (existing) {
    if (existing.status === "cancelled") {
      await sb.from("bookings").update({
        status: "reserved",
        paid_status,
        price_cents_paid: priceCents,
        notes,
        spot_number,
      }).eq("id", existing.id);
      bookingId = existing.id;
      // Re-activation of a cancelled booking is not a new payment per the spec
      // (the original purchase, if any, was refunded on cancel).
      newlyCreated = false;
    } else if (spot_number !== null && existing.spot_number !== spot_number) {
      // Existing reservation, just update the seat
      await sb.from("bookings").update({ spot_number }).eq("id", existing.id);
      bookingId = existing.id;
      newlyCreated = false;
    } else {
      bookingId = existing.id;
      newlyCreated = false;
    }
  } else {
    const { data: inserted } = await sb
      .from("bookings")
      .insert({
        user_id: user.id,
        class_id: classId,
        status: "reserved",
        paid_status,
        price_cents_paid: priceCents,
        surface: "class",
        notes,
        spot_number,
      })
      .select("id")
      .single();
    bookingId = inserted?.id ?? null;
    newlyCreated = true;
    // bump booked count (best effort — racy but fine for v1)
    await sb.from("classes").update({ booked: cls.booked + 1 }).eq("id", classId);
  }

  revalidatePath(`/classes/${classId}`);
  revalidatePath(`/classes`);
  revalidatePath(`/gym/classes/${classId}`);
  revalidatePath(`/gym`);
  revalidatePath(`/home`);
  revalidatePath(`/account/history`);

  // Paid + brand-new booking → Stripe checkout. Compute the URL BEFORE the
  // redirect call (redirect() throws, so anything after it is unreachable).
  if (requiresPayment && newlyCreated && bookingId) {
    const className = (cls as { name?: string | null }).name ?? null;
    const { checkoutUrl } = await createPurchaseAndCheckout({
      userId: user.id,
      kind: "class_booking",
      amountCents: priceCents,
      description: className ? `Class reservation — ${className}` : "Class reservation",
      refIds: { class_booking_id: bookingId },
      successPath: `/classes/${classId}?reserved=1${spot_number ? `&spot=${spot_number}` : ""}`,
      cancelPath: `/classes/${classId}`,
      trainerId: (cls as { trainer_id?: string | null }).trainer_id ?? null,
    });
    redirect(checkoutUrl);
  }

  redirect(`${returnTo || `/classes/${classId}`}?reserved=1${spot_number ? `&spot=${spot_number}` : ""}`);
}

export async function cancelBookingAction(formData: FormData) {
  const bookingId = String(formData.get("booking_id") ?? "");
  const classId = String(formData.get("class_id") ?? "");

  const user = await getUser();
  if (!user) redirect("/login");

  const sb = createClient();

  // Find the booking and confirm ownership
  const { data: booking } = await sb.from("bookings").select("*").eq("id", bookingId).eq("user_id", user.id).maybeSingle();
  if (!booking) redirect(`/classes/${classId}?error=${encodeURIComponent("Booking not found")}`);

  await sb.from("bookings").update({
    status: "cancelled",
    paid_status: booking.paid_status === "paid" ? "refunded" : "cancelled",
  }).eq("id", bookingId);

  // Decrement booked (best effort)
  const { data: cls } = await sb.from("classes").select("booked").eq("id", classId).single();
  if (cls) {
    await sb.from("classes").update({ booked: Math.max(0, cls.booked - 1) }).eq("id", classId);
  }

  // If this booking was paid via Stripe, refund the linked purchase row.
  const { data: linkedPurchase } = await sb
    .from("purchases")
    .select("id, status")
    .eq("class_booking_id", bookingId)
    .maybeSingle();
  if (linkedPurchase && linkedPurchase.status === "paid") {
    await refundPurchase(linkedPurchase.id, { reason: "requested_by_customer" });
  }

  // Auto-promote the next waitlisted person, oldest waitlist_position first.
  const { data: nextWaitlist } = await sb
    .from("bookings")
    .select("id, user_id")
    .eq("class_id", classId)
    .eq("status", "waitlist")
    .order("waitlist_position", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (nextWaitlist) {
    const promo = nextWaitlist as { id: string; user_id: string };
    // Promote: status → reserved, paid_status stays whatever it was on
    // waitlist (typically "free" — we don't pre-charge waitlists). Booked
    // count compensates immediately.
    await sb.from("bookings").update({
      status: "reserved",
      waitlist_position: null,
      waitlisted_at: null,
    }).eq("id", promo.id);
    if (cls) {
      // We just decremented; promotion takes the spot back.
      await sb.from("classes").update({ booked: Math.max(0, cls.booked) }).eq("id", classId);
    }
  }

  revalidatePath(`/classes/${classId}`);
  revalidatePath(`/classes`);
  revalidatePath(`/account/history`);
  redirect(`/classes/${classId}?cancelled=1`);
}

/** Add the current user to a class's waitlist. Idempotent. */
export async function joinWaitlistAction(formData: FormData) {
  const classId = String(formData.get("class_id") ?? "");
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/classes/${classId}`)}`);

  const sb = createClient();
  const { data: existing } = await sb.from("bookings").select("id, status").eq("user_id", user.id).eq("class_id", classId).maybeSingle();
  if (existing) {
    if ((existing as { status: string }).status === "waitlist") {
      redirect(`/classes/${classId}?waitlist=already`);
    }
    redirect(`/classes/${classId}?error=${encodeURIComponent("You already have a booking here")}`);
  }

  // Position = current count of waitlisted entries + 1.
  const { count } = await sb
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId)
    .eq("status", "waitlist");
  const position = (count ?? 0) + 1;

  await sb.from("bookings").insert({
    user_id: user.id,
    class_id: classId,
    status: "waitlist",
    paid_status: "free",
    price_cents_paid: 0,
    surface: "class",
    waitlist_position: position,
    waitlisted_at: new Date().toISOString(),
  });

  revalidatePath(`/classes/${classId}`);
  redirect(`/classes/${classId}?waitlist=joined`);
}

/** Leave a waitlist entry (user only). */
export async function leaveWaitlistAction(formData: FormData) {
  const classId = String(formData.get("class_id") ?? "");
  const user = await getUser();
  if (!user) redirect("/login");

  const sb = createClient();
  await sb.from("bookings").delete().eq("user_id", user.id).eq("class_id", classId).eq("status", "waitlist");
  revalidatePath(`/classes/${classId}`);
  redirect(`/classes/${classId}?waitlist=left`);
}
