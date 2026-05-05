import { Photo } from "@/components/ui/Photo";

/**
 * Round avatar that gracefully degrades when the user has no photo on file.
 * Members who haven't uploaded an image get a colored circle with their first
 * letter, keyed off the display name so the same person always lands on the
 * same color across the app. Trainers nearly always have a photo via the
 * trainers table, so the fallback only kicks in for fresh member accounts.
 */
const PALETTE = [
  ["var(--electric)", "var(--ink)"],   // sky blue
  ["var(--rose)", "var(--ink)"],       // rose
  ["var(--sky)", "var(--ink)"],        // pale sky
  ["#1B2230", "var(--bone)"],          // haze
  ["#5C7A99", "var(--bone)"],          // dust blue
  ["#A14040", "var(--bone)"],          // muted red
] as const;

function colorFor(name: string | null | undefined): readonly [string, string] {
  if (!name) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function AvatarCircle({
  src,
  name,
  size = 36,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  if (src) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(10,14,20,0.08)" }}>
        <Photo src={src} alt={name ?? ""} style={{ width: "100%", height: "100%" }} />
      </div>
    );
  }
  const [bg, fg] = colorFor(name);
  const initial = (name ?? "·").trim().charAt(0).toUpperCase() || "·";
  return (
    <div
      aria-label={name ?? "Member"}
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: bg, color: fg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontSize: Math.round(size * 0.45), lineHeight: 1,
        letterSpacing: 0,
      }}
    >
      {initial}
    </div>
  );
}
