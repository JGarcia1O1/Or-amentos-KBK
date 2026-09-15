import {
  QuoteChapter,
  QuoteItem,
  QuoteTemplate,
  TemplateSelection,
} from '@/types';

/**
 * MOTOR DO CONFIGURADOR DE ORÇAMENTOS
 *
 * Transforma receitas + quantidades em capítulos e artigos de orçamento.
 * Não calcula preços de venda: limita-se a preencher o custo unitário e o
 * markup, deixando todo o cálculo comercial ao `calculator.ts`, que continua
 * a ser a única fonte de verdade para preços.
 *
 * Nível atual — SIMPLES: custo conhecido por unidade (metro linear de
 * cozinha, metro quadrado de roupeiro), vindo das folhas de custo da KUBIK.
 *
 * Nível seguinte — POR MÓDULO: quando as receitas tiverem `automaticConfig`
 * preenchido, o artigo nasce em modo 'automatic' e o custo passa a ser
 * calculado a partir de chapas, orlas, tempos de máquina e ferragens.
 * O `buildItemFromTemplate` já trata esse caso.
 */

export const UNIT_LABELS: Record<string, string> = {
  m: 'metro linear',
  m2: 'metro quadrado',
  un: 'unidade',
};

export function unitLabel(template: QuoteTemplate): string {
  return template.unitLabel || UNIT_LABELS[template.unit] || template.unit;
}

/** Custo total de uma linha da seleção (sem markup) */
export function selectionCost(sel: TemplateSelection): number {
  return (sel.template.costPerUnit || 0) * (sel.quantity || 0);
}

/**
 * Preço de venda de uma linha, pela mesma fórmula do calculator.ts:
 * venda = custo * (1 + markup) + extra fixo
 * (markup sobre o custo — ver capítulo 3.4 do handoff)
 */
export function selectionSell(sel: TemplateSelection): number {
  const custo = selectionCost(sel);
  return custo * (1 + (sel.template.marginPercent || 0)) + (sel.template.fixedExtra || 0);
}

/** Gera um artigo de orçamento a partir de uma receita */
export function buildItemFromTemplate(
  template: QuoteTemplate,
  quantity: number,
  code: string,
  seed: number
): QuoteItem {
  const temConfigTecnica =
    !!template.automaticConfig &&
    Array.isArray(template.automaticConfig.operations);

  return {
    id: `${code}.${seed}`,
    code,
    designation: template.designation || template.name,
    unit: template.unit,
    quantity: quantity,
    // No nível simples o custo vem da receita. No nível por módulo o
    // QuoteEditor recalcula-o a partir do automaticConfig.
    costUnit: template.costPerUnit || 0,
    marginPercent: template.marginPercent || 0,
    // O extra fixo é por artigo, não por unidade — entra uma só vez.
    fixedExtra: template.fixedExtra || 0,
    calculationMode: temConfigTecnica ? 'automatic' : 'quick',
    automaticConfig: temConfigTecnica ? template.automaticConfig : undefined,
  };
}

/**
 * Agrupa as seleções por categoria e devolve os capítulos do orçamento.
 * Cada categoria de receita vira um capítulo; a ordem segue a das seleções.
 */
export function buildChaptersFromSelections(
  selections: TemplateSelection[]
): QuoteChapter[] {
  const validas = selections.filter(s => s.template && s.quantity > 0);
  if (validas.length === 0) return [];

  const porCategoria = new Map<string, TemplateSelection[]>();
  for (const sel of validas) {
    const cat = sel.template.category || 'Mobiliário';
    if (!porCategoria.has(cat)) porCategoria.set(cat, []);
    porCategoria.get(cat)!.push(sel);
  }

  const chapters: QuoteChapter[] = [];
  let chapterIndex = 0;

  porCategoria.forEach((sels, categoria) => {
    chapterIndex += 1;
    const items = sels.map((sel, i) =>
      buildItemFromTemplate(
        sel.template,
        sel.quantity,
        `${chapterIndex}.${i + 1}`,
        Date.now() + chapterIndex * 100 + i
      )
    );
    chapters.push({ id: chapterIndex, title: categoria, items });
  });

  return chapters;
}

/** Resumo para mostrar antes de gerar o orçamento */
export function summarize(selections: TemplateSelection[]) {
  const validas = selections.filter(s => s.template && s.quantity > 0);
  const custo = validas.reduce((acc, s) => acc + selectionCost(s), 0);
  const venda = validas.reduce((acc, s) => acc + selectionSell(s), 0);
  const lucro = venda - custo;
  // Markup sobre o custo — a mesma leitura que o resto do software usa
  const markup = custo > 0 ? (lucro / custo) * 100 : 0;
  // Margem efetiva sobre a venda, para não haver ilusões
  const margemVenda = venda > 0 ? (lucro / venda) * 100 : 0;

  return {
    linhas: validas.length,
    custo,
    venda,
    lucro,
    markup: Number(markup.toFixed(1)),
    margemVenda: Number(margemVenda.toFixed(1)),
    temPorConfirmar: validas.some(s => !s.template.isConfirmed),
  };
}
