import { getUser } from "@/lib/auth";
import { listMemberUpcomingForAlert } from "@/lib/data/queries";
import { IncomingCallAlert } from "@/components/site/IncomingCallAlert";

// Passthrough layout — each screen owns its full app shell (status bar, scroll
// body, tab bar, home indicator) because the design uses different chrome per
// screen (dark vs light, full-bleed vs framed).
//
// The one shared piece: the IncomingCallAlert. We mount it at the layout
// level so a member already deep in any /train, /account, /trainers screen
// gets the on-brand call alert the moment a coach starts their session.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const upcoming = user ? await listMemberUpcomingForAlert(user.id) : [];

  return (
    <>
      {children}
      {user && upcoming.length > 0 && (
        <IncomingCallAlert viewerId={user.id} bookings={upcoming} />
      )}
    </>
  );
}
