"use client";

import { TabBar } from "@/components/chrome/TabBar";

/**
 * FloatingTabBar — sticky-bottom version of the in-app TabBar for marketing
 * pages. Use anywhere outside the `.app` flex shell. Renders a spacer so
 * page content isn't hidden behind the bar.
 */
export function FloatingTabBar() {
  return (
    <>
      <div style={{ height: 86 }} aria-hidden />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
        }}
      >
        <TabBar />
      </div>
    </>
  );
}
