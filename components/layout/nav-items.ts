import {
  LayoutDashboard,
  Package,
  Wrench,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/produtos", label: "Meus Produtos", icon: Package },
  { href: "/ferramentas", label: "Ferramentas", icon: Wrench },
  { href: "/perfil", label: "Perfil", icon: UserRound },
];
