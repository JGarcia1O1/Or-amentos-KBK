import { supabase } from '@/lib/supabase';
import { QuoteAdjudication, QuotePayment } from '@/types';

/**
 * Pagamentos de orçamentos adjudicados.
 *
 * Porque é que isto não está dentro da tabela `quotes`:
 * um orçamento adjudicado está bloqueado para alterações na base de dados
 * (trigger trg_block_adjudicados). Qualquer tentativa de escrever o valor
 * pago dentro do orçamento falharia. Além disso são números financeiros,
 * de uso interno — não têm nada que ver com o documento que vai para o
 * cliente e nunca aparecem no PDF.
 *
 * Duas tabelas:
 *   quote_adjudications — o valor adjudicado (uma linha por orçamento)
 *   quote_payments      — cada recebimento (várias linhas por orçamento)
 */

function mapAdjudication(row: any): QuoteAdjudication {
  return {
    quoteId: row.quote_id,
    quoteNumber: row.quote_number ?? null,
    amount: Number(row.amount) || 0,
    updatedAt: row.updated_at ?? null,
    updatedBy: row.updated_by ?? null,
  };
}

function mapPayment(row: any): QuotePayment {
  return {
    id: row.id,
    quoteId: row.quote_id,
    quoteNumber: row.quote_number ?? null,
    paidAt: row.paid_at,
    amount: Number(row.amount) || 0,
    description: row.description ?? null,
    createdAt: row.created_at ?? null,
    createdBy: row.created_by ?? null,
  };
}

export const PaymentService = {
  /** Valor adjudicado gravado. Devolve null se ainda ninguém o fixou. */
  async getAdjudication(quoteId: string): Promise<QuoteAdjudication | null> {
    const { data, error } = await supabase
      .from('quote_adjudications')
      .select('*')
      .eq('quote_id', quoteId)
      .maybeSingle();

    if (error) {
      console.error('SUPABASE ERROR (quote_adjudications):', error);
      throw error;
    }
    return data ? mapAdjudication(data) : null;
  },

  /** Fixa ou corrige o valor adjudicado. */
  async saveAdjudication(
    quoteId: string,
    quoteNumber: string,
    amount: number,
    updatedBy: string
  ): Promise<QuoteAdjudication> {
    const { data, error } = await supabase
      .from('quote_adjudications')
      .upsert(
        {
          quote_id: quoteId,
          quote_number: quoteNumber,
          amount,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        },
        { onConflict: 'quote_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('SUPABASE ERROR (quote_adjudications):', error);
      throw error;
    }
    return mapAdjudication(data);
  },

  /** Lançamentos do orçamento, do mais recente para o mais antigo. */
  async getPayments(quoteId: string): Promise<QuotePayment[]> {
    const { data, error } = await supabase
      .from('quote_payments')
      .select('*')
      .eq('quote_id', quoteId)
      .order('paid_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('SUPABASE ERROR (quote_payments):', error);
      throw error;
    }
    return (data || []).map(mapPayment);
  },

  /** Regista um recebimento. */
  async addPayment(entrada: {
    quoteId: string;
    quoteNumber: string;
    paidAt: string;
    amount: number;
    description?: string;
    createdBy: string;
  }): Promise<QuotePayment> {
    const { data, error } = await supabase
      .from('quote_payments')
      .insert({
        quote_id: entrada.quoteId,
        quote_number: entrada.quoteNumber,
        paid_at: entrada.paidAt,
        amount: entrada.amount,
        description: entrada.description || null,
        created_by: entrada.createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error('SUPABASE ERROR (quote_payments):', error);
      throw error;
    }
    return mapPayment(data);
  },

  /** Apaga um lançamento errado. Só a administração chega aqui. */
  async deletePayment(id: string): Promise<void> {
    const { error } = await supabase.from('quote_payments').delete().eq('id', id);
    if (error) {
      console.error('SUPABASE ERROR (quote_payments):', error);
      throw error;
    }
  },

  /**
   * Totais de vários orçamentos de uma vez, para listas.
   * Devolve um mapa quoteId -> total já pago.
   */
  async getPaidTotals(quoteIds: string[]): Promise<Record<string, number>> {
    if (quoteIds.length === 0) return {};

    const { data, error } = await supabase
      .from('quote_payments')
      .select('quote_id, amount')
      .in('quote_id', quoteIds);

    if (error) {
      console.error('SUPABASE ERROR (quote_payments):', error);
      return {};
    }

    const totais: Record<string, number> = {};
    (data || []).forEach((linha: any) => {
      const valor = Number(linha.amount) || 0;
      totais[linha.quote_id] = (totais[linha.quote_id] || 0) + valor;
    });
    return totais;
  },
};
