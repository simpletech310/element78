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
  const { data } = await sb
    .from("trainer_bookings")
    .select("id, user_id, starts_at, ends_at, mode, video_room_url, trainer_id")
    .eq("id", params.id)
    .maybeSingle();
  const b = data as { id: string; user_id: string; starts_at: string; ends_at: string; mode: string; video_room_url: string | null; trainer_id: string } | null;
  if (!b || b.user_id !== user.id) return new Response("not found", { status: 404 });

  const { data: tr } = await sb.from("trainers").select("name, slug").eq("id", b.trainer_id).maybeSingle();
  const trainerName = (tr as { name: string } | null)?.name ?? "Coach";

  const ics = buildIcs({
    uid: `trainer-booking-${b.id}@element78.com`,
    startsAt: b.starts_at,
    endsAt: b.ends_at,
    summary: `1-on-1 with ${trainerName}`,
    description: b.mode === "video" ? "Video call · join link in your account or email." : "In-person at the gym.",
    location: b.mode === "video" ? "Video call (Element 78)" : "Element 78 Gym",
    url: b.video_room_url ?? `https://element78.vercel.app/account/sessions`,
  });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="element78-${b.id}.ics"`,
    },
  });
}
