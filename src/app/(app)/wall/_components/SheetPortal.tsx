"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Render children into document.body so they escape the .app container's
 * stacking context. Necessary because the TabBar uses backdrop-filter, which
 * creates a stacking context that would otherwise trap our sheets behind it.
 */
export function SheetPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Block body scroll while a sheet is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
