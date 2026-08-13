"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/format";
import type { PartItem } from "@/lib/supabase/types";

export interface QuoteDefaults {
  service_client_id?: string;
  device_id?: string;
  service_order_id?: string;
  client_name?: string;
  device_label?: string;
  service_description?: string;
  items?: PartItem[];
  labor_cost?: number;
  discount?: number;
}

export function QuoteForm({
  action,
  defaults = {},
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: QuoteDefaults;
}) {
  const [items, setItems] = useState<PartItem[]>(defaults.items ?? []);
  const [labor, setLabor] = useState(String(defaults.labor_cost ?? ""));
  const [discount, setDiscount] = useState(String(defaults.discount ?? ""));

  const total = useMemo(() => {
    const itemsSum = items.reduce((s, p) => s + p.qty * p.unit_price, 0);
    return Math.max(
      0,
      itemsSum + (parseFloat(labor) || 0) - (parseFloat(discount) || 0)
    );
  }, [items, labor, discount]);

  function updateItem(index: number, patch: Partial<PartItem>) {
    setItems((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  return (
    <form action={action} className="space-y-6">
      {defaults.service_client_id && (
        <input
          type="hidden"
          name="service_client_id"
          value={defaults.service_client_id}
        />
      )}
      {defaults.device_id && (
        <input type="hidden" name="device_id" value={defaults.device_id} />
      )}
      {defaults.service_order_id && (
        <input
          type="hidden"
          name="service_order_id"
          value={defaults.service_order_id}
        />
      )}
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cliente e aparelho</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="client_name">Nome do cliente *</Label>
            <Input
              id="client_name"
              name="client_name"
              required
              defaultValue={defaults.client_name ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="device_label">Aparelho</Label>
            <Input
              id="device_label"
              name="device_label"
              placeholder="Samsung Galaxy A54 preto"
              defaultValue={defaults.device_label ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="service_description">Serviço proposto</Label>
            <Textarea
              id="service_description"
              name="service_description"
              defaultValue={defaults.service_description ?? ""}
              placeholder="Descrição do serviço que será executado"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Peças e valores</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setItems((prev) => [...prev, { description: "", qty: 1, unit_price: 0 }])
            }
          >
            <Plus data-icon="inline-start" />
            Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>
          )}
          {items.map((item, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <div className="min-w-40 flex-1 space-y-1">
                {i === 0 && <Label>Descrição</Label>}
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(i, { description: e.target.value })}
                />
              </div>
              <div className="w-16 space-y-1">
                {i === 0 && <Label>Qtd</Label>}
                <Input
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={(e) =>
                    updateItem(i, { qty: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                />
              </div>
              <div className="w-28 space-y-1">
                {i === 0 && <Label>Valor un.</Label>}
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unit_price || ""}
                  onChange={(e) =>
                    updateItem(i, { unit_price: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remover item"
                onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
              >
                <Trash2 />
              </Button>
            </div>
          ))}

          <div className="grid gap-4 border-t pt-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="labor_cost">Mão de obra (R$)</Label>
              <Input
                id="labor_cost"
                name="labor_cost"
                type="number"
                min={0}
                step="0.01"
                value={labor}
                onChange={(e) => setLabor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Desconto (R$)</Label>
              <Input
                id="discount"
                name="discount"
                type="number"
                min={0}
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Total</Label>
              <p className="flex h-8 items-center text-lg font-semibold tabular-nums">
                {formatBRL(total)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Condições</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="deadline">Prazo de execução</Label>
            <Input id="deadline" name="deadline" placeholder="Ex.: 3 dias úteis" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valid_until">Orçamento válido até</Label>
            <Input id="valid_until" name="valid_until" type="date" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" />
          </div>
        </CardContent>
      </Card>

      <Button type="submit">Salvar orçamento</Button>
    </form>
  );
}
