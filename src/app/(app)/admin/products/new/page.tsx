import { redirect } from "next/navigation";
import { AdminShell } from "@/components/site/AdminShell";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createProductAction } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default async function NewProductPage({ searchParams }: { searchParams: { error?: string } }) {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/login?next=/admin/products/new");
  return (
    <AdminShell pathname="/admin/products" title="NEW PRODUCT" subtitle="ADD TO SHOP">
      {searchParams.error && (
        <div className="e-mono" style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
          {searchParams.error}
        </div>
      )}
      <form action={createProductAction} encType="multipart/form-data" style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 14, padding: 22, borderRadius: 16, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
        <Field label="NAME *"><input name="name" required className="ta-input" placeholder="ELEMENT 78 HOODIE" /></Field>
        <Field label="SLUG"><input name="slug" className="ta-input" placeholder="optional · auto-generated" /></Field>
        <Field label="SUBTITLE"><input name="subtitle" className="ta-input" placeholder="Heavyweight cotton" /></Field>
        <Field label="CATEGORY"><input name="category" className="ta-input" placeholder="wear · gear · accessories" /></Field>
        <Field label="DESCRIPTION"><textarea name="description" rows={3} className="ta-input" style={{ resize: "vertical" }} /></Field>
        <Field label="HERO IMAGE · UPLOAD">
          <input type="file" name="hero_image_file" accept="image/*" className="ta-input" />
        </Field>
        <Field label="OR HERO IMAGE URL (use if you already have one hosted)">
          <input name="hero_image" className="ta-input" placeholder="https://… or /assets/foo.jpg" />
        </Field>
        <Field label="GALLERY · UP TO 4 EXTRA PHOTOS">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input type="file" name="gallery_1_file" accept="image/*" className="ta-input" />
            <input type="file" name="gallery_2_file" accept="image/*" className="ta-input" />
            <input type="file" name="gallery_3_file" accept="image/*" className="ta-input" />
            <input type="file" name="gallery_4_file" accept="image/*" className="ta-input" />
          </div>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="PRICE · USD *"><input name="price_dollars" type="number" min={0} step="0.01" required className="ta-input" placeholder="0.00" /></Field>
          <Field label="COMPARE AT · USD (strikethrough)"><input name="compare_at_dollars" type="number" min={0} step="0.01" className="ta-input" placeholder="optional" /></Field>
        </div>
        <Field label="TAG"><input name="tag" className="ta-input" placeholder="NEW · LIMITED · STAFF PICK" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Field label="STOCK QTY (BLANK = UNLIMITED)">
            <input name="stock_qty" type="number" min={0} className="ta-input" placeholder="e.g. 50" />
          </Field>
          <Field label="SORT ORDER"><input name="sort_order" type="number" defaultValue={0} className="ta-input" /></Field>
          <label className="e-mono" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9, color: "rgba(242,238,232,0.6)", letterSpacing: "0.2em" }}>
            ACTIVE
            <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 13px", borderRadius: 10, background: "rgba(10,14,20,0.4)", border: "1px solid rgba(143,184,214,0.25)" }}>
              <input type="checkbox" name="in_stock" defaultChecked /> SHOW IN SHOP
            </label>
          </label>
        </div>
        <div><button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>CREATE →</button></div>
      </form>
      <style>{`
        .ta-input { padding: 11px 13px; border-radius: 10px; background: rgba(10,14,20,0.4); border: 1px solid rgba(143,184,214,0.25); color: var(--bone); font-family: var(--font-body); font-size: 14px; width: 100%; }
        .ta-input:focus { outline: none; border-color: var(--sky); }
      `}</style>
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="e-mono" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9, color: "rgba(242,238,232,0.6)", letterSpacing: "0.2em" }}>{label}{children}</label>;
}
