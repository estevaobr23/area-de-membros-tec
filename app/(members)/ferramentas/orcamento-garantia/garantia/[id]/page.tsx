import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PrintButton } from "@/components/tools/print-button";
import { requireCustomer } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { formatBRL, formatDate } from "@/lib/format";
import { formatOsNumber } from "@/lib/tools/os-status";
import type { PartItem } from "@/lib/supabase/types";

export default async function WarrantyDetailPage({
  params,
}: PageProps<"/ferramentas/orcamento-garantia/garantia/[id]">) {
  const customer = await requireCustomer();
  const { id } = await params;

  const supabase = createServiceClient();
  const [{ data: warranty }, { data: profile }] = await Promise.all([
    supabase
      .from("warranties")
      .select(
        "*, service_orders(os_number, total, service_performed, diagnosis, reported_defect, parts, delivered_at, service_clients(name, phone), devices(brand, model, color, imei))"
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

  if (!warranty) notFound();

  const os = warranty.service_orders as unknown as {
    os_number: number;
    total: number;
    service_performed: string | null;
    diagnosis: string | null;
    reported_defect: string;
    parts: PartItem[];
    delivered_at: string | null;
    service_clients: { name: string; phone: string | null } | null;
    devices: {
      brand: string;
      model: string;
      color: string | null;
      imei: string | null;
    } | null;
  } | null;

  const number = `GAR-${String(warranty.warranty_number).padStart(4, "0")}`;
  const start = new Date(warranty.created_at);
  const end = new Date(start);
  end.setDate(end.getDate() + warranty.period_days);
  const parts = os?.parts ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/ferramentas/orcamento-garantia?aba=garantias"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Garantias
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{number}</h1>
        </div>
        <PrintButton />
      </div>

      <Card>
        <CardContent className="print-doc space-y-6 py-2">
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
              <p className="font-semibold">TERMO DE GARANTIA {number}</p>
              <p className="text-sm text-muted-foreground">
                Emitido em {formatDate(warranty.created_at)}
              </p>
              {os && (
                <p className="text-sm text-muted-foreground">
                  Ref. {formatOsNumber(os.os_number)}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{os?.service_clients?.name ?? "—"}</p>
              {os?.service_clients?.phone && (
                <p className="text-sm text-muted-foreground">
                  {os.service_clients.phone}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aparelho</p>
              <p className="font-medium">
                {os?.devices
                  ? [os.devices.brand, os.devices.model, os.devices.color]
                      .filter(Boolean)
                      .join(" ")
                  : "—"}
              </p>
              {os?.devices?.imei && (
                <p className="text-sm text-muted-foreground">
                  IMEI: {os.devices.imei}
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Serviço executado</p>
            <p>
              {os?.service_performed || os?.diagnosis || os?.reported_defect || "—"}
            </p>
            {parts.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                Peças: {parts.map((p) => `${p.qty}× ${p.description}`).join(", ")}
              </p>
            )}
            {os && (
              <p className="mt-1 text-sm text-muted-foreground">
                Valor do serviço: {formatBRL(os.total)}
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="font-medium">
              Garantia de {warranty.period_days} dias
            </p>
            <p className="text-sm text-muted-foreground">
              Válida de {formatDate(start)} até {formatDate(end)}.
            </p>
          </div>

          {warranty.conditions && (
            <div>
              <p className="text-sm text-muted-foreground">Condições</p>
              <p className="text-sm whitespace-pre-line">{warranty.conditions}</p>
            </div>
          )}

          {warranty.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Observações</p>
              <p className="text-sm">{warranty.notes}</p>
            </div>
          )}

          <div className="grid gap-8 pt-8 sm:grid-cols-2">
            <div className="border-t pt-2 text-center text-sm text-muted-foreground">
              {profile?.business_name || "Assistência"}
            </div>
            <div className="border-t pt-2 text-center text-sm text-muted-foreground">
              {os?.service_clients?.name ?? "Cliente"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
