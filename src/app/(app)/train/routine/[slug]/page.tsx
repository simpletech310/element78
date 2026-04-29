import { notFound } from "next/navigation";
import { RoutinePlayer } from "@/components/site/RoutinePlayer";
import { getRoutine } from "@/lib/data/routines";

export default function RoutinePage({ params }: { params: { slug: string } }) {
  const routine = getRoutine(params.slug);
  if (!routine) notFound();
  return <RoutinePlayer routine={routine} />;
}
