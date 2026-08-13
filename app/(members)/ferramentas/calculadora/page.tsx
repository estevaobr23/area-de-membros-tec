import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolAccessBadge } from "@/components/tools/tool-paywall";
import { PriceCalculator } from "@/components/tools/calculator/price-calculator";
import { requireCustomer } from "@/lib/auth/session";
import { getToolAccess } from "@/lib/auth/tool-access";
import { createServiceClient } from "@/lib/supabase/server";
import { formatBRL, formatDateTime } from "@/lib/format";
import type { PricingResults } from "@/lib/tools/pricing";
import {
  savePricingCalculationAction,
  deletePricingCalculationAction,
  duplicatePricingCalculationAction,
} from "./actions";

export default async function CalculadoraPage({
  searchParams,
}: PageProps<"/ferramentas/calculadora">) {
  const customer = await requireCustomer();
  const access = await getToolAccess("calculadora");
  const { salvo } = await searchParams;

  const supabase = createServiceClient();
  const { data: history } = await supabase
    .from("pricing_calculations")
    .select("id, label, results, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Calculadora de Preço e Lucro
          </h1>
          <ToolAccessBadge access={access} />
        </div>
        <p className="text-muted-foreground">
          Descubra quanto cobrar para ter o lucro que você quer.
        </p>
      </div>

      {salvo === "1" && (
        <p className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          Cálculo salvo no histórico.
        </p>
      )}

      <PriceCalculator saveAction={savePricingCalculationAction} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Histórico ({history?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum cálculo salvo ainda. Salve um cálculo para consultar depois.
            </p>
          ) : (
            <ul className="divide-y">
              {history.map((calc) => {
                const r = calc.results as PricingResults;
                return (
                  <li
                    key={calc.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm"
                  >
                    <div className="min-w-40 flex-1">
                      <p className="font-medium">{calc.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(calc.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums">
                        Preço: <strong>{formatBRL(r.finalPrice)}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        Lucro {formatBRL(r.profit)} ·{" "}
                        {r.profitMarginPercent.toFixed(1)}%
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <form action={duplicatePricingCalculationAction}>
                        <input type="hidden" name="id" value={calc.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Duplicar cálculo"
                          title="Duplicar"
                        >
                          <Copy />
                        </Button>
                      </form>
                      <form action={deletePricingCalculationAction}>
                        <input type="hidden" name="id" value={calc.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Excluir cálculo"
                          title="Excluir"
                        >
                          <Trash2 />
                        </Button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
