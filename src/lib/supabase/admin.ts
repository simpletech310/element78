import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Never import this in any client-side path —
 * it has full RLS-bypass privileges. Use only inside Server Actions /
 * route handlers / server components that require admin operations
 * (creating users with auto-confirmed emails, etc.).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase admin client unavailable — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.",
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
