import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import type { HydratedPost } from "@/lib/data/types";
import { LikeButton } from "./LikeButton";
import { CommentButton } from "./CommentButton";
import { relativeTime } from "./relative-time";

export function PostCard({ post }: { post: HydratedPost }) {
  const displayName = (post.author?.display_name ?? "MEMBER").toUpperCase();
  const tagLabel = post.kind === "announcement" ? "ANNOUNCE" : post.is_staff ? "STAFF" : null;
  const tagBg = tagLabel === "ANNOUNCE" ? "var(--rose)" : "var(--sky)";
  const t = relativeTime(post.created_at);
  const locationLabel = post.location ?? "ATL HQ";

  // Optional decorations driven by meta — keeps the legacy mockup variants
  // (event overlay, progress bar, milestone badge) working without forcing
  // every member post to fill them out.
  const meta = (post.meta ?? {}) as Record<string, unknown>;
  const eventTag = typeof meta.event_tag === "string" ? meta.event_tag : (post.kind === "event" || post.kind === "announcement") && typeof meta.date === "string" ? meta.date : null;
  const eventCta = typeof meta.event_cta === "string" ? meta.event_cta : null;
  const progress = (meta.progress && typeof meta.progress === "object")
    ? meta.progress as { day?: number; total?: number; label?: string }
    : null;
  const milestone = typeof meta.pr === "string" ? meta.pr : null;

  return (
    <div style={{ borderRadius: 16, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)", overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: "rgba(10,14,20,0.08)" }}>
          {post.author?.avatar_url && (
            <Photo src={post.author.avatar_url} alt="" style={{ width: "100%", height: "100%" }} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{displayName}{post.is_staff && post.kind !== "announcement" ? " · TRAINER" : ""}</span>
            {tagLabel && <span className="e-mono" style={{ background: tagBg, color: "var(--ink)", padding: "1px 5px", borderRadius: 3, fontSize: 8 }}>{tagLabel}</span>}
          </div>
          <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", marginTop: 2 }}>{t} · {locationLabel}</div>
        </div>
        <span style={{ color: "rgba(10,14,20,0.5)", letterSpacing: "2px" }}>···</span>
      </div>

      {post.body && (
        <div style={{ padding: "0 14px 12px", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{post.body}</div>
      )}

      {post.media_url && post.media_type === "image" && (
        <div style={{ height: 220, position: "relative" }}>
          <Photo src={post.media_url} alt="" style={{ position: "absolute", inset: 0 }} />
          {eventTag && (
            <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, padding: 10, borderRadius: 10, background: "rgba(10,14,20,0.7)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", gap: 10 }}>
              <span className="e-tag" style={{ color: "var(--sky)" }}>{eventTag}</span>
              {eventCta && <button className="btn btn-sky" style={{ marginLeft: "auto", padding: "6px 12px", fontSize: 10 }}>{eventCta}</button>}
            </div>
          )}
        </div>
      )}

      {post.media_url && post.media_type === "video" && (
        <div style={{ height: 220, position: "relative", background: "#000" }}>
          <video
            src={post.media_url}
            controls
            playsInline
            preload="metadata"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", background: "#000" }}
          />
        </div>
      )}

      {progress && typeof progress.day === "number" && typeof progress.total === "number" && progress.total > 0 && (
        <div style={{ margin: "0 14px 12px", padding: 12, background: "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(77,169,214,0.05))", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--electric-deep)" }}>{progress.day}<span style={{ fontSize: 14, opacity: 0.6 }}>/{progress.total}</span></div>
          <div style={{ flex: 1 }}>
            <div className="e-mono" style={{ fontSize: 9, color: "var(--electric-deep)" }}>{(progress.label ?? "PROGRAM").toUpperCase()}</div>
            <div style={{ height: 4, background: "rgba(46,127,176,0.2)", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, Math.round((progress.day / progress.total) * 100))}%`, height: "100%", background: "var(--electric-deep)" }} />
            </div>
          </div>
        </div>
      )}

      {milestone && (
        <div style={{ margin: "0 14px 12px", padding: 12, background: "var(--ink)", color: "var(--bone)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--sky)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="flame" size={16} />
          </div>
          <div className="e-mono" style={{ fontSize: 10, color: "var(--sky)" }}>{milestone.toUpperCase()}</div>
        </div>
      )}

      <div style={{ padding: "12px 14px", display: "flex", gap: 16, alignItems: "center", borderTop: "1px solid rgba(10,14,20,0.06)" }}>
        <LikeButton postId={post.id} initialLiked={post.liked_by_me} initialCount={post.like_count} />
        <CommentButton postId={post.id} initialCount={post.comment_count} />
        <div style={{ marginLeft: "auto", color: "var(--ink)" }}><Icon name="arrowUpRight" size={16} /></div>
      </div>
    </div>
  );
}
