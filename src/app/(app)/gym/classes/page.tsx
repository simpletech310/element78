import { redirect } from "next/navigation";

// Class listing now lives at /classes (the canonical catalog). Kept as a
// redirect so old links and bookmarks still land somewhere useful.
export default function GymClassesRedirect() {
  redirect("/classes");
}
