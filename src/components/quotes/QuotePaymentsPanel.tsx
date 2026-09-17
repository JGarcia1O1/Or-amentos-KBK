'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Quote, QuotePayment } from '@/types';
import { formatCurrency, calculateQuoteTotalWithVat } from '@/lib/calculator';
import { PaymentService } from '@/services/paymentService';
import { useApp } from '@/context/AppContext';
import { Lock, Plus, Trash2, Wallet, Check, Pencil } from 'lucide-react';

/**
 * Controlo de recebimentos de um orçamento adjudicado.
 *
 * É um painel interno: nunca sai no PDF e só a administração o vê.
 * Escreve em tabelas próprias (quote_adjudications e quote_payments),
 * nunca no orçamento — um orçamento adjudicado está bloqueado para
 * alterações na base de dados.
 */
export default function QuotePaymentsPanel({ quote }: { quote: Quote }) {
  const { currentUser, confirmAction } = useApp();

  const totalOrcamento = useMemo(
    () => calculateQuoteTotalWithVat(quote),
    [quote]
  );

  const [carregando, setCarregando] = useState(true);
  const [pagamentos, setPagamentos] = useState<QuotePayment[]>([]);

  // Valor adjudicado: arranca no total da proposta, mas é corrigível.
  const [adjudicado, setAdjudicado] = useState<number>(totalOrcamento);
  const [adjudicadoGravado, setAdjudicadoGravado] = useState<number | null>(null);
  const [editarAdjudicado, setEditarAdjudicado] = useState(false);
  const [rascunhoAdjudicado, setRascunhoAdjudicado] = useState('');

  // Formulário de novo lançamento
  const hoje = new Date().toISOString().slice(0, 10);
  const [novaData, setNovaData] = useState(hoje);
  const [novoValor, setNovoValor] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [aGravar, setAGravar] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [registo, linhas] = await Promise.all([
        PaymentService.getAdjudication(quote.id),
        PaymentService.getPayments(quote.id),
      ]);
      setPagamentos(linhas);
      if (registo) {
        setAdjudicado(registo.amount);
        setAdjudicadoGravado(registo.amount);
      } else {
        setAdjudicado(totalOrcamento);
        setAdjudicadoGravado(null);
      }
    } catch {
      toast.error('Não foi possível ler os pagamentos deste orçamento.');
    } finally {
      setCarregando(false);
    }
  }, [quote.id, totalOrcamento]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const pago = useMemo(
    () => pagamentos.reduce((soma, p) => soma + (p.amount || 0), 0),
    [pagamentos]
  );
  const falta = adjudicado - pago;
  const percentagem =
    adjudicado > 0 ? Math.min(100, Math.round((pago / adjudicado) * 100)) : 0;

  /* ---------------- Valor adjudicado ---------------- */

  const abrirEdicaoAdjudicado = () => {
    setRascunhoAdjudicado(String(adjudicado.toFixed(2)));
    setEditarAdjudicado(true);
  };

  const gravarAdjudicado = async () => {
    const valor = Number(String(rascunhoAdjudicado).replace(',', '.'));
    if (!isFinite(valor) || valor < 0) {
      toast.error('Indica um valor adjudicado válido.');
      return;
    }
    try {
      await PaymentService.saveAdjudication(
        quote.id,
        quote.number,
        valor,
        currentUser
      );
      setAdjudicado(valor);
      setAdjudicadoGravado(valor);
      setEditarAdjudicado(false);
      toast.success('Valor adjudicado atualizado.');
    } catch {
      toast.error('Não foi possível gravar o valor adjudicado.');
    }
  };

  /* ---------------- Lançamentos ---------------- */

  const registarPagamento = async () => {
    const valor = Number(String(novoValor).replace(',', '.'));
    if (!isFinite(valor) || valor === 0) {
      toast.error('Indica o valor recebido.');
      return;
    }
    if (!novaData) {
      toast.error('Indica a data do recebimento.');
      return;
    }

    setAGravar(true);
    try {
      // Se o valor adjudicado ainda nunca foi fixado, fixa-se agora com o
      // total da proposta. Sem isto, o "falta pagar" ficava dependente de
      // um total que muda sempre que alguém mexe num artigo.
      if (adjudicadoGravado === null) {
        await PaymentService.saveAdjudication(
          quote.id,
          quote.number,
          adjudicado,
          currentUser
        );
        setAdjudicadoGravado(adjudicado);
      }

      const linha = await PaymentService.addPayment({
        quoteId: quote.id,
        quoteNumber: quote.number,
        paidAt: novaData,
        amount: valor,
        description: novaDescricao.trim() || undefined,
        createdBy: currentUser,
      });

      setPagamentos(prev => [linha, ...prev]);
      setNovoValor('');
      setNovaDescricao('');
      setNovaData(hoje);
      toast.success('Recebimento registado.');
    } catch {
      toast.error('Não foi possível registar o recebimento.');
    } finally {
      setAGravar(false);
    }
  };

  const apagarPagamento = (linha: QuotePayment) => {
    confirmAction(
      'Apagar lançamento',
      `Apagar o recebimento de ${formatCurrency(linha.amount)} de ${formatarData(
        linha.paidAt
      )}? Esta ação não se desfaz.`,
      async () => {
        try {
          await PaymentService.deletePayment(linha.id);
          setPagamentos(prev => prev.filter(p => p.id !== linha.id));
          toast.success('Lançamento apagado.');
        } catch {
          toast.error('Não foi possível apagar o lançamento.');
        }
      }
    );
  };

  /* ---------------- Render ---------------- */

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      <div className="bg-gray-100/70 px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-900">
            Controlo de Recebimentos
          </h3>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <Lock className="w-3 h-3" />
          Interno · não sai no PDF
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Totais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Adjudicado
              </span>
              {!editarAdjudicado && (
                <button
                  type="button"
                  onClick={abrirEdicaoAdjudicado}
                  title="Corrigir o valor adjudicado"
                  className="text-gray-400 hover:text-gray-900 transition"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>

            {editarAdjudicado ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  autoFocus
                  value={rascunhoAdjudicado}
                  onFocus={e => e.target.select()}
                  onChange={e => setRascunhoAdjudicado(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      gravarAdjudicado();
                    }
                    if (e.key === 'Escape') setEditarAdjudicado(false);
                  }}
                  className="w-28 text-sm font-mono font-bold bg-white border border-gray-300 rounded-lg px-2 py-1 outline-none"
                />
                <button
                  type="button"
                  onClick={gravarAdjudicado}
                  title="Gravar"
                  className="p-1.5 bg-gray-900 hover:bg-black text-white rounded-lg transition"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="text-lg font-bold text-gray-900 num-tabular">
                  {formatCurrency(adjudicado)}
                </div>
                {adjudicadoGravado === null && (
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Assumido do total da proposta
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Já pago
            </div>
            <div className="text-lg font-bold text-emerald-700 num-tabular">
              {formatCurrency(pago)}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Falta pagar
            </div>
            <div
              className={`text-lg font-bold num-tabular ${
                Math.abs(falta) < 0.005
                  ? 'text-emerald-700'
                  : falta < 0
                  ? 'text-amber-700'
                  : 'text-gray-900'
              }`}
            >
              {formatCurrency(falta)}
            </div>
            {falta < -0.005 && (
              <div className="text-[10px] text-amber-700 mt-0.5">
                Recebido a mais
              </div>
            )}
          </div>
        </div>

        {/* Barra de progresso */}
        <div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all"
              style={{ width: `${percentagem}%` }}
            />
          </div>
          <div className="text-[10px] text-gray-400 mt-1 font-medium">
            {percentagem}% recebido
          </div>
        </div>

        {/* Novo lançamento */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end pt-1">
          <div className="sm:col-span-3">
            <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">
              Data
            </label>
            <input
              type="date"
              value={novaData}
              onChange={e => setNovaData(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none font-mono"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">
              Valor recebido
            </label>
            <input
              type="number"
              step="0.01"
              value={novoValor}
              placeholder="0,00"
              onChange={e => setNovoValor(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  registarPagamento();
                }
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none font-mono"
            />
          </div>
          <div className="sm:col-span-4">
            <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={novaDescricao}
              placeholder="Ex: sinal, 2.ª tranche, entrega"
              onChange={e => setNovaDescricao(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  registarPagamento();
                }
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={registarPagamento}
              disabled={aGravar}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Registar
            </button>
          </div>
        </div>

        {/* Lista de lançamentos */}
        {carregando ? (
          <div className="text-xs text-gray-400 py-4 text-center">
            A carregar recebimentos...
          </div>
        ) : pagamentos.length === 0 ? (
          <div className="text-xs text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-xl">
            Ainda não há recebimentos registados.
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs num-tabular">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] w-28">
                    Data
                  </th>
                  <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">
                    Descrição
                  </th>
                  <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-right w-32">
                    Valor
                  </th>
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {pagamentos.map(p => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-mono text-gray-600">
                      {formatarData(p.paidAt)}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {p.description || <span className="text-gray-300">—</span>}
                      {p.createdBy && (
                        <span className="text-[10px] text-gray-400 ml-2">
                          {p.createdBy}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-gray-900">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => apagarPagamento(p)}
                        title="Apagar lançamento"
                        className="text-gray-300 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/** '2026-09-17' -> '17/09/2026' */
function formatarData(iso: string): string {
  if (!iso) return '';
  const partes = String(iso).slice(0, 10).split('-');
  if (partes.length !== 3) return iso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
