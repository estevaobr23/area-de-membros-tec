import { Package } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";
import { OrderBumpCard } from "@/components/products/order-bump-card";
import { getCurrentCustomer } from "@/lib/auth/session";
import { getCustomerProducts } from "@/lib/data/products";
import { ORDER_BUMPS } from "@/lib/config/order-bumps";

export default async function ProdutosPage() {
  const customer = await getCurrentCustomer();
  const products = customer ? await getCustomerProducts(customer.id) : [];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Meus Produtos
        </h1>
        <p className="text-muted-foreground">
          Os infoprodutos que você adquiriu ficam disponíveis aqui.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <Package className="size-8 text-muted-foreground" />
          <p className="font-medium">Nenhum produto liberado ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Complementos disponíveis</h2>
          <p className="text-sm text-muted-foreground">
            Materiais extras que você pode adicionar à sua assinatura.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {ORDER_BUMPS.map((item) => (
            <OrderBumpCard key={item.slug} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
