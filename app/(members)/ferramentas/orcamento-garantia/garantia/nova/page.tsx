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
import { formatOsNumber, OS_DONE_STATUSES, type OsStatus } from "@/lib/tools/os-status";
import { createWarrantyAction } from "../../actions";

export default async function NovaGarantiaPage({
  searchParams,
}: PageProps<"/ferramentas/orcamento-garantia/garantia/nova">) {
  const customer = await requireCustomer();
  const access = await getToolAccess("orcamento-garantia");
  if (!access.canWrite) redirect("/ferramentas/orcamento-garantia?bloqueado=1");

  const params = await searchParams;
  const osId = typeof params.os === "string" ? params.os : "";
  if (!osId) redirect("/ferramentas/orcamento-garantia?aba=garantias");

  const supabase = createServiceClient();
  const [{ data: os }, { data: profile }] = await Promise.all([
    supabase
      .from("service_orders")
      .select(
        "id, os_number, status, service_performed, diagnosis, reported_defect, service_clients(name), devices(brand, model, color)"
      )
      .eq("id", osId)
      .eq("customer_id", customer.id)
      .maybeSingle(),
    supabase
      .from("business_profiles")
      .select("warranty_terms")
      .eq("customer_id", customer.id)
      .maybeSingle(),
  ]);

  if (!os) notFound();
  if (!OS_DONE_STATUSES.includes(os.status as OsStatus)) {
    redirect(`/ferramentas/ordem-servico/${os.id}`);
  }

  const client = os.service_clients as unknown as { name: string } | null;
  const device = os.devices as unknown as {
    brand: string;
    model: string;
    color: string | null;
  } | null;

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4 md:p-8">
      <div>
        <Link
          href={`/ferramentas/ordem-servico/${os.id}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {formatOsNumber(os.os_number)}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Termo de garantia
        </h1>
        <p className="text-muted-foreground">
          {client?.name} ·{" "}
          {device
            ? [device.brand, device.model, device.color].filter(Boolean).join(" ")
            : ""}
        </p>
      </div>

      <form action={createWarrantyAction} className="space-y-4">
        <input type="hidden" name="service_order_id" value={os.id} />
        <div className="space-y-2">
          <Label htmlFor="period_days">Período de garantia (dias)</Label>
          <Input
            id="period_days"
            name="period_days"
            type="number"
            min={1}
            defaultValue={90}
            required
            className="max-w-32"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="conditions">Condições da garantia</Label>
          <Textarea
            id="conditions"
            name="conditions"
            rows={5}
            defaultValue={profile?.warranty_terms ?? ""}
            placeholder="Condições que valem para este serviço (o texto padrão pode ser configurado no Perfil da assistência)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" name="notes" />
        </div>
        <Button type="submit">Emitir termo de garantia</Button>
      </form>
    </div>
  );
}
