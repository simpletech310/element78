import "server-only";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildIcs } from "@/lib/ics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const sb = createClient();
  const { data: bookingRow } = await sb
    .from("bookings")
    .select("id, user_id, class_id")
    .eq("id", params.id)
    .maybeSingle();
  const b = bookingRow as { id: string; user_id: string; class_id: string } | null;
  if (!b || b.user_id !== user.id) return new Response("not found", { status: 404 });

  const { data: cls } = await sb.from("classes").select("name, starts_at, duration_min, room").eq("id", b.class_id).maybeSingle();
  const c = cls as { name: string; starts_at: string; duration_min: number; room: string | null } | null;
  if (!c) return new Response("class not found", { status: 404 });

  const endsAt = new Date(new Date(c.starts_at).getTime() + c.duration_min * 60_000).toISOString();
  const ics = buildIcs({
    uid: `class-booking-${b.id}@element78.com`,
    startsAt: c.starts_at,
    endsAt,
    summary: c.name,
    description: c.room ? `Room: ${c.room}` : "",
    location: "Element 78 Gym",
    url: `https://element78.vercel.app/classes/${b.class_id}`,
  });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="element78-class-${b.id}.ics"`,
    },
  });
}
