export type ProductFeature =
  | "manual_reader"
  | "tools_os"
  | "tools_calculator"
  | "tools_financeiro"
  | "tools_orcamento";

export interface ProductContent {
  description: string;
  features: ProductFeature[];
  allowDownload: boolean;
  /** Caminho da capa (1:1) em /public, ex: "/products/slug.png". */
  coverImage?: string;
  /** Caminho do PDF dentro do bucket privado "manuals" do Supabase Storage, se houver leitor. */
  manualStoragePath?: string;
  /** Pathname do PDF dentro do store privado do Vercel Blob, se houver leitor. */
  manualBlobPath?: string;
  /**
   * Ponte de emergência (dev-only): caminho absoluto no disco local, servido
   * por /api/manual/[slug] quando nem Blob nem Supabase estão configurados.
   * Não funciona em produção (o servidor não tem acesso ao disco local).
   */
  manualLocalPath?: string;
}

/**
 * Metadados de exibição por produto (descrição, ferramentas liberadas, etc.).
 * Fica no app em vez do banco porque a tabela `products` é compartilhada com
 * a integração de compras/Wiapy — isto aqui é só apresentação.
 */
const PRODUCT_CONTENT: Record<string, ProductContent> = {
  "150-defeitos-de-celulares": {
    description:
      "Manual Visual de Diagnóstico e Reparos — 150 defeitos organizados por sintoma, com fluxos de teste e mapas visuais para Samsung, Xiaomi/Redmi/POCO, iPhone e Motorola.",
    features: [
      "manual_reader",
      "tools_os",
      "tools_calculator",
      "tools_financeiro",
      "tools_orcamento",
    ],
    allowDownload: true,
    coverImage: "/products/150-defeitos-de-celulares.png",
    manualBlobPath: "manuals/150-defeitos-de-celulares.pdf",
    manualLocalPath:
      "C:/Users/Usuário/Desktop/150 defeitos em celulares/ebook materiasi/Nova pasta/150 DEFEITOS CELULARES.pdf",
  },
  "100-defeitos-de-lavadoras": {
    description:
      "Manual Visual de Diagnóstico e Reparos de lavadoras — 100 defeitos organizados por sintoma, com fluxos de teste e mapas visuais.",
    features: ["manual_reader"],
    allowDownload: false,
  },
  "50-defeitos-tablets-ipads": {
    description:
      "Manual visual de diagnóstico e reparos para tablets Android e iPads.",
    features: ["manual_reader"],
    allowDownload: false,
    coverImage: "/products/50-defeitos-tablets-ipads.png",
  },
  "40-defeitos-smartwatches": {
    description:
      "Manual visual com problemas de bateria, carregamento, tela, touch, sensores, conectividade e outros defeitos.",
    features: ["manual_reader"],
    allowDownload: false,
    coverImage: "/products/40-defeitos-smartwatches.png",
  },
  "50-diagnosticos-placas": {
    description:
      "Material avançado focado em falhas de placa, alimentação, carregamento, consumo, curto e inicialização.",
    features: ["manual_reader"],
    allowDownload: false,
    coverImage: "/products/50-diagnosticos-placas.png",
  },
  "gabaritos-parafusos-iphone": {
    description:
      "Gabarito visual pra organizar e identificar os parafusos na hora de desmontar e montar iPhones (6 ao 15), sem trocar peça de lugar.",
    features: ["manual_reader"],
    allowDownload: false,
    coverImage: "/products/gabaritos-parafusos-iphone.png",
  },
};

const DEFAULT_CONTENT: ProductContent = {
  description: "",
  features: [],
  allowDownload: false,
};

export function getProductContent(slug: string): ProductContent {
  return PRODUCT_CONTENT[slug] ?? DEFAULT_CONTENT;
}
