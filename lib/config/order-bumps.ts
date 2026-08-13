export interface OrderBump {
  /**
   * Slug do produto real em `products` (existe no Supabase, o webhook da
   * Wiapy consegue liberar entitlement pra ele). Itens que são só um pacote
   * de outros produtos (ex: combo) não têm um `products` próprio — usam
   * `bundleOfSlugs` pra saber se o cliente já tem tudo que o pacote contém.
   */
  slug: string;
  name: string;
  description: string;
  priceLabel: string;
  coverImage: string;
  checkoutUrl: string;
  /** Só em itens que são pacote de outros produtos, não um produto próprio. */
  bundleOfSlugs?: string[];
}

/**
 * Complementos oferecidos como order bump no checkout do 150 Defeitos.
 * Preço e link de checkout batem com o painel da Wiapy — ajuste os dois
 * juntos se o preço mudar lá.
 */
export const ORDER_BUMPS: OrderBump[] = [
  {
    slug: "50-defeitos-tablets-ipads",
    name: "50 Defeitos de Tablets e iPads",
    description:
      "Manual visual de diagnóstico e reparos para tablets Android e iPads.",
    priceLabel: "R$ 14,90",
    coverImage: "/products/50-defeitos-tablets-ipads.png",
    checkoutUrl: "https://pay.wiapy.com/6a7e1a069df1dadce893fa7e",
  },
  {
    slug: "40-defeitos-smartwatches",
    name: "40 Defeitos de Smartwatches",
    description:
      "Manual visual com problemas de bateria, carregamento, tela, touch, sensores, conectividade e outros defeitos.",
    priceLabel: "R$ 14,90",
    coverImage: "/products/40-defeitos-smartwatches.png",
    checkoutUrl: "https://pay.wiapy.com/6a7e1aa39df1dadce8941005",
  },
  {
    slug: "50-diagnosticos-placas",
    name: "50 Diagnósticos Avançados em Placas de Celulares",
    description:
      "Material avançado focado em falhas de placa, alimentação, carregamento, consumo, curto e inicialização.",
    priceLabel: "R$ 14,90",
    coverImage: "/products/50-diagnosticos-placas.png",
    checkoutUrl: "https://pay.wiapy.com/6a7e1b661943b5bbdef76a39",
  },
  {
    slug: "gabaritos-parafusos-iphone",
    name: "Gabaritos de Parafusos para iPhone",
    description:
      "Gabarito visual pra organizar e identificar os parafusos na hora de desmontar e montar iPhones (6 ao 15), sem trocar peça de lugar.",
    priceLabel: "R$ 12,90",
    coverImage: "/products/gabaritos-parafusos-iphone.png",
    checkoutUrl: "https://pay.wiapy.com/iT89dNzEW_N8",
  },
  {
    slug: "combo-3-manuais-extras",
    name: "Leve os 3 Manuais Extras",
    description:
      "Pacote com os três materiais acima, totalizando 140 conteúdos adicionais de diagnóstico por um valor menor do que comprados separadamente.",
    priceLabel: "R$ 29,90",
    coverImage: "/products/combo-3-manuais-extras.png",
    checkoutUrl: "https://pay.wiapy.com/XmT3OHuX_b2U",
    bundleOfSlugs: [
      "50-defeitos-tablets-ipads",
      "40-defeitos-smartwatches",
      "50-diagnosticos-placas",
    ],
  },
];

/** Já tem tudo que esse item libera? Pacotes só contam como "adquirido" se o cliente já tem cada item que o compõe. */
export function isOrderBumpOwned(
  item: OrderBump,
  ownedSlugs: Set<string>
): boolean {
  if (item.bundleOfSlugs) {
    return item.bundleOfSlugs.every((slug) => ownedSlugs.has(slug));
  }
  return ownedSlugs.has(item.slug);
}
