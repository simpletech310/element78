import type { ReactNode } from "react";

export type IconName =
  | "home" | "train" | "gym" | "shop" | "crew"
  | "play" | "pause" | "plus" | "bag" | "heart"
  | "chevron" | "chevronDown" | "bolt" | "fire"
  | "pin" | "cal" | "clock" | "bell" | "settings"
  | "search" | "filter" | "arrow" | "arrowUpRight"
  | "spark" | "mic" | "bottle" | "flame" | "user"
  | "qr" | "map";

const paths: Record<IconName, ReactNode> = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z" />,
  train: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  gym: <path d="M3 9v6M21 9v6M6 7v10M18 7v10M9 12h6" strokeLinecap="round"/>,
  shop: <path d="M4 7h16l-1 13H5L4 7zM8 7V5a4 4 0 0 1 8 0v2" />,
  crew: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5M14 20c0-2 1.5-3.5 4-3.5s3 1 3 3.5"/></>,
  play: <path d="M7 5l12 7-12 7V5z" />,
  pause: <><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></>,
  plus: <path d="M12 5v14M5 12h14" strokeLinecap="round"/>,
  bag: <path d="M5 8h14l-1 12H6L5 8z M9 8V6a3 3 0 0 1 6 0v2"/>,
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  chevron: <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />,
  chevronDown: <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  fire: <path d="M12 3s4 4 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s-2 1-2 4a6 6 0 0 0 12 0c0-6-7-10-7-10z"/>,
  pin: <><path d="M12 22s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></>,
  cal: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round"/></>,
  bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2zM10 20a2 2 0 0 0 4 0"/>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2.2-1.3L14 3h-4l-.3 2.4a7 7 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .9.1 1.3l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2.2 1.3L10 21h4l.3-2.4a7 7 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.3z"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="M16 16l5 5" strokeLinecap="round"/></>,
  filter: <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round"/>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>,
  arrowUpRight: <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round"/>,
  spark: <path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l4 4M14 14l4 4M18 6l-4 4M10 14l-4 4"/>,
  mic: <><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></>,
  bottle: <><path d="M9 3h6v3l1 2v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8l1-2V3z"/><path d="M9 12h6"/></>,
  flame: <path d="M12 2c0 4 5 5 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 0-1 0-2-1-2 2 0 4 0 4-2z"/>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>,
  qr: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M21 14v3M14 21h7"/></>,
  map: <path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v16M15 6v16"/>,
};

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      {paths[name]}
    </svg>
  );
}
