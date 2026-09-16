'use client';

import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, calculateQuoteTotalWithVat } from '@/lib/calculator';
import { ordenarPorNumeroDesc } from '@/lib/quoteSort';
import { ArrowLeft, RotateCcw, Trash2, Trash, FileText, Loader2 } from 'lucide-react';

/**
 * Papeleira de orçamentos.
 * Eliminar um orçamento manda-o para aqui; não o apaga. Só a
 * administração vê esta vista e só daqui se apaga definitivamente.
 */
export default function QuotesTrashView() {
  const {
    deletedQuotes,
    papeleiraCarregando,
    carregarPapeleira,
    restoreQuote,
    purgeQuote,
    setCurrentView,
    isAdmin,
  } = useApp();

  useEffect(() => {
    carregarPapeleira();
  }, [carregarPapeleira]);

  const lista = ordenarPorNumeroDesc(deletedQuotes);

  const dataLegivel = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAdmin) {
    return (
      <div className="p-6 sm:p-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <Trash className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-900">Papeleira reservada à administração</p>
          <p className="text-xs text-gray-500 mt-1">
            Se eliminou um orçamento por engano, peça a reposição a um administrador.
          </p>
          <button
            type="button"
            onClick={() => setCurrentView('quotes-list')}
            className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar aos orçamentos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            type="button"
            onClick={() => setCurrentView('quotes-list')}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-900 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Orçamentos
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Papeleira</h1>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Orçamentos eliminados. Continuam guardados na base de dados e podem
            ser repostos a qualquer momento. Nada sai daqui sem uma decisão sua.
          </p>
        </div>
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          {lista.length} {lista.length === 1 ? 'orçamento' : 'orçamentos'}
        </span>
      </div>

      {papeleiraCarregando && (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-10 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          A carregar a Papeleira...
        </div>
      )}

      {!papeleiraCarregando && lista.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <Trash className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-900">A Papeleira está vazia</p>
          <p className="text-xs text-gray-500 mt-1">Não há nenhum orçamento eliminado.</p>
        </div>
      )}

      {!papeleiraCarregando && lista.length > 0 && (
        <div className="space-y-2.5">
          {lista.map(q => (
            <div
              key={q.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="font-bold text-sm text-gray-900">{q.number}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                    {q.status}
                  </span>
                </div>
                <div className="text-[13px] font-semibold text-gray-900 mt-1 truncate">
                  {q.clientName}
                </div>
                <div className="text-[11px] text-gray-400 truncate">
                  {q.projectName || 'Obra Geral'} · eliminado a {dataLegivel(q.deletedAt)}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  c/ IVA
                </div>
                <div className="font-mono text-sm font-bold text-gray-900 num-tabular">
                  {formatCurrency(calculateQuoteTotalWithVat(q))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => restoreQuote(q.id)}
                  className="h-9 px-3 rounded-lg bg-gray-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-800 transition"
                  title="Repor este orçamento"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Repor
                </button>
                <button
                  type="button"
                  onClick={() => purgeQuote(q.id)}
                  className="h-9 w-9 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition"
                  title="Apagar definitivamente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-gray-400 pt-2">
        Mesmo depois de apagado definitivamente, o orçamento continua nos backups
        automáticos no GitHub e o PDF da proposta mantém-se lá guardado.
      </p>
    </div>
  );
}
