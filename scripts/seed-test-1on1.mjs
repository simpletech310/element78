#!/usr/bin/env node
// One-off: create a confirmed video 1-on-1 between wilform.thomas@gmail.com and
// a real human coach, with a Daily.co room, joinable for the next 4 hours.
// For testing only — paid_status=free so no Stripe involved.

import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DAILY_KEY = process.env.DAILY_API_KEY;
if (!SB_URL || !SB_KEY) throw new Error("missing supabase env");
if (!DAILY_KEY) throw new Error("missing DAILY_API_KEY");

const sbHeaders = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function sbGet(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbHeaders });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}
async function sbPost(path, body) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: sbHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

// 1. Find user.
const usersRes = await fetch(`${SB_URL}/auth/v1/admin/users?per_page=200`, {
  headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
});
if (!usersRes.ok) throw new Error(`auth users: ${usersRes.status} ${await usersRes.text()}`);
const usersBody = await usersRes.json();
const users = usersBody.users ?? usersBody;
const target = users.find(
  (u) => (u.email ?? "").toLowerCase() === "wilform.thomas@gmail.com",
);
if (!target) throw new Error("wilform.thomas@gmail.com not found in auth.users");
console.log("user:", target.id, target.email);

// 2. Pick a human coach who is not the user themselves and has video sessions on.
const trainers = await sbGet(
  "trainers?select=id,slug,name,is_ai,auth_user_id",
);
const humanTrainers = trainers.filter(
  (t) => !t.is_ai && t.auth_user_id !== target.id,
);
let chosen = null;
let chosenSettings = null;
for (const t of humanTrainers) {
  const settings = await sbGet(
    `trainer_session_settings?trainer_id=eq.${t.id}&select=*`,
  );
  if (settings.length > 0 && (settings[0].modes ?? []).includes("video")) {
    chosen = t;
    chosenSettings = settings[0];
    break;
  }
}
if (!chosen) {
  // Fallback: just pick the first non-AI trainer and accept any settings.
  chosen = humanTrainers[0];
  if (!chosen) throw new Error("no human trainers in db");
  const settings = await sbGet(
    `trainer_session_settings?trainer_id=eq.${chosen.id}&select=*`,
  );
  chosenSettings = settings[0] ?? null;
}
console.log("coach:", chosen.slug, chosen.name);

// 3. Compute window: now → now + 4h.
const startsAt = new Date(Date.now() + 60_000); // +1 min so nbf math has slack
const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60_000);

// 4. Create Daily.co room.
const bookingNonce = `test-${Date.now().toString(36)}`;
const roomName = `e78-test-${bookingNonce}`.slice(0, 40);
const nbf = Math.floor(startsAt.getTime() / 1000) - 600;
const exp = Math.floor(endsAt.getTime() / 1000) + 1800;
const dailyRes = await fetch("https://api.daily.co/v1/rooms", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${DAILY_KEY}`,
  },
  body: JSON.stringify({
    name: roomName,
    privacy: "private",
    properties: {
      nbf,
      exp,
      enable_chat: true,
      enable_screenshare: true,
      start_video_off: false,
      start_audio_off: false,
    },
  }),
});
if (!dailyRes.ok) {
  throw new Error(`daily room create: ${dailyRes.status} ${await dailyRes.text()}`);
}
const dailyBody = await dailyRes.json();
const roomUrl = dailyBody.url ?? `https://element78.daily.co/${dailyBody.name}`;
console.log("daily room:", dailyBody.name, roomUrl);

// 5. Insert trainer_sessions parent row (capacity=1, confirmed).
const [sessionRow] = await sbPost("trainer_sessions", {
  trainer_id: chosen.id,
  starts_at: startsAt.toISOString(),
  ends_at: endsAt.toISOString(),
  mode: "video",
  capacity: 1,
  price_cents: 0,
  status: "confirmed",
  is_group: false,
  video_provider: "daily",
  video_room_url: roomUrl,
  video_room_name: dailyBody.name,
});
console.log("session:", sessionRow.id);

// 6. Insert trainer_bookings row (status=confirmed, paid_status=free).
const [bookingRow] = await sbPost("trainer_bookings", {
  trainer_id: chosen.id,
  user_id: target.id,
  session_id: sessionRow.id,
  starts_at: startsAt.toISOString(),
  ends_at: endsAt.toISOString(),
  mode: "video",
  status: "confirmed",
  paid_status: "free",
  price_cents: 0,
  client_goals: "Video call test (4-hour window)",
  video_provider: "daily",
  video_room_url: roomUrl,
  video_room_name: dailyBody.name,
});
console.log("booking:", bookingRow.id);

console.log("\n✅ Done.");
console.log("Client:    https://element78.vercel.app/account/sessions");
console.log("Trainer:   https://element78.vercel.app/trainer/dashboard");
console.log("Direct:    https://element78.vercel.app/train/session/" + bookingRow.id);
console.log("Daily URL: " + roomUrl);
console.log(`Joinable:  ${startsAt.toISOString()} → ${endsAt.toISOString()}`);
