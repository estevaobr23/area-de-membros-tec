import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/supabase/types";

/** Produtos que o cliente tem acesso liberado (entitlement ativo). */
export async function getCustomerProducts(
  customerId: string
): Promise<Product[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("entitlements")
    .select("products!inner(*)")
    .eq("customer_id", customerId)
    .eq("status", "active");

  if (error || !data) return [];

  return data
    .map((row) => row.products as unknown as Product | null)
    .filter((product): product is Product => product !== null);
}
