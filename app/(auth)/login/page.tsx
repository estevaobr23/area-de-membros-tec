import { redirect } from "next/navigation";
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
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Área de Membros
          </h1>
          <p className="text-sm text-muted-foreground">
            Entre com o e-mail que você usou na compra.
          </p>
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
  );
}
