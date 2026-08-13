import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCustomer } from "@/lib/auth/session";
import { getToolAccess } from "@/lib/auth/tool-access";
import { createServiceClient } from "@/lib/supabase/server";
import { OsForm, type ClientOption } from "@/components/tools/service-orders/os-form";
import { createServiceOrderAction } from "../actions";

const ERRORS: Record<string, string> = {
  campos: "Preencha o cliente e o defeito relatado.",
  cliente: "Cliente inválido — selecione novamente.",
  aparelho: "Selecione um aparelho ou preencha marca e modelo do aparelho novo.",
  salvar: "Não foi possível salvar a OS. Tente de novo.",
};

export default async function NovaOsPage({
  searchParams,
}: PageProps<"/ferramentas/ordem-servico/novo">) {
  const customer = await requireCustomer();
  const access = await getToolAccess("ordem-servico");
  if (!access.canWrite) redirect("/ferramentas/ordem-servico?bloqueado=1");

  const { error } = await searchParams;
  const supabase = createServiceClient();
  const { data: clients } = await supabase
    .from("service_clients")
    .select("id, name, devices(id, brand, model, color)")
    .eq("customer_id", customer.id)
    .order("name");

  const clientOptions: ClientOption[] = (clients ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    devices: (c.devices ?? []).map((d) => ({
      id: d.id,
      label: [d.brand, d.model, d.color].filter(Boolean).join(" "),
    })),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div>
        <Link
          href="/ferramentas/ordem-servico"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Ordens de serviço
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nova OS</h1>
        <p className="text-muted-foreground">
          O número da OS é gerado automaticamente ao salvar.
        </p>
      </div>

      {typeof error === "string" && ERRORS[error] && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {ERRORS[error]}
        </p>
      )}

      <OsForm
        clients={clientOptions}
        action={createServiceOrderAction}
        submitLabel="Criar ordem de serviço"
      />
    </div>
  );
}
