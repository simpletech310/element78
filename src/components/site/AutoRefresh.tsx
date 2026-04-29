"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Polls the current route at `interval` ms by calling router.refresh(). Cheap
 * way to surface server data updates (new bookings, new check-ins) without
 * wiring full realtime. Pauses while the tab is hidden.
 */
export function AutoRefresh({ interval = 30000 }: { interval?: number }) {
  const router = useRouter();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    function start() {
      stop();
      timer.current = window.setInterval(() => {
        if (document.visibilityState === "visible") router.refresh();
      }, interval);
    }
    function stop() {
      if (timer.current != null) {
        window.clearInterval(timer.current);
        timer.current = null;
      }
    }
    function onVisibility() {
      if (document.visibilityState === "visible") {
        router.refresh();
        start();
      } else {
        stop();
      }
    }

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [interval, router]);

  return null;
}
