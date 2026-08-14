import Image from "next/image";
import { Check, ExternalLink } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OrderBump } from "@/lib/config/order-bumps";

export function OrderBumpCard({
  item,
  owned,
}: {
  item: OrderBump;
  owned: boolean;
}) {
  return (
    <Card className="group flex flex-col overflow-hidden gap-3 pt-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:gap-4">
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <Image
          src={item.coverImage}
          alt={item.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
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
      <CardFooter className="flex-col items-stretch gap-2 px-3 sm:px-6">
        {owned ? (
          <Badge
            variant="secondary"
            className="w-fit bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          >
            <Check /> Adquirido
          </Badge>
        ) : (
          <>
            <Badge variant="secondary" className="w-fit">
              {item.priceLabel}
            </Badge>
            <Button
              size="sm"
              className="w-full"
              render={
                <a
                  href={item.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              nativeButton={false}
            >
              Quero garantir <ExternalLink />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
