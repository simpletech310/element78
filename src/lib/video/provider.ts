/**
 * Video provider interface. Mock returns a `mock://` URL — the
 * /train/session/[id] page detects that prefix and renders an in-app
 * placeholder room. Swap to Daily.co by replacing `MockVideoProvider` with a
 * real implementation that POSTs to `https://api.daily.co/v1/rooms`.
 *
 * Required env when going real:
 *   DAILY_API_KEY        (server-side, secret)
 *   DAILY_DOMAIN         (e.g. "element78" → rooms live at
 *                          https://element78.daily.co/<roomName>)
 */

export type VideoRoom = {
  /** URL both client and trainer can navigate to. */
  url: string;
  /** Provider-specific room name — useful for cleanup later. */
  name: string;
  provider: "mock" | "daily";
};

export type CreateRoomInput = {
  bookingId: string;
  startsAt: Date;
  endsAt: Date;
  /** Friendly label that appears in some provider UIs. */
  label?: string;
};

export interface VideoProvider {
  createRoom(input: CreateRoomInput): Promise<VideoRoom>;
}

class MockVideoProvider implements VideoProvider {
  async createRoom(input: CreateRoomInput): Promise<VideoRoom> {
    const name = `e78-${input.bookingId.slice(0, 8)}`;
    return {
      url: `mock://session/${input.bookingId}`,
      name,
      provider: "mock",
    };
  }
}

/**
 * Real Daily.co implementation. Not wired by default — set `DAILY_API_KEY`
 * to enable. `DAILY_DOMAIN` is optional (Daily returns the full room URL in
 * the response; the domain only seeds a fallback if that ever changes).
 */
class DailyVideoProvider implements VideoProvider {
  constructor(private apiKey: string, private domain?: string) {}
  async createRoom(input: CreateRoomInput): Promise<VideoRoom> {
    const name = `e78-${input.bookingId.slice(0, 8)}`;
    // Daily expects unix-seconds for nbf/exp.
    const nbf = Math.floor(input.startsAt.getTime() / 1000) - 600;       // joinable 10m early
    const exp = Math.floor(input.endsAt.getTime() / 1000) + 1800;        // open 30m after end
    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        name,
        privacy: "private",
        properties: {
          nbf,
          exp,
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Daily room create failed (${res.status}): ${detail}`);
    }
    const body = (await res.json()) as { name: string; url?: string };
    let url: string;
    if (body.url) {
      url = body.url;
    } else if (this.domain) {
      url = `https://${this.domain}.daily.co/${body.name}`;
    } else {
      throw new Error("Daily room create succeeded but response had no `url` and DAILY_DOMAIN is not set.");
    }
    return { url, name: body.name, provider: "daily" };
  }
}

export function getVideoProvider(): VideoProvider {
  const key = process.env.DAILY_API_KEY;
  const domain = process.env.DAILY_DOMAIN;
  if (key) return new DailyVideoProvider(key, domain);
  return new MockVideoProvider();
}

/**
 * Helper: a session is joinable from 10 minutes before start through 30
 * minutes after end. Used by both client and trainer pages.
 */
export function isSessionJoinable(startsAt: string, endsAt: string, now: Date = new Date()): boolean {
  const open = new Date(startsAt).getTime() - 10 * 60_000;
  const close = new Date(endsAt).getTime() + 30 * 60_000;
  const t = now.getTime();
  return t >= open && t <= close;
}
