import { Material, Quote, QuoteItem, TechnicalOperation, TechnicalPart } from '@/types';

/**
 * MOTOR DE CÁLCULO DE MARCENARIA & ORÇAMENTOS (KUBIK HOME & LIFE FURNITURE)
 * Fórmulas exatas extraídas e validadas das folhas de cálculo Excel da empresa:
 * - Rendimento de corte de chapas (ROUNDDOWN / Math.floor)
 * - Metragem linear de orlas
 * - Tempos de máquinas e postos de trabalho (Seccionadora, CNC, Orladora, Bancada)
 * - Margem comercial e impostos (IVA 23%)
 */

/**
 * Rendimento de peças por chapa:
 * Rend = MAX(ROUNDDOWN(X / Comp) * ROUNDDOWN(Y / Larg), ROUNDDOWN(X / Larg) * ROUNDDOWN(Y / Comp))
 */
export function calculatePartYield(
  part: { length: number; width: number },
  material: { length: number; width: number }
): number {
  const x = material.length;
  const y = material.width;
  const c = part.length;
  const l = part.width;

  if (c <= 0 || l <= 0 || x <= 0 || y <= 0) return 1;

  const option1 = Math.floor(x / c) * Math.floor(y / l);
  const option2 = Math.floor(x / l) * Math.floor(y / c);

  return Math.max(1, Math.max(option1, option2));
}

/**
 * Utilização de chapa e custo de material para uma peça
 */
export function calculatePartMaterialCost(
  part: { length: number; width: number; qty: number },
  material: { length: number; width: number; price: number }
): { yieldParts: number; sheetsUsed: number; cost: number } {
  const yieldParts = calculatePartYield(part, material);
  const sheetsUsed = part.qty / yieldParts;
  const cost = sheetsUsed * material.price;

  return { yieldParts, sheetsUsed, cost };
}

/**
 * Metros lineares de orla para uma peça (4 lados):
 * Metros = ((2 * Comp / 1000) + (2 * Larg / 1000)) * Qtd
 */
export function calculateEdgeMeters(part: { length: number; width: number; qty: number }): number {
  if (part.length <= 0 || part.width <= 0 || part.qty <= 0) return 0;
  return ((part.length * 2 / 1000) + (part.width * 2 / 1000)) * part.qty;
}

/**
 * Custo de orla a 0,70 €/metro linear
 */
export function calculateEdgeCost(meters: number, pricePerMeter: number = 0.70): number {
  return meters * pricePerMeter;
}

/**
 * Custo de operação de máquina ou mão de obra:
 * OpDireta = (opMin * taxa) / 60
 * Setup = (setupMin * taxa) / 60
 */
export function calculateOperationCost(op: { opMin: number; setupMin: number; hourlyRate: number }): {
  direct: number;
  setup: number;
  total: number;
} {
  const direct = ((op.opMin || 0) * (op.hourlyRate || 0)) / 60;
  const setup = ((op.setupMin || 0) * (op.hourlyRate || 0)) / 60;
  return { direct, setup, total: direct + setup };
}

/**
 * Preço de venda unitário de um artigo comercial:
 * Preço Venda Unitário = Custo Unitário * (1 + Margem%) + Extra Fixo
 */
export function calculateItemSellUnit(item: {
  costUnit: number;
  marginPercent: number;
  fixedExtra?: number;
}): number {
  const cost = item.costUnit || 0;
  const margin = item.marginPercent || 0;
  const extra = item.fixedExtra || 0;
  return cost * (1 + margin) + extra;
}

/**
 * Preço de venda total de uma linha de artigo:
 * Preço Venda Total = Quantidade * Preço Venda Unitário
 */
export function calculateItemSellTotal(item: {
  costUnit: number;
  marginPercent: number;
  fixedExtra?: number;
  quantity: number;
}): number {
  const qty = item.quantity || 1;
  return qty * calculateItemSellUnit(item);
}

/**
 * Custo total de produção do orçamento (soma de todos os custos dos artigos)
 */
export function calculateQuoteCost(quote: Quote): number {
  if (!quote || !quote.chapters) return 0;
  let total = 0;
  for (const chapter of quote.chapters) {
    for (const item of chapter.items) {
      total += (item.costUnit || 0) * (item.quantity || 1);
    }
  }
  return total;
}

/**
 * Subtotal de venda do orçamento (sem IVA)
 */
export function calculateQuoteSubtotal(quote: Quote): number {
  if (!quote || !quote.chapters) return 0;
  let total = 0;
  for (const chapter of quote.chapters) {
    for (const item of chapter.items) {
      total += calculateItemSellTotal(item);
    }
  }
  return total;
}

/**
 * Valor do IVA (taxa normal de 23% em Portugal)
 */
export function calculateQuoteVat(quote: Quote, vatRate: number = 0.23): number {
  return calculateQuoteSubtotal(quote) * vatRate;
}

/**
 * Valor total da proposta com IVA
 */
export function calculateQuoteTotalWithVat(quote: Quote, vatRate: number = 0.23): number {
  return calculateQuoteSubtotal(quote) * (1 + vatRate);
}

/**
 * Margem média comercial da proposta em percentagem:
 * ((Venda - Custo) / Custo) * 100
 */
export function calculateQuoteMarginPercent(quote: Quote): number {
  const cost = calculateQuoteCost(quote);
  const subtotal = calculateQuoteSubtotal(quote);
  if (cost <= 0) return 0;
  return Number((((subtotal - cost) / cost) * 100).toFixed(1));
}

/**
 * Cálculo completo da Ficha Técnica (espelho da folha Aparador)
 */
export function calculateTechnicalSheetGrandTotal(
  parts: TechnicalPart[],
  material: Material,
  operations: TechnicalOperation[],
  extraHardware: number = 78.04
): {
  materialsCost: number;
  operationsCost: number;
  hardwareCost: number;
  grandTotal: number;
} {
  let materialsCost = 0;
  for (const part of parts) {
    const { cost } = calculatePartMaterialCost(part, material);
    materialsCost += cost;
  }

  let operationsCost = 0;
  for (const op of operations) {
    const { total } = calculateOperationCost(op);
    operationsCost += total;
  }

  const hardwareCost = extraHardware;
  const grandTotal = materialsCost + operationsCost + hardwareCost;

  return {
    materialsCost,
    operationsCost,
    hardwareCost,
    grandTotal,
  };
}

/**
 * Formatação monetária em padrão português (ex: "1.234,56 €")
 */
export function formatCurrency(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return '0,00 €';
  
  const parts = Number(value).toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join(',') + ' €';
}
