import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/supabase/types";

export interface LatestReading {
  slug: string;
  name: string;
  lastPage: number;
  numPages: number | null;
}

/** Leitura mais recente do cliente (para o "Continuar lendo" do dashboard). */
export async function getLatestReading(
  customerId: string
): Promise<LatestReading | null> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("reading_progress")
    .select("last_page, num_pages, products!inner(slug, name)")
    .eq("customer_id", customerId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const product = data.products as unknown as {
    slug: string;
    name: string;
  } | null;
  if (!product) return null;

  return {
    slug: product.slug,
    name: product.name,
    lastPage: data.last_page,
    numPages: data.num_pages,
  };
}

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
