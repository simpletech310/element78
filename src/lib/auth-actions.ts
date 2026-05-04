"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";

/**
 * After auth succeeds, decide where to land. If the request brought a real
 * `next` (e.g. a deep link the user was trying to reach before login), honor
 * it. Otherwise: coaches → /trainer/dashboard, members → /home. This keeps
 * coaches from bouncing through the member home before navigating manually.
 */
async function postAuthRedirect(next: string | null): Promise<never> {
  // Honor explicit deep links — except the bare defaults that callers pass
  // when no specific destination was requested.
  const isDefault = !next || next === "/home" || next === "/welcome";
  if (!isDefault && next) {
    redirect(next);
  }
  const trainer = await getTrainerForCurrentUser();
  redirect(trainer ? "/trainer/dashboard" : (next ?? "/home"));
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/home");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    redirect(next);
  }

  const sb = createClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }
  await postAuthRedirect(next);
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const display_name = String(formData.get("display_name") ?? "").trim();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    redirect("/home");
  }

  // Create the user via the admin API with email_confirm:true so they
  // can sign in immediately without clicking a confirmation link.
  const admin = createAdminClient();
  if (admin) {
    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name, handle: email.split("@")[0] },
    });
    if (createErr && !/already.*registered|already.*exists|duplicate/i.test(createErr.message)) {
      redirect(`/join?error=${encodeURIComponent(createErr.message)}`);
    }
    // If they already existed, fall through and try to sign in
    // (matches the "click join twice" edge case gracefully).
  }

  // Sign in to set the auth cookie on the response.
  const sb = createClient();
  const { error: signInErr } = await sb.auth.signInWithPassword({ email, password });
  if (signInErr) {
    redirect(`/login?error=${encodeURIComponent(signInErr.message)}&next=/welcome`);
  }
  // First-time signups land on /welcome — install instructions, push opt-in,
  // and a brand-on tour. Returning logins still go straight to /home via
  // the signInAction path above.
  redirect("/welcome");
}

export async function signOutAction() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/");
  const sb = createClient();
  await sb.auth.signOut();
  redirect("/");
}
