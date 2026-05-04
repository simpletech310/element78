"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";

/**
 * Persist a browser PushSubscription for the current user. The browser
 * already calls pushManager.subscribe() with the VAPID public key; here we
 * just stash the resulting endpoint + keys so the server-side push.ts can
 * fan out later. Idempotent on endpoint (unique index handles the upsert).
 *
 * Two roles ship: 'member' for /home users, 'coach' for trainers viewing
 * /trainer/* paths. Same auth user can have both — say a coach who also
 * trains as a member — and we'll target the right install.
 */
export async function subscribeToPushAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");

  const endpoint = String(formData.get("endpoint") ?? "").trim();
  const p256dh = String(formData.get("p256dh") ?? "").trim();
  const auth = String(formData.get("auth") ?? "").trim();
  const userAgent = String(formData.get("user_agent") ?? "").trim() || null;
  if (!endpoint || !p256dh || !auth) {
    throw new Error("missing_fields");
  }

  // Detect role from coach status — easier and more reliable than trusting
  // the client to tell us. The same auth user can subscribe twice (once as
  // member, once as coach) from different installs since the endpoint
  // differs per browser/device.
  const trainer = await getTrainerForCurrentUser();
  const role = trainer ? "coach" : "member";

  const sb = createClient();
  const { error } = await sb
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent,
        role,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
  if (error) {
    throw new Error(error.message);
  }
}

export async function unsubscribeFromPushAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  const endpoint = String(formData.get("endpoint") ?? "").trim();
  if (!endpoint) return;

  const sb = createClient();
  await sb.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint);
}
