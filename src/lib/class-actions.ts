"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

/**
 * Reserve a spot in a class. Free classes book instantly. Paid classes
 * create a 'pending' booking — Stripe is the v2 step; for now we display
 * a "pay at check-in" notice on the confirmation page.
 */
export async function bookClassAction(formData: FormData) {
  const classId = String(formData.get("class_id") ?? "");
  const requiresPayment = String(formData.get("requires_payment") ?? "false") === "true";
  const priceCents = Number(formData.get("price_cents") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const user = await getUser();
  if (!user) redirect(`/login?next=/classes/${classId}`);

  const sb = createClient();

  // Capacity check before booking
  const { data: cls } = await sb.from("classes").select("id, capacity, booked").eq("id", classId).single();
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

  if (existing) {
    if (existing.status === "cancelled") {
      await sb.from("bookings").update({
        status: "reserved",
        paid_status,
        price_cents_paid: priceCents,
        notes,
      }).eq("id", existing.id);
    }
  } else {
    await sb.from("bookings").insert({
      user_id: user.id,
      class_id: classId,
      status: "reserved",
      paid_status,
      price_cents_paid: priceCents,
      surface: "class",
      notes,
    });
    // bump booked count (best effort — racy but fine for v1)
    await sb.from("classes").update({ booked: cls.booked + 1 }).eq("id", classId);
  }

  revalidatePath(`/classes/${classId}`);
  revalidatePath(`/classes`);
  revalidatePath(`/account/history`);
  redirect(`/classes/${classId}?reserved=1`);
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

  revalidatePath(`/classes/${classId}`);
  revalidatePath(`/classes`);
  revalidatePath(`/account/history`);
  redirect(`/classes/${classId}?cancelled=1`);
}
