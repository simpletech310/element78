import { notFound } from "next/navigation";
import { RoutinePlayer } from "@/components/site/RoutinePlayer";
import { getRoutine } from "@/lib/data/routines";

export default function RoutinePage({
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

  return <RoutinePlayer routine={routine} programContext={programContext} />;
}
