"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { uploadMediaToBucket } from "@/lib/supabase/storage";

const KINDS = [
  "progress",
  "milestone",
  "event",
  "announcement",
  "trainer_drop",
  "challenge",
  "open_mic",
] as const;
type PostKind = (typeof KINDS)[number];

const MAX_BODY = 1000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const IMAGE_MIME = /^image\/(jpeg|png|webp|gif|heic|heif)$/i;
const VIDEO_MIME = /^video\/(mp4|webm|quicktime|x-m4v)$/i;

async function gate() {
  const user = await getUser();
  if (!user) redirect("/login?next=/wall");
  const sb = createClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("id, is_banned, is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/login?next=/wall");
  const p = profile as { id: string; is_banned: boolean; is_admin: boolean };
  if (p.is_banned) redirect("/home?error=banned");
  return { user, profile: p, sb };
}

/* -------------------------------------------------------------------------- */
/*  Posts                                                                     */
/* -------------------------------------------------------------------------- */

export async function createPostAction(formData: FormData): Promise<void> {
  const { user, sb } = await gate();

  const body = String(formData.get("body") ?? "").trim().slice(0, MAX_BODY);
  const kindRaw = String(formData.get("kind") ?? "progress");
  const kind: PostKind = (KINDS as readonly string[]).includes(kindRaw) ? (kindRaw as PostKind) : "progress";
  const location = String(formData.get("location") ?? "").trim() || null;

  const file = formData.get("media");
  const mediaFile = file instanceof File && file.size > 0 ? file : null;

  if (!body && !mediaFile) {
    redirect("/wall?error=empty_post");
  }

  let mediaUrl: string | null = null;
  let mediaType: "image" | "video" | null = null;

  if (mediaFile) {
    const isImage = IMAGE_MIME.test(mediaFile.type);
    const isVideo = VIDEO_MIME.test(mediaFile.type);
    if (!isImage && !isVideo) redirect("/wall?error=bad_media_type");
    if (isImage && mediaFile.size > MAX_IMAGE_BYTES) redirect("/wall?error=image_too_large");
    if (isVideo && mediaFile.size > MAX_VIDEO_BYTES) redirect("/wall?error=video_too_large");
    const { url } = await uploadMediaToBucket("wall-media", mediaFile, user.id);
    mediaUrl = url;
    mediaType = isImage ? "image" : "video";
  }

  const { error } = await sb.from("posts").insert({
    author_id: user.id,
    kind,
    body: body || null,
    media_url: mediaUrl,
    media_type: mediaType,
    location,
    meta: {},
  });
  if (error) redirect(`/wall?error=insert_failed`);

  revalidatePath("/wall");
  redirect("/wall");
}

/* -------------------------------------------------------------------------- */
/*  Reactions                                                                 */
/* -------------------------------------------------------------------------- */

export async function togglePostLikeAction(postId: string): Promise<{ liked: boolean }> {
  const { user, sb } = await gate();
  if (!postId) return { liked: false };

  // Probe current state, then toggle. RLS only lets users touch their own row.
  const { data: existing } = await sb
    .from("post_reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await sb.from("post_reactions").delete().eq("post_id", postId).eq("user_id", user.id);
    revalidatePath("/wall");
    return { liked: false };
  }

  await sb.from("post_reactions").insert({ post_id: postId, user_id: user.id });
  revalidatePath("/wall");
  return { liked: true };
}

/* -------------------------------------------------------------------------- */
/*  Comments                                                                  */
/* -------------------------------------------------------------------------- */

export async function createCommentAction(formData: FormData): Promise<void> {
  const { user, sb } = await gate();
  const postId = String(formData.get("post_id") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, MAX_BODY);
  if (!postId || !body) return;
  await sb.from("post_comments").insert({ post_id: postId, author_id: user.id, body });
  revalidatePath("/wall");
}

export async function deleteCommentAction(commentId: string): Promise<void> {
  const { sb } = await gate();
  if (!commentId) return;
  // RLS guards: author or admin only.
  await sb.from("post_comments").delete().eq("id", commentId);
  revalidatePath("/wall");
}

/* -------------------------------------------------------------------------- */
/*  Highlights (24h)                                                          */
/* -------------------------------------------------------------------------- */

export async function createHighlightAction(formData: FormData): Promise<void> {
  const { user, sb } = await gate();
  const file = formData.get("media");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No video selected.");
  }
  const f = file as File;
  // Permissive: trust the <input accept="video/*"> filter on the client. iOS
  // Safari hands us assorted MIME strings (video/quicktime, video/mov, even
  // an empty string for some HEVC clips) — so we accept any video/* and any
  // empty type, only blocking obviously-wrong content like images or audio.
  const t = f.type.toLowerCase();
  const looksWrong = t.startsWith("image/") || t.startsWith("audio/") || t.startsWith("text/");
  if (looksWrong) throw new Error("Highlights are video only.");
  if (f.size > MAX_VIDEO_BYTES) throw new Error("Video is over 50MB.");

  let url: string;
  try {
    const r = await uploadMediaToBucket("wall-media", f, user.id);
    url = r.url;
  } catch (err) {
    throw new Error(`Upload failed: ${(err as Error).message}`);
  }

  const { error } = await sb.from("highlights").insert({ author_id: user.id, media_url: url });
  if (error) throw new Error(`Save failed: ${error.message}`);

  revalidatePath("/wall");
}

export async function deleteHighlightAction(highlightId: string): Promise<void> {
  const { sb } = await gate();
  if (!highlightId) return;
  await sb.from("highlights").delete().eq("id", highlightId);
  revalidatePath("/wall");
}
