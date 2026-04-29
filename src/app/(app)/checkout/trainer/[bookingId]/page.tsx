import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";
import { getTrainer, getTrainerBooking } from "@/lib/data/queries";
import { payTrainerBookingAction } from "@/lib/trainer-booking-actions";
import { createClient } from "@/lib/supabase/server";

function fmtMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function MockCheckoutPage({ params }: { params: { bookingId: string } }) {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkout/trainer/${params.bookingId}`)}`);

  const booking = await getTrainerBooking(params.bookingId);
  if (!booking || booking.user_id !== user.id) notFound();

  // Look up the trainer for context.
  const sb = createClient();
  const { data: trainerRow } = await sb.from("trainers").select("name, slug, avatar_url").eq("id", booking.trainer_id).maybeSingle();
  const trainerName = (trainerRow as { name?: string } | null)?.name ?? "Trainer";
  const trainerSlug = (trainerRow as { slug?: string } | null)?.slug ?? "";

  const start = new Date(booking.starts_at);
  const dateStr = start.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "2-digit" });
  const timeStr = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const alreadyPaid = booking.paid_status === "paid";

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href={trainerSlug ? `/trainers/${trainerSlug}` : "/account/sessions"} aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>BACK</span>
        </Link>

        <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10, marginTop: 24 }}>
          MOCK CHECKOUT · DEV MODE
        </div>
        <h1 className="e-display" style={{ fontSize: "clamp(36px, 8vw, 56px)", lineHeight: 0.92, marginTop: 12 }}>
          PAY {fmtMoney(booking.price_cents)}.
        </h1>

        <div style={{ marginTop: 24, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
          <Row label="TRAINER" value={trainerName} />
          <Row label="WHEN" value={`${dateStr} · ${timeStr}`} />
          <Row label="MODE" value={booking.mode === "video" ? "VIDEO CALL" : "IN PERSON · GYM"} />
          <Row label="STATUS" value={booking.status.replace(/_/g, " ").toUpperCase()} />
          <Row label="AMOUNT" value={fmtMoney(booking.price_cents)} />
        </div>

        {alreadyPaid ? (
          <div style={{ marginTop: 24, padding: 18, borderRadius: 14, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)" }}>
            <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>✓ ALREADY PAID</div>
            <p style={{ marginTop: 8, fontSize: 13, color: "rgba(242,238,232,0.7)" }}>
              The trainer will accept or decline shortly. You'll see the JOIN button on{" "}
              <Link href="/account/sessions" style={{ color: "var(--sky)" }}>your sessions</Link>{" "}
              once they confirm.
            </p>
          </div>
        ) : (
          <form action={payTrainerBookingAction} style={{ marginTop: 24 }}>
            <input type="hidden" name="booking_id" value={booking.id} />
            <button type="submit" className="btn btn-sky" style={{ width: "100%", padding: "18px", fontSize: 14, letterSpacing: "0.2em" }}>
              PAY {fmtMoney(booking.price_cents)} · CONFIRM BOOKING
            </button>
            <p className="e-mono" style={{ marginTop: 14, fontSize: 9, color: "rgba(242,238,232,0.5)", letterSpacing: "0.18em", textAlign: "center", lineHeight: 1.7 }}>
              MOCK MODE · NO CARD CHARGED. STRIPE WIRES IN VIA src/lib/payments/provider.ts —
              SET STRIPE_SECRET_KEY TO ENABLE REAL CHECKOUT.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(143,184,214,0.08)" }}>
      <span className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.2em" }}>{label}</span>
      <span className="e-mono" style={{ color: "var(--bone)", fontSize: 11, letterSpacing: "0.14em" }}>{value}</span>
    </div>
  );
}
