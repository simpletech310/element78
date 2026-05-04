import type { Metadata, Viewport } from "next";

/**
 * Coach-side metadata override. Anything under /trainer/* picks up the
 * coach.webmanifest, the COACH-marked icons, and the electric theme color
 * — so when a coach taps "Add to Home Screen" while on their dashboard,
 * iOS / Chrome bind the install to the COACH variant. A member who later
 * logs in as a coach can install both PWAs side-by-side from each role's
 * default route (/home for member, /trainer/dashboard for coach).
 */
export const metadata: Metadata = {
  title: "Element 78 Coach",
  applicationName: "Element 78 Coach",
  manifest: "/coach.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "E78 Coach",
    startupImage: ["/icons/coach/icon-1024.png"],
  },
  icons: {
    icon: [
      { url: "/icons/coach/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/coach/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-coach.svg",     type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/coach/apple-touch-icon-180.png", sizes: "180x180" },
      { url: "/icons/coach/apple-touch-icon-167.png", sizes: "167x167" },
      { url: "/icons/coach/apple-touch-icon-152.png", sizes: "152x152" },
      { url: "/icons/coach/apple-touch-icon-120.png", sizes: "120x120" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#2E7FB0",
  colorScheme: "dark",
};

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
