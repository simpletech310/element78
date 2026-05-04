import { notFound } from "next/navigation";
import Link from "next/link";
import { TabBar } from "@/components/chrome/TabBar";
import { Navbar } from "@/components/site/Navbar";
import { Photo } from "@/components/ui/Photo";
import { getUser } from "@/lib/auth";
import { getEvent } from "@/lib/data/queries";
import { EventCta } from "./_components/EventCta";

export const dynamic = "force-dynamic";

export default async function EventDetail({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { paid?: string; cancelled?: string; error?: string };
}) {
  const user = await getUser();
  const event = await getEvent(params.slug, user?.id ?? null);
  if (!event) notFound();

  const capacityFull = event.capacity !== null && event.rsvp_count >= event.capacity;
  const my = event.rsvped_by_me;

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <Navbar authed={!!user} />
      <div className="app-scroll" style={{ paddingTop: 20, paddingBottom: 100 }}>
        {searchParams.paid && (
          <div className="e-mono" style={{ margin: "0 22px 12px", padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.18)", border: "1px solid rgba(143,184,214,0.4)", color: "var(--electric-deep)", fontSize: 11, letterSpacing: "0.16em" }}>
            ✓ PAYMENT RECEIVED · YOU'RE IN.
          </div>
        )}
        {searchParams.cancelled && (
          <div className="e-mono" style={{ margin: "0 22px 12px", padding: "12px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
            CHECKOUT CANCELLED · NO CHARGE.
          </div>
        )}
        {searchParams.error && (
          <div className="e-mono" style={{ margin: "0 22px 12px", padding: "12px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
            {searchParams.error.toUpperCase().replace(/_/g, " ")}
          </div>
        )}

        <div style={{ padding: "0 22px 10px" }}>
          <div style={{ borderRadius: 18, overflow: "hidden", background: "var(--ink)", color: "var(--bone)", position: "relative", minHeight: 240 }}>
            {event.hero_image && <Photo src={event.hero_image} alt="" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(46,127,176,0.7), rgba(10,14,20,0.85))" }} />
            <div style={{ position: "relative", padding: 22, display: "flex", flexDirection: "column", gap: 14, minHeight: 240 }}>
              <span className="e-tag" style={{ background: "var(--sky)", color: "var(--ink)", padding: "5px 9px", borderRadius: 3, alignSelf: "flex-start" }}>
                EVENT · {event.price_cents > 0 ? `$${(event.price_cents / 100).toFixed(2)}` : "FREE"}
              </span>
              <div>
                <div className="e-display" style={{ fontSize: 32, lineHeight: 0.95 }}>{event.title}</div>
                {event.subtitle && <div style={{ marginTop: 8, color: "rgba(255,255,255,0.78)" }}>{event.subtitle}</div>}
              </div>
              <div className="e-mono" style={{ color: "var(--sky)", fontSize: 11, letterSpacing: "0.16em" }}>
                {new Date(event.starts_at).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                {" · "}{event.location?.name ?? "GYM"}
              </div>
              <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div className="e-mono" style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>
                  {event.capacity ? `${event.rsvp_count}/${event.capacity} JOINED` : `${event.rsvp_count} JOINED`}
                </div>
                <div style={{ flex: 1 }} />
                <EventCta
                  eventId={event.id}
                  slug={event.slug}
                  priceCents={event.price_cents}
                  capacityFull={capacityFull}
                  myStatus={my?.status ?? null}
                  signedIn={!!user}
                />
              </div>
            </div>
          </div>
        </div>

        {event.description && (
          <div style={{ padding: "10px 22px 6px", fontSize: 14, lineHeight: 1.6, color: "var(--ink)", whiteSpace: "pre-wrap" }}>
            {event.description}
          </div>
        )}

        {event.author && (
          <div style={{ padding: "16px 22px 4px" }}>
            <div className="e-mono" style={{ fontSize: 10, color: "rgba(10,14,20,0.5)", letterSpacing: "0.18em" }}>HOSTED BY</div>
            <Link
              href={`/trainers/${event.author.handle ?? ""}`}
              style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "center", padding: "10px 12px", borderRadius: 12, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)", textDecoration: "none", color: "var(--ink)" }}
            >
              <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: "rgba(10,14,20,0.08)" }}>
                {event.author.avatar_url && <Photo src={event.author.avatar_url} alt="" style={{ width: "100%", height: "100%" }} />}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{(event.author.display_name ?? "COACH").toUpperCase()}</div>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", letterSpacing: "0.14em" }}>COACH · STAFF</div>
              </div>
            </Link>
          </div>
        )}
      </div>
      <TabBar />
    </div>
  );
}
