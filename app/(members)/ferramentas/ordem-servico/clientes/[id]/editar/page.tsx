import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireCustomer } from "@/lib/auth/session";
import { getToolAccess } from "@/lib/auth/tool-access";
import { createServiceClient } from "@/lib/supabase/server";
import { updateServiceClientAction } from "../../../actions";

export default async function EditarClientePage({
  params,
  searchParams,
}: PageProps<"/ferramentas/ordem-servico/clientes/[id]/editar">) {
  const customer = await requireCustomer();
  const access = await getToolAccess("ordem-servico");
  const { id } = await params;
  if (!access.canWrite) {
    redirect(`/ferramentas/ordem-servico/clientes/${id}`);
  }
  const { error } = await searchParams;

  const supabase = createServiceClient();
  const { data: client } = await supabase
    .from("service_clients")
    .select("*")
    .eq("id", id)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (!client) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4 md:p-8">
      <div>
        <Link
          href={`/ferramentas/ordem-servico/clientes/${id}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {client.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Editar cliente</h1>
      </div>

      {error === "nome" && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          O nome do cliente é obrigatório.
        </p>
      )}

      <form action={updateServiceClientAction} className="space-y-4">
        <input type="hidden" name="id" value={client.id} />
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input id="name" name="name" required defaultValue={client.name} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone / WhatsApp</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={client.phone ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={client.email ?? ""}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" name="notes" defaultValue={client.notes ?? ""} />
        </div>
        <Button type="submit">Salvar alterações</Button>
      </form>
    </div>
  );
}
