import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OrderBump } from "@/lib/config/order-bumps";

export function OrderBumpCard({ item }: { item: OrderBump }) {
  return (
    <Card className="flex flex-col overflow-hidden gap-3 pt-0 sm:gap-4">
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <Image
          src={item.coverImage}
          alt={item.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
      </div>
      <CardHeader className="px-3 sm:px-6">
        <CardTitle className="text-sm leading-snug sm:text-base">
          {item.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-3 sm:px-6">
        <p className="line-clamp-3 text-xs text-muted-foreground sm:text-sm">
          {item.description}
        </p>
      </CardContent>
      <CardFooter className="items-center justify-between px-3 sm:px-6">
        <Badge variant="secondary">{item.priceLabel}</Badge>
        <span className="text-xs text-muted-foreground">
          Disponível no checkout
        </span>
      </CardFooter>
    </Card>
  );
}
