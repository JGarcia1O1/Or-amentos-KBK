'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TemplateService } from '@/services/templateService';
import { QuoteTemplate } from '@/types';
import { formatCurrency } from '@/lib/calculator';
import { UNIT_LABELS } from '@/lib/templateEngine';
import { toast } from 'sonner';
import {
  ChefHat,
  Loader2,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  BadgeCheck,
  AlertTriangle,
  EyeOff,
} from 'lucide-react';

/**
 * Receitas do Configurador — criar e ajustar sem SQL.
 * A percentagem é MARKUP sobre o custo, coerente com o calculator.ts.
 */
export default function QuoteTemplatesCard() {
  const { can, confirmAction } = useApp();
  const podeEditar = can('materials', 'edit');

  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  const carregar = async () => {
    setLoading(true);
    try {
      setTemplates(await TemplateService.getAll());
      setDirty(new Set());
    } catch {
      toast.error('Não foi possível carregar as receitas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = (id: string, campos: Partial<QuoteTemplate>) => {
    setTemplates(prev => prev.map(t => (t.id === id ? { ...t, ...campos } : t)));
    setDirty(prev => new Set(prev).add(id));
  };

  const gravar = async (t: QuoteTemplate) => {
    if (!t.id) return;
    setSavingId(t.id);
    try {
      await TemplateService.update(t.id, t);
      setDirty(prev => {
        const next = new Set(prev);
        next.delete(t.id!);
        return next;
      });
      toast.success(`"${t.name}" atualizada.`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao gravar.');
    } finally {
      setSavingId(null);
    }
  };

  const criar = async () => {
    try {
      const nova = await TemplateService.create({
        name: 'Nova receita',
        category: 'Cozinhas',
        unit: 'm',
        unitLabel: 'metro linear',
        designation: 'Descrição que aparece no artigo do orçamento',
        costPerUnit: 0,
        marginPercent: 0.6,
        fixedExtra: 0,
        isConfirmed: false,
        isActive: true,
        sortOrder: (templates.length + 1) * 10,
      });
      setTemplates(prev => [...prev, nova]);
      toast.success('Receita criada. Preenche os valores e grava.');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao criar receita.');
    }
  };

  const remover = (t: QuoteTemplate) => {
    confirmAction(
      'Remover Receita',
      `Deseja remover "${t.name}" do configurador? Os orçamentos já criados não são afetados.`,
      async () => {
        if (!t.id) return;
        try {
          await TemplateService.remove(t.id);
          setTemplates(prev => prev.filter(x => x.id !== t.id));
          toast.success('Receita removida.');
        } catch (e: any) {
          toast.error(e.message || 'Erro ao remover.');
        }
      }
    );
  };

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
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <ChefHat className="w-5 h-5 text-gray-800" />
          <div>
            <h3 className="font-bold text-sm text-gray-900">Receitas do Configurador</h3>
            <p className="text-[11px] text-gray-500">
              Custo por metro linear ou por m² de cada tipo de mobiliário.
              A percentagem é <strong>markup sobre o custo</strong>, como no resto do software.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={carregar}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
          {podeEditar && (
            <button
              type="button"
              onClick={criar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Receita
            </button>
          )}
        </div>
      </div>

      {!podeEditar && (
        <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <EyeOff className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 leading-relaxed">
            Tens acesso de consulta. Para alterar receitas é preciso permissão de
            edição no módulo de Chapas, Materiais &amp; Máquinas.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-6">
          <Loader2 className="w-4 h-4 animate-spin" />
          A carregar receitas...
        </div>
      )}

      {!loading && templates.length === 0 && (
        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl p-4">
          Ainda não há receitas. Cria a primeira em «Nova Receita».
        </div>
      )}

      <div className="space-y-5">
        {porCategoria.map(([categoria, lista]) => (
          <div key={categoria} className="space-y-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {categoria}
            </h4>

            {lista.map(t => {
              const id = t.id || '';
              const temAlteracoes = dirty.has(id);
              const vendaUnit = t.costPerUnit * (1 + t.marginPercent);
              const margemReal =
                1 + t.marginPercent > 0
                  ? (t.marginPercent / (1 + t.marginPercent)) * 100
                  : 0;

              return (
                <div
                  key={id}
                  className={`border rounded-xl p-4 space-y-3 ${
                    t.isActive ? 'border-gray-200 bg-gray-50/40' : 'border-gray-200 bg-gray-100/60'
                  }`}
                >
                  {/* Linha 1: nome e estado */}
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={t.name}
                      disabled={!podeEditar}
                      onChange={e => patch(id, { name: e.target.value })}
                      className="flex-1 min-w-[200px] text-xs font-bold bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-black transition disabled:bg-gray-50 disabled:text-gray-500"
                    />

                    <button
                      type="button"
                      disabled={!podeEditar}
                      onClick={() => patch(id, { isConfirmed: !t.isConfirmed })}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition disabled:opacity-60 ${
                        t.isConfirmed
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}
                      title="Custo validado pela produção"
                    >
                      {t.isConfirmed ? (
                        <BadgeCheck className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      {t.isConfirmed ? 'Confirmada' : 'Por confirmar'}
                    </button>

                    <button
                      type="button"
                      disabled={!podeEditar}
                      onClick={() => patch(id, { isActive: !t.isActive })}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                      title="Receitas inativas não aparecem no configurador"
                    >
                      {t.isActive ? 'Ativa' : 'Inativa'}
                    </button>

                    {podeEditar && (
                      <>
                        <button
                          type="button"
                          disabled={!temAlteracoes || savingId === id}
                          onClick={() => gravar(t)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {savingId === id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          Gravar
                        </button>
                        <button
                          type="button"
                          onClick={() => remover(t)}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition"
                          title="Remover receita"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Linha 2: valores */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Categoria
                      </label>
                      <input
                        type="text"
                        value={t.category}
                        disabled={!podeEditar}
                        onChange={e => patch(id, { category: e.target.value })}
                        className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-black transition disabled:bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Unidade
                      </label>
                      <select
                        value={t.unit}
                        disabled={!podeEditar}
                        onChange={e =>
                          patch(id, {
                            unit: e.target.value,
                            unitLabel: UNIT_LABELS[e.target.value] || e.target.value,
                          })
                        }
                        className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-black transition disabled:bg-gray-50"
                      >
                        <option value="m">m — metro linear</option>
                        <option value="m2">m² — metro quadrado</option>
                        <option value="un">un — unidade</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Custo / unidade
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={t.costPerUnit}
                        disabled={!podeEditar}
                        onChange={e => patch(id, { costPerUnit: Number(e.target.value) })}
                        className="w-full text-xs font-mono bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-black transition disabled:bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Markup
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={Math.round(t.marginPercent * 100)}
                          disabled={!podeEditar}
                          onChange={e =>
                            patch(id, { marginPercent: Number(e.target.value) / 100 })
                          }
                          className="w-full text-xs font-mono bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-black transition disabled:bg-gray-50"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Extra fixo
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={t.fixedExtra}
                        disabled={!podeEditar}
                        onChange={e => patch(id, { fixedExtra: Number(e.target.value) })}
                        className="w-full text-xs font-mono bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-black transition disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Linha 3: designação */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Designação no orçamento
                    </label>
                    <input
                      type="text"
                      value={t.designation}
                      disabled={!podeEditar}
                      onChange={e => patch(id, { designation: e.target.value })}
                      className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-black transition disabled:bg-gray-50"
                    />
                  </div>

                  {/* Leitura rápida */}
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-600 bg-white border border-gray-100 rounded-lg px-3 py-2">
                    <span>
                      Venda por {t.unitLabel || t.unit}:{' '}
                      <strong className="font-mono text-gray-900">{formatCurrency(vendaUnit)}</strong>
                    </span>
                    <span className="text-gray-300">|</span>
                    <span>
                      Margem real sobre a venda:{' '}
                      <strong className="font-mono text-gray-900">{margemReal.toFixed(1)}%</strong>
                    </span>
                    {t.source && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-400">Origem: {t.source}</span>
                      </>
                    )}
                  </div>

                  {t.notes && (
                    <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      {t.notes}
                    </div>
                  )}

                  {temAlteracoes && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      Há alterações por gravar nesta receita.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
