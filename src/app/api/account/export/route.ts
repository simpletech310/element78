import "server-only";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const sb = createAdminClient();
  const tables = [
    "profiles",
    "bookings",
    "trainer_bookings",
    "program_enrollments",
    "program_completions",
    "posts",
    "purchases",
    "payouts",
    "subscriptions",
    "waivers",
    "saved_items",
    "guest_passes",
  ];

  const out: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    email: user.email ?? null,
  };

  await Promise.all(
    tables.map(async (t) => {
      const filterCol = t === "profiles" ? "id" : t === "posts" ? "author_id" : t === "payouts" ? null : "user_id";
      if (!filterCol) {
        out[t] = []; // payouts is per-trainer, not per-user
        return;
      }
      const { data } = await sb.from(t).select("*").eq(filterCol, user.id);
      out[t] = data ?? [];
    }),
  );

  return new Response(JSON.stringify(out, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="element78-data-${user.id}.json"`,
    },
  });
}
