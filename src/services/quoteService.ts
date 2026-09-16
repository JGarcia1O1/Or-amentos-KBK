import { Quote } from '@/types';
import { supabase } from '@/lib/supabase';

/**
 * Camada de Abstração para os Orçamentos.
 * Comunica diretamente com a API do Supabase.
 *
 * PAPELEIRA: eliminar um orçamento nunca o apaga da base de dados.
 * Marca apenas a coluna deleted_at. Só o apagamento definitivo,
 * reservado à administração, remove mesmo a linha.
 */

/** Linha do Supabase (snake_case) -> Quote (camelCase). */
function mapFromDb(q: any): Quote {
  return {
    id: q.id,
    number: q.number,
    clientName: q.client_name,
    clientNif: q.client_nif,
    clientAddress: q.client_address,
    clientPostalCode: q.client_postal_code,
    clientCity: q.client_city,
    clientEmail: q.client_email,
    clientPhone: q.client_phone,
    projectName: q.project_name,
    date: q.date,
    status: q.status,
    type: q.type,
    chapters: q.chapters,
    notes: q.notes,
    paymentConditions: q.payment_conditions,
    deliveryTerms: q.delivery_terms,
    validityDays: q.validity_days,
    // Orçamentos antigos não têm estas colunas preenchidas — daí o fallback
    scopeIncluded: q.scope_included || [],
    scopeExcluded: q.scope_excluded || [],
    responsible: q.created_by,
    lastEditedAt: q.last_edited_at,
    deletedAt: q.deleted_at ?? null,
  };
}

/** Quote (camelCase) -> linha do Supabase (snake_case). */
function mapToDb(quote: Quote) {
  return {
    id: quote.id,
    number: quote.number,
    client_name: quote.clientName,
    client_nif: quote.clientNif,
    client_address: quote.clientAddress,
    client_postal_code: quote.clientPostalCode,
    client_city: quote.clientCity,
    client_email: quote.clientEmail,
    client_phone: quote.clientPhone,
    project_name: quote.projectName,
    date: quote.date,
    status: quote.status,
    type: quote.type,
    chapters: quote.chapters,
    notes: quote.notes,
    payment_conditions: quote.paymentConditions,
    delivery_terms: quote.deliveryTerms,
    validity_days: quote.validityDays,
    scope_included: quote.scopeIncluded || [],
    scope_excluded: quote.scopeExcluded || [],
    created_by: quote.responsible,
    last_edited_at: quote.lastEditedAt || Date.now(),
  };
}

export const QuoteService = {
  /** Orçamentos ativos, ou seja, tudo o que não está na papeleira */
  async getAll(): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) { console.error("SUPABASE ERROR:", error); throw new Error(error.message); }
    return (data || []).map(mapFromDb);
  },

  /** Orçamentos que estão na papeleira, mais recentes primeiro */
  async getDeleted(): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (error) { console.error("SUPABASE ERROR:", error); throw new Error(error.message); }
    return (data || []).map(mapFromDb);
  },


  /** Guarda (Cria ou Atualiza) um orçamento */
  async save(quote: Quote): Promise<void> {
    const { error } = await supabase.from('quotes').upsert([mapToDb(quote)]);
    if (error) throw new Error(`Falha ao gravar orçamento: ${error.message}`);
  },

  /** Guarda um array de orçamentos (Usado na migração) */
  async saveBulk(quotes: Quote[]): Promise<void> {
    const { error } = await supabase.from('quotes').upsert(quotes.map(mapToDb));
    if (error) throw new Error(`Falha ao gravar orçamentos em massa: ${error.message}`);
  },

  /** Envia para a papeleira. O orçamento continua na base de dados. */
  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(`Falha ao enviar para a papeleira: ${error.message}`);
  },

  /** Repõe um orçamento que estava na papeleira */
  async restore(id: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .update({ deleted_at: null })
      .eq('id', id);
    if (error) throw new Error(`Falha ao repor orçamento: ${error.message}`);
  },

  /**
   * Apaga mesmo, sem volta. Só a administração chega aqui, e só a
   * partir da papeleira. O backup no GitHub continua a ser a última rede.
   */
  async purge(id: string): Promise<void> {
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) throw new Error(`Falha ao apagar orçamento: ${error.message}`);
  },

  /** O mesmo, para vários de uma vez (seleção na papeleira) */
  async purgeMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await supabase.from('quotes').delete().in('id', ids);
    if (error) throw new Error(`Falha ao apagar orçamentos: ${error.message}`);
  }
};
