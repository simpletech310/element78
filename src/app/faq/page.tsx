import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingTabBar } from "@/components/site/FloatingTabBar";
import { getUser } from "@/lib/auth";

/**
 * Element 78 FAQ — single dedicated page so the home stays tight.
 * Brand-styled <details> accordions (no client JS, no a11y wrapper lib).
 * Sections cover the recurring "wait, how does this actually work?" beats:
 * the gym floor, AI coaches, the human network, classes, membership,
 * billing, and the app. Copy stays in the same voice as the landing page.
 */
export const metadata = {
  title: "Element 78 — FAQ",
  description: "How the gym, the studio, the AI coaches, and the membership work — answered.",
};

type FaqSection = {
  num: string;
  title: string;
  blurb?: string;
  items: { q: string; a: string }[];
};

const sections: FaqSection[] = [
  {
    num: "01",
    title: "THE GYM",
    blurb: "The Atlanta floor — what's there, when it's open, how to get on it.",
    items: [
      {
        q: "When are you open?",
        a: "24 hours a day, every day. Members tap in with the app or the keypad — no front-desk wait. Class blocks happen in the morning and evening; the rest of the floor is yours whenever.",
      },
      {
        q: "What's actually on the floor?",
        a: "Reformers, free weights, treadmills, a mat room for Pilates and yoga, a HIIT pit, and a recovery lounge with cold plunge, sauna, and stretch space. Everything's set up so you can rotate without waiting on a coach.",
      },
      {
        q: "Do I need to bring anything?",
        a: "Just clean shoes and a water bottle. Towels, mats, bands, blocks, and reformer covers are stocked. The store has the rest if you forgot something.",
      },
      {
        q: "Can guests come with me?",
        a: "Elite members get one guest pass a month. Beyond that, day passes are sold at the front for $25.",
      },
    ],
  },
  {
    num: "02",
    title: "AI COACHES",
    blurb: "Three avatars, three lanes — Zuri, Mari, Leila. Train alongside them anywhere.",
    items: [
      {
        q: "What does an AI coach actually do?",
        a: "They run the routine with you — cue your form, count your reps, time your rest, swap exercises. Each one has a lane: Zuri for Pilates and Reformer, Mari for HIIT and conditioning, Leila for yoga and recovery.",
      },
      {
        q: "Where do I follow them?",
        a: "On the app, on a gym booth screen, or both. Start a session in your living room, finish it on the reformer — your spot in the routine carries over.",
      },
      {
        q: "Are the AI coaches free?",
        a: "Yes. All three are unlocked for every member, including the Studio-only tier. We don't paywall the basics.",
      },
      {
        q: "Can I just watch a routine without an AI coaching me?",
        a: "Absolutely. Studio sessions can run as plain video. The AI cues are an add-on, not a requirement.",
      },
    ],
  },
  {
    num: "03",
    title: "REAL COACHES",
    blurb: "When you want a person on the line, not a model.",
    items: [
      {
        q: "How do I book a real coach?",
        a: "Tap any coach on the /trainers page or in the app. Pick a 1-on-1 slot, choose video or in-person, and book. They get the request the moment you submit.",
      },
      {
        q: "Are the coaches in Atlanta only?",
        a: "Some are. We also have a network of coaches around the country who run video sessions only — same standards, just remote. The booking flow shows you which is which.",
      },
      {
        q: "What happens during a video session?",
        a: "You and the coach drop into a private room in the app. They see you, you see them, and they can drive a workout demo on screen so the form work stays synced. Mic, cam, and the routine all live in one window.",
      },
      {
        q: "Can a real coach take over an AI session?",
        a: "Yes. If you start with an AI coach and want a person, book a 1-on-1 right from the session screen. We hand off mid-routine.",
      },
    ],
  },
  {
    num: "04",
    title: "CLASSES",
    blurb: "Reformer + HIIT, daily. Open to members.",
    items: [
      {
        q: "What classes do you run?",
        a: "Reformer Pilates and HIIT are the daily anchor. Mobility, strength, and yoga rotate in across the week. The schedule lives at /classes — book a spot or walk in if there's room.",
      },
      {
        q: "How big are the class blocks?",
        a: "Reformer caps at 8, HIIT at 12, the rest fluctuate. Small enough that the coach actually sees you, big enough that the energy moves.",
      },
      {
        q: "Late or no-show?",
        a: "More than 5 minutes late and we release your spot. No-shows on a Reformer block forfeit one credit. Cancel up to 4 hours before, no penalty.",
      },
    ],
  },
  {
    num: "05",
    title: "MEMBERSHIP & BILLING",
    blurb: "Three tiers, no contracts, cancel any time.",
    items: [
      {
        q: "What's included with each tier?",
        a: "WEEKDAY ($49/mo): Mon–Fri 5A–9P, full floor + group classes. ELITE ($129/mo): 24/7 access, unlimited classes, Studio + 1 guest pass a month. STUDIO ($19/mo): app only — Studio routines, AI coaches, the crew timeline.",
      },
      {
        q: "How do I cancel?",
        a: "From /account/membership. One tap, no email chase. Your access stays live until the end of the current billing cycle.",
      },
      {
        q: "Refunds?",
        a: "Pro-rated refunds for unused class credits and for the rest of the month if you cancel within 7 days of joining. Stripe handles the payout — usually back on your card within 5 business days.",
      },
      {
        q: "Can I freeze my membership?",
        a: "Yes — up to 60 days a year, paused at half rate. Useful if you're traveling or recovering.",
      },
    ],
  },
  {
    num: "06",
    title: "THE APP",
    blurb: "iOS, Android, and a web PWA you can install.",
    items: [
      {
        q: "Do I need the app to use the gym?",
        a: "It's the cleanest path — tap-in at the door, book classes, follow AI coaches, message your trainer. You can do most of it on the web too.",
      },
      {
        q: "Push notifications?",
        a: "Optional. We use them for live-call rings (when a coach starts a 1-on-1 with you), booking confirmations, and class reminders. You toggle them per category in settings.",
      },
      {
        q: "What if my phone dies on the floor?",
        a: "Every gym booth has a kiosk that signs you into your session with a member code. Your routine resumes where you left it.",
      },
    ],
  },
  {
    num: "07",
    title: "HELLO?",
    blurb: "Talk to a real person.",
    items: [
      {
        q: "Where's the gym?",
        a: "Atlanta. Address and a map live at /locations. Studio members can be anywhere — the gym waits for the next time you're in town.",
      },
      {
        q: "Press, partnerships, careers?",
        a: "All on /contact. We read every message. Coaches looking to join the network apply at /coach/apply.",
      },
      {
        q: "Something else?",
        a: "Email hello@element78.com or DM us in the app. We answer fast.",
      },
    ],
  },
];

export default async function FAQPage() {
  const user = await getUser();

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={!!user} />

      {/* Hero */}
      <section style={{ padding: "60px 22px 36px", maxWidth: 880, margin: "0 auto" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>FAQ</div>
        <h1 className="e-display glow" style={{ fontSize: "clamp(56px, 11vw, 104px)", lineHeight: 0.92, marginTop: 12 }}>
          ASK US.<br/>WE&rsquo;LL TELL YOU.
        </h1>
        <p style={{ marginTop: 18, fontSize: 16, color: "rgba(242,238,232,0.7)", lineHeight: 1.6, maxWidth: 540, fontWeight: 300 }}>
          The gym, the AI coaches, the real coaches, the classes, billing — what you actually want to know before you walk in. If we missed it, drop us a line.
        </p>
      </section>

      {/* Sections */}
      <section style={{ padding: "20px 22px 60px", maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 36 }}>
        {sections.map((s) => (
          <div key={s.num}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
              <span className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.28em" }}>{s.num}</span>
              <h2 className="e-display" style={{ fontSize: "clamp(28px, 5vw, 36px)", lineHeight: 0.95, margin: 0 }}>{s.title}</h2>
            </div>
            {s.blurb && (
              <p style={{ marginTop: 8, fontSize: 14, color: "rgba(242,238,232,0.6)", lineHeight: 1.55, fontWeight: 300, maxWidth: 600 }}>{s.blurb}</p>
            )}
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              {s.items.map((it, i) => (
                <details
                  key={i}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    background: "var(--haze)",
                    border: "1px solid rgba(143,184,214,0.18)",
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      listStyle: "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16,
                      fontFamily: "var(--font-display)",
                      fontSize: 17,
                      lineHeight: 1.25,
                      color: "var(--bone)",
                    }}
                  >
                    <span>{it.q}</span>
                    <span aria-hidden style={{ color: "var(--sky)", fontFamily: "var(--font-mono)", fontSize: 18, lineHeight: 1, flexShrink: 0 }}>+</span>
                  </summary>
                  <div style={{ marginTop: 12, fontSize: 14, color: "rgba(242,238,232,0.78)", lineHeight: 1.65, fontWeight: 300 }}>
                    {it.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}

        {/* Talk to us */}
        <div
          style={{
            marginTop: 12,
            padding: "26px 26px 28px",
            borderRadius: 18,
            background: "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(46,127,176,0.04))",
            border: "1px solid rgba(143,184,214,0.28)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.22em" }}>STILL CIRCLING?</div>
            <div style={{ marginTop: 6, fontFamily: "var(--font-display)", fontSize: 24, lineHeight: 1 }}>WE&rsquo;LL ANSWER FAST.</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/contact" className="btn btn-sky" style={{ padding: "12px 22px" }}>CONTACT US</Link>
            <Link href="/join" className="btn" style={{ padding: "12px 22px", background: "transparent", color: "var(--bone)", border: "1px solid rgba(143,184,214,0.3)" }}>
              JOIN ELEMENT
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
      <FloatingTabBar />
    </div>
  );
}

// Hide the default <details> marker arrow on Safari/iOS. Scoped via the
// global style sheet would be cleaner; for now it's inline and tiny.
export const dynamic = "force-static";
