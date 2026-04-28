import { createClient } from "@/lib/supabase/server";
import type { ClassRow, Location, Post, Product, ProductVariant, Trainer, Program, ProgramSession, ProgramEnrollment, ProgramCompletion, Booking } from "./types";
import { fallbackProducts, fallbackClasses, fallbackTrainers, fallbackLocations, fallbackPosts, fallbackPrograms, fallbackProgramSessions } from "./fallback";

function isConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function listProducts(): Promise<Product[]> {
  if (!isConfigured()) return fallbackProducts;
  const sb = createClient();
  const { data } = await sb.from("products").select("*").order("sort_order", { ascending: true });
  return (data as Product[]) ?? fallbackProducts;
}

export async function getProduct(slug: string): Promise<{ product: Product; variants: ProductVariant[] } | null> {
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
  return (data as Program[]) ?? fallbackPrograms;
}

export async function getProgram(slug: string): Promise<{ program: Program; sessions: ProgramSession[] } | null> {
  if (!isConfigured()) {
    const program = fallbackPrograms.find(p => p.slug === slug);
    if (!program) return null;
    const sessions = fallbackProgramSessions.filter(s => s.program_id === program.id);
    return { program, sessions };
  }
  const sb = createClient();
  const { data: program } = await sb.from("programs").select("*").eq("slug", slug).single();
  if (!program) return null;
  const { data: sessions } = await sb.from("program_sessions").select("*").eq("program_id", program.id).order("day_index");
  return { program: program as Program, sessions: (sessions as ProgramSession[]) ?? [] };
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

export async function listPosts(): Promise<Post[]> {
  if (!isConfigured()) return fallbackPosts;
  const sb = createClient();
  const { data } = await sb.from("posts").select("*").order("created_at", { ascending: false }).limit(20);
  return (data as Post[]) ?? fallbackPosts;
}
