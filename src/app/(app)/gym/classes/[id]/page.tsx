import { redirect } from "next/navigation";

// Class detail unified on /classes/[id] — that page now renders the
// SpotPicker conditionally based on `classes.has_equipment`. This route
// stays only as a redirect so old links and bookmarks keep working.
export default function GymClassDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/classes/${params.id}`);
}
