"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { requireCustomer } from "@/lib/auth/session";
import { assertToolWrite } from "@/lib/auth/tool-access";
import { parseMoney } from "@/lib/format";

export async function createFinanceTransactionAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite("financeiro");

  const type = String(formData.get("type") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amount = parseMoney(formData.get("amount"));
  const entryDate = String(formData.get("entry_date") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "outros";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (
    (type !== "receita" && type !== "despesa") ||
    !description ||
    amount <= 0
  ) {
    redirect("/ferramentas/financeiro/novo?error=campos");
  }

  const supabase = createServiceClient();
  await supabase.from("finance_transactions").insert({
    customer_id: customer.id,
    type,
    category,
    description,
    amount,
    entry_date: /^\d{4}-\d{2}-\d{2}$/.test(entryDate) ? entryDate : undefined,
    notes,
    source: "manual",
  });

  redirect("/ferramentas/financeiro");
}

export async function deleteFinanceTransactionAction(formData: FormData) {
  const customer = await requireCustomer();
  await assertToolWrite("financeiro");

  const id = String(formData.get("id") ?? "");
  if (id) {
    const supabase = createServiceClient();
    await supabase
      .from("finance_transactions")
      .delete()
      .eq("id", id)
      .eq("customer_id", customer.id);
  }
  redirect("/ferramentas/financeiro");
}
