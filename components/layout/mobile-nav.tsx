"use client";

import { NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background md:hidden">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} variant="mobile" />
      ))}
    </nav>
  );
}
