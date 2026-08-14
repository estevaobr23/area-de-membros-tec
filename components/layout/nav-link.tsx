"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-items";

export function NavLink({
  item,
  variant = "sidebar",
}: {
  item: NavItem;
  variant?: "sidebar" | "mobile";
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  if (variant === "mobile") {
    return (
      <Link
        href={item.href}
        className={cn(
          "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        <Icon className="size-5" />
        {item.label}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-md"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <Icon className="size-4" />
      {item.label}
    </Link>
  );
}
