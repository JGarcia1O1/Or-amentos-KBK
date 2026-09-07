import { Quote } from '@/types';
import { supabase } from '@/lib/supabase';

/**
 * Camada de Abstração para os Orçamentos.
 * Comunica diretamente com a API do Supabase.
 */
export const QuoteService = {
  /** Busca todos os orçamentos */
  async getAll(): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { console.error("SUPABASE ERROR:", error); throw new Error(error.message); }
    return (data || []).map((q: any) => ({
      id: q.id,
      number: q.number,
      clientName: q.client_name,
      clientNif: q.client_nif,
      clientAddress: q.client_address,
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
      responsible: q.created_by,
      lastEditedAt: q.last_edited_at
    }));
  },

  /** Guarda (Cria ou Atualiza) um orçamento */
  async save(quote: Quote): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .upsert([
        {
          id: quote.id,
          number: quote.number,
          client_name: quote.clientName,
          client_nif: quote.clientNif,
          client_address: quote.clientAddress,
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
          created_by: quote.responsible,
          last_edited_at: quote.lastEditedAt || Date.now()
        }
      ]);
    if (error) throw new Error(`Falha ao gravar orçamento: ${error.message}`);
  },

  /** Guarda um array de orçamentos (Usado na migração) */
  async saveBulk(quotes: Quote[]): Promise<void> {
    const payload = quotes.map(quote => ({
      id: quote.id,
      number: quote.number,
      client_name: quote.clientName,
      client_nif: quote.clientNif,
      client_address: quote.clientAddress,
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
      created_by: quote.responsible,
      last_edited_at: quote.lastEditedAt || Date.now()
    }));

    const { error } = await supabase.from('quotes').upsert(payload);
    if (error) throw new Error(`Falha ao gravar orçamentos em massa: ${error.message}`);
  },

  /** Elimina um orçamento */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) throw new Error(`Falha ao apagar orçamento: ${error.message}`);
  }
};
