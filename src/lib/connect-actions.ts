"use server";

import { redirect } from "next/navigation";

function isRedirect(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && (err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT"));
}
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { ensureConnectAccountForTrainer, syncTrainerPayoutStatus } from "@/lib/connect";

export async function connectStartAction() {
  const user = await getUser();
  if (!user) redirect("/login?next=/trainer/onboarding/connect");
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/trainer/dashboard?error=not_a_coach");

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let onboardingUrl: string;
  try {
    const result = await ensureConnectAccountForTrainer(
      trainer.id,
      user.email ?? `${trainer.slug}@element78.test`,
      `${origin}/trainer/onboarding/connect`,
      `${origin}/trainer/onboarding/connect?return=1`,
    );
    onboardingUrl = result.onboardingUrl;
  } catch (err) {
    // Don't swallow Stripe errors — surface them so the coach (and we) can
    // see what went wrong instead of a silent failed redirect.
    if (isRedirect(err)) throw err;
    const message = (err as Error).message || "stripe_unavailable";
    console.error("[connect] onboarding failed", err);
    redirect(`/trainer/onboarding/connect?error=${encodeURIComponent(message)}`);
  }
  redirect(onboardingUrl);
}

export async function syncConnectStatusAction() {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) return;
  await syncTrainerPayoutStatus(trainer.id);
  revalidatePath("/trainer/onboarding/connect");
  revalidatePath("/trainer/dashboard");
}
