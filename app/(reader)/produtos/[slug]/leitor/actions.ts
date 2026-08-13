"use server";

import { requireCustomer } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";

/** Salva (upsert) a página atual de leitura. Chamada de forma imperativa pelo PdfViewer. */
export async function saveReadingProgress(
  productId: string,
  page: number,
  numPages: number | null
) {
  const customer = await requireCustomer();
  if (!productId || !Number.isFinite(page) || page < 1) return;

  const supabase = createServiceClient();
  await supabase.from("reading_progress").upsert(
    {
      customer_id: customer.id,
      product_id: productId,
      last_page: Math.round(page),
      num_pages: numPages,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "customer_id,product_id" }
  );
}
