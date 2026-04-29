"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { ensureConnectAccountForTrainer, syncTrainerPayoutStatus } from "@/lib/connect";

export async function connectStartAction() {
  const user = await getUser();
  if (!user) redirect("/login?next=/trainer/onboarding/connect");
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/trainer/dashboard?error=not_a_trainer");

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { onboardingUrl } = await ensureConnectAccountForTrainer(
    trainer.id,
    user.email ?? `${trainer.slug}@element78.test`,
    `${origin}/trainer/onboarding/connect`,
    `${origin}/trainer/onboarding/connect?return=1`,
  );
  redirect(onboardingUrl);
}

export async function syncConnectStatusAction() {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) return;
  await syncTrainerPayoutStatus(trainer.id);
  revalidatePath("/trainer/onboarding/connect");
  revalidatePath("/trainer/dashboard");
}
