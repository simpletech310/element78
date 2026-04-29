import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateProfileAction } from "@/lib/profile-actions";

const ERR_MESSAGES: Record<string, string> = {
  name_required: "Display name is required.",
};

export default async function EditProfilePage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/edit");

  const sb = createClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("display_name, handle, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const p = (profile as { display_name?: string; handle?: string; avatar_url?: string } | null) ?? {};
  const displayName = p.display_name ?? (user.user_metadata?.display_name as string | undefined) ?? user.email?.split("@")[0] ?? "";
  const handle = p.handle ?? (user.email?.split("@")[0] ?? "");
  const avatarUrl = p.avatar_url ?? null;

  const errMsg = searchParams.error ? (ERR_MESSAGES[searchParams.error] ?? decodeURIComponent(searchParams.error)) : null;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/account" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ACCOUNT</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>EDIT · PROFILE</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 52px)", lineHeight: 0.92, marginTop: 8 }}>YOU.</h1>
          <p style={{ marginTop: 14, fontSize: 13, color: "rgba(242,238,232,0.6)", lineHeight: 1.6 }}>
            Update your name and avatar. Reflects everywhere — account header, saved items, posts, trainer view.
          </p>
        </div>

        {errMsg && (
          <div className="e-mono" style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
            {errMsg}
          </div>
        )}

        <form action={updateProfileAction} encType="multipart/form-data" style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 16, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
          {/* Avatar preview */}
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--sky)", flexShrink: 0, background: "var(--haze)" }}>
              {avatarUrl ? (
                <Photo src={avatarUrl} alt={displayName} style={{ width: "100%", height: "100%" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(242,238,232,0.45)" }}>
                  <Icon name="user" size={28} />
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.2em" }}>CURRENT</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, marginTop: 4 }}>{displayName.toUpperCase()}</div>
              <div className="e-mono" style={{ marginTop: 4, fontSize: 10, color: "rgba(242,238,232,0.5)", letterSpacing: "0.16em" }}>@{handle}</div>
            </div>
          </div>

          <Field label="DISPLAY NAME *">
            <input name="display_name" required defaultValue={displayName} className="ta-input" />
          </Field>
          <Field label="HANDLE">
            <input name="handle" defaultValue={handle} placeholder="lowercase-letters-numbers-only" className="ta-input" />
          </Field>
          <Field label="NEW AVATAR · UPLOAD (LEAVE BLANK TO KEEP CURRENT)">
            <input type="file" name="avatar_file" accept="image/*" className="ta-input" />
          </Field>
          <Field label="OR AVATAR URL">
            <input name="avatar_url" placeholder="https://… or /assets/..." className="ta-input" />
          </Field>

          <div style={{ marginTop: 6, display: "flex", gap: 10 }}>
            <button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>SAVE</button>
            <Link href="/account" className="btn" style={{ padding: "12px 18px", background: "transparent", color: "rgba(242,238,232,0.6)", border: "1px solid rgba(143,184,214,0.2)" }}>
              CANCEL
            </Link>
          </div>
        </form>
      </div>

      <style>{`
        .ta-input {
          padding: 10px 12px;
          border-radius: 8px;
          background: rgba(10,14,20,0.4);
          border: 1px solid rgba(143,184,214,0.25);
          color: var(--bone);
          font-family: var(--font-body);
          font-size: 13px;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="e-mono" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9, color: "rgba(242,238,232,0.6)", letterSpacing: "0.2em" }}>
      {label}
      {children}
    </label>
  );
}
