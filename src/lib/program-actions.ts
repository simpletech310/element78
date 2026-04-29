"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { createPurchaseAndCheckout, refundPurchase } from "@/lib/purchases";

/**
 * Enroll the current user in a program. Idempotent — re-enrolling
 * resumes a paused/left enrollment instead of creating a duplicate.
 *
 * Free programs activate immediately. Paid programs create the enrollment
 * in `pending_payment` state and redirect through Stripe Checkout; the
 * webhook flips status to `active` and stamps `started_at` on confirmation.
 */
export async function enrollAction(formData: FormData) {
  const programId = String(formData.get("program_id") ?? "");
  const slug = String(formData.get("program_slug") ?? "");
  const user = await getUser();
  if (!user) redirect(`/login?next=/programs/${slug}`);

  const sb = createClient();

  // Look up program pricing so we know whether to route through Stripe.
  const { data: program } = await sb
    .from("programs")
    .select("id, name, slug, requires_payment, price_cents")
    .eq("id", programId)
    .maybeSingle();
  if (!program) redirect(`/programs/${slug}`);
  const prog = program as { id: string; name: string; slug: string; requires_payment: boolean; price_cents: number };

  const requiresPayment = prog.requires_payment === true;

  // Re-activate if a prior enrollment exists.
  const { data: existing } = await sb
    .from("program_enrollments")
    .select("*")
    .eq("user_id", user.id)
    .eq("program_id", programId)
    .maybeSingle();

  let enrollmentId: string;

  if (existing) {
    const existingRow = existing as { id: string };
    if (requiresPayment) {
      // Reactivate into pending_payment; don't reset started_at — webhook stamps it on confirm.
      await sb
        .from("program_enrollments")
        .update({ status: "pending_payment", completed_at: null })
        .eq("id", existingRow.id);
    } else {
      await sb
        .from("program_enrollments")
        .update({ status: "active", started_at: new Date().toISOString(), completed_at: null })
        .eq("id", existingRow.id);
    }
    enrollmentId = existingRow.id;
  } else {
    const { data: inserted } = await sb
      .from("program_enrollments")
      .insert({
        user_id: user.id,
        program_id: programId,
        status: requiresPayment ? "pending_payment" : "active",
        current_day: 1,
      })
      .select("id")
      .single();
    enrollmentId = (inserted as { id: string }).id;
  }

  if (requiresPayment) {
    const { checkoutUrl } = await createPurchaseAndCheckout({
      userId: user.id,
      kind: "program_enrollment",
      amountCents: prog.price_cents,
      description: `Program: ${prog.name}`,
      refIds: { program_enrollment_id: enrollmentId },
      successPath: `/programs/${slug}?enrolled=1`,
      cancelPath: `/programs/${slug}`,
    });
    redirect(checkoutUrl);
  }

  revalidatePath(`/programs/${slug}`);
  redirect(`/programs/${slug}`);
}

/** Mark today's session complete and advance current_day. */
export async function completeSessionAction(formData: FormData) {
  const enrollmentId = String(formData.get("enrollment_id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "");
  const surface = (String(formData.get("surface") ?? "app") as "app" | "gym" | "class");
  const slug = String(formData.get("program_slug") ?? "");
  const totalSessions = Number(formData.get("total_sessions") ?? 0);
  const dayIndex = Number(formData.get("day_index") ?? 0);

  const user = await getUser();
  if (!user) redirect("/login");

  const sb = createClient();

  // Insert the completion row (idempotent via unique(enrollment_id, session_id))
  await sb.from("program_completions").upsert(
    { enrollment_id: enrollmentId, session_id: sessionId, surface },
    { onConflict: "enrollment_id,session_id" },
  );

  const nextDay = Math.min(totalSessions, Math.max(dayIndex, 0) + 1);
  const completedAll = nextDay >= totalSessions && dayIndex >= totalSessions;

  await sb
    .from("program_enrollments")
    .update({
      current_day: nextDay,
      ...(completedAll ? { status: "completed", completed_at: new Date().toISOString() } : {}),
    })
    .eq("id", enrollmentId);

  revalidatePath(`/programs/${slug}`);
  revalidatePath("/account/history");
}

/**
 * Called by the RoutinePlayer when it reaches phase=done while running in a
 * program context. Writes a program_completion row with source='routine'.
 * Idempotent — re-completing the same session is a no-op.
 */
export async function markRoutineSessionCompleteAction(formData: FormData) {
  const programSessionId = String(formData.get("program_session_id") ?? "");
  const programSlug = String(formData.get("program_slug") ?? "");
  const durationActual = formData.get("duration_actual_min");

  const user = await getUser();
  if (!user) return;
  if (!programSessionId) return;

  const sb = createClient();

  // Look up the program for this session, find user's active enrollment.
  const { data: session } = await sb
    .from("program_sessions")
    .select("id, program_id")
    .eq("id", programSessionId)
    .maybeSingle();
  if (!session) return;

  const { data: enrollment } = await sb
    .from("program_enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("program_id", (session as { program_id: string }).program_id)
    .eq("status", "active")
    .maybeSingle();
  if (!enrollment) return;

  await sb.from("program_completions").upsert(
    {
      enrollment_id: (enrollment as { id: string }).id,
      session_id: programSessionId,
      source: "routine",
      surface: "app",
      duration_actual_min: durationActual ? Number(durationActual) : null,
    },
    { onConflict: "enrollment_id,session_id" },
  );

  if (programSlug) revalidatePath(`/programs/${programSlug}`);
  revalidatePath("/account/history");
}

export async function leaveAction(formData: FormData) {
  const enrollmentId = String(formData.get("enrollment_id") ?? "");
  const slug = String(formData.get("program_slug") ?? "");
  const user = await getUser();
  if (!user) redirect("/login");

  const sb = createClient();
  await sb.from("program_enrollments").update({ status: "left" }).eq("id", enrollmentId);

  // If this enrollment was paid for, kick off a Stripe refund. The refund call
  // is best-effort — purchases.ts swallows Stripe errors so local state still
  // reflects the leave.
  const { data: paidPurchase } = await sb
    .from("purchases")
    .select("id")
    .eq("program_enrollment_id", enrollmentId)
    .eq("status", "paid")
    .maybeSingle();
  if (paidPurchase) {
    await refundPurchase((paidPurchase as { id: string }).id, { reason: "requested_by_customer" });
  }

  revalidatePath(`/programs/${slug}`);
  revalidatePath("/account/history");
}
