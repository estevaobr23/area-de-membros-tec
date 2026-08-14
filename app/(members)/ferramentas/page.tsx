import Link from "next/link";
import { ArrowRight, Check, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToolAccessBadge } from "@/components/tools/tool-paywall";
import { getCurrentCustomer } from "@/lib/auth/session";
import { getToolAccess } from "@/lib/auth/tool-access";
import { getCustomerProducts } from "@/lib/data/products";
import { getProductContent } from "@/lib/config/product-content";
import { TOOL_IDENTITIES } from "@/lib/config/tool-identity";
import { cn } from "@/lib/utils";

export default async function FerramentasPage({
  searchParams,
}: PageProps<"/ferramentas">) {
  const customer = await getCurrentCustomer();
  const products = customer ? await getCustomerProducts(customer.id) : [];
  const unlockedFeatures = new Set(
    products.flatMap((p) => getProductContent(p.slug).features)
  );
  const { bloqueado } = await searchParams;

  const accessByTool = new Map(
    await Promise.all(
      TOOL_IDENTITIES.map(
        async (t) => [t.key, await getToolAccess(t.key)] as const
      )
    )
  );

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-lg dark:from-slate-500 dark:to-slate-700">
            <Wrench className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Ferramentas
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Utilitários para o dia a dia da assistência técnica.
            </p>
          </div>
        </div>
      </div>

      {bloqueado && (
        <p className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
          Seu período de teste dessa ferramenta terminou. Seus dados continuam
          salvos — assine o plano (em breve) para voltar a criar registros.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOL_IDENTITIES.map((tool, index) => {
          const isIncluded = unlockedFeatures.has(tool.feature);
          const access = accessByTool.get(tool.key)!;
          const Icon = tool.icon;
          return (
            <div
              key={tool.key}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm",
                "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                tool.hoverGlow,
                "animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards duration-500"
              )}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              {/* filete gradiente da marca da ferramenta */}
              <div className={cn("h-1 w-full", tool.gradient)} />

              <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md",
                        "transition-transform duration-300 group-hover:scale-110",
                        tool.gradient
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold leading-tight">
                        {tool.title}
                      </h2>
                      <p className={cn("text-xs font-medium", tool.textAccent)}>
                        {tool.tagline}
                      </p>
                    </div>
                  </div>
                  {isIncluded ? (
                    <ToolAccessBadge access={access} />
                  ) : (
                    <Badge variant="outline">Não incluso</Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  {tool.description}
                </p>

                <ul className="space-y-1.5">
                  {tool.highlights.map((h) => (
                    <li
                      key={h}
                      className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm"
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-full",
                          tool.softBg
                        )}
                      >
                        <Check className={cn("size-3", tool.textAccent)} />
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>

                {isIncluded && (
                  <div className="mt-auto pt-1">
                    <Button
                      className="w-full"
                      render={<Link href={`/ferramentas/${tool.key}`} />}
                      nativeButton={false}
                    >
                      Abrir ferramenta
                      <ArrowRight
                        data-icon="inline-end"
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
