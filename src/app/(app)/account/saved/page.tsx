import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { SaveButton } from "@/components/site/SaveButton";
import { getUser } from "@/lib/auth";
import { listSavedItems, type SavedItem, type SavedKind } from "@/lib/data/saved-queries";

const SECTION_ORDER: SavedKind[] = ["program", "class", "product", "trainer", "routine"];

const SECTION_LABEL: Record<SavedKind, string> = {
  program: "PROGRAMS",
  class: "CLASSES",
  product: "PRODUCTS",
  trainer: "COACHES",
  routine: "STUDIO ROUTINES",
};

function hrefFor(item: SavedItem): string {
  switch (item.kind) {
    case "program":
      return `/programs/${item.ref_slug ?? ""}`;
    case "class":
      return `/classes/${item.ref_id}`;
    case "product":
      return `/shop/${item.ref_slug ?? ""}`;
    case "trainer":
      return `/trainers/${item.ref_slug ?? ""}`;
    case "routine":
      return `/train/routine/${item.ref_slug ?? ""}`;
  }
}

export default async function SavedPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/saved");

  const items = await listSavedItems(user.id);
  const groups = new Map<SavedKind, SavedItem[]>();
  for (const k of SECTION_ORDER) groups.set(k, []);
  for (const item of items) {
    const list = groups.get(item.kind);
    if (list) list.push(item);
  }

  const totalCount = items.length;

  return (
    <div className="app app-dark" style={{ height: "100dvh", background: "var(--ink)", color: "var(--bone)" }}>
      <Navbar authed={true} />
      <div className="app-scroll" style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: "20px 22px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/account" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
            <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ACCOUNT</span>
          </Link>
        </div>

        {/* Hero */}
        <section style={{ padding: "20px 22px 0" }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em" }}>YOUR · LIBRARY</div>
          <h1 className="e-display" style={{ fontSize: "clamp(40px, 9vw, 64px)", lineHeight: 0.92, marginTop: 12 }}>SAVED.</h1>
          <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.65)", maxWidth: 480, lineHeight: 1.6 }}>
            Programs, classes, coaches, products, and routines you've bookmarked. Tap the heart to remove.
          </p>
        </section>

        {totalCount === 0 ? (
          <section style={{ padding: "32px 22px 0" }}>
            <div style={{
              padding: "28px 22px", borderRadius: 16,
              border: "1px dashed rgba(143,184,214,0.3)",
              color: "rgba(242,238,232,0.6)", fontSize: 14, lineHeight: 1.6,
            }}>
              Nothing saved yet. Tap the heart on any program, class, coach, product, or studio routine to keep it here.
              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/programs" className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.18em", fontSize: 11 }}>BROWSE PROGRAMS →</Link>
                <Link href="/trainers" className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.18em", fontSize: 11 }}>FIND A COACH →</Link>
                <Link href="/shop" className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.18em", fontSize: 11 }}>SHOP →</Link>
              </div>
            </div>
          </section>
        ) : (
          SECTION_ORDER.map(kind => {
            const list = groups.get(kind) ?? [];
            return (
              <section key={kind} style={{ padding: "32px 22px 0" }}>
                <div className="e-mono" style={{
                  color: list.length > 0 ? "var(--sky)" : "rgba(242,238,232,0.4)",
                  letterSpacing: "0.2em", fontSize: 10,
                }}>
                  {SECTION_LABEL[kind]} · {list.length}
                </div>
                {list.length === 0 ? (
                  <div style={{
                    marginTop: 12, padding: "14px 18px", borderRadius: 12,
                    border: "1px dashed rgba(242,238,232,0.08)",
                    color: "rgba(242,238,232,0.4)", fontSize: 12,
                  }}>
                    Nothing saved here yet.
                  </div>
                ) : (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    {list.map(item => (
                      <SavedRow key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>
      <TabBar />
    </div>
  );
}

function SavedRow({ item }: { item: SavedItem }) {
  const href = hrefFor(item);
  return (
    <div className="lift" style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: 12, borderRadius: 14,
      background: "var(--haze)",
      border: "1px solid rgba(255,255,255,0.05)",
    }}>
      <Link href={href} style={{
        flexShrink: 0, width: 56, height: 56, borderRadius: 10, overflow: "hidden",
        background: "rgba(143,184,214,0.08)", display: "block", position: "relative",
      }}>
        {item.ref_image ? (
          <Photo src={item.ref_image} alt={item.ref_name ?? ""} style={{ position: "absolute", inset: 0 }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sky)" }}>
            <Icon name="heart" size={20} />
          </div>
        )}
      </Link>
      <Link href={href} style={{ flex: 1, minWidth: 0, textDecoration: "none", color: "var(--bone)" }}>
        <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, letterSpacing: "0.2em" }}>
          {item.kind.toUpperCase()}
        </div>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 16, marginTop: 4,
          letterSpacing: "0.02em",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {item.ref_name ?? "Untitled"}
        </div>
      </Link>
      <Link href={href} className="e-mono" style={{
        color: "var(--sky)", letterSpacing: "0.18em", fontSize: 10, textDecoration: "none",
      }}>
        OPEN →
      </Link>
      <SaveButton
        kind={item.kind}
        ref_id={item.ref_id}
        ref_slug={item.ref_slug}
        ref_name={item.ref_name}
        ref_image={item.ref_image}
        isSaved={true}
        return_to="/account/saved"
        size={32}
      />
    </div>
  );
}
