"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/format";
import type { PartItem, ServiceOrder } from "@/lib/supabase/types";

export interface ClientOption {
  id: string;
  name: string;
  devices: { id: string; label: string }[];
}

interface OsFormProps {
  clients: ClientOption[];
  action: (formData: FormData) => Promise<void>;
  defaults?: ServiceOrder;
  submitLabel: string;
}

export function OsForm({ clients, action, defaults, submitLabel }: OsFormProps) {
  const isEdit = Boolean(defaults);
  const [clientId, setClientId] = useState(defaults?.service_client_id ?? "");
  const [deviceId, setDeviceId] = useState(defaults?.device_id ?? "");
  const [parts, setParts] = useState<PartItem[]>(defaults?.parts ?? []);
  const [labor, setLabor] = useState(String(defaults?.labor_cost ?? ""));
  const [discount, setDiscount] = useState(String(defaults?.discount ?? ""));

  const selectedClient = clients.find((c) => c.id === clientId);
  const showNewDevice = !isEdit && clientId !== "" && deviceId === "novo";

  const total = useMemo(() => {
    const partsSum = parts.reduce((s, p) => s + p.qty * p.unit_price, 0);
    return Math.max(
      0,
      partsSum + (parseFloat(labor) || 0) - (parseFloat(discount) || 0)
    );
  }, [parts, labor, discount]);

  function updatePart(index: number, patch: Partial<PartItem>) {
    setParts((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  return (
    <form action={action} className="space-y-6">
      {defaults && <input type="hidden" name="id" value={defaults.id} />}
      <input type="hidden" name="parts" value={JSON.stringify(parts)} />

      {!isEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cliente e aparelho</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service_client_id">Cliente *</Label>
              <NativeSelect
                id="service_client_id"
                name="service_client_id"
                required
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setDeviceId("");
                }}
              >
                <option value="">Selecione o cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
              <p className="text-xs text-muted-foreground">
                Cliente não está na lista?{" "}
                <a
                  className="underline"
                  href={`/ferramentas/ordem-servico/clientes/novo?return_to=${encodeURIComponent("/ferramentas/ordem-servico/novo")}`}
                >
                  Cadastrar cliente
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="device_id">Aparelho *</Label>
              <NativeSelect
                id="device_id"
                name="device_id"
                required
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                disabled={!clientId}
              >
                <option value="">
                  {clientId ? "Selecione o aparelho" : "Escolha o cliente antes"}
                </option>
                {selectedClient?.devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
                <option value="novo">+ Cadastrar aparelho novo</option>
              </NativeSelect>
            </div>

            {showNewDevice && (
              <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca *</Label>
                  <Input id="brand" name="brand" required placeholder="Samsung" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo *</Label>
                  <Input id="model" name="model" required placeholder="Galaxy A54" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <Input id="color" name="color" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imei">IMEI / Serial</Label>
                  <Input id="imei" name="imei" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessories">Acessórios entregues</Label>
                  <Input
                    id="accessories"
                    name="accessories"
                    placeholder="Capinha, chip, cartão de memória…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Estado do aparelho</Label>
                  <Input
                    id="condition"
                    name="condition"
                    placeholder="Tela trincada, riscos na tampa…"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Defeito e serviço</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="reported_defect">Defeito relatado *</Label>
            <Textarea
              id="reported_defect"
              name="reported_defect"
              required
              defaultValue={defaults?.reported_defect ?? ""}
              placeholder="O que o cliente relatou"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnóstico</Label>
            <Textarea
              id="diagnosis"
              name="diagnosis"
              defaultValue={defaults?.diagnosis ?? ""}
              placeholder="O que você identificou"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service_performed">Serviço a executar / executado</Label>
            <Textarea
              id="service_performed"
              name="service_performed"
              defaultValue={defaults?.service_performed ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="due_date">Previsão de entrega</Label>
              <Input
                id="due_date"
                name="due_date"
                type="date"
                defaultValue={defaults?.due_date ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Input id="notes" name="notes" defaultValue={defaults?.notes ?? ""} />
            </div>
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
              setParts((prev) => [...prev, { description: "", qty: 1, unit_price: 0 }])
            }
          >
            <Plus data-icon="inline-start" />
            Peça
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {parts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma peça adicionada.
            </p>
          )}
          {parts.map((part, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <div className="min-w-40 flex-1 space-y-1">
                {i === 0 && <Label>Descrição</Label>}
                <Input
                  value={part.description}
                  onChange={(e) => updatePart(i, { description: e.target.value })}
                  placeholder="Tela frontal original"
                />
              </div>
              <div className="w-16 space-y-1">
                {i === 0 && <Label>Qtd</Label>}
                <Input
                  type="number"
                  min={1}
                  value={part.qty}
                  onChange={(e) =>
                    updatePart(i, { qty: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                />
              </div>
              <div className="w-28 space-y-1">
                {i === 0 && <Label>Valor un.</Label>}
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={part.unit_price || ""}
                  onChange={(e) =>
                    updatePart(i, { unit_price: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remover peça"
                onClick={() => setParts((prev) => prev.filter((_, j) => j !== i))}
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
              <Label>Valor final</Label>
              <p className="flex h-8 items-center text-lg font-semibold tabular-nums">
                {formatBRL(total)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
