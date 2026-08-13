"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { requireCustomer } from "@/lib/auth/session";
import { assertToolWrite } from "@/lib/auth/tool-access";
import { parseMoney } from "@/lib/format";
import type { PartItem } from "@/lib/supabase/types";

const TOOL = "orcamento-garantia" as const;

function text(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v.length > 0 ? v : null;
}

function parseItems(formData: FormData): PartItem[] {
  try {
    const raw = JSON.parse(String(formData.get("items") ?? "[]"));
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

// ── Perfil da assistência ──

export async function saveBusinessProfileAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite(TOOL);

  const supabase = createServiceClient();
  await supabase
    .from("business_profiles")
    .upsert(
      {
        customer_id: customer.id,
        business_name: text(formData, "business_name") ?? "",
        owner_name: text(formData, "owner_name"),
        phone: text(formData, "phone"),
        email: text(formData, "email"),
        address: text(formData, "address"),
        warranty_terms: text(formData, "warranty_terms"),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "customer_id" }
    );

  redirect("/ferramentas/orcamento-garantia?aba=perfil&salvo=1");
}

// ── Orçamentos ──

export async function createQuoteAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite(TOOL);

  const clientName = text(formData, "client_name");
  if (!clientName) redirect("/ferramentas/orcamento-garantia/novo?error=cliente");

  const items = parseItems(formData);
  const labor = parseMoney(formData.get("labor_cost"));
  const discount = parseMoney(formData.get("discount"));
  const itemsSum = items.reduce((s, p) => s + p.qty * p.unit_price, 0);
  const total = Math.max(0, itemsSum + labor - discount);

  const supabase = createServiceClient();

  // vínculos opcionais (validados contra o dono antes de gravar)
  async function ownedId(table: string, id: string | null) {
    if (!id) return null;
    const { data } = await supabase
      .from(table)
      .select("id")
      .eq("id", id)
      .eq("customer_id", customer.id)
      .maybeSingle();
    return data?.id ?? null;
  }
  const serviceClientId = await ownedId(
    "service_clients",
    text(formData, "service_client_id")
  );
  const deviceId = await ownedId("devices", text(formData, "device_id"));
  const serviceOrderId = await ownedId(
    "service_orders",
    text(formData, "service_order_id")
  );

  const { data: last } = await supabase
    .from("quotes")
    .select("quote_number")
    .eq("customer_id", customer.id)
    .order("quote_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: created, error } = await supabase
    .from("quotes")
    .insert({
      customer_id: customer.id,
      quote_number: (last?.quote_number ?? 0) + 1,
      service_client_id: serviceClientId,
      device_id: deviceId,
      service_order_id: serviceOrderId,
      client_name: clientName,
      device_label: text(formData, "device_label") ?? "",
      service_description: text(formData, "service_description") ?? "",
      items,
      labor_cost: labor,
      discount,
      total,
      deadline: text(formData, "deadline"),
      valid_until: text(formData, "valid_until"),
      notes: text(formData, "notes"),
    })
    .select("id")
    .single();

  if (error || !created) {
    redirect("/ferramentas/orcamento-garantia/novo?error=salvar");
  }
  redirect(`/ferramentas/orcamento-garantia/${created.id}`);
}

export async function updateQuoteStatusAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite(TOOL);

  const id = text(formData, "id");
  const status = String(formData.get("status") ?? "");
  if (!id || !["rascunho", "enviado", "aprovado", "recusado"].includes(status)) {
    redirect("/ferramentas/orcamento-garantia");
  }

  const supabase = createServiceClient();
  await supabase
    .from("quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("customer_id", customer.id);

  redirect(`/ferramentas/orcamento-garantia/${id}`);
}

export async function duplicateQuoteAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite(TOOL);

  const id = text(formData, "id");
  if (!id) redirect("/ferramentas/orcamento-garantia");

  const supabase = createServiceClient();
  const { data: original } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (!original) redirect("/ferramentas/orcamento-garantia");

  const { data: last } = await supabase
    .from("quotes")
    .select("quote_number")
    .eq("customer_id", customer.id)
    .order("quote_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: created } = await supabase
    .from("quotes")
    .insert({
      customer_id: customer.id,
      quote_number: (last?.quote_number ?? 0) + 1,
      service_client_id: original.service_client_id,
      device_id: original.device_id,
      service_order_id: null,
      client_name: original.client_name,
      device_label: original.device_label,
      service_description: original.service_description,
      items: original.items,
      labor_cost: original.labor_cost,
      discount: original.discount,
      total: original.total,
      deadline: original.deadline,
      valid_until: original.valid_until,
      notes: original.notes,
      status: "rascunho",
    })
    .select("id")
    .single();

  redirect(
    created
      ? `/ferramentas/orcamento-garantia/${created.id}`
      : "/ferramentas/orcamento-garantia"
  );
}

// ── Termos de garantia ──

export async function createWarrantyAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite(TOOL);

  const osId = text(formData, "service_order_id");
  if (!osId) redirect("/ferramentas/orcamento-garantia?aba=garantias");

  const periodDays = Math.max(
    1,
    Math.round(Number(formData.get("period_days")) || 90)
  );

  const supabase = createServiceClient();
  const { data: os } = await supabase
    .from("service_orders")
    .select("id")
    .eq("id", osId)
    .eq("customer_id", customer.id)
    .maybeSingle();
  if (!os) redirect("/ferramentas/orcamento-garantia?aba=garantias");

  const { data: last } = await supabase
    .from("warranties")
    .select("warranty_number")
    .eq("customer_id", customer.id)
    .order("warranty_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: created } = await supabase
    .from("warranties")
    .insert({
      customer_id: customer.id,
      warranty_number: (last?.warranty_number ?? 0) + 1,
      service_order_id: osId,
      period_days: periodDays,
      conditions: text(formData, "conditions"),
      notes: text(formData, "notes"),
    })
    .select("id")
    .single();

  redirect(
    created
      ? `/ferramentas/orcamento-garantia/garantia/${created.id}`
      : "/ferramentas/orcamento-garantia?aba=garantias"
  );
}
