import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireCustomer } from "@/lib/auth/session";
import { getToolAccess } from "@/lib/auth/tool-access";
import { createServiceClientAction } from "../../actions";

export default async function NovoClientePage({
  searchParams,
}: PageProps<"/ferramentas/ordem-servico/clientes/novo">) {
  await requireCustomer();
  const access = await getToolAccess("ordem-servico");
  if (!access.canWrite) redirect("/ferramentas/ordem-servico?bloqueado=1");

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const returnTo = typeof params.return_to === "string" ? params.return_to : "";

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4 md:p-8">
      <div>
        <Link
          href="/ferramentas/ordem-servico/clientes"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Clientes
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Novo cliente</h1>
      </div>

      {error === "nome" && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          O nome do cliente é obrigatório.
        </p>
      )}
      {error === "salvar" && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Não foi possível salvar. Tente de novo.
        </p>
      )}

      <form action={createServiceClientAction} className="space-y-4">
        {returnTo && <input type="hidden" name="return_to" value={returnTo} />}
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone / WhatsApp</Label>
            <Input id="phone" name="phone" type="tel" placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail (opcional)</Label>
            <Input id="email" name="email" type="email" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" name="notes" />
        </div>
        <Button type="submit">Salvar cliente</Button>
      </form>
    </div>
  );
}
