"use server";

import { redirect } from "next/navigation";
import { getVideoProvider } from "@/lib/video/provider";

export async function testVideoRoomAction(): Promise<void> {
  const now = Date.now();
  const room = await getVideoProvider().createRoom({
    bookingId: "test",
    startsAt: new Date(now),
    endsAt: new Date(now + 30 * 60_000),
    label: "TEST",
  });
  redirect(`/trainer/dashboard?test_room=${encodeURIComponent(room.url)}`);
}
