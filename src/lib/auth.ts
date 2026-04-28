import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  try {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}
