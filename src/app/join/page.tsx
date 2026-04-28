import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { Wordmark } from "@/components/brand/Wordmark";
import { Icon } from "@/components/ui/Icon";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { signUpAction } from "@/lib/auth-actions";

export default function JoinPage({ searchParams }: { searchParams: { error?: string } }) {
  const pillars: { i: "pin" | "play" | "bag"; t: string; s: string }[] = [
    { i: "pin", t: "THE FLAGSHIP", s: "Atlanta · 24-hour access · classes · 1:1" },
    { i: "play", t: "AI STUDIO", s: "Live avatar coaching, anywhere" },
    { i: "bag", t: "THE STORE", s: "Wear it. Train in it. Leave the house in it." },
  ];
  const proofs = ["/assets/pilates-pink.jpg","/assets/blue-hair-selfie.jpg","/assets/dumbbell-street.jpg","/assets/blue-set-rooftop.jpg"];

  return (
    <div className="app app-dark" style={{ background: "#000", height: "100dvh" }}>
      <StatusBar dark />
      <div style={{ position: "absolute", inset: 0 }}>
        <Photo src="/assets/blue-set-rooftop.jpg" alt="" style={{ position: "absolute", inset: 0, opacity: 0.85 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.5) 0%, rgba(10,14,20,0.05) 30%, rgba(10,14,20,0.85) 75%, rgba(10,14,20,1) 100%)" }} />
      </div>

      <div className="app-scroll app-top" style={{ position: "relative", paddingBottom: 30 }}>
        <div style={{ padding: "0 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Wordmark size={20} color="var(--bone)" />
          <Link href="/login" style={{ background: "transparent", border: "none", color: "var(--bone)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em" }}>
            SIGN IN
          </Link>
        </div>

        <div style={{ padding: "120px 22px 30px" }}>
          <div className="e-mono" style={{ color: "var(--sky)" }}>◉ FROM ATLANTA · 24/7</div>
          <div className="e-display glow" style={{ fontSize: 64, lineHeight: 0.88, marginTop: 14 }}>
            BE IN<br/>YOUR<br/>ELEMENT.
          </div>
          <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 22, marginTop: 18, lineHeight: 1.2, color: "var(--bone)", maxWidth: 280 }}>
            Pilates with the windows down.
          </div>
          <div style={{ marginTop: 12, fontSize: 14, color: "rgba(242,238,232,0.7)", maxWidth: 300, lineHeight: 1.55 }}>
            A gym, a wardrobe, and an AI studio — built for the women the wellness industry forgot.
          </div>
        </div>

        <div style={{ padding: "0 22px", display: "flex", flexDirection: "column", gap: 8 }}>
          {pillars.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, background: "rgba(10,14,20,0.55)", backdropFilter: "blur(14px)", border: "1px solid rgba(143,184,214,0.18)" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(143,184,214,0.2)", color: "var(--sky)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={p.i} size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--bone)" }}>{p.t}</div>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginTop: 3 }}>{p.s}</div>
              </div>
              <Icon name="chevron" size={16} />
            </div>
          ))}
        </div>

        <div style={{ padding: "24px 22px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex" }}>
            {proofs.map((s, i) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--ink)", marginLeft: i ? -8 : 0 }}>
                <Photo src={s} alt="" style={{ width: "100%", height: "100%" }} />
              </div>
            ))}
          </div>
          <div className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.6)" }}>1,408 WOMEN ALREADY IN.</div>
        </div>

        <form action={signUpAction} style={{ padding: "28px 22px 0", display: "flex", flexDirection: "column", gap: 10 }}>
          {searchParams?.error && (
            <div style={{ fontSize: 12, color: "var(--rose)", fontFamily: "var(--font-mono)" }}>{searchParams.error}</div>
          )}
          <input
            name="display_name"
            placeholder="YOUR NAME"
            required
            className="field-input"
          />
          <input
            name="email"
            type="email"
            placeholder="EMAIL"
            required
            autoComplete="email"
            className="field-input"
          />
          <input
            name="password"
            type="password"
            placeholder="PASSWORD · MIN 6"
            required
            minLength={6}
            autoComplete="new-password"
            className="field-input"
          />
          <button type="submit" className="btn btn-sky" style={{ padding: "18px 22px", fontSize: 12 }}>
            JOIN ELEMENT — START FREE
          </button>
          <div className="e-mono" style={{ textAlign: "center", fontSize: 9, color: "rgba(242,238,232,0.45)" }}>
            7 DAYS FREE · CANCEL ANYTIME · NO CARD UP FRONT
          </div>
        </form>
      </div>
      <HomeIndicator dark />
    </div>
  );
}
