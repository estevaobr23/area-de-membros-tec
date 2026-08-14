import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PrintButton } from "@/components/tools/print-button";
import { requireCustomer } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { formatBRL, formatDate, formatDateTime } from "@/lib/format";
import {
  OS_STATUS_LABELS,
  formatOsNumber,
  type OsStatus,
} from "@/lib/tools/os-status";
import type { PartItem } from "@/lib/supabase/types";

export default async function OsPrintPage({
  params,
}: PageProps<"/ferramentas/ordem-servico/[id]/imprimir">) {
  const customer = await requireCustomer();
  const { id } = await params;

  const supabase = createServiceClient();
  const [{ data: os }, { data: profile }] = await Promise.all([
    supabase
      .from("service_orders")
      .select(
        "*, service_clients(name, phone), devices(brand, model, color, imei, accessories, condition)"
      )
      .eq("id", id)
      .eq("customer_id", customer.id)
      .maybeSingle(),
    supabase
      .from("business_profiles")
      .select("*")
      .eq("customer_id", customer.id)
      .maybeSingle(),
  ]);

  if (!os) notFound();

  const number = formatOsNumber(os.os_number);
  const status = os.status as OsStatus;
  const parts = (os.parts ?? []) as PartItem[];
  const partsSum = parts.reduce((s, p) => s + p.qty * p.unit_price, 0);
  const client = os.service_clients as {
    name: string;
    phone: string | null;
  } | null;
  const device = os.devices as {
    brand: string;
    model: string;
    color: string | null;
    imei: string | null;
    accessories: string | null;
    condition: string | null;
  } | null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link
            href={`/ferramentas/ordem-servico/${os.id}`}
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar para a OS
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Imprimir {number}
          </h1>
          <p className="text-sm text-muted-foreground">
            Use &ldquo;Salvar como PDF&rdquo; na janela de impressão para baixar
            o arquivo.
          </p>
        </div>
        <PrintButton label="Baixar PDF / Imprimir" variant="default" />
      </div>

      <Card>
        <CardContent className="print-doc space-y-6 py-2">
          {/* Cabeçalho do documento */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold">
                {profile?.business_name || "Sua assistência"}
              </p>
              <p className="text-sm text-muted-foreground">
                {[profile?.owner_name, profile?.phone, profile?.email]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {profile?.address && (
                <p className="text-sm text-muted-foreground">{profile.address}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold">ORDEM DE SERVIÇO {number}</p>
              <p className="text-sm text-muted-foreground">
                Aberta em {formatDateTime(os.created_at)}
              </p>
              <p className="text-sm text-muted-foreground">
                Status: {OS_STATUS_LABELS[status]}
              </p>
              {os.due_date && (
                <p className="text-sm text-muted-foreground">
                  Previsão de entrega: {formatDate(os.due_date)}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Cliente e aparelho */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{client?.name ?? "—"}</p>
              {client?.phone && <p className="text-sm">{client.phone}</p>}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aparelho</p>
              <p className="font-medium">
                {device
                  ? [device.brand, device.model, device.color]
                      .filter(Boolean)
                      .join(" ")
                  : "—"}
              </p>
              {device?.imei && (
                <p className="text-sm">IMEI/Serial: {device.imei}</p>
              )}
            </div>
            {device?.accessories && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Acessórios entregues
                </p>
                <p className="text-sm">{device.accessories}</p>
              </div>
            )}
            {device?.condition && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Estado do aparelho na entrada
                </p>
                <p className="text-sm">{device.condition}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Defeito e serviço */}
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Defeito relatado</p>
              <p>{os.reported_defect}</p>
            </div>
            {os.diagnosis && (
              <div>
                <p className="text-sm text-muted-foreground">Diagnóstico</p>
                <p>{os.diagnosis}</p>
              </div>
            )}
            {os.service_performed && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Serviço a executar / executado
                </p>
                <p>{os.service_performed}</p>
              </div>
            )}
            {os.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Observações</p>
                <p>{os.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Valores */}
          <div className="space-y-2 text-sm">
            {parts.map((p, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span>
                  {p.qty}× {p.description}
                </span>
                <span className="tabular-nums">
                  {formatBRL(p.qty * p.unit_price)}
                </span>
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
          </div>

          {/* Assinaturas */}
          <div className="grid gap-10 pt-10 sm:grid-cols-2">
            <div className="text-center text-sm">
              <div className="mx-auto mb-1 w-64 max-w-full border-t" />
              <p>{profile?.owner_name || "Técnico responsável"}</p>
              <p className="text-muted-foreground">Assinatura do técnico</p>
            </div>
            <div className="text-center text-sm">
              <div className="mx-auto mb-1 w-64 max-w-full border-t" />
              <p>{client?.name ?? "Cliente"}</p>
              <p className="text-muted-foreground">Assinatura do cliente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
