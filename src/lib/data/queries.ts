import { createClient } from "@/lib/supabase/server";
import type {
  ClassRow,
  Flow,
  Location,
  Post,
  Product,
  ProductVariant,
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
import { fallbackProducts, fallbackClasses, fallbackTrainers, fallbackLocations, fallbackPosts, fallbackPrograms, fallbackProgramSessions, fallbackFlows } from "./fallback";

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
  return rows.filter(p => !HIDDEN_PRODUCT_SLUGS.has(p.slug));
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
  const { data } = await sb
    .from("program_enrollments")
    .select("*, program:programs(*)")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });
  if (!data) return [];
  return (data as Array<ProgramEnrollment & { program: Program }>).map(row => ({
    enrollment: { id: row.id, user_id: row.user_id, program_id: row.program_id, status: row.status, started_at: row.started_at, completed_at: row.completed_at, current_day: row.current_day },
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
 * Trainer-facing inbox of bookings on them. Optional status filter.
 */
export async function listTrainerInbox(
  trainerId: string,
  statuses?: TrainerBooking["status"][],
): Promise<TrainerBooking[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  let q = sb.from("trainer_bookings").select("*").eq("trainer_id", trainerId);
  if (statuses && statuses.length > 0) q = q.in("status", statuses);
  const { data } = await q.order("starts_at", { ascending: true });
  return (data as TrainerBooking[]) ?? [];
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

export async function listPosts(): Promise<Post[]> {
  if (!isConfigured()) return fallbackPosts;
  const sb = createClient();
  const { data } = await sb.from("posts").select("*").order("created_at", { ascending: false }).limit(20);
  return (data as Post[]) ?? fallbackPosts;
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
