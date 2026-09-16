'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, calculateQuoteTotalWithVat } from '@/lib/calculator';
import { ordenarPorNumeroDesc } from '@/lib/quoteSort';
import {
  ArrowLeft,
  RotateCcw,
  Trash2,
  Trash,
  FileText,
  Loader2,
  ChevronDown,
} from 'lucide-react';

/**
 * Papeleira de orçamentos.
 * Eliminar um orçamento manda-o para aqui; não o apaga. Só a
 * administração vê esta vista e só daqui se apaga definitivamente.
 *
 * A lista está agrupada pelo mês em que cada orçamento foi eliminado.
 * O mês mais recente abre por defeito; os restantes ficam fechados,
 * para a papeleira não virar uma lista interminável.
 */

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** '2026-08' -> 'Agosto de 2026' */
function rotuloDoMes(chave: string): string {
  const [ano, mes] = chave.split('-');
  const indice = parseInt(mes, 10) - 1;
  if (isNaN(indice) || !MESES[indice]) return 'Sem data';
  return `${MESES[indice]} de ${ano}`;
}

export default function QuotesTrashView() {
  const {
    deletedQuotes,
    papeleiraCarregando,
    carregarPapeleira,
    restoreQuote,
    purgeQuote,
    purgeQuotes,
    setCurrentView,
    isAdmin,
  } = useApp();

  const [fechados, setFechados] = useState<Record<string, boolean>>({});
  const [selecionados, setSelecionados] = useState<string[]>([]);

  // Se a papeleira mudar por baixo dos pés, não deixar seleções órfãs
  useEffect(() => {
    const existentes = new Set(deletedQuotes.map(q => q.id));
    setSelecionados(prev => prev.filter(id => existentes.has(id)));
  }, [deletedQuotes]);

  const estaSelecionado = (id: string) => selecionados.includes(id);

  const alternarSelecao = (id: string) => {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const alternarMes = (ids: string[]) => {
    const todosJaEstao = ids.every(id => selecionados.includes(id));
    setSelecionados(prev =>
      todosJaEstao
        ? prev.filter(id => !ids.includes(id))
        : Array.from(new Set([...prev, ...ids]))
    );
  };

  useEffect(() => {
    carregarPapeleira();
  }, [carregarPapeleira]);

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

  // Agrupa pelo mês em que foi eliminado, do mais recente para o mais antigo
  const grupos = useMemo(() => {
    const mapa = new Map<string, typeof deletedQuotes>();

    deletedQuotes.forEach(q => {
      const d = q.deletedAt ? new Date(q.deletedAt) : null;
      const chave = d && !isNaN(d.getTime())
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : 'sem-data';
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)!.push(q);
    });

    return Array.from(mapa.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([chave, lista]) => ({ chave, lista: ordenarPorNumeroDesc(lista) }));
  }, [deletedQuotes]);

  const estaAberto = (chave: string, indice: number) =>
    fechados[chave] === undefined ? indice === 0 : !fechados[chave];

  const alternar = (chave: string, indice: number) => {
    const aberto = estaAberto(chave, indice);
    setFechados(prev => ({ ...prev, [chave]: aberto }));
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
            Orçamentos eliminados, agrupados pelo mês em que saíram das listas.
            Continuam na base de dados e podem ser repostos a qualquer momento.
          </p>
        </div>
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          {deletedQuotes.length} {deletedQuotes.length === 1 ? 'orçamento' : 'orçamentos'}
        </span>
      </div>

      {/* Barra de seleção — só aparece quando há alguma coisa escolhida */}
      {selecionados.length > 0 && (
        <div className="sticky top-2 z-20 bg-gray-900 text-white rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg">
          <span className="text-xs font-semibold">
            {selecionados.length} selecionado{selecionados.length === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelecionados([])}
              className="text-[11px] font-semibold text-gray-300 hover:text-white transition px-2 py-1"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => purgeQuotes(selecionados)}
              className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Apagar definitivamente
            </button>
          </div>
        </div>
      )}

      {papeleiraCarregando && (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-10 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          A carregar a Papeleira...
        </div>
      )}

      {!papeleiraCarregando && deletedQuotes.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <Trash className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-900">A Papeleira está vazia</p>
          <p className="text-xs text-gray-500 mt-1">Não há nenhum orçamento eliminado.</p>
        </div>
      )}

      {!papeleiraCarregando && grupos.map(({ chave, lista }, indice) => {
        const aberto = estaAberto(chave, indice);
        return (
          <div key={chave} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Separador do mês */}
            <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition">
              <input
                type="checkbox"
                checked={lista.every(q => estaSelecionado(q.id))}
                onChange={() => alternarMes(lista.map(q => q.id))}
                title="Selecionar todos deste mês"
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer shrink-0"
              />
              <button
                type="button"
                onClick={() => alternar(chave, indice)}
                aria-expanded={aberto}
                className="flex-1 flex items-center justify-between gap-3 text-left min-w-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                      aberto ? '' : '-rotate-90'
                    }`}
                  />
                  <span className="text-sm font-bold text-gray-900 truncate">
                    {rotuloDoMes(chave)}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-gray-400 shrink-0">
                  {lista.length}
                </span>
              </button>
            </div>

            {aberto && (
              <div className="border-t border-gray-100 divide-y divide-gray-100">
                {lista.map(q => (
                  <div
                    key={q.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 transition-colors ${
                      estaSelecionado(q.id) ? 'bg-gray-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={estaSelecionado(q.id)}
                      onChange={() => alternarSelecao(q.id)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer shrink-0 self-start sm:self-center"
                    />

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
          </div>
        );
      })}

      {!papeleiraCarregando && deletedQuotes.length > 0 && (
        <p className="text-[11px] text-gray-400 pt-1">
          Mesmo depois de apagado definitivamente, o orçamento continua nos backups
          automáticos no GitHub e o PDF da proposta mantém-se lá guardado.
        </p>
      )}
    </div>
  );
}
