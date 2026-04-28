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
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
