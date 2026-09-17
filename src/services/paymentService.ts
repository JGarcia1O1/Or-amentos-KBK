import { supabase } from '@/lib/supabase';
import { QuoteSettlement } from '@/types';

/**
 * Liquidação de orçamentos adjudicados: as duas metades de 50%.
 *
 * Porque é que isto não está dentro da tabela `quotes`:
 * um orçamento adjudicado está bloqueado para alterações na base de dados
 * (trigger trg_block_adjudicados). A única exceção aberta nesse trigger é a
 * passagem de 'Adjudicado' para 'Realizado' — e nada mais. Tudo o resto que
 * diz respeito a recebimentos vive em quote_settlements.
 *
 * Nada disto sai no PDF.
 */

function mapSettlement(row: any): QuoteSettlement {
  return {
    quoteId: row.quote_id,
    quoteNumber: row.quote_number ?? null,
    subtotal: Number(row.subtotal) || 0,
    vatAmount: Number(row.vat_amount) || 0,
    total: Number(row.total) || 0,
    firstPaidAt: row.first_paid_at ?? null,
    secondPaidAt: row.second_paid_at ?? null,
    settledAt: row.settled_at ?? null,
    updatedAt: row.updated_at ?? null,
    updatedBy: row.updated_by ?? null,
  };
}

export const SettlementService = {
  /** Liquidação gravada. null = ainda ninguém marcou nenhuma metade. */
  async get(quoteId: string): Promise<QuoteSettlement | null> {
    const { data, error } = await supabase
      .from('quote_settlements')
      .select('*')
      .eq('quote_id', quoteId)
      .maybeSingle();

    if (error) {
      console.error('SUPABASE ERROR (quote_settlements):', error);
      throw error;
    }
    return data ? mapSettlement(data) : null;
  },

  /**
   * Marca ou desmarca uma das metades.
   *
   * Os valores (subtotal, IVA, total) são gravados de cada vez. Como o
   * orçamento já está trancado na base de dados, não podem mudar — mas
   * assim a linha fica auto-suficiente para consulta e relatórios.
   */
  async setHalf(entrada: {
    quoteId: string;
    quoteNumber: string;
    subtotal: number;
    vatAmount: number;
    total: number;
    firstPaidAt: string | null;
    secondPaidAt: string | null;
    updatedBy: string;
  }): Promise<QuoteSettlement> {
    const liquidado =
      entrada.firstPaidAt !== null && entrada.secondPaidAt !== null;

    const { data, error } = await supabase
      .from('quote_settlements')
      .upsert(
        {
          quote_id: entrada.quoteId,
          quote_number: entrada.quoteNumber,
          subtotal: entrada.subtotal,
          vat_amount: entrada.vatAmount,
          total: entrada.total,
          first_paid_at: entrada.firstPaidAt,
          second_paid_at: entrada.secondPaidAt,
          settled_at: liquidado ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
          updated_by: entrada.updatedBy,
        },
        { onConflict: 'quote_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('SUPABASE ERROR (quote_settlements):', error);
      throw error;
    }
    return mapSettlement(data);
  },

  /**
   * Passa o orçamento de 'Adjudicado' a 'Realizado'.
   *
   * ATENÇÃO: tem de ser um update só à coluna status. O trigger
   * trg_block_adjudicados abre exceção exclusivamente para esta transição e
   * recusa-a se mais alguma coluna vier alterada. Não usar QuoteService.save
   * aqui — esse grava a linha inteira e é recusado.
   */
  async marcarRealizado(quoteId: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .update({ status: 'Realizado' })
      .eq('id', quoteId);

    if (error) {
      console.error('SUPABASE ERROR (quotes -> Realizado):', error);
      throw error;
    }
  },

  /** Volta a 'Adjudicado' quando se desmarca uma metade por engano. */
  async reverterParaAdjudicado(quoteId: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .update({ status: 'Adjudicado' })
      .eq('id', quoteId);

    if (error) {
      console.error('SUPABASE ERROR (quotes -> Adjudicado):', error);
      throw error;
    }
  },
};
