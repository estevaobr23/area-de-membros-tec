"use client";

import Link from "next/link";
import { NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-background md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          Área de Membros
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}
