"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/home");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // Demo mode: just redirect through.
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
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const display_name = String(formData.get("display_name") ?? "");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    redirect("/home");
  }

  const sb = createClient();
  const { error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { display_name } },
  });
  if (error) {
    redirect(`/join?error=${encodeURIComponent(error.message)}`);
  }
  // Email confirmation is disabled, so the session is live.
  redirect("/home");
}

export async function signOutAction() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/");
  const sb = createClient();
  await sb.auth.signOut();
  redirect("/");
}
