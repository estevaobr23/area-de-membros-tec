export interface OrderBump {
  slug: string;
  name: string;
  description: string;
  priceLabel: string;
  coverImage: string;
}

/**
 * Complementos oferecidos como order bump no checkout do 150 Defeitos.
 * Ainda não têm produto/entitlement no Supabase (nenhum cliente comprou via
 * webhook ainda) — por isso ficam como uma lista estática, exibida como
 * vitrine, não como "produto liberado". Quando o fluxo de compra desses
 * itens existir, migram para a tabela `products` como os demais.
 */
export const ORDER_BUMPS: OrderBump[] = [
  {
    slug: "50-defeitos-tablets-ipads",
    name: "50 Defeitos de Tablets e iPads",
    description:
      "Manual visual de diagnóstico e reparos para tablets Android e iPads.",
    priceLabel: "R$ 12,90",
    coverImage: "/products/50-defeitos-tablets-ipads.png",
  },
  {
    slug: "40-defeitos-smartwatches",
    name: "40 Defeitos de Smartwatches",
    description:
      "Manual visual com problemas de bateria, carregamento, tela, touch, sensores, conectividade e outros defeitos.",
    priceLabel: "R$ 12,90",
    coverImage: "/products/40-defeitos-smartwatches.png",
  },
  {
    slug: "50-diagnosticos-placas",
    name: "50 Diagnósticos Avançados em Placas de Celulares",
    description:
      "Material avançado focado em falhas de placa, alimentação, carregamento, consumo, curto e inicialização.",
    priceLabel: "R$ 12,90",
    coverImage: "/products/50-diagnosticos-placas.png",
  },
  {
    slug: "combo-3-manuais-extras",
    name: "Leve os 3 Manuais Extras",
    description:
      "Pacote com os três materiais acima, totalizando 140 conteúdos adicionais de diagnóstico por um valor menor do que comprados separadamente.",
    priceLabel: "R$ 29,90",
    coverImage: "/products/combo-3-manuais-extras.png",
  },
];
