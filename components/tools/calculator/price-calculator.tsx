"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatBRL } from "@/lib/format";
import {
  calculatePricing,
  EMPTY_PRICING_INPUTS,
  type PricingInputs,
} from "@/lib/tools/pricing";
import { cn } from "@/lib/utils";

type NumericField = Exclude<keyof PricingInputs, "mode">;

const COST_FIELDS: { key: NumericField; label: string }[] = [
  { key: "partCost", label: "Custo da peça (R$)" },
  { key: "freight", label: "Frete (R$)" },
  { key: "materials", label: "Materiais (R$)" },
  { key: "otherCosts", label: "Outros custos (R$)" },
  { key: "laborCost", label: "Mão de obra (R$)" },
];

export function PriceCalculator({
  saveAction,
}: {
  saveAction: (formData: FormData) => Promise<void>;
}) {
  const [inputs, setInputs] = useState<PricingInputs>(EMPTY_PRICING_INPUTS);
  const [label, setLabel] = useState("");

  const results = useMemo(() => calculatePricing(inputs), [inputs]);

  function setField(key: NumericField, value: string) {
    setInputs((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  }

  const numberValue = (key: NumericField) =>
    inputs[key] === 0 ? "" : String(inputs[key]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custos e margem</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {COST_FIELDS.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input
                id={f.key}
                type="number"
                min={0}
                step="0.01"
                value={numberValue(f.key)}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder="0,00"
              />
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="feePercent">Taxas sobre a venda (%)</Label>
            <Input
              id="feePercent"
              type="number"
              min={0}
              max={99}
              step="0.1"
              value={numberValue("feePercent")}
              onChange={(e) => setField("feePercent", e.target.value)}
              placeholder="Cartão, plataforma…"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Como calcular o preço</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={inputs.mode === "margin" ? "default" : "outline"}
                onClick={() => setInputs((p) => ({ ...p, mode: "margin" }))}
              >
                Margem desejada
              </Button>
              <Button
                type="button"
                size="sm"
                variant={inputs.mode === "markup" ? "default" : "outline"}
                onClick={() => setInputs((p) => ({ ...p, mode: "markup" }))}
              >
                Markup
              </Button>
            </div>
          </div>

          {inputs.mode === "margin" ? (
            <div className="space-y-2">
              <Label htmlFor="marginPercent">Margem desejada (%)</Label>
              <Input
                id="marginPercent"
                type="number"
                min={0}
                max={95}
                step="1"
                value={numberValue("marginPercent")}
                onChange={(e) => setField("marginPercent", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                % do preço final que vira lucro.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="markupPercent">Markup (%)</Label>
              <Input
                id="markupPercent"
                type="number"
                min={0}
                step="1"
                value={numberValue("markupPercent")}
                onChange={(e) => setField("markupPercent", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                % somado em cima do custo. 100% = dobra o custo.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="discountPercent">Desconto concedido (%)</Label>
            <Input
              id="discountPercent"
              type="number"
              min={0}
              max={100}
              step="1"
              value={numberValue("discountPercent")}
              onChange={(e) => setField("discountPercent", e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInputs(EMPTY_PRICING_INPUTS)}
            >
              Limpar campos
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo total (peça + extras)</span>
              <span className="tabular-nums">{formatBRL(results.totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo + mão de obra</span>
              <span className="tabular-nums">{formatBRL(results.baseCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço mínimo (lucro zero)</span>
              <span className="tabular-nums">{formatBRL(results.minimumPrice)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base">
              <span>Preço sugerido</span>
              <span className="font-semibold tabular-nums">
                {formatBRL(results.suggestedPrice)}
              </span>
            </div>
            {inputs.discountPercent > 0 && (
              <div className="flex justify-between text-base">
                <span>Com desconto de {inputs.discountPercent}%</span>
                <span className="font-semibold tabular-nums">
                  {formatBRL(results.finalPrice)}
                </span>
              </div>
            )}
            {results.fees > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxas pagas</span>
                <span className="tabular-nums">−{formatBRL(results.fees)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base">
              <span>Lucro</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  results.profit > 0
                    ? "text-green-700 dark:text-green-400"
                    : "text-destructive"
                )}
              >
                {formatBRL(results.profit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Margem real</span>
              <span className="tabular-nums">
                {results.profitMarginPercent.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Markup efetivo</span>
              <span className="tabular-nums">
                {results.markupPercent.toFixed(1)}%
              </span>
            </div>
            {results.profit <= 0 && results.baseCost > 0 && (
              <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
                Atenção: com esses valores você não tem lucro. Cobre pelo menos{" "}
                {formatBRL(results.minimumPrice)} só para cobrir os custos.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Salvar no histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="inputs" value={JSON.stringify(inputs)} />
              <Input
                name="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex.: Troca de tela A54"
                className="max-w-xs"
              />
              <Button type="submit" disabled={results.baseCost <= 0}>
                Salvar cálculo
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
