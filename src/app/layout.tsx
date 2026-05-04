import type { Metadata, Viewport } from "next";
import { Anton, Inter_Tight, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const display = Anton({ subsets: ["latin"], weight: "400", variable: "--font-display", display: "swap" });
const body = Inter_Tight({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500"], style: ["italic", "normal"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: "Element 78 — In My Element",
  description: "However you need to move, we got you. Lift, flow, run, recover — with elite coaches and a Studio of guided sessions. Tech-forward training, a gym, and a wardrobe — built in Atlanta for the Black women the wellness industry forgot.",
  manifest: "/manifest.webmanifest",
  applicationName: "Element 78",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Element 78",
    startupImage: ["/icons/icon-1024.png"],
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png",   sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png",   sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg",       type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon-180.png", sizes: "180x180" },
      { url: "/icons/apple-touch-icon-167.png", sizes: "167x167" },
      { url: "/icons/apple-touch-icon-152.png", sizes: "152x152" },
      { url: "/icons/apple-touch-icon-120.png", sizes: "120x120" },
    ],
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#0A0E14",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
