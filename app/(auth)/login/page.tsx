import Image from "next/image";
import { redirect } from "next/navigation";
import { BookOpen, Smartphone, Wrench, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getCurrentCustomer } from "@/lib/auth/session";
import { login } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: "Digite um e-mail válido.",
  not_found:
    "Não encontramos uma compra ativa com esse e-mail. Verifique se digitou o e-mail usado na compra.",
};

const BENEFITS = [
  {
    icon: BookOpen,
    text: "Leia seus manuais direto no celular, sem baixar nada",
  },
  {
    icon: Wrench,
    text: "Ferramentas de OS, orçamento e financeiro incluídas",
  },
  {
    icon: Zap,
    text: "Acesso imediato: entre só com o e-mail da compra",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (customer) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <div className="flex min-h-svh">
      {/* Painel da marca (desktop) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-violet-950 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-md">
            <Smartphone className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Área de Membros
          </span>
        </div>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight">
              Seus manuais e ferramentas de assistência técnica em um só lugar.
            </h2>
            <p className="max-w-md text-slate-300">
              Diagnósticos, reparos e gestão da sua bancada — tudo pensado para
              o dia a dia do técnico.
            </p>
          </div>
          <ul className="space-y-3">
            {BENEFITS.map((b) => (
              <li key={b.text} className="flex items-center gap-3 text-sm">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <b.icon className="size-4 text-blue-300" />
                </span>
                <span className="text-slate-200">{b.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-end justify-between gap-6">
          <p className="text-xs text-slate-400">
            Acesso vitalício · Atualizações incluídas
          </p>
          <Image
            src="/products/150-defeitos-de-celulares.png"
            alt="Manual 150 Defeitos de Celulares"
            width={180}
            height={180}
            className="rounded-xl shadow-2xl ring-1 ring-white/10"
            priority
          />
        </div>
      </div>

      {/* Formulário */}
      <div className="flex flex-1 flex-col items-center justify-center bg-muted/40 px-4 py-10">
        <div className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="space-y-3 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg lg:hidden">
              <Smartphone className="size-6" />
            </span>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Bem-vindo de volta
              </h1>
              <p className="text-sm text-muted-foreground">
                Entre com o e-mail que você usou na compra.
              </p>
            </div>
          </div>

          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="voce@email.com"
                autoComplete="email"
                required
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            )}

            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Não usamos senha. O acesso é liberado automaticamente para quem
            comprou.
          </p>
        </div>
      </div>
    </div>
  );
}
