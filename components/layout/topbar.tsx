import { LogOut } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/app/(members)/actions";

export function Topbar({ email }: { email: string }) {
  const initial = email.charAt(0).toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <span className="font-semibold tracking-tight md:hidden">
        Área de Membros
      </span>
      <div className="hidden md:block" />

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none">
          <Avatar className="size-8">
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="max-w-52 truncate font-normal text-muted-foreground">
              {email}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <form action={logout}>
            <DropdownMenuItem
              render={<button type="submit" className="w-full cursor-pointer" />}
            >
              <LogOut className="size-4" />
              Sair
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
