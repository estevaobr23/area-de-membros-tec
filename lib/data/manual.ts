import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { getProductContent } from "@/lib/config/product-content";
import type { Product } from "@/lib/supabase/types";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 2; // 2h — dá pra ler numa sessão sem expirar

export interface ManualAccess {
  product: Product;
  signedUrl: string;
  downloadUrl: string | null;
  lastPage: number;
}

/**
 * Resolve o acesso ao manual em PDF de um produto: confere se o cliente tem
 * entitlement ativo, gera uma URL assinada de curta duração para o bucket
 * privado e traz a página onde ele parou. Retorna null se não tiver acesso
 * ou se o produto não tiver manual configurado.
 */
export async function getManualAccess(
  customerId: string,
  slug: string
): Promise<ManualAccess | null> {
  const content = getProductContent(slug);
  if (!content.manualBlobPath && !content.manualStoragePath && !content.manualLocalPath) {
    return null;
  }

  const supabase = createServiceClient();

  const { data: entitlement } = await supabase
    .from("entitlements")
    .select("product_id, status, products!inner(id, slug, name, wiapy_product_id, created_at)")
    .eq("customer_id", customerId)
    .eq("status", "active")
    .eq("products.slug", slug)
    .maybeSingle();

  if (!entitlement) return null;
  const product = entitlement.products as unknown as Product;

  let fileUrl: string;
  let downloadUrl: string | null = null;
  if (content.manualBlobPath || content.manualLocalPath) {
    // arquivo privado (Vercel Blob ou ponte local) — sempre servido pela
    // nossa própria rota, que autentica e faz o streaming. Ver route.ts.
    fileUrl = `/api/manual/${slug}`;
    if (content.allowDownload) downloadUrl = `/api/manual/${slug}?download=1`;
  } else if (content.manualStoragePath) {
    const { data: signed, error } = await supabase.storage
      .from("manuals")
      .createSignedUrl(content.manualStoragePath, SIGNED_URL_TTL_SECONDS);
    if (error || !signed) return null;
    fileUrl = signed.signedUrl;

    if (content.allowDownload) {
      const { data: signedDownload } = await supabase.storage
        .from("manuals")
        .createSignedUrl(content.manualStoragePath, SIGNED_URL_TTL_SECONDS, {
          download: true,
        });
      downloadUrl = signedDownload?.signedUrl ?? null;
    }
  } else {
    return null;
  }

  const { data: progress } = await supabase
    .from("reading_progress")
    .select("last_page")
    .eq("customer_id", customerId)
    .eq("product_id", product.id)
    .maybeSingle();

  return {
    product,
    signedUrl: fileUrl,
    downloadUrl,
    lastPage: progress?.last_page ?? 1,
  };
}
