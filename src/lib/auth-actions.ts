"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  redirect(next);
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
    redirect(`/login?error=${encodeURIComponent(signInErr.message)}&next=/home`);
  }
  redirect("/home");
}

export async function signOutAction() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/");
  const sb = createClient();
  await sb.auth.signOut();
  redirect("/");
}
