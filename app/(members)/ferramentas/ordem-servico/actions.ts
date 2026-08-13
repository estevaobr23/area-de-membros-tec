"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { requireCustomer } from "@/lib/auth/session";
import { assertToolWrite } from "@/lib/auth/tool-access";
import { parseMoney } from "@/lib/format";
import { isOsStatus, formatOsNumber } from "@/lib/tools/os-status";
import type { PartItem } from "@/lib/supabase/types";

const TOOL = "ordem-servico" as const;

function text(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v.length > 0 ? v : null;
}

function parseParts(formData: FormData): PartItem[] {
  try {
    const raw = JSON.parse(String(formData.get("parts") ?? "[]"));
    if (!Array.isArray(raw)) return [];
    return raw
      .map((p) => ({
        description: String(p?.description ?? "").trim().slice(0, 200),
        qty: Math.max(1, Math.round(Number(p?.qty) || 1)),
        unit_price: Math.max(0, Number(p?.unit_price) || 0),
      }))
      .filter((p) => p.description.length > 0);
  } catch {
    return [];
  }
}

function partsTotal(parts: PartItem[]) {
  return parts.reduce((sum, p) => sum + p.qty * p.unit_price, 0);
}

// ── Clientes da assistência ──

export async function createServiceClientAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite(TOOL);

  const name = text(formData, "name");
  if (!name) redirect("/ferramentas/ordem-servico/clientes/novo?error=nome");

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("service_clients")
    .insert({
      customer_id: customer.id,
      name,
      phone: text(formData, "phone"),
      email: text(formData, "email"),
      notes: text(formData, "notes"),
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/ferramentas/ordem-servico/clientes/novo?error=salvar");
  }
  // volta para onde o fluxo começou (ex.: criação de OS)
  const returnTo = text(formData, "return_to");
  redirect(returnTo ?? `/ferramentas/ordem-servico/clientes/${data.id}`);
}

export async function updateServiceClientAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite(TOOL);

  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!id) redirect("/ferramentas/ordem-servico/clientes");
  if (!name) {
    redirect(`/ferramentas/ordem-servico/clientes/${id}/editar?error=nome`);
  }

  const supabase = createServiceClient();
  await supabase
    .from("service_clients")
    .update({
      name,
      phone: text(formData, "phone"),
      email: text(formData, "email"),
      notes: text(formData, "notes"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("customer_id", customer.id);

  redirect(`/ferramentas/ordem-servico/clientes/${id}`);
}

// ── Aparelhos ──

export async function createDeviceAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite(TOOL);

  const clientId = text(formData, "service_client_id");
  const brand = text(formData, "brand");
  const model = text(formData, "model");
  if (!clientId) redirect("/ferramentas/ordem-servico/clientes");
  if (!brand || !model) {
    redirect(`/ferramentas/ordem-servico/clientes/${clientId}?error=aparelho`);
  }

  const supabase = createServiceClient();
  // garante que o cliente da assistência pertence ao técnico logado
  const { data: owner } = await supabase
    .from("service_clients")
    .select("id")
    .eq("id", clientId)
    .eq("customer_id", customer.id)
    .maybeSingle();
  if (!owner) redirect("/ferramentas/ordem-servico/clientes");

  await supabase.from("devices").insert({
    customer_id: customer.id,
    service_client_id: clientId,
    brand,
    model,
    color: text(formData, "color"),
    imei: text(formData, "imei"),
    accessories: text(formData, "accessories"),
    condition: text(formData, "condition"),
    notes: text(formData, "device_notes"),
  });

  const returnTo = text(formData, "return_to");
  redirect(returnTo ?? `/ferramentas/ordem-servico/clientes/${clientId}`);
}

// ── Ordens de serviço ──

async function resolveDevice(
  formData: FormData,
  customerId: string,
  clientId: string
): Promise<string | null> {
  const supabase = createServiceClient();
  const deviceId = text(formData, "device_id");

  if (deviceId && deviceId !== "novo") {
    const { data } = await supabase
      .from("devices")
      .select("id")
      .eq("id", deviceId)
      .eq("customer_id", customerId)
      .eq("service_client_id", clientId)
      .maybeSingle();
    return data?.id ?? null;
  }

  // cadastro de aparelho novo inline no formulário da OS
  const brand = text(formData, "brand");
  const model = text(formData, "model");
  if (!brand || !model) return null;

  const { data } = await supabase
    .from("devices")
    .insert({
      customer_id: customerId,
      service_client_id: clientId,
      brand,
      model,
      color: text(formData, "color"),
      imei: text(formData, "imei"),
      accessories: text(formData, "accessories"),
      condition: text(formData, "condition"),
    })
    .select("id")
    .single();
  return data?.id ?? null;
}

export async function createServiceOrderAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite(TOOL);

  const clientId = text(formData, "service_client_id");
  const defect = text(formData, "reported_defect");
  if (!clientId || !defect) {
    redirect("/ferramentas/ordem-servico/novo?error=campos");
  }

  const supabase = createServiceClient();
  const { data: owner } = await supabase
    .from("service_clients")
    .select("id")
    .eq("id", clientId)
    .eq("customer_id", customer.id)
    .maybeSingle();
  if (!owner) redirect("/ferramentas/ordem-servico/novo?error=cliente");

  const deviceId = await resolveDevice(formData, customer.id, clientId);
  if (!deviceId) redirect("/ferramentas/ordem-servico/novo?error=aparelho");

  const parts = parseParts(formData);
  const labor = parseMoney(formData.get("labor_cost"));
  const discount = parseMoney(formData.get("discount"));
  const total = Math.max(0, partsTotal(parts) + labor - discount);

  // número sequencial por técnico (escala de uso individual — sem corrida real)
  const { data: last } = await supabase
    .from("service_orders")
    .select("os_number")
    .eq("customer_id", customer.id)
    .order("os_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const osNumber = (last?.os_number ?? 0) + 1;

  const { data: created, error } = await supabase
    .from("service_orders")
    .insert({
      customer_id: customer.id,
      os_number: osNumber,
      service_client_id: clientId,
      device_id: deviceId,
      reported_defect: defect,
      diagnosis: text(formData, "diagnosis"),
      service_performed: text(formData, "service_performed"),
      parts,
      labor_cost: labor,
      discount,
      total,
      due_date: text(formData, "due_date"),
      notes: text(formData, "notes"),
    })
    .select("id")
    .single();

  if (error || !created) redirect("/ferramentas/ordem-servico/novo?error=salvar");
  redirect(`/ferramentas/ordem-servico/${created.id}`);
}

export async function updateServiceOrderAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite(TOOL);

  const id = text(formData, "id");
  const defect = text(formData, "reported_defect");
  if (!id) redirect("/ferramentas/ordem-servico");
  if (!defect) redirect(`/ferramentas/ordem-servico/${id}/editar?error=campos`);

  const parts = parseParts(formData);
  const labor = parseMoney(formData.get("labor_cost"));
  const discount = parseMoney(formData.get("discount"));
  const total = Math.max(0, partsTotal(parts) + labor - discount);

  const supabase = createServiceClient();
  await supabase
    .from("service_orders")
    .update({
      reported_defect: defect,
      diagnosis: text(formData, "diagnosis"),
      service_performed: text(formData, "service_performed"),
      parts,
      labor_cost: labor,
      discount,
      total,
      due_date: text(formData, "due_date"),
      notes: text(formData, "notes"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("customer_id", customer.id);

  redirect(`/ferramentas/ordem-servico/${id}`);
}

export async function updateOsStatusAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite(TOOL);

  const id = text(formData, "id");
  const status = String(formData.get("status") ?? "");
  if (!id || !isOsStatus(status)) redirect("/ferramentas/ordem-servico");

  const supabase = createServiceClient();
  await supabase
    .from("service_orders")
    .update({
      status,
      delivered_at: status === "entregue" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("customer_id", customer.id);

  redirect(`/ferramentas/ordem-servico/${id}`);
}

/**
 * Lança a receita da OS no Financeiro. O índice único no banco garante que
 * uma OS nunca gera a mesma receita duas vezes — repetir a ação não duplica.
 */
export async function launchOsRevenueAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite("financeiro");

  const id = text(formData, "id");
  if (!id) redirect("/ferramentas/ordem-servico");

  const supabase = createServiceClient();
  const { data: os } = await supabase
    .from("service_orders")
    .select("id, os_number, total, status")
    .eq("id", id)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (!os) redirect("/ferramentas/ordem-servico");

  const { error } = await supabase.from("finance_transactions").insert({
    customer_id: customer.id,
    type: "receita",
    category: "servicos",
    description: `Serviço ${formatOsNumber(os.os_number)}`,
    amount: os.total,
    source: "os",
    service_order_id: os.id,
  });

  // 23505 = unique_violation → receita já lançada antes; não duplica
  if (error && error.code !== "23505") {
    redirect(`/ferramentas/ordem-servico/${id}?receita=erro`);
  }
  redirect(
    `/ferramentas/ordem-servico/${id}?receita=${error ? "duplicada" : "ok"}`
  );
}
