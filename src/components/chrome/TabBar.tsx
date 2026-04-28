"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, IconName } from "@/components/ui/Icon";

const items: { id: string; label: string; icon: IconName; href: string }[] = [
  { id: "home", label: "Element", icon: "home", href: "/home" },
  { id: "train", label: "Train", icon: "play", href: "/train" },
  { id: "gym", label: "Gym", icon: "pin", href: "/gym" },
  { id: "shop", label: "Shop", icon: "bag", href: "/shop" },
  { id: "crew", label: "Crew", icon: "crew", href: "/crew" },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <div className="tabbar">
      {items.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link key={it.id} href={it.href} className={`tabbar-item ${active ? "active" : ""}`}>
            <Icon name={it.icon} size={22} />
            <span>{it.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
