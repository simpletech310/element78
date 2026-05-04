/**
 * Web push fan-out. Loads every push_subscriptions row for a given user
 * and posts an encrypted payload to each via the web-push library. The
 * VAPID key pair is read from env at first call:
 *
 *   VAPID_PUBLIC_KEY    — also exposed to clients via NEXT_PUBLIC_VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY   — server only
 *   VAPID_SUBJECT       — mailto: or https:// identifying you to push services
 *
 * If any are missing we no-op silently — push is opt-in infrastructure, the
 * in-app `notifications` table still gets the row regardless. Generate a
 * fresh pair with: `npx web-push generate-vapid-keys --json`.
 *
 * Stale subscription cleanup: if a push attempt comes back 404 / 410 the
 * endpoint is dead (browser uninstall, expired). We delete the row so we
 * don't keep retrying.
 */
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let vapidConfigured: boolean | null = null;

function ensureVapid(): boolean {
  if (vapidConfigured !== null) return vapidConfigured;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT ?? "mailto:hello@element78.com";
  if (!pub || !priv) {
    vapidConfigured = false;
    return false;
  }
  try {
    webpush.setVapidDetails(subj, pub, priv);
    vapidConfigured = true;
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[push] VAPID setup failed:", (err as Error).message);
    vapidConfigured = false;
    return false;
  }
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  /** Used by the SW to set requireInteraction for live-call alerts. */
  kind?: string;
};

/**
 * Send `payload` to every push subscription owned by `userId`. Best-effort —
 * never throws; failures are logged. Returns the number of successful sends
 * so callers can decide whether to fall back to email/SMS later.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!ensureVapid()) return 0;

  const admin = createAdminClient();
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (error || !subs || subs.length === 0) return 0;

  const body = JSON.stringify(payload);
  let sent = 0;

  await Promise.all(
    (subs as Array<{ id: string; endpoint: string; p256dh: string; auth: string }>).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Subscription is gone for good — clean up so we stop retrying.
          await admin.from("push_subscriptions").delete().eq("id", s.id);
        } else {
          // eslint-disable-next-line no-console
          console.warn(`[push] send failed for sub ${s.id}: status=${status} msg=${(err as Error).message}`);
        }
      }
    }),
  );

  // Touch last_seen_at so cleanup jobs can prune dormant rows later.
  if (sent > 0) {
    await admin
      .from("push_subscriptions")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("user_id", userId);
  }

  return sent;
}
