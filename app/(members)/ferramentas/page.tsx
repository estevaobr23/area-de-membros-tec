import Link from "next/link";
import {
  ClipboardList,
  Calculator,
  Wallet,
  FileText,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolAccessBadge } from "@/components/tools/tool-paywall";
import { getCurrentCustomer } from "@/lib/auth/session";
import { getToolAccess, type ToolKey } from "@/lib/auth/tool-access";
import { getCustomerProducts } from "@/lib/data/products";
import { getProductContent, type ProductFeature } from "@/lib/config/product-content";

interface ToolDefinition {
  key: ToolKey;
  feature: ProductFeature;
  title: string;
  description: string;
  icon: LucideIcon;
}

const TOOLS: ToolDefinition[] = [
  {
    key: "ordem-servico",
    feature: "tools_os",
    title: "Ordem de Serviço",
    description:
      "Cadastre clientes, aparelhos, defeitos, serviços e acompanhe o status de cada reparo.",
    icon: ClipboardList,
  },
  {
    key: "calculadora",
    feature: "tools_calculator",
    title: "Calculadora de Preço e Lucro",
    description:
      "Informe custo, mão de obra e margem para calcular o preço de venda ideal.",
    icon: Calculator,
  },
  {
    key: "financeiro",
    feature: "tools_financeiro",
    title: "Controle Financeiro",
    description:
      "Registre receitas e despesas e acompanhe o financeiro da assistência.",
    icon: Wallet,
  },
  {
    key: "orcamento-garantia",
    feature: "tools_orcamento",
    title: "Orçamento + Garantia",
    description:
      "Gere orçamentos profissionais e termos de garantia para seus clientes.",
    icon: FileText,
  },
];

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
      TOOLS.map(async (t) => [t.key, await getToolAccess(t.key)] as const)
    )
  );

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ferramentas</h1>
        <p className="text-muted-foreground">
          Utilitários para o dia a dia da assistência técnica.
        </p>
      </div>

      {bloqueado && (
        <p className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
          Seu período de teste dessa ferramenta terminou. Seus dados continuam
          salvos — assine o plano (em breve) para voltar a criar registros.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => {
          const isIncluded = unlockedFeatures.has(tool.feature);
          const access = accessByTool.get(tool.key)!;
          const Icon = tool.icon;
          return (
            <Card key={tool.key} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Icon className="size-5 text-muted-foreground" />
                  <CardTitle className="text-base">{tool.title}</CardTitle>
                </div>
                {isIncluded ? (
                  <ToolAccessBadge access={access} />
                ) : (
                  <Badge variant="outline">Não incluso</Badge>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {tool.description}
                </p>
                {isIncluded && (
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/ferramentas/${tool.key}`} />}
                      nativeButton={false}
                    >
                      Abrir
                      <ArrowRight data-icon="inline-end" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
