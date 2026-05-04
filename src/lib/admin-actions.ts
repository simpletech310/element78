"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminForCurrentUser, logAdminAction } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { refundPurchase } from "@/lib/purchases";
import { uploadImageToBucket } from "@/lib/supabase/storage";

/** Resolve a product image: prefer an uploaded file, fall back to a URL field. */
async function resolveProductImage(
  formData: FormData,
  userId: string,
  fileField = "hero_image_file",
  urlField = "hero_image",
): Promise<string | null | undefined> {
  const f = formData.get(fileField);
  if (f instanceof File && f.size > 0) {
    const { url } = await uploadImageToBucket("program-images", f, userId);
    return url;
  }
  const u = String(formData.get(urlField) ?? "").trim();
  return u || undefined;
}

async function gate() {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/home?error=admin_only");
  return admin;
}

export async function banUserAction(formData: FormData) {
  const admin = await gate();
  const userId = String(formData.get("user_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!userId) redirect("/admin/users?error=missing_id");

  const sb = createAdminClient();
  await sb
    .from("profiles")
    .update({ is_banned: true, banned_reason: reason, banned_at: new Date().toISOString() })
    .eq("id", userId);
  await logAdminAction({ adminUserId: admin.id, action: "ban_user", targetType: "user", targetId: userId, details: { reason } });
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  redirect(`/admin/users/${userId}?banned=1`);
}

export async function unbanUserAction(formData: FormData) {
  const admin = await gate();
  const userId = String(formData.get("user_id") ?? "");
  const sb = createAdminClient();
  await sb
    .from("profiles")
    .update({ is_banned: false, banned_reason: null, banned_at: null })
    .eq("id", userId);
  await logAdminAction({ adminUserId: admin.id, action: "unban_user", targetType: "user", targetId: userId });
  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}?unbanned=1`);
}

export async function refundPurchaseAction(formData: FormData) {
  const admin = await gate();
  const purchaseId = String(formData.get("purchase_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || "requested_by_customer";
  if (!purchaseId) redirect("/admin/purchases?error=missing_id");

  try {
    await refundPurchase(purchaseId, { reason });
  } catch (err) {
    redirect(`/admin/purchases?error=${encodeURIComponent((err as Error).message)}`);
  }
  await logAdminAction({ adminUserId: admin.id, action: "refund_purchase", targetType: "purchase", targetId: purchaseId, details: { reason } });
  revalidatePath("/admin/purchases");
  redirect(`/admin/purchases?refunded=${purchaseId}`);
}

export async function hidePostAction(formData: FormData) {
  const admin = await gate();
  const postId = String(formData.get("post_id") ?? "");
  const sb = createAdminClient();
  const { data: row } = await sb.from("posts").select("meta").eq("id", postId).maybeSingle();
  const meta = (row as { meta: Record<string, unknown> | null } | null)?.meta ?? {};
  await sb.from("posts").update({ meta: { ...meta, hidden: true } }).eq("id", postId);
  await logAdminAction({ adminUserId: admin.id, action: "hide_post", targetType: "post", targetId: postId });
  revalidatePath("/admin/posts");
  revalidatePath("/wall");
  redirect(`/admin/posts?hidden=${postId}`);
}

export async function setAdminAction(formData: FormData) {
  const admin = await gate();
  const userId = String(formData.get("user_id") ?? "");
  const value = formData.get("value") === "true";
  const sb = createAdminClient();
  await sb.from("profiles").update({ is_admin: value }).eq("id", userId);
  await logAdminAction({ adminUserId: admin.id, action: value ? "grant_admin" : "revoke_admin", targetType: "user", targetId: userId });
  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}?admin_${value ? "granted" : "revoked"}=1`);
}

/* -------------------------------------------------------------------------- */
/*  Account ops (password reset, force logout, hard delete)                   */
/* -------------------------------------------------------------------------- */

export async function sendPasswordResetAction(formData: FormData) {
  const admin = await gate();
  const userId = String(formData.get("user_id") ?? "");
  if (!userId) redirect("/admin/users?error=missing_id");
  const sb = createAdminClient();
  // Need the email to send the recovery link.
  const { data: u } = await sb.auth.admin.getUserById(userId);
  const email = u?.user?.email;
  if (!email) redirect(`/admin/users/${userId}?error=no_email`);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://element78.vercel.app";
  await sb.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/account/reset` });
  await logAdminAction({ adminUserId: admin.id, action: "send_password_reset", targetType: "user", targetId: userId });
  redirect(`/admin/users/${userId}?reset_sent=1`);
}

export async function forceLogoutAction(formData: FormData) {
  const admin = await gate();
  const userId = String(formData.get("user_id") ?? "");
  if (!userId) redirect("/admin/users?error=missing_id");
  const sb = createAdminClient();
  // Revoke every active refresh token globally — kills all sessions for this user.
  await sb.auth.admin.signOut(userId, "global");
  await logAdminAction({ adminUserId: admin.id, action: "force_logout", targetType: "user", targetId: userId });
  redirect(`/admin/users/${userId}?logged_out=1`);
}

export async function hardDeleteUserAction(formData: FormData) {
  const admin = await gate();
  const userId = String(formData.get("user_id") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!userId) redirect("/admin/users?error=missing_id");
  if (confirm !== "DELETE") redirect(`/admin/users/${userId}?error=confirm_required`);
  if (userId === admin.id) redirect(`/admin/users/${userId}?error=cant_delete_self`);
  const sb = createAdminClient();
  // Best-effort capture of the email for the audit trail.
  const { data: u } = await sb.auth.admin.getUserById(userId);
  const email = u?.user?.email ?? null;
  // Cascades through profiles + downstream tables via the FK chain.
  const { error } = await sb.auth.admin.deleteUser(userId);
  if (error) redirect(`/admin/users/${userId}?error=${encodeURIComponent(error.message)}`);
  await logAdminAction({ adminUserId: admin.id, action: "hard_delete_user", targetType: "user", targetId: userId, details: { email } });
  redirect("/admin/users?deleted=1");
}

/* -------------------------------------------------------------------------- */
/*  Trainer ops (create, archive, set split)                                  */
/* -------------------------------------------------------------------------- */

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || `c-${Date.now()}`;
}

export async function createTrainerAction(formData: FormData) {
  const admin = await gate();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/trainers/new?error=name_required");
  const slug = slugify(String(formData.get("slug") ?? "") || name);
  const headline = String(formData.get("headline") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const specialtiesRaw = String(formData.get("specialties") ?? "").trim();
  const specialties = specialtiesRaw ? specialtiesRaw.split(",").map(s => s.trim()).filter(Boolean) : [];
  const cert = String(formData.get("cert") ?? "").trim() || null;
  const yearsRaw = String(formData.get("years_experience") ?? "").trim();
  const yearsExperience = yearsRaw ? Math.max(0, Number(yearsRaw)) : null;
  const isAi = formData.get("is_ai") === "on";
  const homeLocationId = String(formData.get("home_location_id") ?? "").trim() || null;
  const linkUserId = String(formData.get("link_user_id") ?? "").trim() || null;
  const splitRaw = String(formData.get("payout_split_bps") ?? "").trim();
  const splitBps = splitRaw ? Math.max(0, Math.min(10000, Number(splitRaw))) : null;

  const sb = createAdminClient();
  const { data: created, error } = await sb
    .from("trainers")
    .insert({
      name,
      slug,
      headline,
      bio,
      specialties,
      cert,
      years_experience: yearsExperience,
      is_ai: isAi,
      home_location_id: homeLocationId,
      auth_user_id: linkUserId,
      rating: 5,
      payout_split_bps: splitBps,
    })
    .select("id, slug")
    .maybeSingle();
  if (error || !created) redirect(`/admin/trainers/new?error=${encodeURIComponent(error?.message ?? "create_failed")}`);
  const newId = (created as { id: string }).id;
  await logAdminAction({ adminUserId: admin.id, action: "create_trainer", targetType: "trainer", targetId: newId, details: { name, slug } });
  redirect(`/admin/trainers/${newId}?created=1`);
}

export async function updateTrainerAction(formData: FormData) {
  const admin = await gate();
  const id = String(formData.get("trainer_id") ?? "");
  if (!id) redirect("/admin/trainers?error=missing_id");
  const patch: Record<string, unknown> = {};
  const fields: Array<[string, "text" | "int" | "bool" | "csv"]> = [
    ["headline", "text"], ["bio", "text"], ["cert", "text"],
    ["years_experience", "int"], ["specialties", "csv"],
    ["home_location_id", "text"], ["is_ai", "bool"],
  ];
  for (const [key, kind] of fields) {
    const raw = formData.get(key);
    if (raw === null) continue;
    const s = String(raw).trim();
    if (kind === "csv") patch[key] = s ? s.split(",").map(x => x.trim()).filter(Boolean) : [];
    else if (kind === "int") patch[key] = s ? Number(s) : null;
    else if (kind === "bool") patch[key] = formData.get(key) === "on";
    else patch[key] = s || null;
  }
  const sb = createAdminClient();
  await sb.from("trainers").update(patch).eq("id", id);
  await logAdminAction({ adminUserId: admin.id, action: "update_trainer", targetType: "trainer", targetId: id, details: patch });
  redirect(`/admin/trainers/${id}?updated=1`);
}

export async function setTrainerSplitAction(formData: FormData) {
  const admin = await gate();
  const id = String(formData.get("trainer_id") ?? "");
  if (!id) redirect("/admin/trainers?error=missing_id");
  const raw = String(formData.get("payout_split_bps") ?? "").trim();
  const bps = raw === "" ? null : Math.max(0, Math.min(10000, Number(raw)));
  if (bps !== null && Number.isNaN(bps)) redirect(`/admin/trainers/${id}?error=invalid_split`);
  const sb = createAdminClient();
  await sb.from("trainers").update({ payout_split_bps: bps }).eq("id", id);
  await logAdminAction({ adminUserId: admin.id, action: "set_trainer_split", targetType: "trainer", targetId: id, details: { payout_split_bps: bps } });
  redirect(`/admin/trainers/${id}?split_updated=1`);
}

export async function archiveTrainerAction(formData: FormData) {
  const admin = await gate();
  const id = String(formData.get("trainer_id") ?? "");
  if (!id) redirect("/admin/trainers?error=missing_id");
  const sb = createAdminClient();
  // Archive by clearing the auth link + setting payout_status=paused. Keeps
  // the historical row + payouts intact for reporting.
  await sb.from("trainers").update({ auth_user_id: null, payout_status: "paused" }).eq("id", id);
  await logAdminAction({ adminUserId: admin.id, action: "archive_trainer", targetType: "trainer", targetId: id });
  redirect(`/admin/trainers?archived=${id}`);
}

/* -------------------------------------------------------------------------- */
/*  Shop products                                                             */
/* -------------------------------------------------------------------------- */

export async function createProductAction(formData: FormData) {
  const admin = await gate();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/products/new?error=name_required");
  const slug = slugify(String(formData.get("slug") ?? "") || name);
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const priceDollars = Number(formData.get("price_dollars") ?? 0);
  const priceCents = Math.round(Math.max(0, priceDollars) * 100);
  const compareDollarsRaw = String(formData.get("compare_at_dollars") ?? "").trim();
  const compareCents = compareDollarsRaw ? Math.round(Math.max(0, Number(compareDollarsRaw)) * 100) : null;
  const tag = String(formData.get("tag") ?? "").trim() || null;
  const inStock = formData.get("in_stock") !== "false";
  const sortOrderRaw = String(formData.get("sort_order") ?? "").trim();
  const sortOrder = sortOrderRaw ? Number(sortOrderRaw) : 0;
  const stockQtyRaw = String(formData.get("stock_qty") ?? "").trim();
  const stockQty = stockQtyRaw === "" ? null : Math.max(0, Math.floor(Number(stockQtyRaw)));

  let heroImage: string | null = null;
  try {
    const resolved = await resolveProductImage(formData, admin.id);
    heroImage = resolved ?? null;
  } catch (err) {
    redirect(`/admin/products/new?error=${encodeURIComponent((err as Error).message)}`);
  }

  // Optional gallery: up to 4 additional file uploads.
  const galleryUrls: string[] = heroImage ? [heroImage] : [];
  for (let i = 1; i <= 4; i++) {
    const f = formData.get(`gallery_${i}_file`);
    if (f instanceof File && f.size > 0) {
      try {
        const { url } = await uploadImageToBucket("program-images", f, admin.id);
        galleryUrls.push(url);
      } catch { /* ignore individual gallery upload failures */ }
    }
  }

  const sb = createAdminClient();
  const { data: created, error } = await sb
    .from("products")
    .insert({
      name, slug, subtitle, category, description,
      hero_image: heroImage,
      gallery: galleryUrls,
      price_cents: priceCents, compare_at_cents: compareCents, tag,
      in_stock: inStock, sort_order: sortOrder,
      stock_qty: stockQty,
    })
    .select("id, slug")
    .maybeSingle();
  if (error || !created) redirect(`/admin/products/new?error=${encodeURIComponent(error?.message ?? "create_failed")}`);
  const newId = (created as { id: string }).id;
  await logAdminAction({ adminUserId: admin.id, action: "create_product", targetType: "product", targetId: newId, details: { name, slug, stockQty } });
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect(`/admin/products/${newId}?created=1`);
}

export async function updateProductAction(formData: FormData) {
  const admin = await gate();
  const id = String(formData.get("product_id") ?? "");
  if (!id) redirect("/admin/products?error=missing_id");
  const patch: Record<string, unknown> = {};
  const setText = (k: string, dest: string = k) => {
    const r = formData.get(k);
    if (r !== null) patch[dest] = String(r).trim() || null;
  };
  setText("name");
  setText("subtitle");
  setText("category");
  setText("description");
  setText("tag");

  // Hero image: file upload wins, then URL field, else leave column alone.
  try {
    const resolved = await resolveProductImage(formData, admin.id);
    if (resolved !== undefined) patch.hero_image = resolved;
  } catch (err) {
    redirect(`/admin/products/${id}?error=${encodeURIComponent((err as Error).message)}`);
  }

  if (formData.get("price_dollars") !== null) {
    patch.price_cents = Math.round(Math.max(0, Number(formData.get("price_dollars") ?? 0)) * 100);
  }
  if (formData.get("compare_at_dollars") !== null) {
    const v = String(formData.get("compare_at_dollars") ?? "").trim();
    patch.compare_at_cents = v === "" ? null : Math.round(Math.max(0, Number(v)) * 100);
  }
  if (formData.get("sort_order") !== null) {
    patch.sort_order = Number(formData.get("sort_order") ?? 0);
  }
  if (formData.get("stock_qty") !== null) {
    const raw = String(formData.get("stock_qty") ?? "").trim();
    patch.stock_qty = raw === "" ? null : Math.max(0, Math.floor(Number(raw)));
  }
  patch.in_stock = formData.get("in_stock") === "on";

  // Optional appended gallery uploads — append to existing array.
  const sb = createAdminClient();
  const newGalleryUrls: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const f = formData.get(`gallery_${i}_file`);
    if (f instanceof File && f.size > 0) {
      try {
        const { url } = await uploadImageToBucket("program-images", f, admin.id);
        newGalleryUrls.push(url);
      } catch { /* ignore */ }
    }
  }
  if (newGalleryUrls.length > 0) {
    const { data: existing } = await sb.from("products").select("gallery").eq("id", id).maybeSingle();
    const existingGallery = ((existing as { gallery: string[] | null } | null)?.gallery ?? []) as string[];
    patch.gallery = [...existingGallery, ...newGalleryUrls];
  }

  await sb.from("products").update(patch).eq("id", id);
  await logAdminAction({ adminUserId: admin.id, action: "update_product", targetType: "product", targetId: id, details: patch });
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/shop/${String(formData.get("slug") ?? "")}`);
  redirect(`/admin/products/${id}?updated=1`);
}

export async function deleteProductAction(formData: FormData) {
  const admin = await gate();
  const id = String(formData.get("product_id") ?? "");
  if (!id) redirect("/admin/products?error=missing_id");
  const sb = createAdminClient();
  await sb.from("products").delete().eq("id", id);
  await logAdminAction({ adminUserId: admin.id, action: "delete_product", targetType: "product", targetId: id });
  redirect("/admin/products?deleted=1");
}

/* -------------------------------------------------------------------------- */
/*  Programs / Events / Challenges (admin oversight: archive)                 */
/* -------------------------------------------------------------------------- */

export async function archiveProgramAction(formData: FormData) {
  const admin = await gate();
  const id = String(formData.get("program_id") ?? "");
  if (!id) redirect("/admin/programs?error=missing_id");
  const sb = createAdminClient();
  await sb.from("programs").update({ status: "archived" }).eq("id", id);
  await logAdminAction({ adminUserId: admin.id, action: "archive_program", targetType: "program", targetId: id });
  redirect(`/admin/programs?archived=${id}`);
}

export async function archiveChallengeAction(formData: FormData) {
  const admin = await gate();
  const id = String(formData.get("challenge_id") ?? "");
  if (!id) redirect("/admin/challenges?error=missing_id");
  const sb = createAdminClient();
  await sb.from("challenges").update({ status: "archived" }).eq("id", id);
  await logAdminAction({ adminUserId: admin.id, action: "archive_challenge", targetType: "challenge", targetId: id });
  redirect(`/admin/challenges?archived=${id}`);
}

export async function cancelEventAction(formData: FormData) {
  const admin = await gate();
  const id = String(formData.get("event_id") ?? "");
  if (!id) redirect("/admin/events?error=missing_id");
  const sb = createAdminClient();
  await sb.from("events").update({ status: "cancelled" }).eq("id", id);
  await logAdminAction({ adminUserId: admin.id, action: "cancel_event", targetType: "event", targetId: id });
  redirect(`/admin/events?cancelled=${id}`);
}
