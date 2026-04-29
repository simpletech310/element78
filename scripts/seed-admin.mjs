#!/usr/bin/env node
// Idempotent: flip is_admin=true on the profile of a given email (default
// commonground.notify@gmail.com — the platform owner).

import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SB_KEY) throw new Error("supabase env missing");

const EMAIL = process.argv[2] ?? "commonground.notify@gmail.com";

const lookup = await fetch(`${SB_URL}/auth/v1/admin/users?per_page=200`, {
  headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
});
if (!lookup.ok) throw new Error(`auth list: ${lookup.status} ${await lookup.text()}`);
const body = await lookup.json();
const users = body.users ?? body;
const target = users.find((u) => (u.email ?? "").toLowerCase() === EMAIL.toLowerCase());
if (!target) throw new Error(`no auth user with email ${EMAIL}`);

const patchRes = await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${target.id}`, {
  method: "PATCH",
  headers: {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: JSON.stringify({ is_admin: true }),
});
if (!patchRes.ok) throw new Error(`profiles PATCH: ${patchRes.status} ${await patchRes.text()}`);
const result = await patchRes.json();
if (!Array.isArray(result) || result.length === 0) throw new Error("no profile row matched — sign in once first");

console.log(`✅ ${EMAIL} (${target.id}) is now admin.`);
console.log(`Visit: https://element78.vercel.app/admin`);
