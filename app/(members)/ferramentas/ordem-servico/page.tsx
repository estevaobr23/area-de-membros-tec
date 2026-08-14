import Link from "next/link";
import { ClipboardList, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToolPaywall, ToolAccessBadge } from "@/components/tools/tool-paywall";
import { ToolHeader } from "@/components/tools/tool-header";
import { requireCustomer } from "@/lib/auth/session";
import { getToolAccess } from "@/lib/auth/tool-access";
import { createServiceClient } from "@/lib/supabase/server";
import { formatBRL, formatDate } from "@/lib/format";
import {
  OS_STATUSES,
  OS_STATUS_LABELS,
  OS_STATUS_STYLES,
  formatOsNumber,
  isOsStatus,
  type OsStatus,
} from "@/lib/tools/os-status";
import { cn } from "@/lib/utils";

interface OsRow {
  id: string;
  os_number: number;
  status: OsStatus;
  total: number;
  created_at: string;
  reported_defect: string;
  service_clients: { name: string } | null;
  devices: { brand: string; model: string } | null;
}

export default async function OrdemServicoPage({
  searchParams,
}: PageProps<"/ferramentas/ordem-servico">) {
  const customer = await requireCustomer();
  const access = await getToolAccess("ordem-servico");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const statusFilter =
    typeof params.status === "string" && isOsStatus(params.status)
      ? params.status
      : "";

  const supabase = createServiceClient();

  let query = supabase
    .from("service_orders")
    .select(
      "id, os_number, status, total, created_at, reported_defect, service_clients(name), devices(brand, model)"
    )
    .eq("customer_id", customer.id)
    .order("os_number", { ascending: false })
    .limit(100);
  if (statusFilter) query = query.eq("status", statusFilter);

  const [{ data: rawOrders }, { data: allStatuses }] = await Promise.all([
    query,
    supabase
      .from("service_orders")
      .select("status")
      .eq("customer_id", customer.id),
  ]);

  let orders = (rawOrders ?? []) as unknown as OsRow[];
  if (q) {
    const needle = q.toLowerCase();
    orders = orders.filter(
      (o) =>
        formatOsNumber(o.os_number).toLowerCase().includes(needle) ||
        (o.service_clients?.name ?? "").toLowerCase().includes(needle) ||
        `${o.devices?.brand ?? ""} ${o.devices?.model ?? ""}`
          .toLowerCase()
          .includes(needle) ||
        o.reported_defect.toLowerCase().includes(needle)
    );
  }

  const counts = { abertas: 0, diagnostico: 0, peca: 0, prontas: 0, entregues: 0 };
  for (const { status } of allStatuses ?? []) {
    if (status === "em_diagnostico") counts.diagnostico++;
    if (status === "aguardando_peca") counts.peca++;
    if (status === "pronto") counts.prontas++;
    if (status === "entregue") counts.entregues++;
    if (!["entregue", "cancelado"].includes(status)) counts.abertas++;
  }

  const stats = [
    { label: "Abertas", value: counts.abertas },
    { label: "Em diagnóstico", value: counts.diagnostico },
    { label: "Aguardando peça", value: counts.peca },
    { label: "Prontas", value: counts.prontas },
    { label: "Entregues", value: counts.entregues },
  ];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <ToolHeader
        tool="ordem-servico"
        subtitle="Gestão dos reparos da sua assistência."
        badge={<ToolAccessBadge access={access} />}
        actions={
          <>
            <Button
              variant="outline"
              render={<Link href="/ferramentas/ordem-servico/clientes" />}
              nativeButton={false}
            >
              <Users data-icon="inline-start" />
              Clientes
            </Button>
            {access.canWrite && (
              <Button
                render={<Link href="/ferramentas/ordem-servico/novo" />}
                nativeButton={false}
              >
                <Plus data-icon="inline-start" />
                Nova OS
              </Button>
            )}
          </>
        }
      />

      <ToolPaywall
        toolName="Ordem de Serviço"
        benefit="Continue criando OS ilimitadas, controlando status e histórico de todos os reparos da sua assistência."
        access={access}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="py-4">
            <CardContent className="space-y-1">
              <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <form className="flex flex-wrap gap-2" action="/ferramentas/ordem-servico">
        <Input
          name="q"
          placeholder="Buscar por nº, cliente, aparelho ou defeito"
          defaultValue={q}
          className="max-w-xs"
        />
        <NativeSelect name="status" defaultValue={statusFilter} className="w-48">
          <option value="">Todos os status</option>
          {OS_STATUSES.map((s) => (
            <option key={s} value={s}>
              {OS_STATUS_LABELS[s]}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <ClipboardList className="size-8 text-muted-foreground" />
          <p className="font-medium">
            {q || statusFilter
              ? "Nenhuma OS encontrada com esses filtros"
              : "Nenhuma ordem de serviço ainda"}
          </p>
          {!q && !statusFilter && access.canWrite && (
            <p className="max-w-sm text-sm text-muted-foreground">
              Crie a primeira OS para começar a acompanhar seus reparos.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Aparelho</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((os) => (
                <TableRow key={os.id}>
                  <TableCell>
                    <Link
                      href={`/ferramentas/ordem-servico/${os.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {formatOsNumber(os.os_number)}
                    </Link>
                  </TableCell>
                  <TableCell>{os.service_clients?.name ?? "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {os.devices ? `${os.devices.brand} ${os.devices.model}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(OS_STATUS_STYLES[os.status])}>
                      {OS_STATUS_LABELS[os.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatDate(os.created_at)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(os.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
