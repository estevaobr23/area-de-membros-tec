"use client";

import { useMemo, useState } from "react";
import { Bookmark, PackageOpen, Trash2 } from "lucide-react";
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

export interface SavedPart {
  id: string;
  name: string;
  cost: number;
}

export function PriceCalculator({
  savedParts,
  saveAction,
  savePartAction,
  deletePartAction,
}: {
  savedParts: SavedPart[];
  saveAction: (formData: FormData) => Promise<void>;
  savePartAction: (formData: FormData) => Promise<void>;
  deletePartAction: (formData: FormData) => Promise<void>;
}) {
  const [inputs, setInputs] = useState<PricingInputs>(EMPTY_PRICING_INPUTS);
  const [label, setLabel] = useState("");
  const [partName, setPartName] = useState("");

  const results = useMemo(() => calculatePricing(inputs), [inputs]);
  const marginBarWidth = Math.min(Math.max(results.profitMarginPercent, 0), 100);
  const hasNumbers = results.baseCost > 0;

  function setField(key: NumericField, value: string) {
    setInputs((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  }

  function usePart(part: SavedPart) {
    setInputs((prev) => ({ ...prev, partCost: part.cost }));
    if (!label) setLabel(part.name);
  }

  const numberValue = (key: NumericField) =>
    inputs[key] === 0 ? "" : String(inputs[key]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
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

        {/* Banco de peças: custos salvos para reuso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PackageOpen className="size-4 text-violet-600 dark:text-violet-400" />
              Banco de peças
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              action={savePartAction}
              className="flex flex-wrap items-end gap-2"
            >
              <input type="hidden" name="cost" value={inputs.partCost} />
              <div className="min-w-40 flex-1 space-y-1">
                <Label htmlFor="part-name">Nome da peça</Label>
                <Input
                  id="part-name"
                  name="name"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  placeholder="Ex.: Tela Galaxy A54 original"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={!partName.trim() || inputs.partCost <= 0}
                title={
                  inputs.partCost <= 0
                    ? "Preencha o custo da peça acima para salvar"
                    : undefined
                }
              >
                <Bookmark data-icon="inline-start" />
                Salvar por {formatBRL(inputs.partCost)}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              Salve o custo das peças que você mais usa e reaproveite com um
              clique. Salvar com o mesmo nome atualiza o preço.
            </p>

            {savedParts.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                Nenhuma peça salva ainda.
              </p>
            ) : (
              <ul className="divide-y">
                {savedParts.map((part) => (
                  <li
                    key={part.id}
                    className="flex items-center gap-2 py-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{part.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatBRL(part.cost)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => usePart(part)}
                    >
                      Usar
                    </Button>
                    <form action={deletePartAction}>
                      <input type="hidden" name="id" value={part.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Excluir peça ${part.name}`}
                        title="Excluir"
                      >
                        <Trash2 />
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Destaque do preço sugerido */}
        <div className="overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 p-5 text-white shadow-lg">
          <p className="text-sm/none text-violet-100">
            {inputs.discountPercent > 0
              ? `Preço com ${inputs.discountPercent}% de desconto`
              : "Preço sugerido"}
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight">
            {hasNumbers ? formatBRL(results.finalPrice) : "R$ 0,00"}
          </p>
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-violet-100">
              <span>Margem real</span>
              <span className="tabular-nums">
                {hasNumbers ? `${results.profitMarginPercent.toFixed(1)}%` : "—"}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${hasNumbers ? marginBarWidth : 0}%` }}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span
              className={cn(
                "rounded-full px-3 py-1 font-medium tabular-nums",
                results.profit > 0 || !hasNumbers
                  ? "bg-white/15"
                  : "bg-red-500/80"
              )}
            >
              Lucro: {hasNumbers ? formatBRL(results.profit) : "—"}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 tabular-nums">
              Custo: {hasNumbers ? formatBRL(results.baseCost) : "—"}
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhes do cálculo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Custo total (peça + extras)
              </span>
              <span className="tabular-nums">{formatBRL(results.totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo + mão de obra</span>
              <span className="tabular-nums">{formatBRL(results.baseCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Preço mínimo (lucro zero)
              </span>
              <span className="tabular-nums">
                {formatBRL(results.minimumPrice)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Preço cheio (sem desconto)
              </span>
              <span className="tabular-nums">
                {formatBRL(results.suggestedPrice)}
              </span>
            </div>
            {results.fees > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxas pagas</span>
                <span className="tabular-nums">−{formatBRL(results.fees)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Markup efetivo</span>
              <span className="tabular-nums">
                {results.markupPercent.toFixed(1)}%
              </span>
            </div>
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
            {results.profit <= 0 && hasNumbers && (
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
              <Button type="submit" disabled={!hasNumbers}>
                Salvar cálculo
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
