'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Quote, QuoteSettlement } from '@/types';
import {
  formatCurrency,
  calculateQuoteSubtotal,
  calculateQuoteVat,
} from '@/lib/calculator';
import { SettlementService } from '@/services/paymentService';
import { useApp } from '@/context/AppContext';
import { Lock, Wallet, CheckCircle2 } from 'lucide-react';

/**
 * Liquidação de um orçamento adjudicado.
 *
 * O cliente paga em duas metades iguais do total com IVA: 50% na adjudicação
 * e 50% depois. Cada metade tem um visto e uma data. Quando as duas ficam
 * marcadas, o orçamento passa sozinho a Realizado.
 *
 * Painel interno: só a administração o vê e nunca sai no PDF.
 */
export default function QuotePaymentsPanel({ quote }: { quote: Quote }) {
  const { currentUser, setQuotes, setSelectedQuote } = useApp();

  const hoje = new Date().toISOString().slice(0, 10);

  const [carregando, setCarregando] = useState(true);
  const [aGravar, setAGravar] = useState(false);
  const [registo, setRegisto] = useState<QuoteSettlement | null>(null);

  // Datas em edição. Se a metade ainda não está marcada, guardam a data que
  // será usada quando alguém carregar no visto.
  const [data1, setData1] = useState(hoje);
  const [data2, setData2] = useState(hoje);

  // Valores calculados a partir do orçamento. Se já houver registo gravado,
  // manda o registo — é a fotografia do momento em que se cobrou.
  const calculado = useMemo(() => {
    const subtotal = calculateQuoteSubtotal(quote);
    const iva = calculateQuoteVat(quote);
    return { subtotal, iva, total: subtotal + iva };
  }, [quote]);

  const subtotal = registo ? registo.subtotal : calculado.subtotal;
  const iva = registo ? registo.vatAmount : calculado.iva;
  const total = registo ? registo.total : calculado.total;
  const metade = total / 2;

  const pago1 = !!registo?.firstPaidAt;
  const pago2 = !!registo?.secondPaidAt;
  const recebido = (pago1 ? metade : 0) + (pago2 ? metade : 0);
  const emFalta = total - recebido;

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const linha = await SettlementService.get(quote.id);
      setRegisto(linha);
      if (linha?.firstPaidAt) setData1(linha.firstPaidAt);
      if (linha?.secondPaidAt) setData2(linha.secondPaidAt);
    } catch {
      toast.error('Não foi possível ler o estado dos pagamentos.');
    } finally {
      setCarregando(false);
    }
  }, [quote.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /** Atualiza o estado do orçamento em memória, sem gravar a linha inteira. */
  const refletirEstado = (novoEstado: Quote['status']) => {
    setQuotes(prev =>
      prev.map(q => (q.id === quote.id ? { ...q, status: novoEstado } : q))
    );
    setSelectedQuote({ ...quote, status: novoEstado });
  };

  /**
   * Grava as duas metades e, se for caso disso, muda o estado do orçamento.
   * primeira/segunda: data em texto, ou null para "ainda não recebido".
   */
  const gravar = async (primeira: string | null, segunda: string | null) => {
    setAGravar(true);
    try {
      const linha = await SettlementService.setHalf({
        quoteId: quote.id,
        quoteNumber: quote.number,
        subtotal: calculado.subtotal,
        vatAmount: calculado.iva,
        total: calculado.total,
        firstPaidAt: primeira,
        secondPaidAt: segunda,
        updatedBy: currentUser,
      });
      setRegisto(linha);

      const liquidado = primeira !== null && segunda !== null;

      if (liquidado && quote.status !== 'Realizado') {
        await SettlementService.marcarRealizado(quote.id);
        refletirEstado('Realizado');
        toast.success('Pago na totalidade. O orçamento passou a Realizado.');
        return;
      }

      if (!liquidado && quote.status === 'Realizado') {
        await SettlementService.reverterParaAdjudicado(quote.id);
        refletirEstado('Adjudicado');
        toast.success('Pagamento desmarcado. O orçamento voltou a Adjudicado.');
        return;
      }

      toast.success('Pagamento atualizado.');
    } catch (e: any) {
      const mensagem = String(e?.message || e);
      if (mensagem.includes('trancado') || mensagem.includes('SEGURANÇA')) {
        toast.error(
          'A base de dados recusou a mudança de estado. Falta correr o SQL que abre a exceção Adjudicado → Realizado.'
        );
      } else {
        toast.error('Não foi possível gravar o pagamento.');
      }
      // Volta a ler para o ecrã não ficar a mostrar algo que não gravou.
      carregar();
    } finally {
      setAGravar(false);
    }
  };

  const alternarPrimeira = () =>
    gravar(pago1 ? null : data1, registo?.secondPaidAt ?? null);

  const alternarSegunda = () =>
    gravar(registo?.firstPaidAt ?? null, pago2 ? null : data2);

  /** Mudar a data de uma metade já marcada regrava-a com a data nova. */
  const mudarData1 = (valor: string) => {
    setData1(valor);
    if (pago1) gravar(valor, registo?.secondPaidAt ?? null);
  };

  const mudarData2 = (valor: string) => {
    setData2(valor);
    if (pago2) gravar(registo?.firstPaidAt ?? null, valor);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      <div className="bg-gray-100/70 px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-900">Pagamento</h3>
          {pago1 && pago2 && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Realizado
            </span>
          )}
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <Lock className="w-3 h-3" />
          Interno · não sai no PDF
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* De onde vem a conta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Subtotal Venda
            </div>
            <div className="text-base font-bold text-gray-900 num-tabular">
              {formatCurrency(subtotal)}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              IVA (23%)
            </div>
            <div className="text-base font-bold text-gray-900 num-tabular">
              {formatCurrency(iva)}
            </div>
          </div>
          <div className="bg-black text-white rounded-xl px-4 py-3">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Total com IVA
            </div>
            <div className="text-base font-bold num-tabular">
              {formatCurrency(total)}
            </div>
          </div>
        </div>

        {/* As duas metades */}
        {carregando ? (
          <div className="text-xs text-gray-400 py-6 text-center">
            A carregar...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MetadeBox
              titulo="1.ª metade · 50%"
              legenda="Na adjudicação"
              valor={metade}
              pago={pago1}
              data={data1}
              bloqueado={aGravar}
              onAlternar={alternarPrimeira}
              onMudarData={mudarData1}
            />
            <MetadeBox
              titulo="2.ª metade · 50%"
              legenda="Restante"
              valor={metade}
              pago={pago2}
              data={data2}
              bloqueado={aGravar}
              onAlternar={alternarSegunda}
              onMudarData={mudarData2}
            />
          </div>
        )}

        {/* Resumo */}
        <div className="flex items-center justify-between gap-3 pt-1 text-xs">
          <span className="text-gray-400 font-medium">
            Recebido{' '}
            <span className="font-bold text-emerald-700 num-tabular">
              {formatCurrency(recebido)}
            </span>
          </span>
          <span className="text-gray-400 font-medium">
            Em falta{' '}
            <span
              className={`font-bold num-tabular ${
                emFalta < 0.005 ? 'text-emerald-700' : 'text-gray-900'
              }`}
            >
              {formatCurrency(emFalta)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function MetadeBox({
  titulo,
  legenda,
  valor,
  pago,
  data,
  bloqueado,
  onAlternar,
  onMudarData,
}: {
  titulo: string;
  legenda: string;
  valor: number;
  pago: boolean;
  data: string;
  bloqueado: boolean;
  onAlternar: () => void;
  onMudarData: (valor: string) => void;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 transition ${
        pago
          ? 'bg-emerald-50/60 border-emerald-200'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {titulo}
          </div>
          <div className="text-lg font-bold text-gray-900 num-tabular mt-0.5">
            {formatCurrency(valor)}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">{legenda}</div>
        </div>

        <label
          className={`shrink-0 flex items-center gap-2 text-xs font-semibold select-none ${
            bloqueado ? 'opacity-50' : 'cursor-pointer'
          }`}
          title={pago ? 'Desmarcar como pago' : 'Marcar como pago'}
        >
          <input
            type="checkbox"
            checked={pago}
            disabled={bloqueado}
            onChange={onAlternar}
            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-0 cursor-pointer"
          />
          <span className={pago ? 'text-emerald-700' : 'text-gray-500'}>
            Pago
          </span>
        </label>
      </div>

      <div className="mt-3">
        <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">
          Data do pagamento
        </label>
        <input
          type="date"
          value={data}
          disabled={bloqueado}
          onChange={e => onMudarData(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none font-mono disabled:opacity-50"
        />
      </div>
    </div>
  );
}
