import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  FINANCE_CATEGORY_LABELS,
  resolvePeriod,
  type FinancePeriod,
} from "@/lib/tools/finance";
import { formatOsNumber } from "@/lib/tools/os-status";
import { cn } from "@/lib/utils";
import { deleteFinanceTransactionAction } from "./actions";
import { Trash2 } from "lucide-react";

const PERIOD_TABS: { value: FinancePeriod; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "7dias", label: "7 dias" },
  { value: "mes", label: "Mês atual" },
  { value: "mes_anterior", label: "Mês anterior" },
];

export default async function FinanceiroPage({
  searchParams,
}: PageProps<"/ferramentas/financeiro">) {
  const customer = await requireCustomer();
  const access = await getToolAccess("financeiro");
  const params = await searchParams;

  const periodParam = typeof params.periodo === "string" ? params.periodo : "mes";
  const period = (
    ["hoje", "7dias", "mes", "mes_anterior", "personalizado"].includes(periodParam)
      ? periodParam
      : "mes"
  ) as FinancePeriod;
  const { from, to } = resolvePeriod(
    period,
    typeof params.de === "string" ? params.de : undefined,
    typeof params.ate === "string" ? params.ate : undefined
  );

  const supabase = createServiceClient();
  const { data: transactions } = await supabase
    .from("finance_transactions")
    .select(
      "id, type, category, description, amount, entry_date, source, service_order_id, service_orders(os_number)"
    )
    .eq("customer_id", customer.id)
    .gte("entry_date", from)
    .lte("entry_date", to)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);

  const rows = transactions ?? [];
  let income = 0;
  let expenses = 0;
  const byCategory = new Map<string, number>();
  for (const t of rows) {
    const amount = Number(t.amount);
    if (t.type === "receita") income += amount;
    else {
      expenses += amount;
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + amount);
    }
  }
  const balance = income - expenses;
  const topCategories = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Controle Financeiro
            </h1>
            <ToolAccessBadge access={access} />
          </div>
          <p className="text-muted-foreground">
            Receitas e despesas da assistência de {formatDate(from)} a{" "}
            {formatDate(to)}.
          </p>
        </div>
        {access.canWrite && (
          <Button
            render={<Link href="/ferramentas/financeiro/novo" />}
            nativeButton={false}
          >
            <Plus data-icon="inline-start" />
            Nova movimentação
          </Button>
        )}
      </div>

      <ToolPaywall
        toolName="Controle Financeiro"
        benefit="Continue registrando receitas e despesas e enxergando o lucro real da sua assistência todo mês."
        access={access}
      />

      <div className="flex flex-wrap items-center gap-2">
        {PERIOD_TABS.map((t) => (
          <Button
            key={t.value}
            variant={period === t.value ? "default" : "outline"}
            size="sm"
            render={<Link href={`/ferramentas/financeiro?periodo=${t.value}`} />}
            nativeButton={false}
          >
            {t.label}
          </Button>
        ))}
        <form
          action="/ferramentas/financeiro"
          className="flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="periodo" value="personalizado" />
          <Input
            type="date"
            name="de"
            defaultValue={period === "personalizado" ? from : ""}
            className="w-36"
            aria-label="De"
          />
          <Input
            type="date"
            name="ate"
            defaultValue={period === "personalizado" ? to : ""}
            className="w-36"
            aria-label="Até"
          />
          <Button type="submit" variant="outline" size="sm">
            Aplicar
          </Button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="py-4">
          <CardContent className="space-y-1">
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="text-2xl font-semibold text-green-700 tabular-nums dark:text-green-400">
              {formatBRL(income)}
            </p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="space-y-1">
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="text-2xl font-semibold text-destructive tabular-nums">
              {formatBRL(expenses)}
            </p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="space-y-1">
            <p className="text-xs text-muted-foreground">Saldo do período</p>
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums",
                balance >= 0
                  ? "text-green-700 dark:text-green-400"
                  : "text-destructive"
              )}
            >
              {formatBRL(balance)}
            </p>
            {topCategories.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Maiores gastos:{" "}
                {topCategories
                  .map(
                    ([cat, v]) =>
                      `${FINANCE_CATEGORY_LABELS[cat] ?? cat} (${formatBRL(v)})`
                  )
                  .join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <Wallet className="size-8 text-muted-foreground" />
          <p className="font-medium">Nenhuma movimentação neste período</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                {access.canWrite && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => {
                const osNumber = (
                  t.service_orders as unknown as { os_number: number } | null
                )?.os_number;
                return (
                  <TableRow key={t.id}>
                    <TableCell>{formatDate(t.entry_date)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{t.description}</span>
                      {t.source === "os" && osNumber && (
                        <Badge variant="secondary" className="ml-2">
                          {formatOsNumber(osNumber)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {FINANCE_CATEGORY_LABELS[t.category] ?? t.category}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        t.type === "receita"
                          ? "text-green-700 dark:text-green-400"
                          : "text-destructive"
                      )}
                    >
                      {t.type === "receita" ? "+" : "−"}
                      {formatBRL(t.amount)}
                    </TableCell>
                    {access.canWrite && (
                      <TableCell>
                        <form action={deleteFinanceTransactionAction}>
                          <input type="hidden" name="id" value={t.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Excluir movimentação"
                            title="Excluir"
                          >
                            <Trash2 />
                          </Button>
                        </form>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
