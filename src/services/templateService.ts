import { QuoteTemplate } from '@/types';
import { supabase } from '@/lib/supabase';

/**
 * Receitas do Configurador de Orçamentos.
 * Mapeamento camelCase (frontend) <-> snake_case (Supabase).
 */

function mapFromDb(row: any): QuoteTemplate {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    unitLabel: row.unit_label || undefined,
    designation: row.designation,
    costPerUnit: Number(row.cost_per_unit) || 0,
    marginPercent: Number(row.margin_percent) || 0,
    fixedExtra: Number(row.fixed_extra) || 0,
    automaticConfig: row.automatic_config || undefined,
    source: row.source || undefined,
    isConfirmed: row.is_confirmed === true,
    isActive: row.is_active !== false,
    sortOrder: Number(row.sort_order) || 0,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapToDb(t: QuoteTemplate) {
  return {
    name: t.name,
    category: t.category,
    unit: t.unit,
    unit_label: t.unitLabel || null,
    designation: t.designation,
    cost_per_unit: t.costPerUnit,
    margin_percent: t.marginPercent,
    fixed_extra: t.fixedExtra,
    automatic_config: t.automaticConfig || null,
    source: t.source || null,
    is_confirmed: t.isConfirmed,
    is_active: t.isActive,
    sort_order: t.sortOrder,
    notes: t.notes || null,
  };
}

export const TemplateService = {
  /** Todas as receitas, ativas primeiro, por categoria e ordem */
  async getAll(): Promise<QuoteTemplate[]> {
    const { data, error } = await supabase
      .from('quote_templates')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[KUBIK] Falha ao carregar receitas:', error.message);
      throw new Error(error.message);
    }
    return (data || []).map(mapFromDb);
  },

  /** Cria uma receita e devolve-a já com o id atribuído */
  async create(template: QuoteTemplate): Promise<QuoteTemplate> {
    const { data, error } = await supabase
      .from('quote_templates')
      .insert(mapToDb(template))
      .select('*')
      .single();

    if (error) throw new Error(`Falha ao criar receita: ${error.message}`);
    return mapFromDb(data);
  },

  /** Atualiza uma receita existente */
  async update(id: string, template: QuoteTemplate): Promise<void> {
    const { error } = await supabase
      .from('quote_templates')
      .update(mapToDb(template))
      .eq('id', id);

    if (error) throw new Error(`Falha ao gravar receita: ${error.message}`);
  },

  /** Remove uma receita */
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('quote_templates').delete().eq('id', id);
    if (error) throw new Error(`Falha ao remover receita: ${error.message}`);
  },
};
