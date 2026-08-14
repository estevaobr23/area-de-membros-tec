import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/supabase/types";
import { getProductContent } from "@/lib/config/product-content";

export function ProductCard({ product }: { product: Product }) {
  const content = getProductContent(product.slug);
  const hasManual = Boolean(
    content.manualBlobPath || content.manualStoragePath || content.manualLocalPath
  );

  return (
    <Card className="group flex flex-col overflow-hidden gap-3 pt-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:gap-4">
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {content.coverImage ? (
          <Image
            src={content.coverImage}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <BookOpen className="size-10 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardHeader className="px-3 sm:px-6">
        <CardTitle className="text-sm leading-snug sm:text-base">
          {product.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-3 sm:px-6">
        <p className="line-clamp-3 text-xs text-muted-foreground sm:text-sm">
          {content.description}
        </p>
      </CardContent>
      <CardFooter className="px-3 sm:px-6">
        {hasManual ? (
          <Button
            render={<Link href={`/produtos/${product.slug}/leitor`} />}
            nativeButton={false}
            className="w-full"
            size="sm"
          >
            Acessar
          </Button>
        ) : (
          <Button
            className="w-full"
            size="sm"
            disabled
            title="Leitor em breve para este produto"
          >
            Em breve
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
