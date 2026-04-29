"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const PARQ_QUESTION_KEYS = [
  "heart_condition",
  "chest_pain",
  "dizziness",
  "joint_problem",
  "blood_pressure_meds",
  "doctor_says_no",
  "pregnant_postpartum",
];

export async function signWaiversAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/waiver");

  const signature = String(formData.get("signature_text") ?? "").trim();
  const consent = formData.get("consent") === "on";
  const next = String(formData.get("next") ?? "/account").trim() || "/account";

  if (!signature || !consent) {
    redirect(`/account/waiver?error=signature_required&next=${encodeURIComponent(next)}`);
  }

  const parqAnswers: Record<string, string> = {};
  for (const k of PARQ_QUESTION_KEYS) {
    parqAnswers[k] = String(formData.get(`parq_${k}`) ?? "no");
  }

  const h = headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ua = h.get("user-agent") ?? null;

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Expire any prior live waiver (the unique partial index requires expires_at IS NULL).
  await admin
    .from("waivers")
    .update({ expires_at: now })
    .eq("user_id", user.id)
    .in("kind", ["parq", "liability"])
    .is("expires_at", null);

  const { error } = await admin.from("waivers").insert([
    {
      user_id: user.id,
      kind: "parq",
      signature_text: signature,
      parq_answers: parqAnswers,
      ip_address: ip,
      user_agent: ua,
    },
    {
      user_id: user.id,
      kind: "liability",
      signature_text: signature,
      parq_answers: null,
      ip_address: ip,
      user_agent: ua,
    },
  ]);
  if (error) {
    redirect(`/account/waiver?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  revalidatePath("/account");
  revalidatePath("/account/waiver");
  redirect(next);
}
