import "server-only";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { listComments } from "@/lib/data/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });
  if (!params.id) return new NextResponse("bad request", { status: 400 });

  const comments = await listComments(params.id);
  return NextResponse.json({ comments });
}
