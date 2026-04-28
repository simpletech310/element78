import { redirect } from "next/navigation";

// /gym/classes was folded into /gym (the day strip + class list now live there).
// Kept as a redirect so old links and bookmarks still land somewhere useful.
export default function GymClassesRedirect() {
  redirect("/gym");
}
