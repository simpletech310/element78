import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

/** Returns the current admin profile or null. Used as the gate for /admin routes. */
export async function getAdminForCurrentUser(): Promise<{ id: string; display_name: string | null } | null> {
  const user = await getUser();
  if (!user) return null;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const sb = createClient();
  const { data } = await sb.from("profiles").select("id, display_name, is_admin").eq("id", user.id).maybeSingle();
  if (!data) return null;
  const p = data as { id: string; display_name: string | null; is_admin: boolean };
  if (!p.is_admin) return null;
  return { id: p.id, display_name: p.display_name };
}

/** Server-side audit-log writer. Use after any admin mutation. */
export async function logAdminAction(input: {
  adminUserId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  const sb = createClient();
  await sb.from("admin_audit_log").insert({
    admin_user_id: input.adminUserId,
    action: input.action,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    details: input.details ?? null,
  });
}
