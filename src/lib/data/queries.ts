import { createClient } from "@/lib/supabase/server";
import type {
  Challenge,
  ChallengeEnrollment,
  ChallengeTask,
  ChallengeTaskCompletion,
  ClassRow,
  EventRow,
  EventRsvp,
  Flow,
  HydratedComment,
  HydratedEvent,
  HydratedHighlight,
  HydratedPost,
  LeaderboardRow,
  Location,
  Post,
  Product,
  ProductVariant,
  ProfileLite,
  Trainer,
  Program,
  ProgramSession,
  ProgramEnrollment,
  ProgramCompletion,
  Booking,
  TrainerSessionSettings,
  TrainerAvailabilityRule,
  TrainerAvailabilityBlock,
  TrainerBooking,
  TrainerSessionRow,
} from "./types";
import { fallbackProducts, fallbackClasses, fallbackTrainers, fallbackLocations, fallbackPosts, fallbackHighlights, fallbackPrograms, fallbackProgramSessions, fallbackFlows } from "./fallback";

function isConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Slugs we keep hidden from the catalog without deleting them outright. Lets
// us drop products from the live site without touching the production DB.
const HIDDEN_PRODUCT_SLUGS = new Set(["heavy-flask", "element-bra"]);

export async function listProducts(): Promise<Product[]> {
  if (!isConfigured()) return fallbackProducts.filter(p => !HIDDEN_PRODUCT_SLUGS.has(p.slug));
  const sb = createClient();
  const { data } = await sb.from("products").select("*").order("sort_order", { ascending: true });
  const rows = (data as Product[]) ?? fallbackProducts;
  // Hide admin-deactivated rows + legacy slugs we never want shown to members.
  // Tracked-out-of-stock products (stock_qty = 0) still appear, but the detail
  // page renders them as SOLD OUT instead of hiding them entirely.
  return rows.filter(p => p.in_stock && !HIDDEN_PRODUCT_SLUGS.has(p.slug));
}

export async function getProduct(slug: string): Promise<{ product: Product; variants: ProductVariant[] } | null> {
  if (HIDDEN_PRODUCT_SLUGS.has(slug)) return null;
  if (!isConfigured()) {
    const product = fallbackProducts.find(p => p.slug === slug);
    return product ? { product, variants: [] } : null;
  }
  const sb = createClient();
  const { data: product } = await sb.from("products").select("*").eq("slug", slug).single();
  if (!product) return null;
  const { data: variants } = await sb.from("product_variants").select("*").eq("product_id", product.id);
  return { product: product as Product, variants: (variants as ProductVariant[]) ?? [] };
}

export async function listLocations(): Promise<Location[]> {
  if (!isConfigured()) return fallbackLocations;
  const sb = createClient();
  const { data } = await sb.from("locations").select("*").order("sort_order");
  return (data as Location[]) ?? fallbackLocations;
}

export async function listTrainers(): Promise<Trainer[]> {
  if (!isConfigured()) return fallbackTrainers;
  const sb = createClient();
  const { data } = await sb.from("trainers").select("*").order("name");
  return (data as Trainer[]) ?? fallbackTrainers;
}

export async function getTrainer(slug: string): Promise<Trainer | null> {
  if (!isConfigured()) return fallbackTrainers.find(t => t.slug === slug) ?? null;
  const sb = createClient();
  const { data } = await sb.from("trainers").select("*").eq("slug", slug).single();
  return (data as Trainer) ?? null;
}

export async function listClasses(): Promise<ClassRow[]> {
  if (!isConfigured()) return fallbackClasses;
  const sb = createClient();
  const { data } = await sb.from("classes").select("*").gte("starts_at", new Date().toISOString()).order("starts_at").limit(40);
  return (data as ClassRow[]) ?? fallbackClasses;
}

export async function getClass(id: string): Promise<ClassRow | null> {
  if (!isConfigured()) return fallbackClasses.find(c => c.id === id) ?? null;
  const sb = createClient();
  const { data } = await sb.from("classes").select("*").eq("id", id).single();
  return (data as ClassRow) ?? null;
}

export async function listPrograms(): Promise<Program[]> {
  if (!isConfigured()) return fallbackPrograms;
  const sb = createClient();
  const { data } = await sb.from("programs").select("*").order("sort_order");
  const live = (data as Program[]) ?? [];
  // Surface any fallback programs the prod DB hasn't been seeded with yet so
  // the catalog stays complete during the migration window. Once the rows are
  // in Supabase (see supabase/migrations/0003_more_programs.sql) this becomes
  // a no-op because every slug is already represented.
  const liveSlugs = new Set(live.map(p => p.slug));
  const supplemental = fallbackPrograms.filter(p => !liveSlugs.has(p.slug));
  return [...live, ...supplemental].sort((a, b) => a.sort_order - b.sort_order);
}

export async function getProgram(slug: string): Promise<{ program: Program; sessions: ProgramSession[] } | null> {
  if (!isConfigured()) {
    const program = fallbackPrograms.find(p => p.slug === slug);
    if (!program) return null;
    const sessions = fallbackProgramSessions.filter(s => s.program_id === program.id);
    return { program, sessions };
  }
  const sb = createClient();
  const { data: program } = await sb.from("programs").select("*").eq("slug", slug).maybeSingle();
  if (program) {
    const { data: sessions } = await sb.from("program_sessions").select("*").eq("program_id", program.id).order("day_index");
    return { program: program as Program, sessions: (sessions as ProgramSession[]) ?? [] };
  }
  // Fall back to static program when the DB doesn't have it yet — same merge
  // strategy as listPrograms keeps the detail page reachable for every slug.
  const fb = fallbackPrograms.find(p => p.slug === slug);
  if (!fb) return null;
  const sessions = fallbackProgramSessions.filter(s => s.program_id === fb.id);
  return { program: fb, sessions };
}

export async function getEnrollment(userId: string, programId: string): Promise<ProgramEnrollment | null> {
  if (!isConfigured()) return null;
  const sb = createClient();
  const { data } = await sb.from("program_enrollments").select("*").eq("user_id", userId).eq("program_id", programId).maybeSingle();
  return (data as ProgramEnrollment) ?? null;
}

export async function listUserEnrollments(userId: string): Promise<{ enrollment: ProgramEnrollment; program: Program }[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  // Order by last_opened_at first (most recently visited program), falling
  // back to started_at for older rows that pre-date the column. The home page
  // hero + YOUR PROGRAMS rail rely on this ordering for "pick up where you
  // left off" semantics.
  const { data } = await sb
    .from("program_enrollments")
    .select("*, program:programs(*)")
    .eq("user_id", userId)
    .order("last_opened_at", { ascending: false, nullsFirst: false })
    .order("started_at", { ascending: false });
  if (!data) return [];
  return (data as Array<ProgramEnrollment & { program: Program }>).map(row => ({
    enrollment: {
      id: row.id, user_id: row.user_id, program_id: row.program_id,
      status: row.status, started_at: row.started_at,
      completed_at: row.completed_at, current_day: row.current_day,
      last_opened_at: row.last_opened_at ?? null,
    },
    program: row.program,
  }));
}

export async function listEnrollmentCompletions(enrollmentId: string): Promise<ProgramCompletion[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb.from("program_completions").select("*").eq("enrollment_id", enrollmentId).order("completed_at", { ascending: false });
  return (data as ProgramCompletion[]) ?? [];
}

export async function listTakenSpots(classId: string): Promise<number[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb.from("bookings").select("spot_number").eq("class_id", classId).eq("status", "reserved");
  return ((data as { spot_number: number | null }[]) ?? []).map(r => r.spot_number).filter((n): n is number => typeof n === "number");
}

export async function getUserBookingForClass(userId: string, classId: string): Promise<Booking | null> {
  if (!isConfigured()) return null;
  const sb = createClient();
  const { data } = await sb.from("bookings").select("*").eq("user_id", userId).eq("class_id", classId).maybeSingle();
  return (data as Booking) ?? null;
}

export async function listUserBookings(userId: string): Promise<Array<{ booking: Booking; class: ClassRow }>> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb
    .from("bookings")
    .select("*, class:classes(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!data) return [];
  return (data as Array<Booking & { class: ClassRow }>).map(row => ({
    booking: { id: row.id, user_id: row.user_id, class_id: row.class_id, status: row.status, paid_status: row.paid_status, price_cents_paid: row.price_cents_paid, surface: row.surface, notes: row.notes, spot_number: row.spot_number, created_at: row.created_at },
    class: row.class,
  }));
}

/**
 * Flows by trainer — short solo videos this trainer recorded (or, for AI
 * avatars, sessions modeled on this avatar). No DB table yet; filtered from
 * the fallback list by trainer_id.
 */
export async function listFlowsByTrainer(trainerId: string): Promise<Flow[]> {
  return fallbackFlows.filter(f => f.trainer_id === trainerId);
}

/**
 * Programs led by a trainer. Real query when Supabase is configured;
 * gracefully returns [] if the trainer_id column hasn't been added to
 * production yet (the migration is in supabase/migrations/0002_*).
 */
export async function listProgramsByTrainer(trainerId: string): Promise<Program[]> {
  if (!isConfigured()) return fallbackPrograms.filter(p => p.trainer_id === trainerId);
  const sb = createClient();
  const { data, error } = await sb.from("programs").select("*").eq("trainer_id", trainerId).order("sort_order");
  if (error) return [];
  const live = (data as Program[]) ?? [];
  // Same merge as listPrograms — covers fallback-only programs while the prod
  // table is being backfilled.
  const liveSlugs = new Set(live.map(p => p.slug));
  const supplemental = fallbackPrograms.filter(p => p.trainer_id === trainerId && !liveSlugs.has(p.slug));
  return [...live, ...supplemental].sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Upcoming classes a trainer is teaching, soonest first.
 */
export async function listClassesByTrainer(trainerId: string, limit = 6): Promise<ClassRow[]> {
  if (!isConfigured()) {
    return fallbackClasses
      .filter(c => c.trainer_id === trainerId && new Date(c.starts_at).getTime() >= Date.now())
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
      .slice(0, limit);
  }
  const sb = createClient();
  const { data } = await sb.from("classes").select("*").eq("trainer_id", trainerId).gte("starts_at", new Date().toISOString()).order("starts_at").limit(limit);
  return (data as ClassRow[]) ?? [];
}

/* -------------------------------------------------------------------------- */
/*  Program builder (trainer-authored programs)                               */
/* -------------------------------------------------------------------------- */

export async function listProgramsAuthoredBy(trainerId: string): Promise<Program[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb
    .from("programs")
    .select("*")
    .or(`author_trainer_id.eq.${trainerId},trainer_id.eq.${trainerId}`)
    .order("sort_order");
  return (data as Program[]) ?? [];
}

export async function getProgramById(id: string): Promise<{ program: Program; sessions: ProgramSession[] } | null> {
  if (!isConfigured()) return null;
  const sb = createClient();
  const { data: program } = await sb.from("programs").select("*").eq("id", id).maybeSingle();
  if (!program) return null;
  const { data: sessions } = await sb
    .from("program_sessions")
    .select("*")
    .eq("program_id", id)
    .order("day_index")
    .order("session_index");
  return { program: program as Program, sessions: (sessions as ProgramSession[]) ?? [] };
}

/**
 * Look up unique class slugs (the "class kind" series) so the program builder
 * can let trainers pick which type of class fulfills a day. Pulls from the
 * `classes` table — distinct slug + a representative name.
 */
export async function listClassKinds(): Promise<Array<{ slug: string; name: string; kind: string | null }>> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb.from("classes").select("slug, name, kind").order("slug");
  if (!data) return [];
  const seen = new Map<string, { slug: string; name: string; kind: string | null }>();
  for (const r of data as Array<{ slug: string; name: string; kind: string | null }>) {
    if (!seen.has(r.slug)) seen.set(r.slug, r);
  }
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/* -------------------------------------------------------------------------- */
/*  1-on-1 trainer bookings                                                   */
/* -------------------------------------------------------------------------- */

export async function getTrainerSessionSettings(trainerId: string): Promise<TrainerSessionSettings | null> {
  if (!isConfigured()) return null;
  const sb = createClient();
  const { data } = await sb.from("trainer_session_settings").select("*").eq("trainer_id", trainerId).maybeSingle();
  return (data as TrainerSessionSettings) ?? null;
}

export async function listAvailabilityRules(trainerId: string): Promise<TrainerAvailabilityRule[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb
    .from("trainer_availability_rules")
    .select("*")
    .eq("trainer_id", trainerId)
    .eq("is_active", true)
    .order("weekday")
    .order("start_minute");
  return (data as TrainerAvailabilityRule[]) ?? [];
}

export async function listAllAvailabilityRules(trainerId: string): Promise<TrainerAvailabilityRule[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb
    .from("trainer_availability_rules")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("weekday")
    .order("start_minute");
  return (data as TrainerAvailabilityRule[]) ?? [];
}

export async function listAvailabilityBlocks(
  trainerId: string,
  fromIso: string,
  toIso: string,
): Promise<TrainerAvailabilityBlock[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb
    .from("trainer_availability_blocks")
    .select("*")
    .eq("trainer_id", trainerId)
    .lte("starts_at", toIso)
    .gte("ends_at", fromIso);
  return (data as TrainerAvailabilityBlock[]) ?? [];
}

/**
 * Active bookings (pending or confirmed) for a trainer in a window. Used by
 * the slot generator to subtract already-taken time.
 */
export async function listActiveTrainerBookingsInWindow(
  trainerId: string,
  fromIso: string,
  toIso: string,
): Promise<TrainerBooking[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb
    .from("trainer_bookings")
    .select("*")
    .eq("trainer_id", trainerId)
    .in("status", ["pending_trainer", "confirmed"])
    .gte("starts_at", fromIso)
    .lte("starts_at", toIso)
    .order("starts_at");
  return (data as TrainerBooking[]) ?? [];
}

export async function getTrainerBooking(id: string): Promise<TrainerBooking | null> {
  if (!isConfigured()) return null;
  const sb = createClient();
  const { data } = await sb.from("trainer_bookings").select("*").eq("id", id).maybeSingle();
  return (data as TrainerBooking) ?? null;
}

/**
 * Client-facing list of their own 1-on-1 bookings (any status), trainer joined.
 */
export async function listClientTrainerBookings(
  userId: string,
): Promise<Array<{ booking: TrainerBooking; trainer: Trainer }>> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb
    .from("trainer_bookings")
    .select("*, trainer:trainers(*)")
    .eq("user_id", userId)
    .order("starts_at", { ascending: false });
  if (!data) return [];
  return (data as Array<TrainerBooking & { trainer: Trainer }>).map(row => {
    const { trainer, ...booking } = row;
    return { booking: booking as TrainerBooking, trainer };
  });
}

/**
 * Trainer-facing inbox of 1-on-1 bookings. Group session attendees live in the
 * GROUP SESSIONS surface (`listTrainerOwnedSessions` + roster) and must be
 * excluded here — otherwise every group join would render as a phantom 1-on-1
 * request alongside the actual group roster.
 *
 * Implementation: every booking has a parent `trainer_sessions` row (1-on-1s
 * get a capacity=1 session created in `requestTrainerBookingAction`), so we
 * can't use `session_id IS NULL`. Instead we inner-join on the parent and
 * filter by `is_group=false`. Bookings with no parent session at all (legacy
 * data, before Phase 3) are loaded separately and merged.
 */
export async function listTrainerInbox(
  trainerId: string,
  statuses?: TrainerBooking["status"][],
): Promise<TrainerBooking[]> {
  if (!isConfigured()) return [];
  const sb = createClient();

  // 1-on-1s: bookings whose parent trainer_sessions row is NOT a group.
  let q = sb
    .from("trainer_bookings")
    .select("*, parent_session:trainer_sessions!inner(is_group)")
    .eq("trainer_id", trainerId)
    .eq("parent_session.is_group", false);
  if (statuses && statuses.length > 0) q = q.in("status", statuses);
  const { data: joined } = await q.order("starts_at", { ascending: true });

  // Legacy: bookings without a parent session at all. Should be empty in
  // production but kept for back-compat with pre-Phase 3 rows.
  let qOrphan = sb
    .from("trainer_bookings")
    .select("*")
    .eq("trainer_id", trainerId)
    .is("session_id", null);
  if (statuses && statuses.length > 0) qOrphan = qOrphan.in("status", statuses);
  const { data: orphans } = await qOrphan.order("starts_at", { ascending: true });

  const fromJoin = ((joined as Array<TrainerBooking & { parent_session: unknown }>) ?? []).map(({ parent_session: _ps, ...rest }) => rest as TrainerBooking);
  const fromOrphans = (orphans as TrainerBooking[]) ?? [];
  const seen = new Set<string>();
  const merged: TrainerBooking[] = [];
  for (const b of [...fromJoin, ...fromOrphans]) {
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    merged.push(b);
  }
  merged.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return merged;
}

/**
 * Pre-fetch the metadata IncomingCallAlert needs (one row per upcoming
 * confirmed booking the viewer has) so the realtime payload can be matched
 * against trainer name + session title + routine name without a follow-up
 * fetch from the client. Bounded to bookings within the next 12 hours plus
 * any that already started but haven't been completed yet — the realistic
 * window in which a START SESSION ping could land.
 */
export async function listMemberUpcomingForAlert(
  userId: string,
): Promise<Array<{
  id: string;
  starts_at: string;
  ends_at: string;
  trainer_name: string;
  session_title: string | null;
  routine_name: string | null;
  mode: "video" | "in_person";
  live_started_at: string | null;
}>> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const horizonMs = Date.now() + 12 * 60 * 60 * 1000;
  const lookbackMs = Date.now() - 2 * 60 * 60 * 1000;

  const { data } = await sb
    .from("trainer_bookings")
    .select("id, starts_at, ends_at, mode, routine_slug, live_started_at, status, trainer:trainers(name), parent:trainer_sessions(title)")
    .eq("user_id", userId)
    .in("status", ["confirmed"])
    .gte("starts_at", new Date(lookbackMs).toISOString())
    .lte("starts_at", new Date(horizonMs).toISOString())
    .order("starts_at");

  type Row = {
    id: string;
    starts_at: string;
    ends_at: string;
    mode: "video" | "in_person";
    routine_slug: string | null;
    live_started_at: string | null;
    status: string;
    // Supabase returns nested selects as arrays even for single-row joins.
    trainer: Array<{ name: string }> | { name: string } | null;
    parent: Array<{ title: string | null }> | { title: string | null } | null;
  };
  const { routines } = await import("@/lib/data/routines");
  const byRoutine = new Map(routines.map(r => [r.slug, r.name] as const));

  function unwrap<T>(v: T[] | T | null | undefined): T | null {
    if (!v) return null;
    return Array.isArray(v) ? (v[0] ?? null) : v;
  }

  return ((data as unknown as Row[]) ?? []).map(r => ({
    id: r.id,
    starts_at: r.starts_at,
    ends_at: r.ends_at,
    mode: r.mode,
    trainer_name: unwrap(r.trainer)?.name ?? "Coach",
    session_title: unwrap(r.parent)?.title ?? null,
    routine_name: r.routine_slug ? (byRoutine.get(r.routine_slug) ?? null) : null,
    live_started_at: r.live_started_at,
  }));
}

/**
 * Lightweight profile lookup so the trainer dashboard can show client names
 * next to bookings. Service-role wouldn't be needed if we relied on the
 * profiles RLS policy ("public read profiles") which is already in place.
 */
export async function listProfilesByIds(ids: string[]): Promise<Record<string, { display_name: string | null; handle: string | null; avatar_url: string | null }>> {
  if (!isConfigured() || ids.length === 0) return {};
  const sb = createClient();
  const { data } = await sb.from("profiles").select("id, display_name, handle, avatar_url").in("id", ids);
  const out: Record<string, { display_name: string | null; handle: string | null; avatar_url: string | null }> = {};
  for (const row of (data as Array<{ id: string; display_name: string | null; handle: string | null; avatar_url: string | null }>) ?? []) {
    out[row.id] = { display_name: row.display_name, handle: row.handle, avatar_url: row.avatar_url };
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*  trainer_sessions (parent rows for 1-on-1 + group)                         */
/* -------------------------------------------------------------------------- */

export async function getTrainerSessionRow(id: string): Promise<TrainerSessionRow | null> {
  if (!isConfigured()) return null;
  const sb = createClient();
  const { data } = await sb.from("trainer_sessions").select("*").eq("id", id).maybeSingle();
  return (data as TrainerSessionRow) ?? null;
}

/**
 * Active trainer_sessions for the trainer in a window, used by the slot
 * generator so it doesn't suggest times the trainer already has booked
 * (group or otherwise).
 */
export async function listActiveTrainerSessionsInWindow(
  trainerId: string,
  fromIso: string,
  toIso: string,
): Promise<TrainerSessionRow[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb
    .from("trainer_sessions")
    .select("*")
    .eq("trainer_id", trainerId)
    .in("status", ["open", "full", "confirmed"])
    .gte("starts_at", fromIso)
    .lte("starts_at", toIso)
    .order("starts_at");
  return (data as TrainerSessionRow[]) ?? [];
}

/**
 * Open group sessions for a trainer in a window, plus the live attendee count
 * (confirmed + pending_trainer bookings) so the booking page can render
 * "X of N seats" and gray out full ones.
 */
export async function listOpenGroupSessionsForTrainer(
  trainerId: string,
  fromIso: string,
  toIso: string,
): Promise<Array<{ session: TrainerSessionRow; attendees: number }>> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data: sessions } = await sb
    .from("trainer_sessions")
    .select("*")
    .eq("trainer_id", trainerId)
    .eq("is_group", true)
    .eq("status", "open")
    .gte("starts_at", fromIso)
    .lte("starts_at", toIso)
    .order("starts_at");
  const rows = (sessions as TrainerSessionRow[]) ?? [];
  if (rows.length === 0) return [];

  // One IN-list query for all attendee counts beats N round-trips.
  const ids = rows.map(r => r.id);
  const { data: bookings } = await sb
    .from("trainer_bookings")
    .select("session_id, status")
    .in("session_id", ids)
    .in("status", ["pending_trainer", "confirmed"]);
  const counts = new Map<string, number>();
  for (const b of (bookings as Array<{ session_id: string | null; status: string }>) ?? []) {
    if (!b.session_id) continue;
    counts.set(b.session_id, (counts.get(b.session_id) ?? 0) + 1);
  }
  return rows.map(s => ({ session: s, attendees: counts.get(s.id) ?? 0 }));
}

/**
 * Open group sessions across every coach in a window — powers the /train
 * discovery rail and full /train/groups list. Same shape as the per-trainer
 * version but joined with trainer info (name, slug, avatar_url) and with full
 * sessions filtered out so members never see one they can't join.
 */
export async function listAllOpenGroupSessions(
  fromIso: string,
  toIso: string,
): Promise<Array<{ session: TrainerSessionRow; attendees: number; trainer: Pick<Trainer, "id" | "slug" | "name" | "avatar_url"> }>> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data: sessions } = await sb
    .from("trainer_sessions")
    .select("*")
    .eq("is_group", true)
    .eq("status", "open")
    .gte("starts_at", fromIso)
    .lte("starts_at", toIso)
    .order("starts_at");
  const rows = (sessions as TrainerSessionRow[]) ?? [];
  if (rows.length === 0) return [];

  const ids = rows.map(r => r.id);
  const trainerIds = Array.from(new Set(rows.map(r => r.trainer_id)));
  const [{ data: bookings }, { data: trainers }] = await Promise.all([
    sb.from("trainer_bookings").select("session_id, status").in("session_id", ids).in("status", ["pending_trainer", "confirmed"]),
    sb.from("trainers").select("id, slug, name, avatar_url").in("id", trainerIds),
  ]);
  const counts = new Map<string, number>();
  for (const b of (bookings as Array<{ session_id: string | null; status: string }>) ?? []) {
    if (!b.session_id) continue;
    counts.set(b.session_id, (counts.get(b.session_id) ?? 0) + 1);
  }
  const trainerById = new Map<string, Pick<Trainer, "id" | "slug" | "name" | "avatar_url">>();
  for (const t of (trainers as Array<Pick<Trainer, "id" | "slug" | "name" | "avatar_url">>) ?? []) {
    trainerById.set(t.id, t);
  }

  return rows
    .map(s => {
      const trainer = trainerById.get(s.trainer_id);
      const attendees = counts.get(s.id) ?? 0;
      if (!trainer || attendees >= s.capacity) return null;
      return { session: s, attendees, trainer };
    })
    .filter((r): r is { session: TrainerSessionRow; attendees: number; trainer: Pick<Trainer, "id" | "slug" | "name" | "avatar_url"> } => r !== null);
}

/**
 * All trainer_sessions this trainer owns that haven't ended yet — for the
 * trainer dashboard "GROUP SESSIONS · YOUR UPCOMING" rail.
 */
export async function listTrainerOwnedSessions(trainerId: string): Promise<Array<{ session: TrainerSessionRow; attendees: number }>> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data: sessions } = await sb
    .from("trainer_sessions")
    .select("*")
    .eq("trainer_id", trainerId)
    .eq("is_group", true)
    .in("status", ["open", "full", "confirmed"])
    .order("starts_at");
  const rows = (sessions as TrainerSessionRow[]) ?? [];
  if (rows.length === 0) return [];
  const ids = rows.map(r => r.id);
  const { data: bookings } = await sb
    .from("trainer_bookings")
    .select("session_id, status")
    .in("session_id", ids)
    .in("status", ["pending_trainer", "confirmed"]);
  const counts = new Map<string, number>();
  for (const b of (bookings as Array<{ session_id: string | null; status: string }>) ?? []) {
    if (!b.session_id) continue;
    counts.set(b.session_id, (counts.get(b.session_id) ?? 0) + 1);
  }
  return rows.map(s => ({ session: s, attendees: counts.get(s.id) ?? 0 }));
}

/**
 * Fetch wall posts hydrated with author profile, STAFF flag (has trainers row),
 * and the current user's like state. One server query for the rows + at most
 * two follow-ups for the small joined sets (trainers + reactions). Keeps the
 * page-level call to a small constant number of round trips.
 */
export async function listPosts(opts?: {
  kinds?: string[];
  currentUserId?: string | null;
  limit?: number;
}): Promise<HydratedPost[]> {
  const limit = opts?.limit ?? 20;
  if (!isConfigured()) {
    const kinds = opts?.kinds ?? [];
    return kinds.length === 0 ? fallbackPosts : fallbackPosts.filter(p => kinds.includes(p.kind));
  }
  const sb = createClient();
  let q = sb
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(id, display_name, handle, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (opts?.kinds?.length) q = q.in("kind", opts.kinds);
  const { data } = await q;
  const rows = (data as Array<Post & { author: ProfileLite | null }>) ?? [];
  if (rows.length === 0) return [];

  const authorIds = Array.from(new Set(rows.map(r => r.author_id).filter((x): x is string => !!x)));
  const postIds = rows.map(r => r.id);

  const [staffRes, likedRes] = await Promise.all([
    authorIds.length
      ? sb.from("trainers").select("auth_user_id, name, avatar_url").in("auth_user_id", authorIds)
      : Promise.resolve({ data: [] as Array<{ auth_user_id: string | null; name: string; avatar_url: string | null }> }),
    opts?.currentUserId
      ? sb.from("post_reactions").select("post_id").eq("user_id", opts.currentUserId).in("post_id", postIds)
      : Promise.resolve({ data: [] as Array<{ post_id: string }> }),
  ]);

  // Trainer rows let us mark is_staff AND fall back to trainers.avatar_url when
  // the profile row doesn't have one set — coaches' headshots live on trainers,
  // not profiles, so the wall would otherwise render empty avatar circles.
  const trainerByAuthId = new Map<string, { name: string; avatar_url: string | null }>();
  for (const t of (staffRes.data ?? []) as Array<{ auth_user_id: string | null; name: string; avatar_url: string | null }>) {
    if (t.auth_user_id) trainerByAuthId.set(t.auth_user_id, { name: t.name, avatar_url: t.avatar_url });
  }
  const liked = new Set(((likedRes.data ?? []) as Array<{ post_id: string }>).map(r => r.post_id));

  return rows.map(r => {
    const trainer = r.author_id ? trainerByAuthId.get(r.author_id) : undefined;
    const author: ProfileLite | null = r.author
      ? {
          ...r.author,
          // Prefer the trainer headshot when the profile avatar is missing.
          avatar_url: r.author.avatar_url ?? trainer?.avatar_url ?? null,
          // Use the trainer's display name when the profile didn't set one
          // (some legacy profiles have null display_name).
          display_name: r.author.display_name ?? trainer?.name ?? null,
        }
      : null;
    return {
      ...r,
      author,
      is_staff: !!trainer,
      liked_by_me: liked.has(r.id),
    };
  });
}

export async function listHighlights(): Promise<HydratedHighlight[]> {
  if (!isConfigured()) return fallbackHighlights;
  const sb = createClient();
  const { data } = await sb
    .from("highlights")
    .select("*, author:profiles!highlights_author_id_fkey(id, display_name, handle, avatar_url)")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as HydratedHighlight[]) ?? [];
}

export async function listComments(postId: string): Promise<HydratedComment[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb
    .from("post_comments")
    .select("*, author:profiles!post_comments_author_id_fkey(id, display_name, handle, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  return (data as HydratedComment[]) ?? [];
}

/* -------------------------------------------------------------------------- */
/*  Coach-management aggregates                                               */
/* -------------------------------------------------------------------------- */

/** Every class taught by `trainerId`, both past and future. */
export async function listAllClassesByTrainer(trainerId: string): Promise<ClassRow[]> {
  if (!isConfigured()) {
    return fallbackClasses
      .filter(c => c.trainer_id === trainerId)
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
  }
  const sb = createClient();
  const { data } = await sb.from("classes").select("*").eq("trainer_id", trainerId).order("starts_at", { ascending: false });
  return (data as ClassRow[]) ?? [];
}

export type ClassRosterEntry = {
  booking: Booking;
  profile: { display_name: string | null; avatar_url: string | null; handle: string | null };
  email: string | null;
};

export async function listClassRoster(classId: string): Promise<ClassRosterEntry[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data: bookings } = await sb
    .from("bookings")
    .select("*")
    .eq("class_id", classId)
    .in("status", ["confirmed", "pending"])
    .order("created_at", { ascending: true });
  const rows = (bookings as Booking[]) ?? [];
  if (rows.length === 0) return [];
  const ids = Array.from(new Set(rows.map(r => r.user_id)));
  const profiles = await listProfilesByIds(ids);
  return rows.map(b => ({
    booking: b,
    profile: profiles[b.user_id] ?? { display_name: null, avatar_url: null, handle: null },
    email: null,
  }));
}

export type EnrolledClient = {
  enrollment: ProgramEnrollment;
  profile: { display_name: string | null; avatar_url: string | null; handle: string | null };
  completionCount: number;
  lastCompletionAt: string | null;
};

export async function listEnrollmentsByProgram(programId: string): Promise<EnrolledClient[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data: enrollments } = await sb
    .from("program_enrollments")
    .select("*")
    .eq("program_id", programId)
    .order("started_at", { ascending: false });
  const rows = (enrollments as ProgramEnrollment[]) ?? [];
  if (rows.length === 0) return [];
  const ids = Array.from(new Set(rows.map(r => r.user_id)));
  const profiles = await listProfilesByIds(ids);
  // Count completions + last completion per enrollment.
  const enrollmentIds = rows.map(r => r.id);
  const { data: comps } = await sb
    .from("program_completions")
    .select("enrollment_id, completed_at")
    .in("enrollment_id", enrollmentIds);
  const counts = new Map<string, { count: number; last: string | null }>();
  for (const c of (comps as Array<{ enrollment_id: string; completed_at: string }>) ?? []) {
    const cur = counts.get(c.enrollment_id) ?? { count: 0, last: null };
    cur.count += 1;
    if (!cur.last || new Date(c.completed_at) > new Date(cur.last)) cur.last = c.completed_at;
    counts.set(c.enrollment_id, cur);
  }
  return rows.map(e => ({
    enrollment: e,
    profile: profiles[e.user_id] ?? { display_name: null, avatar_url: null, handle: null },
    completionCount: counts.get(e.id)?.count ?? 0,
    lastCompletionAt: counts.get(e.id)?.last ?? null,
  }));
}

export type TrainerClientRow = {
  user_id: string;
  profile: { display_name: string | null; avatar_url: string | null; handle: string | null };
  lastInteractionAt: string | null;
  oneOnOneCount: number;
  programCount: number;
  classCount: number;
};

/**
 * Aggregate every member who's interacted with this trainer, across all
 * surfaces (1-on-1s, programs they author, classes they teach).
 */
export async function listTrainerClientsAggregate(trainerId: string): Promise<TrainerClientRow[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const map = new Map<string, TrainerClientRow>();
  const bump = (uid: string, ts: string | null, key: "oneOnOneCount" | "programCount" | "classCount") => {
    let row = map.get(uid);
    if (!row) {
      row = { user_id: uid, profile: { display_name: null, avatar_url: null, handle: null }, lastInteractionAt: null, oneOnOneCount: 0, programCount: 0, classCount: 0 };
      map.set(uid, row);
    }
    row[key] += 1;
    if (ts && (!row.lastInteractionAt || new Date(ts) > new Date(row.lastInteractionAt))) {
      row.lastInteractionAt = ts;
    }
  };
  // 1-on-1 bookings.
  const { data: tb } = await sb.from("trainer_bookings").select("user_id, starts_at").eq("trainer_id", trainerId);
  for (const r of (tb as Array<{ user_id: string; starts_at: string }>) ?? []) bump(r.user_id, r.starts_at, "oneOnOneCount");
  // Program enrollments — find programs authored or owned by this trainer.
  const { data: progs } = await sb.from("programs").select("id").or(`author_trainer_id.eq.${trainerId},trainer_id.eq.${trainerId}`);
  const progIds = ((progs as Array<{ id: string }>) ?? []).map(p => p.id);
  if (progIds.length > 0) {
    const { data: ens } = await sb.from("program_enrollments").select("user_id, started_at").in("program_id", progIds);
    for (const r of (ens as Array<{ user_id: string; started_at: string }>) ?? []) bump(r.user_id, r.started_at, "programCount");
  }
  // Class bookings — through classes taught by this trainer.
  const { data: cls } = await sb.from("classes").select("id").eq("trainer_id", trainerId);
  const classIds = ((cls as Array<{ id: string }>) ?? []).map(c => c.id);
  if (classIds.length > 0) {
    const { data: cb } = await sb.from("bookings").select("user_id, created_at").in("class_id", classIds);
    for (const r of (cb as Array<{ user_id: string; created_at: string }>) ?? []) bump(r.user_id, r.created_at, "classCount");
  }
  // Hydrate profiles.
  const ids = Array.from(map.keys());
  if (ids.length === 0) return [];
  const profiles = await listProfilesByIds(ids);
  for (const id of ids) {
    const row = map.get(id)!;
    row.profile = profiles[id] ?? row.profile;
  }
  return Array.from(map.values()).sort((a, b) => {
    if (!a.lastInteractionAt) return 1;
    if (!b.lastInteractionAt) return -1;
    return new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime();
  });
}

export type TrainerClientHistory = {
  enrollments: Array<{ enrollment: ProgramEnrollment; program: Program; completionCount: number }>;
  bookings: TrainerBooking[];
  classBookings: Array<{ booking: Booking; class: ClassRow }>;
  totalSpentCents: number;
};

export async function listTrainerClientHistory(trainerId: string, userId: string): Promise<TrainerClientHistory> {
  if (!isConfigured()) {
    return { enrollments: [], bookings: [], classBookings: [], totalSpentCents: 0 };
  }
  const sb = createClient();
  // 1-on-1 bookings
  const { data: tb } = await sb.from("trainer_bookings").select("*").eq("trainer_id", trainerId).eq("user_id", userId).order("starts_at", { ascending: false });
  const bookings = (tb as TrainerBooking[]) ?? [];

  // Programs by this trainer + this user's enrollments in them.
  const { data: progs } = await sb.from("programs").select("*").or(`author_trainer_id.eq.${trainerId},trainer_id.eq.${trainerId}`);
  const allPrograms = (progs as Program[]) ?? [];
  const progIds = allPrograms.map(p => p.id);
  let enrollments: TrainerClientHistory["enrollments"] = [];
  if (progIds.length > 0) {
    const { data: ens } = await sb.from("program_enrollments").select("*").eq("user_id", userId).in("program_id", progIds);
    const enRows = (ens as ProgramEnrollment[]) ?? [];
    if (enRows.length > 0) {
      const enIds = enRows.map(e => e.id);
      const { data: comps } = await sb.from("program_completions").select("enrollment_id").in("enrollment_id", enIds);
      const counts = new Map<string, number>();
      for (const c of (comps as Array<{ enrollment_id: string }>) ?? []) {
        counts.set(c.enrollment_id, (counts.get(c.enrollment_id) ?? 0) + 1);
      }
      enrollments = enRows.map(e => ({
        enrollment: e,
        program: allPrograms.find(p => p.id === e.program_id)!,
        completionCount: counts.get(e.id) ?? 0,
      })).filter(r => r.program); // drop any FK miss
    }
  }

  // Class bookings.
  const { data: cls } = await sb.from("classes").select("*").eq("trainer_id", trainerId);
  const classes = (cls as ClassRow[]) ?? [];
  const classIds = classes.map(c => c.id);
  let classBookings: TrainerClientHistory["classBookings"] = [];
  if (classIds.length > 0) {
    const { data: cb } = await sb.from("bookings").select("*").eq("user_id", userId).in("class_id", classIds).order("created_at", { ascending: false });
    classBookings = ((cb as Booking[]) ?? []).map(b => ({ booking: b, class: classes.find(c => c.id === b.class_id)! })).filter(r => r.class);
  }

  // Total spent — sum from purchases that ref any of these surfaces.
  const totalCents = bookings.reduce((s, b) => s + (b.paid_status === "paid" ? b.price_cents : 0), 0)
    + classBookings.reduce((s, r) => s + (r.booking.paid_status === "paid" ? r.booking.price_cents_paid : 0), 0);

  return { enrollments, bookings, classBookings, totalSpentCents: totalCents };
}

/* -------------------------------------------------------------------------- */
/*  Coach earnings (Stripe Connect payouts)                                   */
/* -------------------------------------------------------------------------- */

export type EarningsRow = {
  payout: { id: string; gross_cents: number; platform_fee_cents: number; trainer_cents: number; stripe_transfer_id: string | null; status: string; created_at: string };
  description: string;
  kind: string;
};

export type TrainerEarnings = {
  thisMonthCents: number;
  lifetimeCents: number;
  thisMonthCount: number;
  lifetimeCount: number;
  pendingCents: number;
  byKind: Record<string, { count: number; cents: number; label: string }>;
  recent: EarningsRow[];
};

export async function getTrainerEarnings(trainerId: string): Promise<TrainerEarnings> {
  const empty: TrainerEarnings = { thisMonthCents: 0, lifetimeCents: 0, thisMonthCount: 0, lifetimeCount: 0, pendingCents: 0, byKind: {}, recent: [] };
  if (!isConfigured()) return empty;
  const sb = createClient();
  const { data: rows } = await sb
    .from("payouts")
    .select("*, purchases:purchase_id(description, kind)")
    .eq("trainer_id", trainerId)
    .order("created_at", { ascending: false });
  const list = (rows as Array<{
    id: string; gross_cents: number; platform_fee_cents: number; trainer_cents: number;
    stripe_transfer_id: string | null; status: string; created_at: string;
    purchases: { description: string | null; kind: string } | null;
  }>) ?? [];

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const KIND_LABELS: Record<string, string> = {
    trainer_booking: "1-ON-1 / GROUP",
    class_booking: "CLASSES",
    program_enrollment: "PROGRAMS",
    shop_order: "SHOP",
    guest_pass: "GUEST PASS",
  };

  const byKind: TrainerEarnings["byKind"] = {};
  let thisMonthCents = 0;
  let lifetimeCents = 0;
  let thisMonthCount = 0;
  let lifetimeCount = 0;
  let pendingCents = 0;
  const recent: EarningsRow[] = [];

  for (const r of list) {
    if (r.status === "sent") {
      lifetimeCents += r.trainer_cents;
      lifetimeCount += 1;
      if (r.created_at >= monthStart) {
        thisMonthCents += r.trainer_cents;
        thisMonthCount += 1;
      }
      const kind = r.purchases?.kind ?? "other";
      const label = KIND_LABELS[kind] ?? kind.toUpperCase();
      const cur = byKind[kind] ?? { count: 0, cents: 0, label };
      cur.count += 1;
      cur.cents += r.trainer_cents;
      byKind[kind] = cur;
    } else if (r.status === "pending") {
      pendingCents += r.trainer_cents;
    }
    if (recent.length < 50) {
      recent.push({
        payout: { id: r.id, gross_cents: r.gross_cents, platform_fee_cents: r.platform_fee_cents, trainer_cents: r.trainer_cents, stripe_transfer_id: r.stripe_transfer_id, status: r.status, created_at: r.created_at },
        description: r.purchases?.description ?? "—",
        kind: r.purchases?.kind ?? "other",
      });
    }
  }

  return { thisMonthCents, lifetimeCents, thisMonthCount, lifetimeCount, pendingCents, byKind, recent };
}

export async function listJournalEntriesForEnrollment(enrollmentId: string): Promise<Record<string, { body: string; updated_at: string }>> {
  if (!isConfigured()) return {};
  const sb = createClient();
  const { data } = await sb
    .from("program_journal_entries")
    .select("session_id, body, updated_at")
    .eq("enrollment_id", enrollmentId);
  const out: Record<string, { body: string; updated_at: string }> = {};
  for (const r of (data as Array<{ session_id: string; body: string; updated_at: string }>) ?? []) {
    out[r.session_id] = { body: r.body, updated_at: r.updated_at };
  }
  return out;
}

/** Full-text search across coaches + programs + classes. Returns up to 20 hits. */
export async function searchAll(query: string): Promise<{
  trainers: Array<{ id: string; slug: string; name: string; headline: string | null }>;
  programs: Array<{ id: string; slug: string; name: string; subtitle: string | null }>;
  classes: Array<{ id: string; name: string; kind: string | null; starts_at: string }>;
}> {
  const empty = { trainers: [], programs: [], classes: [] };
  const q = query.trim();
  if (!q || !isConfigured()) return empty;
  const sb = createClient();
  // websearch_to_tsquery is gentler than plainto_tsquery for casual input.
  const tsQuery = q.split(/\s+/).filter(Boolean).join(" & ");
  const [trainers, programs, classes] = await Promise.all([
    sb.from("trainers").select("id, slug, name, headline").textSearch("search_doc", tsQuery, { type: "websearch" }).limit(8),
    sb.from("programs").select("id, slug, name, subtitle").textSearch("search_doc", tsQuery, { type: "websearch" }).limit(8),
    sb.from("classes").select("id, name, kind, starts_at").textSearch("search_doc", tsQuery, { type: "websearch" }).gte("starts_at", new Date().toISOString()).order("starts_at").limit(8),
  ]);
  return {
    trainers: (trainers.data as Array<{ id: string; slug: string; name: string; headline: string | null }>) ?? [],
    programs: (programs.data as Array<{ id: string; slug: string; name: string; subtitle: string | null }>) ?? [],
    classes: (classes.data as Array<{ id: string; name: string; kind: string | null; starts_at: string }>) ?? [],
  };
}

export async function listProgramAnnouncements(programId: string): Promise<Array<{ id: string; title: string; body: string; created_at: string }>> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb
    .from("program_announcements")
    .select("id, title, body, created_at")
    .eq("program_id", programId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as Array<{ id: string; title: string; body: string; created_at: string }>) ?? [];
}

/** Roster of attendees for a single trainer_sessions row (group session). */
export async function listGroupSessionRoster(sessionId: string): Promise<Array<{ booking: TrainerBooking; profile: { display_name: string | null; avatar_url: string | null; handle: string | null } }>> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data: bs } = await sb
    .from("trainer_bookings")
    .select("*")
    .eq("session_id", sessionId)
    .in("status", ["pending_trainer", "confirmed", "completed"])
    .order("created_at", { ascending: true });
  const rows = (bs as TrainerBooking[]) ?? [];
  if (rows.length === 0) return [];
  const profiles = await listProfilesByIds(Array.from(new Set(rows.map(r => r.user_id))));
  return rows.map(b => ({ booking: b, profile: profiles[b.user_id] ?? { display_name: null, avatar_url: null, handle: null } }));
}

/* -------------------------------------------------------------------------- */
/*  Challenges (migration 0031)                                               */
/* -------------------------------------------------------------------------- */

/** Active = published and ends_at > now(). Used by /challenges and the wall pinned card. */
export async function listActiveChallenges(): Promise<Challenge[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb
    .from("challenges")
    .select("*")
    .eq("status", "published")
    .gt("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  return (data as Challenge[]) ?? [];
}

/** The single most-recent published+active challenge — drives the wall pinned card. */
export async function getCurrentWallChallenge(): Promise<Challenge | null> {
  const list = await listActiveChallenges();
  return list[0] ?? null;
}

export type ChallengeDetail = {
  challenge: Challenge;
  tasks: ChallengeTask[];
  myEnrollment: ChallengeEnrollment | null;
  myCompletions: ChallengeTaskCompletion[];
};

export async function getChallenge(slug: string, currentUserId?: string | null): Promise<ChallengeDetail | null> {
  if (!isConfigured()) return null;
  const sb = createClient();
  const { data: ch } = await sb.from("challenges").select("*").eq("slug", slug).maybeSingle();
  if (!ch) return null;
  const challenge = ch as Challenge;
  const [{ data: tasks }, enrollmentRes, completionsRes] = await Promise.all([
    sb.from("challenge_tasks").select("*").eq("challenge_id", challenge.id).order("sort_order"),
    currentUserId
      ? sb.from("challenge_enrollments").select("*").eq("challenge_id", challenge.id).eq("user_id", currentUserId).maybeSingle()
      : Promise.resolve({ data: null }),
    currentUserId
      ? sb.from("challenge_task_completions").select("*").eq("challenge_id", challenge.id).eq("user_id", currentUserId)
      : Promise.resolve({ data: [] as ChallengeTaskCompletion[] }),
  ]);
  return {
    challenge,
    tasks: (tasks as ChallengeTask[]) ?? [],
    myEnrollment: (enrollmentRes.data as ChallengeEnrollment | null) ?? null,
    myCompletions: (completionsRes.data as ChallengeTaskCompletion[]) ?? [],
  };
}

/** Leaderboard: finishers ranked by completed_at asc; in-progress sorted by tasks_done desc. */
export async function listChallengeLeaderboard(challengeId: string): Promise<LeaderboardRow[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const [{ data: enrollments }, { data: tasks }, { data: completions }] = await Promise.all([
    sb.from("challenge_enrollments").select("*").eq("challenge_id", challengeId),
    sb.from("challenge_tasks").select("id").eq("challenge_id", challengeId),
    sb.from("challenge_task_completions").select("user_id, task_id").eq("challenge_id", challengeId),
  ]);
  const enrollRows = (enrollments as ChallengeEnrollment[]) ?? [];
  const totalTasks = ((tasks as Array<{ id: string }>) ?? []).length;
  if (enrollRows.length === 0) return [];

  const tasksDoneByUser = new Map<string, number>();
  for (const c of (completions as Array<{ user_id: string }>) ?? []) {
    tasksDoneByUser.set(c.user_id, (tasksDoneByUser.get(c.user_id) ?? 0) + 1);
  }

  const profiles = await listProfilesByIds(enrollRows.map(e => e.user_id));

  const rows: LeaderboardRow[] = enrollRows.map(e => ({
    user: { id: e.user_id, ...(profiles[e.user_id] ?? { display_name: null, handle: null, avatar_url: null }) },
    joined_at: e.joined_at,
    completed_at: e.completed_at,
    tasks_done: tasksDoneByUser.get(e.user_id) ?? 0,
    tasks_total: totalTasks,
    rank: null,
  }));

  // Finishers first (by completed_at asc), then by tasks_done desc, then joined_at asc.
  rows.sort((a, b) => {
    if (a.completed_at && b.completed_at) return a.completed_at.localeCompare(b.completed_at);
    if (a.completed_at) return -1;
    if (b.completed_at) return 1;
    if (a.tasks_done !== b.tasks_done) return b.tasks_done - a.tasks_done;
    return a.joined_at.localeCompare(b.joined_at);
  });

  let r = 0;
  for (const row of rows) {
    if (row.completed_at) {
      r += 1;
      row.rank = r;
    }
  }
  return rows;
}

export async function listChallengesByTrainer(trainerId: string): Promise<Challenge[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb
    .from("challenges")
    .select("*")
    .eq("author_trainer_id", trainerId)
    .order("created_at", { ascending: false });
  return (data as Challenge[]) ?? [];
}

export async function getChallengeForCoach(challengeId: string): Promise<{ challenge: Challenge; tasks: ChallengeTask[] } | null> {
  if (!isConfigured()) return null;
  const sb = createClient();
  const [{ data: ch }, { data: tasks }] = await Promise.all([
    sb.from("challenges").select("*").eq("id", challengeId).maybeSingle(),
    sb.from("challenge_tasks").select("*").eq("challenge_id", challengeId).order("sort_order"),
  ]);
  if (!ch) return null;
  return { challenge: ch as Challenge, tasks: (tasks as ChallengeTask[]) ?? [] };
}

/* -------------------------------------------------------------------------- */
/*  Events (migration 0031)                                                   */
/* -------------------------------------------------------------------------- */

async function hydrateEvents(rows: EventRow[], currentUserId?: string | null): Promise<HydratedEvent[]> {
  if (rows.length === 0) return [];
  const sb = createClient();
  const trainerIds = Array.from(new Set(rows.map(r => r.author_trainer_id).filter((x): x is string => !!x)));
  const locationIds = Array.from(new Set(rows.map(r => r.location_id)));

  const [{ data: trainers }, { data: locations }, myRsvpsRes] = await Promise.all([
    trainerIds.length
      ? sb.from("trainers").select("id, slug, name, avatar_url, auth_user_id").in("id", trainerIds)
      : Promise.resolve({ data: [] as Array<{ id: string; slug: string; name: string; avatar_url: string | null; auth_user_id: string | null }> }),
    sb.from("locations").select("id, slug, name, city, state").in("id", locationIds),
    currentUserId
      ? sb.from("event_rsvps").select("*").eq("user_id", currentUserId).in("event_id", rows.map(r => r.id))
      : Promise.resolve({ data: [] as EventRsvp[] }),
  ]);

  const trainerMap = new Map<string, { id: string; slug: string; name: string; avatar_url: string | null; auth_user_id: string | null }>();
  for (const t of (trainers ?? []) as Array<{ id: string; slug: string; name: string; avatar_url: string | null; auth_user_id: string | null }>) {
    trainerMap.set(t.id, t);
  }
  const locMap = new Map<string, { id: string; slug: string; name: string; city: string; state: string }>();
  for (const l of (locations ?? []) as Array<{ id: string; slug: string; name: string; city: string; state: string }>) {
    locMap.set(l.id, l);
  }
  const rsvpMap = new Map<string, EventRsvp>();
  for (const r of (myRsvpsRes.data ?? []) as EventRsvp[]) rsvpMap.set(r.event_id, r);

  return rows.map(e => {
    const t = e.author_trainer_id ? trainerMap.get(e.author_trainer_id) : null;
    return {
      ...e,
      author: t
        ? { id: t.auth_user_id ?? t.id, display_name: t.name, handle: t.slug, avatar_url: t.avatar_url }
        : null,
      location: locMap.get(e.location_id) ?? null,
      rsvped_by_me: rsvpMap.get(e.id) ?? null,
    };
  });
}

export async function listEventsForGym(locationId: string, fromIso: string, toIso: string, currentUserId?: string | null): Promise<HydratedEvent[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb
    .from("events")
    .select("*")
    .eq("location_id", locationId)
    .eq("status", "published")
    .gte("starts_at", fromIso)
    .lt("starts_at", toIso)
    .order("starts_at", { ascending: true });
  return hydrateEvents((data as EventRow[]) ?? [], currentUserId);
}

export async function listEventsForDay(locationId: string, dayStartIso: string, dayEndIso: string, currentUserId?: string | null): Promise<HydratedEvent[]> {
  return listEventsForGym(locationId, dayStartIso, dayEndIso, currentUserId);
}

export async function getEvent(slug: string, currentUserId?: string | null): Promise<HydratedEvent | null> {
  if (!isConfigured()) return null;
  const sb = createClient();
  const { data } = await sb.from("events").select("*").eq("slug", slug).maybeSingle();
  if (!data) return null;
  const [hydrated] = await hydrateEvents([data as EventRow], currentUserId);
  return hydrated ?? null;
}

export async function listEventsByTrainer(trainerId: string): Promise<HydratedEvent[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb
    .from("events")
    .select("*")
    .eq("author_trainer_id", trainerId)
    .order("starts_at", { ascending: false });
  return hydrateEvents((data as EventRow[]) ?? []);
}

export type EventRsvpRow = EventRsvp & { user: ProfileLite | null; amount_paid_cents: number | null };

export async function listEventRsvps(eventId: string): Promise<EventRsvpRow[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  const rsvps = (data as EventRsvp[]) ?? [];
  if (rsvps.length === 0) return [];
  const profiles = await listProfilesByIds(rsvps.map(r => r.user_id));
  const purchaseIds = rsvps.map(r => r.purchase_id).filter((x): x is string => !!x);
  let purchaseMap = new Map<string, number>();
  if (purchaseIds.length) {
    const { data: purchases } = await sb.from("purchases").select("id, amount_cents").in("id", purchaseIds);
    for (const p of (purchases ?? []) as Array<{ id: string; amount_cents: number }>) {
      purchaseMap.set(p.id, p.amount_cents);
    }
  }
  return rsvps.map(r => ({
    ...r,
    user: { id: r.user_id, ...(profiles[r.user_id] ?? { display_name: null, handle: null, avatar_url: null }) },
    amount_paid_cents: r.purchase_id ? purchaseMap.get(r.purchase_id) ?? null : null,
  }));
}
