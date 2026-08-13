import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCustomer } from "@/lib/auth/session";
import { getToolAccess } from "@/lib/auth/tool-access";
import { createServiceClient } from "@/lib/supabase/server";
import { formatOsNumber } from "@/lib/tools/os-status";
import { OsForm } from "@/components/tools/service-orders/os-form";
import type { ServiceOrder } from "@/lib/supabase/types";
import { updateServiceOrderAction } from "../../actions";

export default async function EditarOsPage({
  params,
  searchParams,
}: PageProps<"/ferramentas/ordem-servico/[id]/editar">) {
  const customer = await requireCustomer();
  const access = await getToolAccess("ordem-servico");
  const { id } = await params;
  if (!access.canWrite) redirect(`/ferramentas/ordem-servico/${id}`);
  const { error } = await searchParams;

  const supabase = createServiceClient();
  const { data: os } = await supabase
    .from("service_orders")
    .select("*")
    .eq("id", id)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (!os) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div>
        <Link
          href={`/ferramentas/ordem-servico/${id}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {formatOsNumber(os.os_number)}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Editar {formatOsNumber(os.os_number)}
        </h1>
      </div>

      {error === "campos" && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Preencha o defeito relatado.
        </p>
      )}

      <OsForm
        clients={[]}
        defaults={os as ServiceOrder}
        action={updateServiceOrderAction}
        submitLabel="Salvar alterações"
      />
    </div>
  );
}
