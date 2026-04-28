import { redirect } from "next/navigation";

// Day pass info now lives on /join — kept this route as a redirect so any
// existing links (and indexed search results) land at the new section.
export default function DayPassRedirect() {
  redirect("/join#day-pass");
}
