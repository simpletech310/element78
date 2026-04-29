import { notFound, redirect } from "next/navigation";
import { RoutinePlayer } from "@/components/site/RoutinePlayer";
import { getRoutine } from "@/lib/data/routines";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function RoutinePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { program_session?: string; program_slug?: string };
}) {
  const routine = getRoutine(params.slug);
  if (!routine) notFound();

  // Optional program context — when set, RoutinePlayer fires the completion
  // action on phase=done so progress lands in /account/history.
  const programContext = searchParams.program_session && searchParams.program_slug
    ? { programSessionId: searchParams.program_session, programSlug: searchParams.program_slug }
    : undefined;

  // Gate: when launched from inside a program, the user MUST have an active
  // enrollment. Paid programs sit in `pending_payment` until Stripe confirms,
  // and we don't want a client to fly through routines without paying.
  if (programContext) {
    const user = await getUser();
    if (!user) redirect(`/login?next=${encodeURIComponent(`/programs/${programContext.programSlug}`)}`);

    const sb = createClient();
    const { data: program } = await sb
      .from("programs")
      .select("id")
      .eq("slug", programContext.programSlug)
      .maybeSingle();
    if (!program) redirect(`/programs/${programContext.programSlug}`);

    const { data: enrollment } = await sb
      .from("program_enrollments")
      .select("status")
      .eq("user_id", user.id)
      .eq("program_id", (program as { id: string }).id)
      .maybeSingle();

    const status = (enrollment as { status?: string } | null)?.status;
    if (status !== "active") {
      // Not paid / not enrolled / pending_payment — bounce to the program
      // page so they can complete checkout or enroll first.
      redirect(`/programs/${programContext.programSlug}?locked=1`);
    }
  }

  return <RoutinePlayer routine={routine} programContext={programContext} />;
}
