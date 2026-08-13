export const FINANCE_CATEGORIES = {
  receita: ["servicos", "vendas", "outras_receitas"],
  despesa: [
    "pecas",
    "ferramentas",
    "aluguel",
    "energia",
    "transporte",
    "fornecedores",
    "taxas",
    "outras_despesas",
  ],
} as const;

export const FINANCE_CATEGORY_LABELS: Record<string, string> = {
  servicos: "Serviços",
  vendas: "Vendas",
  outras_receitas: "Outras receitas",
  pecas: "Peças",
  ferramentas: "Ferramentas",
  aluguel: "Aluguel",
  energia: "Energia",
  transporte: "Transporte",
  fornecedores: "Fornecedores",
  taxas: "Taxas",
  outras_despesas: "Outras despesas",
  outros: "Outros",
};

export type FinancePeriod =
  | "hoje"
  | "7dias"
  | "mes"
  | "mes_anterior"
  | "personalizado";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Resolve o período do filtro em [from, to] no formato YYYY-MM-DD (inclusivo). */
export function resolvePeriod(
  period: FinancePeriod,
  customFrom?: string,
  customTo?: string
): { from: string; to: string } {
  const now = new Date();
  const today = toISODate(now);

  switch (period) {
    case "hoje":
      return { from: today, to: today };
    case "7dias": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: toISODate(from), to: today };
    }
    case "mes_anterior": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: toISODate(first), to: toISODate(last) };
    }
    case "personalizado": {
      const valid = (s?: string) => s && /^\d{4}-\d{2}-\d{2}$/.test(s);
      if (valid(customFrom) && valid(customTo)) {
        return { from: customFrom!, to: customTo! };
      }
      // sem intervalo válido, cai no mês atual
      return resolvePeriod("mes");
    }
    case "mes":
    default: {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toISODate(first), to: today };
    }
  }
}
