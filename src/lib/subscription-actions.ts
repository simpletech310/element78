"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import {
  createSubscriptionCheckout,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
} from "@/lib/subscriptions";
import type { SubscriptionTier } from "@/lib/data/types";

export async function subscribeAction(formData: FormData) {
  const tier = String(formData.get("tier") ?? "") as SubscriptionTier;
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/membership/upgrade")}`);
  if (!["premium", "elite"].includes(tier)) {
    redirect("/membership/upgrade?error=invalid_tier");
  }
  const { url } = await createSubscriptionCheckout(
    user.id,
    user.email ?? null,
    tier,
    `/account/membership?upgraded=${tier}`,
    `/membership/upgrade?cancelled=1`,
  );
  redirect(url);
}

export async function cancelSubscriptionAction() {
  const user = await getUser();
  if (!user) redirect("/login");
  await cancelSubscription(user.id);
  revalidatePath("/account/membership");
  redirect("/account/membership?cancelled=1");
}

export async function pauseSubscriptionAction() {
  const user = await getUser();
  if (!user) redirect("/login");
  await pauseSubscription(user.id);
  revalidatePath("/account/membership");
  redirect("/account/membership?paused=1");
}

export async function resumeSubscriptionAction() {
  const user = await getUser();
  if (!user) redirect("/login");
  await resumeSubscription(user.id);
  revalidatePath("/account/membership");
  redirect("/account/membership?resumed=1");
}
