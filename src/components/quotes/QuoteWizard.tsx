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
  MessageSquare,
  CornerDownLeft,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BotDoubt,
  BotMatch,
  interpretar,
  unidadeDivergente,
} from '@/lib/quoteBotParser';

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

  // Ajustes por linha: substituem o markup e o extra da receita, sem a alterar.
  // Servem para adaptar a obra ou o cliente sem mexer no catálogo.
  const [ajustes, setAjustes] = useState<
    Record<string, { margem?: number; extra?: number }>
  >({});

  const selections: TemplateSelection[] = useMemo(
    () =>
      templates
        .map(t => {
          const id = t.id || '';
          const a = ajustes[id] || {};
          return {
            template: t,
            quantity: quantities[id] || 0,
            marginPercent: a.margem,
            fixedExtra: a.extra,
          };
        })
        .filter(s => s.quantity > 0),
    [templates, quantities, ajustes]
  );

  const setAjuste = (id: string, campo: 'margem' | 'extra', valor?: number) => {
    setAjustes(prev => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }));
  };

  const resumo = useMemo(() => summarize(selections), [selections]);

  const setQty = (id: string, value: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, Number(value) || 0) }));
  };

  // ============================================================
  // ASSISTENTE — escreve-se o pedido e ele preenche as quantidades
  // Interpretador próprio, sem serviços externos (src/lib/quoteBotParser.ts)
  // ============================================================
  const [pedido, setPedido] = useState('');
  const [entendido, setEntendido] = useState<BotMatch[]>([]);
  const [duvidas, setDuvidas] = useState<BotDoubt[]>([]);
  const [jaInterpretou, setJaInterpretou] = useState(false);

  const interpretarPedido = () => {
    if (!pedido.trim()) return;

    const { matches, doubts } = interpretar(pedido, templates);
    setEntendido(matches);
    setDuvidas(doubts);
    setJaInterpretou(true);

    if (matches.length === 0) {
      toast.error('Não consegui identificar nenhum modelo. Vê as notas abaixo.');
      return;
    }

    // Preenche as quantidades: o que o assistente entendeu passa a estar
    // nos mesmos campos que preencherias à mão, para poderes corrigir.
    setQuantities(prev => {
      const next = { ...prev };
      matches.forEach(m => {
        const id = m.template.id || '';
        if (id) next[id] = m.quantity;
      });
      return next;
    });

    // Markups e extras pedidos no texto entram como ajustes da linha
    setAjustes(prev => {
      const next = { ...prev };
      matches.forEach(m => {
        const id = m.template.id || '';
        if (!id) return;
        if (m.marginPercent !== undefined || m.fixedExtra !== undefined) {
          next[id] = {
            ...next[id],
            ...(m.marginPercent !== undefined ? { margem: m.marginPercent } : {}),
            ...(m.fixedExtra !== undefined ? { extra: m.fixedExtra } : {}),
          };
        }
      });
      return next;
    });

    const avisos = matches.filter(m => unidadeDivergente(m, pedido)).length;
    if (avisos > 0) {
      toast.warning(`${matches.length} linha(s) preenchida(s), mas confirma as unidades.`);
    } else {
      toast.success(`${matches.length} linha(s) preenchida(s). Confere antes de gerar.`);
    }
  };

  const escolherSugestao = (duvida: BotDoubt, t: QuoteTemplate) => {
    const id = t.id || '';
    if (!id) return;
    if (!duvida.quantidade) {
      toast.error('Falta a quantidade. Indica-a no campo da receita.');
    } else {
      setQty(id, duvida.quantidade);
      toast.success(`${t.name}: ${duvida.quantidade} ${t.unit}`);
    }
    setDuvidas(prev => prev.filter(d => d !== duvida));
  };

  const limparAssistente = () => {
    setPedido('');
    setEntendido([]);
    setDuvidas([]);
    setJaInterpretou(false);
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

      {/* ============================================================ */}
      {/* ASSISTENTE — escreve o pedido em texto corrido                */}
      {/* ============================================================ */}
      {!loading && templates.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-800" />
            <h3 className="text-xs font-bold text-gray-900">Descreve o que precisas</h3>
          </div>

          <textarea
            id="kubik-bot-pedido"
            value={pedido}
            onChange={e => setPedido(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                interpretarPedido();
              }
            }}
            placeholder="Ex: cozinha lacada normal de 5,2 metros com margem de 70% e roupeiro branco de correr 6 m2, extra de 500 para este cliente"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none text-xs min-h-[76px] resize-y leading-relaxed focus:border-black transition"
          />

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
              <CornerDownLeft className="w-3 h-3" />
              Enter para interpretar · Shift+Enter para mudar de linha
            </span>
            <div className="flex items-center gap-2">
              {jaInterpretou && (
                <button
                  type="button"
                  onClick={limparAssistente}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-semibold transition"
                >
                  Limpar
                </button>
              )}
              <button
                type="button"
                onClick={interpretarPedido}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 text-xs font-semibold transition"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Interpretar
              </button>
            </div>
          </div>

          {/* O que foi entendido */}
          {entendido.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {entendido.map((m, i) => {
                const divergente = unidadeDivergente(m, pedido);
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-[11px] bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700">
                      <strong className="text-gray-900">
                        {m.quantity} {m.template.unit}
                      </strong>{' '}
                      de {m.template.name}
                      {m.marginPercent !== undefined && (
                        <span className="text-gray-900">
                          {' '}· markup {Math.round(m.marginPercent * 100)}%
                          {m.deGeral && <span className="text-gray-400"> (geral)</span>}
                        </span>
                      )}
                      {m.fixedExtra !== undefined && (
                        <span className="text-gray-900">
                          {' '}· extra {formatCurrency(m.fixedExtra)}
                          {m.deGeral && <span className="text-gray-400"> (geral)</span>}
                        </span>
                      )}
                      {divergente && (
                        <span className="text-amber-700">
                          {' '}— atenção: esta receita é cobrada por{' '}
                          {unitLabel(m.template)}, confirma a quantidade.
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dúvidas */}
          {duvidas.length > 0 && (
            <div className="space-y-2 pt-1">
              {duvidas.map((d, i) => (
                <div
                  key={i}
                  className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-2"
                >
                  <div className="flex items-start gap-2 text-[11px] text-amber-900">
                    <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      {d.motivo === 'sem-quantidade' &&
                        <>Percebi o modelo em «{d.trecho}» mas falta a quantidade.</>}
                      {d.motivo === 'sem-modelo' &&
                        <>Não reconheci nenhum modelo em «{d.trecho}».</>}
                      {d.motivo === 'ambiguo' &&
                        <>«{d.trecho}» pode ser mais do que um modelo. Qual queres?</>}
                    </span>
                  </div>

                  {d.sugestoes && d.sugestoes.length > 0 && d.motivo === 'ambiguo' && (
                    <div className="flex flex-wrap gap-1.5 pl-5">
                      {d.sugestoes.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => escolherSugestao(d, s)}
                          className="px-2.5 py-1 bg-white border border-amber-200 text-amber-900 rounded-lg text-[10px] font-semibold hover:bg-amber-100 transition"
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {jaInterpretou && (
            <p className="text-[11px] text-gray-400 leading-relaxed pt-1">
              As quantidades foram lançadas nos campos abaixo. Confere e corrige
              o que for preciso antes de gerar — nada é gravado até carregares em
              Gerar Orçamento.
            </p>
          )}
        </div>
      )}

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
                const linha: TemplateSelection = {
                  template: t,
                  quantity: qtd,
                  marginPercent: ajustes[id]?.margem,
                  fixedExtra: ajustes[id]?.extra,
                };

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

                      {/* Markup e extra desta linha — substituem os da receita */}
                      {qtd > 0 && (
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">
                              Markup
                            </span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={Math.round(
                                  (ajustes[id]?.margem ?? t.marginPercent) * 100
                                )}
                                onChange={e =>
                                  setAjuste(id, 'margem', Number(e.target.value) / 100)
                                }
                                title={
                                  ajustes[id]?.margem !== undefined
                                    ? 'Ajustado nesta obra'
                                    : 'Valor da receita'
                                }
                                className={`w-14 text-center text-xs font-mono border rounded-lg p-1.5 outline-none focus:border-black transition ${
                                  ajustes[id]?.margem !== undefined
                                    ? 'bg-amber-50 border-amber-300'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              />
                              <span className="text-[10px] text-gray-400">%</span>
                            </div>
                          </div>

                          <div>
                            <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">
                              Extra
                            </span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={ajustes[id]?.extra ?? t.fixedExtra}
                                onChange={e =>
                                  setAjuste(id, 'extra', Number(e.target.value))
                                }
                                title={
                                  ajustes[id]?.extra !== undefined
                                    ? 'Ajustado nesta obra'
                                    : 'Valor da receita'
                                }
                                className={`w-20 text-center text-xs font-mono border rounded-lg p-1.5 outline-none focus:border-black transition ${
                                  ajustes[id]?.extra !== undefined
                                    ? 'bg-amber-50 border-amber-300'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              />
                              <span className="text-[10px] text-gray-400">€</span>
                            </div>
                          </div>
                        </div>
                      )}

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
