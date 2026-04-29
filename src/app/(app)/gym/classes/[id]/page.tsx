import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { notFound, redirect } from "next/navigation";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { SpotPicker } from "@/components/site/SpotPicker";
import { getClass, getTrainer, getUserBookingForClass, listTakenSpots } from "@/lib/data/queries";
import { getSavedKindRefs } from "@/lib/data/saved-queries";
import { SaveButton } from "@/components/site/SaveButton";
import { getUser } from "@/lib/auth";
import { cancelBookingAction } from "@/lib/class-actions";

function fmtPrice(cents: number) {
  if (!cents) return "FREE";
  return `$${(cents / 100).toFixed(0)}`;
}

export default async function ClassDetailInApp({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { reserved?: string; cancelled?: string; error?: string; spot?: string };
}) {
  const user = await getUser();
  if (!user) redirect(`/login?next=/gym/classes/${params.id}`);

  const c = await getClass(params.id);
  if (!c) notFound();

  const [taken, trainer, booking, savedClassIds] = await Promise.all([
    listTakenSpots(c.id),
    c.trainer_id ? getTrainer(c.trainer_id).then(t => t).catch(() => null) : Promise.resolve(null),
    getUserBookingForClass(user.id, c.id),
    getSavedKindRefs(user.id, "class"),
  ]);
  const isSaved = savedClassIds.has(c.id);

  const dt = new Date(c.starts_at);
  const dateStr = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
  const timeStr = `${dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} — ${new Date(dt.getTime() + c.duration_min * 60000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  const isReserved = !!booking && booking.status === "reserved";

  const banner = searchParams.reserved === "1" ? "reserved"
              : searchParams.cancelled === "1" ? "cancelled"
              : searchParams.error ? "error"
              : null;

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <Navbar authed={true} />
      <div className="app-scroll" style={{ paddingBottom: 30 }}>
        {banner && (
          <div style={{
            padding: "12px 22px",
            background: banner === "error" ? "rgba(232,181,168,0.08)" : "rgba(143,184,214,0.12)",
            borderBottom: "1px solid rgba(143,184,214,0.18)",
          }}>
            <div className="e-mono" style={{ fontSize: 11, letterSpacing: "0.18em", color: banner === "error" ? "var(--rose)" : "var(--electric-deep)" }}>
              {banner === "reserved" && (booking?.spot_number ? `✓ SPOT ${booking.spot_number} RESERVED` : "✓ RESERVED")}
              {banner === "cancelled" && "✓ RESERVATION CANCELLED"}
              {banner === "error" && (searchParams.error ?? "Something went wrong.")}
            </div>
          </div>
        )}

        {/* HERO */}
        <div style={{ position: "relative", height: 360 }}>
          {c.hero_image && <Photo src={c.hero_image} alt={c.name} style={{ position: "absolute", inset: 0 }} />}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.65) 0%, rgba(10,14,20,0) 30%, rgba(10,14,20,0) 50%, rgba(10,14,20,0.95) 100%)" }} />
          <div style={{ position: "absolute", top: 16, left: 22, right: 22, display: "flex", justifyContent: "space-between" }}>
            <Link href="/gym" style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(10,14,20,0.6)", backdropFilter: "blur(10px)", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
            </Link>
            <div style={{ display: "flex", gap: 8 }}>
              <SaveButton
                kind="class"
                ref_id={c.id}
                ref_slug={c.slug}
                ref_name={c.name}
                ref_image={c.hero_image}
                isSaved={isSaved}
                return_to={`/gym/classes/${c.id}`}
                size={40}
              />
            </div>
          </div>
          <div style={{ position: "absolute", left: 22, right: 22, bottom: 18, color: "var(--bone)" }}>
            <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.18em" }}>{c.kind?.toUpperCase()} · {c.room} · {c.duration_min} MIN</div>
            <div className="e-display" style={{ fontSize: 44, lineHeight: 0.9, marginTop: 6 }}>{c.name}</div>
            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 11px", borderRadius: 999, background: c.requires_payment ? "var(--sky)" : "rgba(143,184,214,0.18)", color: c.requires_payment ? "var(--ink)" : "var(--sky)", border: c.requires_payment ? "none" : "1px solid rgba(143,184,214,0.4)" }}>
              <span className="e-mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>{fmtPrice(c.price_cents)}</span>
            </div>
          </div>
        </div>

        {/* DATE TILE */}
        <div style={{ padding: "20px 22px 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 14, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)" }}>
            <div>
              <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", letterSpacing: "0.18em" }}>{dateStr}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 2 }}>{timeStr}</div>
            </div>
            <Icon name="cal" size={22} />
          </div>
        </div>

        {/* TRAINER */}
        {trainer && (
          <div style={{ padding: "14px 22px 4px" }}>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", marginBottom: 8, letterSpacing: "0.2em" }}>WITH</div>
            <Link href={`/trainers/${trainer.slug}`} className="lift" style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)", color: "var(--ink)", textDecoration: "none" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                <Photo src={trainer.avatar_url ?? trainer.hero_image ?? ""} alt={trainer.name} style={{ width: "100%", height: "100%" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{trainer.name.toUpperCase()}</div>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", marginTop: 2, letterSpacing: "0.18em" }}>★ {trainer.rating} · {trainer.specialties.slice(0, 2).join(" · ").toUpperCase()}</div>
              </div>
              <Icon name="chevron" size={18} />
            </Link>
          </div>
        )}

        {/* SUMMARY + WHAT TO BRING */}
        {(c.summary || c.what_to_bring) && (
          <div style={{ padding: "20px 22px 4px" }}>
            {c.summary && (
              <>
                <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", marginBottom: 8, letterSpacing: "0.2em" }}>WHAT TO EXPECT</div>
                <div style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(10,14,20,0.78)" }}>{c.summary}</div>
              </>
            )}
            {c.what_to_bring && (
              <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.08)" }}>
                <div className="e-mono" style={{ fontSize: 9, color: "var(--electric-deep)", letterSpacing: "0.2em" }}>BRING</div>
                <div style={{ fontSize: 13, color: "rgba(10,14,20,0.7)", marginTop: 4 }}>{c.what_to_bring}</div>
              </div>
            )}
          </div>
        )}

        {/* SPOT PICKER (interactive client component) */}
        <div style={{ padding: "20px 22px 8px" }}>
          <SpotPicker
            classId={c.id}
            capacity={c.capacity}
            taken={taken}
            ownSpot={booking?.spot_number ?? null}
            requiresPayment={c.requires_payment}
            priceCents={c.price_cents}
            isReserved={isReserved}
            returnTo={`/gym/classes/${c.id}`}
          />
        </div>

        {/* ALREADY-BOOKED ROW: cancel + summary */}
        {isReserved && (
          <div style={{ padding: "10px 22px 24px" }}>
            <div style={{ padding: 16, borderRadius: 14, background: "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(46,127,176,0.06))", border: "1px solid rgba(143,184,214,0.3)" }}>
              <div className="e-mono" style={{ color: "var(--electric-deep)", letterSpacing: "0.2em", fontSize: 10 }}>YOUR RESERVATION</div>
              <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>SPOT {booking?.spot_number ?? "—"}</div>
                  <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.55)", letterSpacing: "0.18em", marginTop: 4 }}>
                    {booking?.paid_status === "free" ? "FREE" : booking?.paid_status === "paid" ? `PAID · ${fmtPrice(booking.price_cents_paid)}` : `PAY AT CHECK-IN · ${fmtPrice(booking?.price_cents_paid ?? c.price_cents)}`}
                  </div>
                </div>
                <form action={cancelBookingAction}>
                  <input type="hidden" name="booking_id" value={booking!.id} />
                  <input type="hidden" name="class_id" value={c.id} />
                  <button type="submit" className="btn" style={{ background: "transparent", color: "var(--rose)", border: "1px solid rgba(232,181,168,0.4)" }}>CANCEL</button>
                </form>
              </div>
              <div className="e-mono" style={{ marginTop: 10, fontSize: 9, color: "rgba(10,14,20,0.5)", letterSpacing: "0.2em" }}>
                CANCEL UP TO 2H BEFORE FOR FULL REFUND OR CREDIT
              </div>
            </div>
          </div>
        )}
      </div>
      <TabBar />
    </div>
  );
}
