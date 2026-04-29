#!/usr/bin/env node
// One-off: ensure trainer 'kai-brooks' has an auth.users login + linked
// trainers.auth_user_id. Idempotent — re-running just prints credentials.

import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SB_KEY) throw new Error("missing supabase env");

const sbHeaders = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const TRAINER_SLUG = "kai-brooks";
const EMAIL = "kai@element78.test";
const PASSWORD = "Element78Coach!";

// 1. Ensure trainer row exists.
const trainerRes = await fetch(
  `${SB_URL}/rest/v1/trainers?slug=eq.${TRAINER_SLUG}&select=id,name,auth_user_id`,
  { headers: sbHeaders },
);
if (!trainerRes.ok) throw new Error(`trainers GET: ${trainerRes.status} ${await trainerRes.text()}`);
const [trainer] = await trainerRes.json();
if (!trainer) throw new Error(`trainer slug=${TRAINER_SLUG} not found`);
console.log("trainer:", trainer.id, trainer.name);

// 2. Find or create the auth user.
let userId = trainer.auth_user_id;
if (!userId) {
  // Look up by email first.
  const lookup = await fetch(
    `${SB_URL}/auth/v1/admin/users?per_page=200`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
  );
  if (!lookup.ok) throw new Error(`auth list: ${lookup.status} ${await lookup.text()}`);
  const body = await lookup.json();
  const users = body.users ?? body;
  const existing = users.find((u) => (u.email ?? "").toLowerCase() === EMAIL);
  if (existing) {
    userId = existing.id;
    console.log("found existing auth user:", userId);
    // Reset password just in case.
    const updRes = await fetch(`${SB_URL}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ password: PASSWORD, email_confirm: true }),
    });
    if (!updRes.ok) console.warn("password reset:", updRes.status, await updRes.text());
  } else {
    const createRes = await fetch(`${SB_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: trainer.name },
      }),
    });
    if (!createRes.ok) throw new Error(`auth create: ${createRes.status} ${await createRes.text()}`);
    const u = await createRes.json();
    userId = u.id;
    console.log("created auth user:", userId);
  }
}

// 3. Link trainer row.
const linkRes = await fetch(
  `${SB_URL}/rest/v1/trainers?id=eq.${trainer.id}`,
  {
    method: "PATCH",
    headers: sbHeaders,
    body: JSON.stringify({ auth_user_id: userId }),
  },
);
if (!linkRes.ok) throw new Error(`trainers PATCH: ${linkRes.status} ${await linkRes.text()}`);
console.log("linked trainer.auth_user_id =", userId);

// 4. Make sure profile row exists (needed for header bubble).
const profilePayload = { id: userId, display_name: trainer.name };
const profileRes = await fetch(`${SB_URL}/rest/v1/profiles?on_conflict=id`, {
  method: "POST",
  headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify(profilePayload),
});
if (!profileRes.ok) console.warn("profile upsert:", profileRes.status, await profileRes.text());

console.log("\n✅ Coach login ready.");
console.log("URL:      https://element78.vercel.app/login?next=/trainer/dashboard");
console.log("Email:   ", EMAIL);
console.log("Password:", PASSWORD);
