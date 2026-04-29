import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { TabBar } from "@/components/chrome/TabBar";
import { Icon } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";
import { listPurchasesForUser } from "@/lib/purchases";
import type { Purchase } from "@/lib/purchases";

const KIND_LABEL: Record<Purchase["kind"], string> = {
  class_booking: "GYM CLASS",
  program_enrollment: "PROGRAM",
  trainer_booking: "1-ON-1",
  shop_order: "SHOP ORDER",
};

const STATUS_COLOR: Record<Purchase["status"], string> = {
  paid: "var(--sky)",
  pending: "rgba(242,238,232,0.6)",
  refunded: "var(--rose)",
  failed: "var(--rose)",
  cancelled: "rgba(242,238,232,0.45)",
};

export default async function PurchasesPage({ searchParams }: { searchParams: { paid?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/purchases");

  const purchases = await listPurchasesForUser(user.id);

  const totalPaid = purchases
    .filter(p => p.status === "paid")
    .reduce((n, p) => n + p.amount_cents, 0);

  return (
    <div className="app app-dark" style={{ height: "100dvh", background: "var(--ink)", color: "var(--bone)" }}>
      <Navbar authed={true} />
      <div className="app-scroll" style={{ paddingBottom: 100 }}>
        <div style={{ padding: "20px 22px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/account" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
            <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ACCOUNT</span>
          </Link>
        </div>

        <section style={{ padding: "20px 22px 0" }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em" }}>YOUR · LEDGER</div>
          <h1 className="e-display" style={{ fontSize: "clamp(40px, 9vw, 64px)", lineHeight: 0.92, marginTop: 12 }}>PURCHASES.</h1>
          <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.65)", maxWidth: 480, lineHeight: 1.6 }}>
            Every checkout in one place — classes, programs, 1-on-1s, gear.
          </p>

          <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <RollUp label="TOTAL PAID" v={`$${(totalPaid / 100).toFixed(0)}`} />
            <RollUp label="ITEMS" v={String(purchases.length)} />
            <RollUp label="REFUNDED" v={String(purchases.filter(p => p.status === "refunded").length)} />
          </div>
        </section>

        {searchParams.paid && (
          <section style={{ padding: "14px 22px 0" }}>
            <div className="e-mono" style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
              ✓ PAYMENT SUCCESSFUL
            </div>
          </section>
        )}

        <section style={{ padding: "32px 22px 0" }}>
          {purchases.length === 0 ? (
            <div style={{ marginTop: 14, padding: "18px 22px", borderRadius: 14, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>
              No purchases yet. Browse{" "}
              <Link href="/programs" className="e-mono" style={{ color: "var(--sky)" }}>programs</Link>,{" "}
              <Link href="/classes" className="e-mono" style={{ color: "var(--sky)" }}>classes</Link>, or{" "}
              <Link href="/shop" className="e-mono" style={{ color: "var(--sky)" }}>the shop</Link>.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {purchases.map(p => (
                <PurchaseRow key={p.id} purchase={p} />
              ))}
            </div>
          )}
        </section>
      </div>
      <TabBar />
    </div>
  );
}

function PurchaseRow({ purchase }: { purchase: Purchase }) {
  const dt = new Date(purchase.created_at);
  const dateStr = dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase();
  const linkHref = hrefForPurchase(purchase);

  return (
    <Link
      href={linkHref ?? "#"}
      style={{
        display: "flex", gap: 14, padding: 14, borderRadius: 14,
        background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
        color: "var(--bone)", textDecoration: "none",
        opacity: purchase.status === "refunded" || purchase.status === "cancelled" ? 0.6 : 1,
      }}
    >
      <div style={{ minWidth: 90, paddingRight: 14, borderRight: "1px solid rgba(143,184,214,0.18)" }}>
        <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.18em" }}>{dateStr}</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, marginTop: 4 }}>
          ${(purchase.amount_cents / 100).toFixed(0)}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>
          {KIND_LABEL[purchase.kind]}
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, marginTop: 4, letterSpacing: "0.02em" }}>
          {purchase.description ?? "—"}
        </div>
        <div className="e-mono" style={{ marginTop: 6, fontSize: 9, color: STATUS_COLOR[purchase.status], letterSpacing: "0.2em" }}>
          {purchase.status.toUpperCase()}
        </div>
      </div>
      {linkHref && <Icon name="chevron" size={18} />}
    </Link>
  );
}

function hrefForPurchase(p: Purchase): string | null {
  switch (p.kind) {
    case "class_booking":
      return p.class_booking_id ? `/account/history` : null;
    case "program_enrollment":
      return null; // could link to /programs/:slug — would require a join; skip for MVP
    case "trainer_booking":
      return p.trainer_booking_id ? `/account/sessions` : null;
    case "shop_order":
      return p.order_id ? `/account/purchases` : null;
    default:
      return null;
  }
}

function RollUp({ label, v }: { label: string; v: string }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--sky)", lineHeight: 1 }}>{v}</div>
      <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)", marginTop: 6, letterSpacing: "0.2em" }}>{label}</div>
    </div>
  );
}
