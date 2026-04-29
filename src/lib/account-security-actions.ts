"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function changeEmailAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/security");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) redirect("/account/security?error=invalid_email");
  if (email === user.email) redirect("/account/security?error=same_email");

  const sb = createClient();
  const { error } = await sb.auth.updateUser({ email });
  if (error) redirect(`/account/security?error=${encodeURIComponent(error.message)}`);

  redirect("/account/security?email_change_sent=1");
}

export async function changePasswordAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/security");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!password || password.length < 8) redirect("/account/security?error=password_too_short");
  if (password !== confirm) redirect("/account/security?error=password_mismatch");

  const sb = createClient();
  const { error } = await sb.auth.updateUser({ password });
  if (error) redirect(`/account/security?error=${encodeURIComponent(error.message)}`);

  redirect("/account/security?password_changed=1");
}

export async function saveNotificationPrefsAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  const sb = createClient();
  await sb.from("notification_preferences").upsert({
    user_id: user.id,
    email_booking_confirmations: formData.get("email_booking_confirmations") === "on",
    email_class_reminders: formData.get("email_class_reminders") === "on",
    email_program_announcements: formData.get("email_program_announcements") === "on",
    email_messages: formData.get("email_messages") === "on",
    email_marketing: formData.get("email_marketing") === "on",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  revalidatePath("/account/notifications");
  redirect("/account/notifications?saved=1");
}
