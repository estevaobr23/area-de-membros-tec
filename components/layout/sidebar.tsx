"use client";

import Link from "next/link";
import { Smartphone } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-md">
            <Smartphone className="size-4.5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight">
              Área de Membros
            </span>
            <span className="block text-[11px] text-sidebar-foreground/60">
              Assistência técnica
            </span>
          </span>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <p className="text-[11px] text-sidebar-foreground/50">
          Acesso vitalício aos seus manuais
        </p>
      </div>
    </aside>
  );
}
