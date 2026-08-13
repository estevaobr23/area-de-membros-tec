import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Pencil, Receipt, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { requireCustomer } from "@/lib/auth/session";
import { getToolAccess } from "@/lib/auth/tool-access";
import { createServiceClient } from "@/lib/supabase/server";
import { formatBRL, formatDate, formatDateTime } from "@/lib/format";
import {
  OS_STATUSES,
  OS_STATUS_LABELS,
  OS_STATUS_STYLES,
  OS_DONE_STATUSES,
  formatOsNumber,
  type OsStatus,
} from "@/lib/tools/os-status";
import { cn } from "@/lib/utils";
import type { PartItem } from "@/lib/supabase/types";
import { updateOsStatusAction, launchOsRevenueAction } from "../actions";

const REVENUE_MESSAGES: Record<string, { text: string; ok: boolean }> = {
  ok: { text: "Receita lançada no Financeiro.", ok: true },
  duplicada: {
    text: "Esta OS já tinha receita lançada — nada foi duplicado.",
    ok: true,
  },
  erro: { text: "Não foi possível lançar a receita. Tente de novo.", ok: false },
};

export default async function OsDetailPage({
  params,
  searchParams,
}: PageProps<"/ferramentas/ordem-servico/[id]">) {
  const customer = await requireCustomer();
  const access = await getToolAccess("ordem-servico");
  const { id } = await params;
  const { receita } = await searchParams;

  const supabase = createServiceClient();
  const { data: os } = await supabase
    .from("service_orders")
    .select(
      "*, service_clients(id, name, phone), devices(brand, model, color, imei, accessories, condition)"
    )
    .eq("id", id)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (!os) notFound();

  const { data: existingRevenue } = await supabase
    .from("finance_transactions")
    .select("id")
    .eq("service_order_id", os.id)
    .maybeSingle();

  const { data: warranty } = await supabase
    .from("warranties")
    .select("id")
    .eq("service_order_id", os.id)
    .eq("customer_id", customer.id)
    .maybeSingle();

  const status = os.status as OsStatus;
  const parts = (os.parts ?? []) as PartItem[];
  const partsSum = parts.reduce((s, p) => s + p.qty * p.unit_price, 0);
  const isDone = OS_DONE_STATUSES.includes(status);
  const client = os.service_clients as { id: string; name: string; phone: string | null } | null;
  const device = os.devices as {
    brand: string;
    model: string;
    color: string | null;
    imei: string | null;
    accessories: string | null;
    condition: string | null;
  } | null;
  const revenueMsg = typeof receita === "string" ? REVENUE_MESSAGES[receita] : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/ferramentas/ordem-servico"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Ordens de serviço
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {formatOsNumber(os.os_number)}
            </h1>
            <Badge className={cn(OS_STATUS_STYLES[status])}>
              {OS_STATUS_LABELS[status]}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Criada em {formatDateTime(os.created_at)}
            {os.delivered_at && ` · entregue em ${formatDateTime(os.delivered_at)}`}
          </p>
        </div>
        {access.canWrite && (
          <Button
            variant="outline"
            render={<Link href={`/ferramentas/ordem-servico/${os.id}/editar`} />}
            nativeButton={false}
          >
            <Pencil data-icon="inline-start" />
            Editar
          </Button>
        )}
      </div>

      {revenueMsg && (
        <p
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            revenueMsg.ok
              ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400"
              : "border-destructive/50 bg-destructive/10 text-destructive"
          )}
        >
          {revenueMsg.text}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">
              {client ? (
                <Link
                  href={`/ferramentas/ordem-servico/clientes/${client.id}`}
                  className="underline-offset-2 hover:underline"
                >
                  {client.name}
                </Link>
              ) : (
                "—"
              )}
            </p>
            {client?.phone && (
              <p className="text-muted-foreground">{client.phone}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aparelho</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">
              {device ? [device.brand, device.model, device.color].filter(Boolean).join(" ") : "—"}
            </p>
            {device?.imei && (
              <p className="text-muted-foreground">IMEI: {device.imei}</p>
            )}
            {device?.accessories && (
              <p className="text-muted-foreground">
                Acessórios: {device.accessories}
              </p>
            )}
            {device?.condition && (
              <p className="text-muted-foreground">Estado: {device.condition}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Defeito e serviço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground">Defeito relatado</p>
            <p>{os.reported_defect}</p>
          </div>
          {os.diagnosis && (
            <div>
              <p className="text-muted-foreground">Diagnóstico</p>
              <p>{os.diagnosis}</p>
            </div>
          )}
          {os.service_performed && (
            <div>
              <p className="text-muted-foreground">Serviço</p>
              <p>{os.service_performed}</p>
            </div>
          )}
          {os.due_date && (
            <div>
              <p className="text-muted-foreground">Previsão de entrega</p>
              <p>{formatDate(os.due_date)}</p>
            </div>
          )}
          {os.notes && (
            <div>
              <p className="text-muted-foreground">Observações</p>
              <p>{os.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Valores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {parts.map((p, i) => (
            <div key={i} className="flex justify-between gap-2">
              <span>
                {p.qty}× {p.description}
              </span>
              <span className="tabular-nums">{formatBRL(p.qty * p.unit_price)}</span>
            </div>
          ))}
          {parts.length > 0 && (
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span>Subtotal peças</span>
              <span className="tabular-nums">{formatBRL(partsSum)}</span>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <span>Mão de obra</span>
            <span className="tabular-nums">{formatBRL(os.labor_cost)}</span>
          </div>
          {Number(os.discount) > 0 && (
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span>Desconto</span>
              <span className="tabular-nums">−{formatBRL(os.discount)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between gap-2 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatBRL(os.total)}</span>
          </div>
        </CardContent>
      </Card>

      {access.canWrite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={updateOsStatusAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={os.id} />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Alterar status</p>
                <NativeSelect name="status" defaultValue={status} className="w-56">
                  {OS_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {OS_STATUS_LABELS[s]}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <Button type="submit" variant="outline">
                Salvar status
              </Button>
            </form>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <form action={launchOsRevenueAction}>
                <input type="hidden" name="id" value={os.id} />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={!isDone || Boolean(existingRevenue)}
                  title={
                    !isDone
                      ? "Disponível quando a OS estiver Pronta ou Entregue"
                      : existingRevenue
                        ? "Receita já lançada no Financeiro"
                        : undefined
                  }
                >
                  <Receipt data-icon="inline-start" />
                  {existingRevenue ? "Receita já lançada" : "Lançar receita"}
                </Button>
              </form>

              <Button
                variant="outline"
                render={
                  <Link href={`/ferramentas/orcamento-garantia/novo?os=${os.id}`} />
                }
                nativeButton={false}
              >
                <FileText data-icon="inline-start" />
                Gerar orçamento
              </Button>

              {isDone && !warranty && (
                <Button
                  variant="outline"
                  render={
                    <Link
                      href={`/ferramentas/orcamento-garantia/garantia/nova?os=${os.id}`}
                    />
                  }
                  nativeButton={false}
                >
                  <ShieldCheck data-icon="inline-start" />
                  Gerar garantia
                </Button>
              )}
              {warranty && (
                <Button
                  variant="outline"
                  render={
                    <Link href={`/ferramentas/orcamento-garantia/garantia/${warranty.id}`} />
                  }
                  nativeButton={false}
                >
                  <ShieldCheck data-icon="inline-start" />
                  Ver garantia
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
