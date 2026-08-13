import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCustomer } from "@/lib/auth/session";
import { getToolAccess } from "@/lib/auth/tool-access";
import { createServiceClient } from "@/lib/supabase/server";
import { formatOsNumber } from "@/lib/tools/os-status";
import { QuoteForm, type QuoteDefaults } from "@/components/tools/quotes/quote-form";
import type { PartItem } from "@/lib/supabase/types";
import { createQuoteAction } from "../actions";

const ERRORS: Record<string, string> = {
  cliente: "Informe o nome do cliente.",
  salvar: "Não foi possível salvar o orçamento. Tente de novo.",
};

export default async function NovoOrcamentoPage({
  searchParams,
}: PageProps<"/ferramentas/orcamento-garantia/novo">) {
  const customer = await requireCustomer();
  const access = await getToolAccess("orcamento-garantia");
  if (!access.canWrite) redirect("/ferramentas/orcamento-garantia?bloqueado=1");

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const osId = typeof params.os === "string" ? params.os : "";

  // Integração com OS: pré-preenche cliente, aparelho, defeito, peças e valores
  let defaults: QuoteDefaults = {};
  let fromOs: string | null = null;
  if (osId) {
    const supabase = createServiceClient();
    const { data: os } = await supabase
      .from("service_orders")
      .select(
        "id, os_number, service_client_id, device_id, reported_defect, diagnosis, service_performed, parts, labor_cost, discount, service_clients(name), devices(brand, model, color)"
      )
      .eq("id", osId)
      .eq("customer_id", customer.id)
      .maybeSingle();

    if (os) {
      const client = os.service_clients as unknown as { name: string } | null;
      const device = os.devices as unknown as {
        brand: string;
        model: string;
        color: string | null;
      } | null;
      fromOs = formatOsNumber(os.os_number);
      defaults = {
        service_client_id: os.service_client_id,
        device_id: os.device_id,
        service_order_id: os.id,
        client_name: client?.name ?? "",
        device_label: device
          ? [device.brand, device.model, device.color].filter(Boolean).join(" ")
          : "",
        service_description:
          os.service_performed || os.diagnosis || os.reported_defect || "",
        items: (os.parts ?? []) as PartItem[],
        labor_cost: Number(os.labor_cost) || 0,
        discount: Number(os.discount) || 0,
      };
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div>
        <Link
          href="/ferramentas/orcamento-garantia"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Orçamentos
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Novo orçamento</h1>
        {fromOs && (
          <p className="text-muted-foreground">
            Dados importados da {fromOs} — revise e ajuste o que precisar.
          </p>
        )}
      </div>

      {ERRORS[error] && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {ERRORS[error]}
        </p>
      )}

      <QuoteForm action={createQuoteAction} defaults={defaults} />
    </div>
  );
}
