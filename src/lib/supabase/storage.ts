import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Construct a public URL for an object stored in a public bucket.
 * Bucket must be marked public in Supabase Storage for the URL to actually serve.
 */
export function publicUrl(bucket: string, key: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${key}`;
}

/**
 * Slugify a filename while preserving its extension. Lowercases, replaces any
 * non-alphanumeric run with a single dash, trims leading/trailing dashes.
 */
function slugify(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  const base = lastDot > 0 ? filename.slice(0, lastDot) : filename;
  const ext = lastDot > 0 ? filename.slice(lastDot + 1) : "";
  const slugBase = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "file";
  const slugExt = ext.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return slugExt ? `${slugBase}.${slugExt}` : slugBase;
}

/**
 * Upload an image to a public Supabase Storage bucket using the service-role
 * admin client. The admin client bypasses RLS so the upload always succeeds —
 * we manually enforce per-user ownership via the `${userId}/...` key prefix.
 *
 * Returns the canonical public URL plus the storage key (handy if you later
 * need to delete or replace the object).
 */
export async function uploadImageToBucket(
  bucket: "program-images" | "trainer-uploads",
  file: File,
  userId: string,
): Promise<{ url: string; key: string }> {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client unavailable — missing SUPABASE_SERVICE_ROLE_KEY?");
  }

  const key = `${userId}/${crypto.randomUUID()}-${slugify(file.name)}`;

  const { error } = await admin.storage.from(bucket).upload(key, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload to ${bucket} failed: ${error.message}`);
  }

  return { url: publicUrl(bucket, key), key };
}

/**
 * Upload either an image OR a video to a public bucket. Same key convention
 * and admin-client setup as uploadImageToBucket; the difference is the wider
 * acceptable content-type. Used by the Wall composer and highlights uploader.
 */
export async function uploadMediaToBucket(
  bucket: "wall-media",
  file: File,
  userId: string,
): Promise<{ url: string; key: string }> {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client unavailable — missing SUPABASE_SERVICE_ROLE_KEY?");
  }

  const key = `${userId}/${crypto.randomUUID()}-${slugify(file.name)}`;

  const { error } = await admin.storage.from(bucket).upload(key, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload to ${bucket} failed: ${error.message}`);
  }

  return { url: publicUrl(bucket, key), key };
}
