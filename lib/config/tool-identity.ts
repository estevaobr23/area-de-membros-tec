import {
  ClipboardList,
  Calculator,
  Wallet,
  FileText,
  type LucideIcon,
} from "lucide-react";
import type { ToolKey } from "@/lib/auth/tool-access";
import type { ProductFeature } from "@/lib/config/product-content";

/**
 * Identidade visual única de cada ferramenta (cor, gradiente, ícone).
 * As classes precisam ser strings literais completas para o Tailwind enxergar.
 */
export interface ToolIdentity {
  key: ToolKey;
  feature: ProductFeature;
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  /** Gradiente da marca da ferramenta (usado no tile do ícone e detalhes). */
  gradient: string;
  /** Cor de texto de destaque da ferramenta. */
  textAccent: string;
  /** Fundo suave para chips/realces da ferramenta. */
  softBg: string;
  /** Sombra colorida no hover do card. */
  hoverGlow: string;
  /** Pontos fortes exibidos no card do hub. */
  highlights: string[];
}

export const TOOL_IDENTITIES: ToolIdentity[] = [
  {
    key: "ordem-servico",
    feature: "tools_os",
    title: "Ordem de Serviço",
    tagline: "Monte, acompanhe e imprima suas OS",
    description:
      "Cadastre clientes e aparelhos, monte a OS completa e baixe o PDF pronto para imprimir e entregar.",
    icon: ClipboardList,
    gradient: "bg-gradient-to-br from-sky-500 to-blue-600",
    textAccent: "text-blue-600 dark:text-sky-400",
    softBg: "bg-blue-500/10",
    hoverGlow: "hover:shadow-blue-500/20",
    highlights: [
      "Clientes e aparelhos cadastrados",
      "Status de cada reparo",
      "PDF da OS para imprimir",
    ],
  },
  {
    key: "calculadora",
    feature: "tools_calculator",
    title: "Calculadora de Preço e Lucro",
    tagline: "Saiba exatamente quanto cobrar",
    description:
      "Calcule o preço ideal com margem ou markup, salve o custo das suas peças e reaproveite nos próximos cálculos.",
    icon: Calculator,
    gradient: "bg-gradient-to-br from-violet-500 to-purple-600",
    textAccent: "text-violet-600 dark:text-violet-400",
    softBg: "bg-violet-500/10",
    hoverGlow: "hover:shadow-violet-500/20",
    highlights: [
      "Margem, markup, taxas e desconto",
      "Banco de peças com custos salvos",
      "Histórico de cálculos",
    ],
  },
  {
    key: "financeiro",
    feature: "tools_financeiro",
    title: "Controle Financeiro",
    tagline: "O caixa da assistência na palma da mão",
    description:
      "Registre receitas e despesas, acompanhe o saldo por período e veja para onde o dinheiro está indo.",
    icon: Wallet,
    gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
    textAccent: "text-emerald-600 dark:text-emerald-400",
    softBg: "bg-emerald-500/10",
    hoverGlow: "hover:shadow-emerald-500/20",
    highlights: [
      "Receitas e despesas por período",
      "Saldo e maiores gastos",
      "Receita lançada direto da OS",
    ],
  },
  {
    key: "orcamento-garantia",
    feature: "tools_orcamento",
    title: "Orçamento + Garantia",
    tagline: "Documentos com a cara da sua assistência",
    description:
      "Gere orçamentos profissionais e termos de garantia prontos para imprimir, com os dados do seu negócio.",
    icon: FileText,
    gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
    textAccent: "text-amber-600 dark:text-amber-400",
    softBg: "bg-amber-500/10",
    hoverGlow: "hover:shadow-amber-500/20",
    highlights: [
      "Orçamento em PDF na hora",
      "Termo de garantia por OS",
      "Perfil da assistência no cabeçalho",
    ],
  },
];

export function getToolIdentity(key: ToolKey): ToolIdentity {
  const identity = TOOL_IDENTITIES.find((t) => t.key === key);
  if (!identity) throw new Error(`Ferramenta desconhecida: ${key}`);
  return identity;
}
