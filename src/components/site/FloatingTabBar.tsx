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
      {/* Spacer mirrors the bar's intrinsic height + iOS home-indicator inset
          so the last rows of page content never end up underneath the bar in
          standalone PWA mode (where env(safe-area-inset-bottom) > 0). */}
      <div
        aria-hidden
        style={{ height: "calc(86px + env(safe-area-inset-bottom, 0px))" }}
      />
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
