// Matemática pura da calculadora de preço/lucro — sem dependência de servidor,
// para poder ser testada isoladamente e reusada no client component.

export interface PricingInputs {
  partCost: number; // custo da peça
  freight: number; // frete
  materials: number; // materiais/insumos
  otherCosts: number; // outros custos
  laborCost: number; // mão de obra
  feePercent: number; // taxas sobre o preço de venda (cartão, plataforma) em %
  discountPercent: number; // desconto concedido em %
  marginPercent: number; // margem desejada sobre o preço (modo "margem")
  markupPercent: number; // markup sobre o custo (modo "markup")
  mode: "margin" | "markup";
}

export interface PricingResults {
  totalCost: number; // custo total (peça + frete + materiais + outros)
  baseCost: number; // custo total + mão de obra
  suggestedPrice: number; // preço antes do desconto
  finalPrice: number; // preço após desconto
  fees: number; // taxas pagas sobre o preço final
  profit: number; // lucro líquido no preço final
  profitMarginPercent: number; // margem real (% do preço final)
  markupPercent: number; // markup efetivo sobre o baseCost
  minimumPrice: number; // preço de lucro zero (cobre custos + taxas)
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calculatePricing(i: PricingInputs): PricingResults {
  const totalCost = i.partCost + i.freight + i.materials + i.otherCosts;
  const baseCost = totalCost + i.laborCost;
  const fee = Math.min(Math.max(i.feePercent, 0), 99) / 100;
  const discount = Math.min(Math.max(i.discountPercent, 0), 100) / 100;

  let suggestedPrice: number;
  if (i.mode === "markup") {
    // markup aplicado sobre o custo base; taxas cobradas por fora do preço
    const priceBeforeFees = baseCost * (1 + Math.max(i.markupPercent, 0) / 100);
    suggestedPrice = fee < 1 ? priceBeforeFees / (1 - fee) : priceBeforeFees;
  } else {
    // margem desejada como % do preço de venda: price*(1 - fee - margin) = baseCost
    const margin = Math.min(Math.max(i.marginPercent, 0), 95) / 100;
    const divisor = 1 - fee - margin;
    suggestedPrice = divisor > 0 ? baseCost / divisor : baseCost;
  }

  const finalPrice = suggestedPrice * (1 - discount);
  const fees = finalPrice * fee;
  const profit = finalPrice - fees - baseCost;
  const profitMarginPercent = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;
  const markupPercent = baseCost > 0 ? ((finalPrice - baseCost) / baseCost) * 100 : 0;
  const minimumPrice = fee < 1 ? baseCost / (1 - fee) : baseCost;

  return {
    totalCost: round2(totalCost),
    baseCost: round2(baseCost),
    suggestedPrice: round2(suggestedPrice),
    finalPrice: round2(finalPrice),
    fees: round2(fees),
    profit: round2(profit),
    profitMarginPercent: round2(profitMarginPercent),
    markupPercent: round2(markupPercent),
    minimumPrice: round2(minimumPrice),
  };
}

export const EMPTY_PRICING_INPUTS: PricingInputs = {
  partCost: 0,
  freight: 0,
  materials: 0,
  otherCosts: 0,
  laborCost: 0,
  feePercent: 0,
  discountPercent: 0,
  marginPercent: 30,
  markupPercent: 100,
  mode: "margin",
};
