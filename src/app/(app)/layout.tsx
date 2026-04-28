// Passthrough layout — each screen owns its full app shell (status bar, scroll body, tab bar, home indicator)
// because the design uses different chrome per screen (dark vs light, full-bleed vs framed).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
