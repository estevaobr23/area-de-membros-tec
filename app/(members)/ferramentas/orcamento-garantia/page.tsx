import Link from "next/link";
import { FileText, Plus, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToolPaywall, ToolAccessBadge } from "@/components/tools/tool-paywall";
import { requireCustomer } from "@/lib/auth/session";
import { getToolAccess } from "@/lib/auth/tool-access";
import { createServiceClient } from "@/lib/supabase/server";
import { formatBRL, formatDate } from "@/lib/format";
import { formatOsNumber } from "@/lib/tools/os-status";
import { cn } from "@/lib/utils";
import { saveBusinessProfileAction } from "./actions";

const QUOTE_STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

const TABS = [
  { value: "orcamentos", label: "Orçamentos" },
  { value: "garantias", label: "Garantias" },
  { value: "perfil", label: "Perfil da assistência" },
];

export default async function OrcamentoGarantiaPage({
  searchParams,
}: PageProps<"/ferramentas/orcamento-garantia">) {
  const customer = await requireCustomer();
  const access = await getToolAccess("orcamento-garantia");
  const params = await searchParams;
  const tab =
    typeof params.aba === "string" && TABS.some((t) => t.value === params.aba)
      ? params.aba
      : "orcamentos";
  const salvo = params.salvo === "1";

  const supabase = createServiceClient();
  const [{ data: quotes }, { data: warranties }, { data: profile }] =
    await Promise.all([
      supabase
        .from("quotes")
        .select("id, quote_number, client_name, device_label, total, status, created_at")
        .eq("customer_id", customer.id)
        .order("quote_number", { ascending: false })
        .limit(100),
      supabase
        .from("warranties")
        .select(
          "id, warranty_number, period_days, created_at, service_orders(os_number, service_clients(name))"
        )
        .eq("customer_id", customer.id)
        .order("warranty_number", { ascending: false })
        .limit(100),
      supabase
        .from("business_profiles")
        .select("*")
        .eq("customer_id", customer.id)
        .maybeSingle(),
    ]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Orçamento + Garantia
            </h1>
            <ToolAccessBadge access={access} />
          </div>
          <p className="text-muted-foreground">
            Documentos profissionais para entregar ao seu cliente.
          </p>
        </div>
        {access.canWrite && tab === "orcamentos" && (
          <Button
            render={<Link href="/ferramentas/orcamento-garantia/novo" />}
            nativeButton={false}
          >
            <Plus data-icon="inline-start" />
            Novo orçamento
          </Button>
        )}
      </div>

      <ToolPaywall
        toolName="Orçamento + Garantia"
        benefit="Continue gerando orçamentos e termos de garantia com a cara da sua assistência, prontos para imprimir."
        access={access}
      />

      <div className="flex gap-2">
        {TABS.map((t) => (
          <Button
            key={t.value}
            variant={tab === t.value ? "default" : "outline"}
            size="sm"
            render={<Link href={`/ferramentas/orcamento-garantia?aba=${t.value}`} />}
            nativeButton={false}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "orcamentos" &&
        (!quotes || quotes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <p className="font-medium">Nenhum orçamento ainda</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Crie um orçamento do zero ou gere a partir de uma OS aberta.
            </p>
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
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <Link
                        href={`/ferramentas/orcamento-garantia/${q.id}`}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        ORC-{String(q.quote_number).padStart(4, "0")}
                      </Link>
                    </TableCell>
                    <TableCell>{q.client_name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {q.device_label || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          q.status === "aprovado" &&
                            "bg-green-500/15 text-green-700 dark:text-green-400",
                          q.status === "recusado" && "bg-destructive/10 text-destructive",
                          q.status === "enviado" &&
                            "bg-blue-500/15 text-blue-700 dark:text-blue-400",
                          q.status === "rascunho" && "bg-secondary text-secondary-foreground"
                        )}
                      >
                        {QUOTE_STATUS_LABELS[q.status] ?? q.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {formatDate(q.created_at)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(q.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}

      {tab === "garantias" &&
        (!warranties || warranties.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
            <ShieldCheck className="size-8 text-muted-foreground" />
            <p className="font-medium">Nenhum termo de garantia ainda</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Abra uma OS com status Pronto ou Entregue e clique em
              &ldquo;Gerar garantia&rdquo;.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">OS</TableHead>
                  <TableHead>Garantia</TableHead>
                  <TableHead className="hidden sm:table-cell">Emitida em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warranties.map((w) => {
                  const os = w.service_orders as unknown as {
                    os_number: number;
                    service_clients: { name: string } | null;
                  } | null;
                  return (
                    <TableRow key={w.id}>
                      <TableCell>
                        <Link
                          href={`/ferramentas/orcamento-garantia/garantia/${w.id}`}
                          className="font-medium underline-offset-2 hover:underline"
                        >
                          GAR-{String(w.warranty_number).padStart(4, "0")}
                        </Link>
                      </TableCell>
                      <TableCell>{os?.service_clients?.name ?? "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {os ? formatOsNumber(os.os_number) : "—"}
                      </TableCell>
                      <TableCell>{w.period_days} dias</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatDate(w.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ))}

      {tab === "perfil" && (
        <div className="max-w-xl space-y-4">
          {salvo && (
            <p className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
              Perfil salvo. Esses dados aparecem nos seus documentos.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Os dados abaixo aparecem no cabeçalho dos orçamentos e termos de
            garantia.
          </p>
          <form action={saveBusinessProfileAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Nome da assistência</Label>
              <Input
                id="business_name"
                name="business_name"
                defaultValue={profile?.business_name ?? ""}
                placeholder="TechCell Assistência"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="owner_name">Responsável</Label>
                <Input
                  id="owner_name"
                  name="owner_name"
                  defaultValue={profile?.owner_name ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input id="phone" name="phone" defaultValue={profile?.phone ?? ""} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={profile?.email ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={profile?.address ?? ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="warranty_terms">
                Condições padrão da garantia
              </Label>
              <Textarea
                id="warranty_terms"
                name="warranty_terms"
                rows={4}
                defaultValue={profile?.warranty_terms ?? ""}
                placeholder="Ex.: A garantia cobre exclusivamente o serviço executado e as peças trocadas…"
              />
              <p className="text-xs text-muted-foreground">
                Esse texto é sugerido automaticamente ao gerar um termo de
                garantia (você pode ajustar em cada termo).
              </p>
            </div>
            {access.canWrite && <Button type="submit">Salvar perfil</Button>}
          </form>
        </div>
      )}
    </div>
  );
}
