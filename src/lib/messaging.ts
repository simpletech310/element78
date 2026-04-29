/**
 * Direct messaging primitives. Threads are stored as canonical (a,b) pairs
 * sorted, so dedupe is automatic regardless of who initiates.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Thread, Message } from "@/lib/data/types";

function sortPair(a: string, b: string): { participant_a: string; participant_b: string } {
  return a < b
    ? { participant_a: a, participant_b: b }
    : { participant_a: b, participant_b: a };
}

/** Find or create the thread between two users. Idempotent. */
export async function ensureThread(userA: string, userB: string): Promise<Thread> {
  if (userA === userB) throw new Error("cannot DM yourself");
  const pair = sortPair(userA, userB);
  // Use admin client because the unique-pair upsert needs to read both
  // sides regardless of which participant the caller is. The action layer
  // is responsible for verifying that the caller is one of the two.
  const sb = createAdminClient();
  const { data: existing } = await sb
    .from("threads")
    .select("*")
    .eq("participant_a", pair.participant_a)
    .eq("participant_b", pair.participant_b)
    .maybeSingle();
  if (existing) return existing as Thread;

  const { data: inserted, error } = await sb.from("threads").insert(pair).select("*").single();
  if (error) {
    // Race: another request created the thread first. Re-fetch.
    const { data } = await sb
      .from("threads")
      .select("*")
      .eq("participant_a", pair.participant_a)
      .eq("participant_b", pair.participant_b)
      .maybeSingle();
    if (data) return data as Thread;
    throw error;
  }
  return inserted as Thread;
}

export async function listThreadsForUser(userId: string): Promise<Array<{
  thread: Thread;
  other_id: string;
  unread_count: number;
}>> {
  const sb = createClient();
  const { data: rows } = await sb
    .from("threads")
    .select("*")
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });
  const threads = (rows as Thread[]) ?? [];
  if (threads.length === 0) return [];
  // Unread counts: messages in these threads that the OTHER party sent and
  // current user hasn't read.
  const ids = threads.map(t => t.id);
  const { data: msgs } = await sb
    .from("messages")
    .select("thread_id, sender_id, read_at")
    .in("thread_id", ids)
    .neq("sender_id", userId)
    .is("read_at", null);
  const counts = new Map<string, number>();
  for (const m of (msgs as Array<{ thread_id: string }>) ?? []) {
    counts.set(m.thread_id, (counts.get(m.thread_id) ?? 0) + 1);
  }
  return threads.map(t => ({
    thread: t,
    other_id: t.participant_a === userId ? t.participant_b : t.participant_a,
    unread_count: counts.get(t.id) ?? 0,
  }));
}

export async function listMessagesInThread(threadId: string): Promise<Message[]> {
  const sb = createClient();
  const { data } = await sb
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(500);
  return (data as Message[]) ?? [];
}

/** Mark every other-sent unread message in a thread as read. */
export async function markThreadRead(threadId: string, viewerId: string): Promise<void> {
  const sb = createClient();
  await sb
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .neq("sender_id", viewerId)
    .is("read_at", null);
}
