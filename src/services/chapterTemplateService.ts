import { supabase } from '@/lib/supabase';
import { ChapterTemplate, QuoteItem } from '@/types';

/**
 * Modelos de capítulo.
 *
 * Um modelo é simplesmente a lista de artigos de um capítulo, guardada com um
 * nome. Aplicar um modelo copia esses artigos para o capítulo aberto — não cria
 * nenhuma ligação viva: mexer no modelo depois NÃO mexe nos orçamentos já
 * feitos, e mexer no orçamento não mexe no modelo. É de propósito, para o
 * histórico não mudar debaixo dos pés.
 *
 * Os custos, margens e extras vão tal e qual estavam no momento em que o modelo
 * foi guardado. Artigos em modo automático levam a sua automaticConfig, por isso
 * recalculam com os preços de chapa e ferragem em vigor quando forem aplicados.
 *
 * Não confundir com `templateService.ts` (QuoteTemplate), que são as receitas do
 * configurador — custo por metro linear e afins. Isto aqui é um capítulo inteiro.
 *
 * Mapeamento camelCase (frontend) <-> snake_case (Supabase).
 */

function mapChapterTemplate(row: any): ChapterTemplate {
  return {
    id: row.id,
    name: row.name,
    items: Array.isArray(row.items) ? (row.items as QuoteItem[]) : [],
    notes: row.notes ?? undefined,
    sortOrder: Number(row.sort_order) || 0,
    isActive: row.is_active !== false,
    createdAt: row.created_at ?? undefined,
    createdBy: row.created_by ?? undefined,
  };
}

export const ChapterTemplateService = {
  /** Modelos ativos, pela ordem definida e depois por nome. */
  async list(): Promise<ChapterTemplate[]> {
    const { data, error } = await supabase
      .from('quote_chapter_templates')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('SUPABASE ERROR (quote_chapter_templates select):', error);
      throw error;
    }
    return (data || []).map(mapChapterTemplate);
  },

  /** Guarda um capítulo como modelo novo. */
  async create(entrada: {
    name: string;
    items: QuoteItem[];
    notes?: string;
    createdBy?: string;
  }): Promise<ChapterTemplate> {
    const { data, error } = await supabase
      .from('quote_chapter_templates')
      .insert({
        name: entrada.name,
        items: entrada.items,
        notes: entrada.notes ?? null,
        created_by: entrada.createdBy ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('SUPABASE ERROR (quote_chapter_templates insert):', error);
      throw error;
    }
    return mapChapterTemplate(data);
  },

  /**
   * Arquiva um modelo. Não apaga a linha: põe is_active a false, para que um
   * modelo removido por engano possa ser recuperado com um UPDATE.
   */
  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from('quote_chapter_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('SUPABASE ERROR (quote_chapter_templates archive):', error);
      throw error;
    }
  },
};
