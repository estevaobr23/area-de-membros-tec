import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireCustomer } from "@/lib/auth/session";
import { getToolAccess } from "@/lib/auth/tool-access";
import { createServiceClient } from "@/lib/supabase/server";
import { formatBRL, formatDate } from "@/lib/format";
import {
  OS_STATUS_LABELS,
  OS_STATUS_STYLES,
  formatOsNumber,
  type OsStatus,
} from "@/lib/tools/os-status";
import { cn } from "@/lib/utils";
import { createDeviceAction } from "../../actions";

export default async function ClienteDetailPage({
  params,
  searchParams,
}: PageProps<"/ferramentas/ordem-servico/clientes/[id]">) {
  const customer = await requireCustomer();
  const access = await getToolAccess("ordem-servico");
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = createServiceClient();
  const { data: client } = await supabase
    .from("service_clients")
    .select(
      "*, devices(id, brand, model, color, imei), service_orders(id, os_number, status, total, created_at)"
    )
    .eq("id", id)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (!client) notFound();

  const devices = (client.devices ?? []) as {
    id: string;
    brand: string;
    model: string;
    color: string | null;
    imei: string | null;
  }[];
  const orders = (
    [...(client.service_orders ?? [])] as {
      id: string;
      os_number: number;
      status: string;
      total: number;
      created_at: string;
    }[]
  ).sort((a, b) => b.os_number - a.os_number);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/ferramentas/ordem-servico/clientes"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Clientes
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
          <p className="text-muted-foreground">
            {[client.phone, client.email].filter(Boolean).join(" · ") ||
              "Sem contato cadastrado"}
          </p>
        </div>
        {access.canWrite && (
          <Button
            variant="outline"
            render={
              <Link href={`/ferramentas/ordem-servico/clientes/${client.id}/editar`} />
            }
            nativeButton={false}
          >
            <Pencil data-icon="inline-start" />
            Editar
          </Button>
        )}
      </div>

      {client.notes && (
        <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          {client.notes}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Aparelhos ({devices.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum aparelho cadastrado.
            </p>
          ) : (
            <ul className="space-y-2">
              {devices.map((d) => (
                <li key={d.id} className="flex items-center gap-2 text-sm">
                  <Smartphone className="size-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium">
                    {[d.brand, d.model, d.color].filter(Boolean).join(" ")}
                  </span>
                  {d.imei && (
                    <span className="text-muted-foreground">IMEI {d.imei}</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {access.canWrite && (
            <form
              action={createDeviceAction}
              className="grid gap-3 border-t pt-4 sm:grid-cols-2"
            >
              <input type="hidden" name="service_client_id" value={client.id} />
              {error === "aparelho" && (
                <p className="text-sm text-destructive sm:col-span-2">
                  Marca e modelo são obrigatórios.
                </p>
              )}
              <div className="space-y-1">
                <Label htmlFor="brand">Marca *</Label>
                <Input id="brand" name="brand" required placeholder="Xiaomi" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="model">Modelo *</Label>
                <Input id="model" name="model" required placeholder="Redmi Note 12" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="color">Cor</Label>
                <Input id="color" name="color" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="imei">IMEI / Serial</Label>
                <Input id="imei" name="imei" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="accessories">Acessórios</Label>
                <Input id="accessories" name="accessories" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="condition">Estado</Label>
                <Input id="condition" name="condition" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" variant="outline" size="sm">
                  Adicionar aparelho
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Histórico de serviços ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma OS para este cliente ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {orders.map((os) => (
                <li
                  key={os.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <Link
                    href={`/ferramentas/ordem-servico/${os.id}`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {formatOsNumber(os.os_number)}
                  </Link>
                  <Badge className={cn(OS_STATUS_STYLES[os.status as OsStatus])}>
                    {OS_STATUS_LABELS[os.status as OsStatus]}
                  </Badge>
                  <span className="text-muted-foreground">
                    {formatDate(os.created_at)}
                  </span>
                  <span className="tabular-nums">{formatBRL(os.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
