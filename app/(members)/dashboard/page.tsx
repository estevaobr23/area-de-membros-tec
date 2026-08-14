import Link from "next/link";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { OrderBumpCard } from "@/components/products/order-bump-card";
import { getCurrentCustomer } from "@/lib/auth/session";
import { getCustomerProducts, getLatestReading } from "@/lib/data/products";
import { ORDER_BUMPS, isOrderBumpOwned } from "@/lib/config/order-bumps";
import { getProductContent } from "@/lib/config/product-content";
import { HeroBanner } from "@/components/dashboard/hero-banner";

export default async function DashboardPage() {
  const customer = await getCurrentCustomer();
  const [products, latestReading] = customer
    ? await Promise.all([
        getCustomerProducts(customer.id),
        getLatestReading(customer.id),
      ])
    : [[], null];
  const ownedSlugs = new Set(products.map((product) => product.slug));

  // Só oferece "continuar lendo" se o cliente ainda tem acesso ao produto.
  const reading =
    latestReading && ownedSlugs.has(latestReading.slug) ? latestReading : null;
  const firstReadable = products.find((p) => {
    const c = getProductContent(p.slug);
    return Boolean(c.manualBlobPath || c.manualStoragePath || c.manualLocalPath);
  });

  return (
    <div className="space-y-8 p-4 md:p-8">
      <HeroBanner
        name={customer?.name ?? null}
        reading={reading}
        startSlug={firstReadable?.slug ?? null}
      />

      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards duration-500 [animation-delay:100ms]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Seus produtos</h2>
          {products.length > 0 && (
            <Button
              variant="link"
              render={<Link href="/produtos" />}
              nativeButton={false}
              className="px-0"
            >
              Ver todos
            </Button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
            <Package className="size-8 text-muted-foreground" />
            <p className="font-medium">Nenhum produto liberado ainda</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Assim que sua compra for confirmada, seu produto aparece aqui
              automaticamente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards duration-500 [animation-delay:200ms]">
        <div>
          <h2 className="text-lg font-medium">Complementos disponíveis</h2>
          <p className="text-sm text-muted-foreground">
            Materiais extras que você pode adicionar à sua assinatura.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {ORDER_BUMPS.map((item) => (
            <OrderBumpCard
              key={item.slug}
              item={item}
              owned={isOrderBumpOwned(item, ownedSlugs)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
