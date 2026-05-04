import { getUser } from "@/lib/auth";
import { listMemberUpcomingForAlert } from "@/lib/data/queries";
import { IncomingCallAlert } from "@/components/site/IncomingCallAlert";
import { ServiceWorkerRegister } from "@/components/site/PushSetup";
import { PwaReminder } from "@/components/site/PwaReminder";

// Passthrough layout — each screen owns its full app shell (status bar, scroll
// body, tab bar, home indicator) because the design uses different chrome per
// screen (dark vs light, full-bleed vs framed).
//
// Shared pieces mounted here so they cover every authed surface:
//   - ServiceWorkerRegister: registers /sw.js once for push + offline shell.
//   - IncomingCallAlert:    realtime modal when a coach starts a session.
//   - PwaReminder:          dismissible banner nudging install + push opt-in.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const upcoming = user ? await listMemberUpcomingForAlert(user.id) : [];

  return (
    <>
      {children}
      <ServiceWorkerRegister />
      {user && upcoming.length > 0 && (
        <IncomingCallAlert viewerId={user.id} bookings={upcoming} />
      )}
      {user && <PwaReminder />}
    </>
  );
}
