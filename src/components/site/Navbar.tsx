"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Icon } from "@/components/ui/Icon";

const links = [
  { label: "HOME", href: "/" },
  { label: "SHOP", href: "/shop" },
  { label: "LOCATIONS", href: "/locations" },
  { label: "CONTACT", href: "/contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header
        style={{
          position: "sticky", top: 0, zIndex: 40,
          padding: "14px 22px",
          background: scrolled ? "rgba(10,14,20,0.92)" : "rgba(10,14,20,0.55)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: scrolled ? "1px solid rgba(143,184,214,0.12)" : "1px solid transparent",
          transition: "background .25s ease, border-color .25s ease",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <Link href="/" aria-label="Element 78 home" style={{ color: "var(--bone)", textDecoration: "none" }}>
          <Wordmark size={18} color="var(--bone)" />
        </Link>

        {/* Desktop nav */}
        <nav className="nav-desktop" aria-label="Primary" style={{ display: "none", gap: 26, alignItems: "center" }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} className="e-mono" style={{
              color: isActive(l.href) ? "var(--sky)" : "rgba(242,238,232,0.7)",
              fontSize: 11, letterSpacing: "0.2em",
              padding: "6px 0",
              borderBottom: isActive(l.href) ? "1px solid var(--sky)" : "1px solid transparent",
              transition: "color .2s ease",
            }}>{l.label}</Link>
          ))}
          <Link href="/login" className="e-mono" style={{ color: "var(--sky)", fontSize: 11, letterSpacing: "0.2em" }}>SIGN IN</Link>
          <Link href="/join" className="btn btn-sky" style={{ padding: "10px 18px", fontSize: 10 }}>JOIN ELEMENT</Link>
        </nav>

        {/* Mobile controls */}
        <div className="nav-mobile" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/shop" aria-label="Shop" style={{ color: "var(--bone)" }}><Icon name="bag" size={18} /></Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: open ? "var(--bone)" : "transparent",
              color: open ? "var(--ink)" : "var(--bone)",
              border: open ? "none" : "1px solid rgba(242,238,232,0.25)",
              display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 4,
              cursor: "pointer",
            }}
          >
            <span style={{ width: 14, height: 1.5, background: "currentColor", transformOrigin: "center", transform: open ? "translateY(2.5px) rotate(45deg)" : "none", transition: "transform .2s" }} />
            <span style={{ width: 14, height: 1.5, background: "currentColor", transformOrigin: "center", transform: open ? "translateY(-2.5px) rotate(-45deg)" : "none", transition: "transform .2s" }} />
          </button>
        </div>
      </header>

      {/* Mobile sheet */}
      <div
        aria-hidden={!open}
        style={{
          position: "fixed", inset: 0, top: 0, zIndex: 30,
          background: "rgba(10,14,20,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          padding: "84px 22px 40px",
          transform: open ? "translateY(0)" : "translateY(-100%)",
          transition: "transform .3s cubic-bezier(.2,.8,.2,1)",
          display: "flex", flexDirection: "column", gap: 4,
        }}
      >
        <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, marginBottom: 18, letterSpacing: "0.25em" }}>◉ MENU</div>
        {links.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              display: "flex", alignItems: "baseline", justifyContent: "space-between",
              padding: "16px 0", borderBottom: "1px solid rgba(242,238,232,0.08)",
              color: "var(--bone)", textDecoration: "none",
            }}
          >
            <span className="e-display" style={{ fontSize: 36, lineHeight: 1 }}>{l.label}</span>
            <span className="e-mono" style={{ color: "rgba(242,238,232,0.4)", fontSize: 11 }}>0{i + 1}</span>
          </Link>
        ))}
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/join" className="btn btn-sky" style={{ width: "100%" }}>JOIN ELEMENT</Link>
          <Link href="/login" className="btn btn-ghost" style={{ width: "100%", color: "var(--bone)", borderColor: "rgba(242,238,232,0.25)" }}>SIGN IN</Link>
        </div>
        <div className="e-mono" style={{ color: "rgba(242,238,232,0.35)", marginTop: 32, fontSize: 9, letterSpacing: "0.25em" }}>
          ATLANTA · 24/7
        </div>
      </div>

      <style>{`
        @media (min-width: 880px) {
          .nav-desktop { display: flex !important; }
          .nav-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}
