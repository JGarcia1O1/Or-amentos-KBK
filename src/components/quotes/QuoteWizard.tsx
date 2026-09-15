'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TemplateService } from '@/services/templateService';
import { QuoteTemplate, TemplateSelection } from '@/types';
import {
  buildChaptersFromSelections,
  selectionSell,
  summarize,
  unitLabel,
} from '@/lib/templateEngine';
import { formatCurrency } from '@/lib/calculator';
import {
  ArrowLeft,
  Wand2,
  Loader2,
  AlertTriangle,
  Minus,
  Plus,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export default function QuoteWizard() {
  const { setCurrentView, createNewQuote } = useApp();

  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    TemplateService.getAll()
      .then(list => setTemplates(list.filter(t => t.isActive)))
      .catch(() => toast.error('Não foi possível carregar as receitas.'))
      .finally(() => setLoading(false));
  }, []);

  const selections: TemplateSelection[] = useMemo(
    () =>
      templates
        .map(t => ({ template: t, quantity: quantities[t.id || ''] || 0 }))
        .filter(s => s.quantity > 0),
    [templates, quantities]
  );

  const resumo = useMemo(() => summarize(selections), [selections]);

  const setQty = (id: string, value: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, Number(value) || 0) }));
  };

  const handleGenerate = () => {
    const chapters = buildChaptersFromSelections(selections);
    if (chapters.length === 0) {
      toast.error('Indica pelo menos uma quantidade.');
      return;
    }
    createNewQuote('manual', chapters);
    toast.success('Orçamento gerado. Revê antes de apresentar.');
  };

  // Agrupar por categoria para a apresentação
  const porCategoria = useMemo(() => {
    const mapa = new Map<string, QuoteTemplate[]>();
    templates.forEach(t => {
      const c = t.category || 'Outros';
      if (!mapa.has(c)) mapa.set(c, []);
      mapa.get(c)!.push(t);
    });
    return Array.from(mapa.entries());
  }, [templates]);

  return (
    <div className="p-6 space-y-6 w-full pb-28">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setCurrentView('quotes-list')}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition mt-0.5"
            title="Voltar à lista"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-gray-800" />
              Configurador de Orçamento
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Indica as quantidades e o orçamento é montado a partir dos custos de produção.
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-10">
          <Loader2 className="w-4 h-4 animate-spin" />
          A carregar receitas...
        </div>
      )}

      {!loading && templates.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-xs text-gray-500">
          Ainda não há receitas configuradas. Cria-as em Configurações Gerais,
          no painel <strong>Receitas do Configurador</strong>.
        </div>
      )}

      {/* Receitas por categoria */}
      {!loading &&
        porCategoria.map(([categoria, lista]) => (
          <div
            key={categoria}
            className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden"
          >
            <div className="bg-gray-100/70 px-4 py-3 border-b border-gray-200">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                {categoria}
              </h3>
            </div>

            <div className="divide-y divide-gray-100">
              {lista.map(t => {
                const id = t.id || '';
                const qtd = quantities[id] || 0;
                const linha: TemplateSelection = { template: t, quantity: qtd };

                return (
                  <div
                    key={id}
                    className="px-4 py-3 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-900">{t.name}</span>
                        {!t.isConfirmed && (
                          <span
                            className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                            title="Custo ainda não validado pela produção"
                          >
                            Por confirmar
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {formatCurrency(t.costPerUnit)} de custo por {unitLabel(t)}
                        {t.fixedExtra > 0 && ` · ${formatCurrency(t.fixedExtra)} de extra fixo`}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setQty(id, qtd - 1)}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                          title="Diminuir"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={qtd || ''}
                          placeholder="0"
                          onChange={e => setQty(id, Number(e.target.value))}
                          className="w-20 text-center text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg p-1.5 outline-none focus:border-black transition"
                        />
                        <button
                          type="button"
                          onClick={() => setQty(id, qtd + 1)}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                          title="Aumentar"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-[10px] text-gray-400 w-16">{t.unit}</span>
                      </div>

                      <div className="text-right w-28">
                        <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                          Venda
                        </span>
                        <span className="font-mono text-xs font-bold text-gray-900">
                          {qtd > 0 ? formatCurrency(selectionSell(linha)) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      {/* Aviso de receitas por confirmar */}
      {resumo.temPorConfirmar && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            Estás a usar receitas cujo custo ainda não foi validado pela produção.
            Confirma os valores antes de apresentar este orçamento a um cliente.
          </p>
        </div>
      )}

      {/* Barra fixa com o resumo */}
      {selections.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-8 py-3.5 z-40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Custo de Produção
              </span>
              <span className="font-mono text-base font-bold text-gray-700">
                {formatCurrency(resumo.custo)}
              </span>
            </div>

            <div className="h-7 w-px bg-gray-200" />

            <div>
              <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Lucro Previsto
              </span>
              <span className="font-mono text-base font-bold text-emerald-600">
                {formatCurrency(resumo.lucro)}
              </span>
            </div>

            <div className="h-7 w-px bg-gray-200" />

            <div>
              <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Markup / Margem
              </span>
              <span className="font-mono text-base font-bold text-blue-600">
                {resumo.markup}% <span className="text-gray-400">/</span>{' '}
                <span className="text-gray-600">{resumo.margemVenda}%</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Subtotal Venda
              </span>
              <span className="font-mono text-lg font-extrabold text-gray-900">
                {formatCurrency(resumo.venda)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition"
            >
              <FileCheck className="w-4 h-4" />
              Gerar Orçamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
