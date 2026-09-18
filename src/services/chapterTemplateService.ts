import { supabase } from '@/lib/supabase';
import {
  ChapterTemplate,
  ChapterTemplateRequest,
  ChapterTemplateRequestStatus,
  QuoteItem,
} from '@/types';

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
 * QUEM PODE O QUÊ
 * - Ver e aplicar: quem tem o módulo `quotes` em `view`.
 * - Criar: quem tem `quotes` em `edit`. Criar não estraga o trabalho de ninguém.
 * - REMOVER: só administradores. A lista é partilhada por toda a equipa e um
 *   modelo apagado por engano leva atrás o trabalho de quem o montou. Quem não
 *   é admin faz um pedido de autorização, que o admin aprova ou recusa.
 *
 * Isto está trancado na base de dados, não só no ecrã: as políticas de UPDATE e
 * DELETE de `quote_chapter_templates` exigem `kubik_is_admin()`.
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

function mapRequest(row: any): ChapterTemplateRequest {
  return {
    id: row.id,
    templateId: row.template_id ?? null,
    templateName: row.template_name,
    reason: row.reason ?? null,
    status: (row.status as ChapterTemplateRequestStatus) ?? 'pendente',
    requestedBy: row.requested_by ?? null,
    decidedBy: row.decided_by ?? null,
    decidedAt: row.decided_at ?? null,
    createdAt: row.created_at ?? null,
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

  /** Guarda um capítulo como modelo novo. Aberto a quem edita orçamentos. */
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
   * Arquiva um modelo. SÓ ADMINISTRADORES — a política de UPDATE exige
   * kubik_is_admin(), por isso um não-admin recebe erro do Supabase mesmo que
   * chegue aqui.
   *
   * Não apaga a linha: põe is_active a false, para que um modelo removido por
   * engano possa ser recuperado com um UPDATE.
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

  /* ==========================================================
     PEDIDOS DE REMOÇÃO
     Quem não é admin não apaga: pede. O admin vê os pedidos na
     mesma janela dos modelos e decide.
     ========================================================== */

  /** Pedidos ainda por decidir. O admin vê todos; cada um vê os seus. */
  async listRequests(): Promise<ChapterTemplateRequest[]> {
    const { data, error } = await supabase
      .from('quote_chapter_template_requests')
      .select('*')
      .eq('status', 'pendente')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('SUPABASE ERROR (template_requests select):', error);
      throw error;
    }
    return (data || []).map(mapRequest);
  },

  /**
   * Regista um pedido de remoção.
   *
   * Só pode haver um pedido pendente por modelo (índice único parcial na base
   * de dados). Um segundo pedido devolve erro 23505 — quem chama deve dizer ao
   * utilizador que o pedido já está em cima da mesa.
   */
  async createRequest(entrada: {
    templateId: string;
    templateName: string;
    reason?: string;
    requestedBy?: string;
  }): Promise<ChapterTemplateRequest> {
    const { data, error } = await supabase
      .from('quote_chapter_template_requests')
      .insert({
        template_id: entrada.templateId,
        template_name: entrada.templateName,
        reason: entrada.reason?.trim() || null,
        requested_by: entrada.requestedBy ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('SUPABASE ERROR (template_requests insert):', error);
      throw error;
    }
    return mapRequest(data);
  },

  /**
   * Aprova um pedido: arquiva o modelo e fecha o pedido.
   *
   * O modelo é arquivado primeiro. Se isso falhar (por exemplo por o utilizador
   * não ser admin), o pedido fica pendente — nunca se marca como aprovado um
   * pedido cuja remoção não chegou a acontecer.
   */
  async approveRequest(
    pedido: ChapterTemplateRequest,
    decidedBy?: string
  ): Promise<void> {
    if (pedido.templateId) {
      await this.archive(pedido.templateId);
    }
    await this.decideRequest(pedido.id, 'aprovado', decidedBy);
  },

  /** Fecha um pedido com a decisão tomada. Só administradores. */
  async decideRequest(
    id: string,
    status: Exclude<ChapterTemplateRequestStatus, 'pendente'>,
    decidedBy?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('quote_chapter_template_requests')
      .update({
        status,
        decided_by: decidedBy ?? null,
        decided_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('SUPABASE ERROR (template_requests decide):', error);
      throw error;
    }
  },
};
