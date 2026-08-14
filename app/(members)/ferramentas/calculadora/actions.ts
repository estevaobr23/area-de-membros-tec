"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { requireCustomer } from "@/lib/auth/session";
import { assertToolWrite } from "@/lib/auth/tool-access";
import {
  calculatePricing,
  type PricingInputs,
} from "@/lib/tools/pricing";

function num(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Reconstrói e recalcula no servidor — nunca confia nos resultados do client. */
function sanitizeInputs(raw: unknown): PricingInputs {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    partCost: num(r.partCost),
    freight: num(r.freight),
    materials: num(r.materials),
    otherCosts: num(r.otherCosts),
    laborCost: num(r.laborCost),
    feePercent: num(r.feePercent),
    discountPercent: num(r.discountPercent),
    marginPercent: num(r.marginPercent),
    markupPercent: num(r.markupPercent),
    mode: r.mode === "markup" ? "markup" : "margin",
  };
}

export async function savePricingCalculationAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite("calculadora");

  let inputs: PricingInputs;
  try {
    inputs = sanitizeInputs(JSON.parse(String(formData.get("inputs") ?? "{}")));
  } catch {
    redirect("/ferramentas/calculadora?erro=dados");
  }

  const label =
    String(formData.get("label") ?? "").trim().slice(0, 120) || "Cálculo";
  const results = calculatePricing(inputs);

  const supabase = createServiceClient();
  await supabase.from("pricing_calculations").insert({
    customer_id: customer.id,
    label,
    inputs,
    results,
  });

  redirect("/ferramentas/calculadora?salvo=1");
}

export async function deletePricingCalculationAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite("calculadora");

  const id = String(formData.get("id") ?? "");
  if (id) {
    const supabase = createServiceClient();
    await supabase
      .from("pricing_calculations")
      .delete()
      .eq("id", id)
      .eq("customer_id", customer.id);
  }
  redirect("/ferramentas/calculadora");
}

export async function savePartAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite("calculadora");

  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const cost = num(formData.get("cost"));
  if (!name) redirect("/ferramentas/calculadora?erro=peca");

  const supabase = createServiceClient();
  // Mesmo nome = atualiza o custo (upsert pela unique customer_id+name).
  await supabase.from("saved_parts").upsert(
    {
      customer_id: customer.id,
      name,
      cost,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "customer_id,name" }
  );

  redirect("/ferramentas/calculadora?peca=1");
}

export async function deletePartAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite("calculadora");

  const id = String(formData.get("id") ?? "");
  if (id) {
    const supabase = createServiceClient();
    await supabase
      .from("saved_parts")
      .delete()
      .eq("id", id)
      .eq("customer_id", customer.id);
  }
  redirect("/ferramentas/calculadora");
}

export async function duplicatePricingCalculationAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite("calculadora");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/ferramentas/calculadora");

  const supabase = createServiceClient();
  const { data: original } = await supabase
    .from("pricing_calculations")
    .select("label, inputs")
    .eq("id", id)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (original) {
    const inputs = sanitizeInputs(original.inputs);
    await supabase.from("pricing_calculations").insert({
      customer_id: customer.id,
      label: `${original.label} (cópia)`.slice(0, 120),
      inputs,
      results: calculatePricing(inputs),
    });
  }
  redirect("/ferramentas/calculadora");
}
