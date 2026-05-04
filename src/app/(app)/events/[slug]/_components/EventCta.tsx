"use client";

import { useTransition } from "react";
import { rsvpFreeEventAction, cancelRsvpAction, buyEventTicketAction } from "@/lib/event-actions";

export function EventCta({
  eventId,
  slug,
  priceCents,
  capacityFull,
  myStatus,
  signedIn,
}: {
  eventId: string;
  slug: string;
  priceCents: number;
  capacityFull: boolean;
  myStatus: "rsvp" | "pending_payment" | "paid" | "cancelled" | "attended" | "refunded" | null;
  signedIn: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <a href={`/login?next=/events/${slug}`} className="btn btn-sky" style={{ padding: "12px 20px" }}>
        SIGN IN TO {priceCents > 0 ? "BUY TICKET" : "RSVP"}
      </a>
    );
  }

  // Already in
  if (myStatus === "rsvp") {
    return (
      <form action={cancelRsvpAction}>
        <input type="hidden" name="event_id" value={eventId} />
        <input type="hidden" name="slug" value={slug} />
        <button type="submit" disabled={pending} className="e-tag" style={{ padding: "10px 16px", borderRadius: 999, background: "transparent", border: "1px solid rgba(10,14,20,0.3)", cursor: "pointer" }}>
          RSVP'D · CANCEL
        </button>
      </form>
    );
  }
  if (myStatus === "paid") {
    return <span className="btn btn-sky" style={{ padding: "12px 20px" }}>✓ TICKET CONFIRMED</span>;
  }
  if (myStatus === "pending_payment") {
    return <span className="btn btn-ink" style={{ padding: "12px 20px" }}>PAYMENT PENDING…</span>;
  }

  if (capacityFull) {
    return <span className="btn btn-ink" style={{ padding: "12px 20px", opacity: 0.6, cursor: "not-allowed" }}>SOLD OUT</span>;
  }

  if (priceCents === 0) {
    return (
      <form action={rsvpFreeEventAction}>
        <input type="hidden" name="event_id" value={eventId} />
        <input type="hidden" name="slug" value={slug} />
        <button type="submit" disabled={pending} className="btn btn-sky" style={{ padding: "12px 20px" }}>RSVP</button>
      </form>
    );
  }

  return (
    <form action={buyEventTicketAction} onSubmit={() => startTransition(() => undefined)}>
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />
      <button type="submit" disabled={pending} className="btn btn-sky" style={{ padding: "12px 20px" }}>
        {pending ? "REDIRECTING…" : `BUY TICKET · $${(priceCents / 100).toFixed(2)}`}
      </button>
    </form>
  );
}
