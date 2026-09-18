'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  LayoutTemplate,
  X,
  Loader2,
  Save,
  Trash2,
  ListPlus,
  Replace,
  AlertTriangle,
  ShieldAlert,
  Send,
  Check,
  Clock,
} from 'lucide-react';
import { ChapterTemplate, ChapterTemplateRequest, QuoteItem } from '@/types';
import { ChapterTemplateService } from '@/services/chapterTemplateService';

type ModoAplicar = 'acrescentar' | 'substituir';

interface Props {
  /** Título do capítulo aberto — serve de sugestão ao guardar um modelo. */
  chapterTitle: string;
  /** Artigos que o capítulo tem neste momento. */
  itemsAtuais: QuoteItem[];
  /** Só quem tem o módulo de orçamentos em 'edit' vê e usa isto. */
  podeEditar: boolean;
  /** Remover modelos e decidir pedidos é exclusivo da administração. */
  isAdmin: boolean;
  /** Nome de quem está a usar a app, para registo. */
  criadoPor?: string;
  onAplicar: (items: QuoteItem[], modo: ModoAplicar) => void;
}

export default function ChapterTemplateMenu({
  chapterTitle,
  itemsAtuais,
  podeEditar,
  isAdmin,
  criadoPor,
  onAplicar,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [lista, setLista] = useState<ChapterTemplate[]>([]);
  const [pedidos, setPedidos] = useState<ChapterTemplateRequest[]>([]);
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aTratar, setATratar] = useState<string | null>(null);

  // Passos que substituem a lista quando estão ativos.
  const [aAplicar, setAAplicar] = useState<ChapterTemplate | null>(null);
  const [aRemover, setARemover] = useState<ChapterTemplate | null>(null);
  const [aPedir, setAPedir] = useState<ChapterTemplate | null>(null);
  const [motivo, setMotivo] = useState('');

  // Guardar o capítulo atual como modelo novo.
  const [aGuardar, setAGuardar] = useState(false);
  const [nomeNovo, setNomeNovo] = useState('');
  const [aGravar, setAGravar] = useState(false);

  const capituloVazio = itemsAtuais.length === 0;

  const carregar = async () => {
    setACarregar(true);
    setErro(null);
    try {
      const [modelos, porDecidir] = await Promise.all([
        ChapterTemplateService.list(),
        ChapterTemplateService.listRequests().catch(() => []),
      ]);
      setLista(modelos);
      setPedidos(porDecidir);
    } catch {
      setErro('Não foi possível carregar os modelos. Verifica a ligação.');
    } finally {
      setACarregar(false);
    }
  };

  useEffect(() => {
    if (aberto) carregar();
  }, [aberto]);

  const voltarALista = () => {
    setAAplicar(null);
    setARemover(null);
    setAPedir(null);
    setMotivo('');
  };

  const fechar = () => {
    setAberto(false);
    voltarALista();
    setAGuardar(false);
    setNomeNovo('');
  };

  // Fechar com Escape
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aberto]);

  /* ---------------- aplicar ---------------- */

  const escolher = (modelo: ChapterTemplate) => {
    // Capítulo vazio não precisa de pergunta nenhuma.
    if (capituloVazio) {
      onAplicar(modelo.items, 'substituir');
      fechar();
      return;
    }
    setAAplicar(modelo);
  };

  const aplicar = (modo: ModoAplicar) => {
    if (!aAplicar) return;
    onAplicar(aAplicar.items, modo);
    fechar();
  };

  /* ---------------- guardar ---------------- */

  const guardar = async () => {
    const nome = nomeNovo.trim();
    if (!nome) {
      toast.error('Dá um nome ao modelo.');
      return;
    }
    if (capituloVazio) {
      toast.error('O capítulo está vazio — não há nada para guardar.');
      return;
    }
    setAGravar(true);
    try {
      await ChapterTemplateService.create({
        name: nome,
        items: itemsAtuais,
        createdBy: criadoPor,
      });
      toast.success(`Modelo "${nome}" guardado.`);
      setAGuardar(false);
      setNomeNovo('');
      await carregar();
    } catch (e: any) {
      toast.error(
        e?.code === '23505'
          ? 'Já existe um modelo com esse nome.'
          : 'Não foi possível guardar o modelo.'
      );
    } finally {
      setAGravar(false);
    }
  };

  /* ---------------- remover (admin) ---------------- */

  const removerMesmo = async () => {
    if (!aRemover?.id) return;
    setATratar(aRemover.id);
    try {
      await ChapterTemplateService.archive(aRemover.id);
      toast.success(`Modelo "${aRemover.name}" removido da lista.`);
      voltarALista();
      await carregar();
    } catch {
      toast.error('Não foi possível remover o modelo.');
    } finally {
      setATratar(null);
    }
  };

  /* ---------------- pedir (não-admin) ---------------- */

  const enviarPedido = async () => {
    if (!aPedir?.id) return;
    setATratar(aPedir.id);
    try {
      await ChapterTemplateService.createRequest({
        templateId: aPedir.id,
        templateName: aPedir.name,
        reason: motivo,
        requestedBy: criadoPor,
      });
      toast.success('Pedido enviado à administração.');
      voltarALista();
      await carregar();
    } catch (e: any) {
      toast.error(
        e?.code === '23505'
          ? 'Já existe um pedido pendente para este modelo.'
          : 'Não foi possível enviar o pedido.'
      );
    } finally {
      setATratar(null);
    }
  };

  /* ---------------- decidir (admin) ---------------- */

  const decidir = async (
    pedido: ChapterTemplateRequest,
    decisao: 'aprovado' | 'recusado'
  ) => {
    setATratar(pedido.id);
    try {
      if (decisao === 'aprovado') {
        await ChapterTemplateService.approveRequest(pedido, criadoPor);
        toast.success(`Modelo "${pedido.templateName}" removido.`);
      } else {
        await ChapterTemplateService.decideRequest(pedido.id, 'recusado', criadoPor);
        toast.success('Pedido recusado.');
      }
      await carregar();
    } catch {
      toast.error('Não foi possível registar a decisão.');
    } finally {
      setATratar(null);
    }
  };

  if (!podeEditar) return null;

  const meusPedidos = pedidos.map(p => p.templateId).filter(Boolean) as string[];

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        title="Modelos de capítulo"
        aria-label="Modelos de capítulo"
        className="shrink-0 text-gray-400 hover:text-gray-900 hover:bg-gray-200/70 rounded p-1 transition"
      >
        <LayoutTemplate className="w-3.5 h-3.5" />
      </button>

      {aberto &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4"
            onMouseDown={e => {
              if (e.target === e.currentTarget) fechar();
            }}
          >
            <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
              {/* Cabeçalho */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4 text-gray-400" />
                    Modelos de capítulo
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    Capítulo aberto: {chapterTitle || 'sem título'} ·{' '}
                    {itemsAtuais.length} artigo{itemsAtuais.length === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fechar}
                  className="text-gray-400 hover:text-gray-900 p-1 transition shrink-0"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ---------- passo: acrescentar ou substituir ---------- */}
              {aAplicar ? (
                <div className="p-5">
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 leading-relaxed">
                      Este capítulo já tem <strong>{itemsAtuais.length}</strong> artigo
                      {itemsAtuais.length === 1 ? '' : 's'}. O modelo{' '}
                      <strong>{aAplicar.name}</strong> traz{' '}
                      <strong>{aAplicar.items.length}</strong>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => aplicar('acrescentar')}
                      className="w-full text-left border border-gray-200 hover:border-black rounded-xl p-3 transition flex items-start gap-3"
                    >
                      <ListPlus className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                      <span>
                        <span className="block text-[13px] font-semibold text-gray-900">
                          Acrescentar no fim
                        </span>
                        <span className="block text-[11px] text-gray-500 mt-0.5">
                          Os artigos do modelo entram a seguir aos que já lá estão. Não
                          perdes nada.
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => aplicar('substituir')}
                      className="w-full text-left border border-gray-200 hover:border-red-400 rounded-xl p-3 transition flex items-start gap-3"
                    >
                      <Replace className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>
                        <span className="block text-[13px] font-semibold text-gray-900">
                          Substituir tudo
                        </span>
                        <span className="block text-[11px] text-gray-500 mt-0.5">
                          Apaga os {itemsAtuais.length} artigo
                          {itemsAtuais.length === 1 ? '' : 's'} que lá estão e põe só o
                          modelo.
                        </span>
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={voltarALista}
                    className="mt-4 text-xs text-gray-500 hover:text-gray-900 transition"
                  >
                    Voltar à lista
                  </button>
                </div>
              ) : aRemover ? (
                /* ---------- passo: confirmar remoção (admin) ---------- */
                <div className="p-5">
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-900 leading-relaxed">
                      Remover <strong>{aRemover.name}</strong> tira-o da lista de toda a
                      equipa. Os orçamentos já feitos com este modelo{' '}
                      <strong>não são afetados</strong> — os artigos foram copiados.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={removerMesmo}
                      disabled={aTratar === aRemover.id}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition"
                    >
                      {aTratar === aRemover.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Remover mesmo
                    </button>
                    <button
                      type="button"
                      onClick={voltarALista}
                      className="text-xs text-gray-500 hover:text-gray-900 px-2 py-2 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : aPedir ? (
                /* ---------- passo: pedir remoção (não-admin) ---------- */
                <div className="p-5">
                  <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                    <ShieldAlert className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-700 leading-relaxed">
                      Remover modelos é da administração. Explica porquê e o pedido fica
                      registado para o <strong>{aPedir.name}</strong>.
                    </p>
                  </div>
                  <textarea
                    autoFocus
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    placeholder="Motivo (ex: substituído pelo modelo novo de cozinha)"
                    className="w-full text-[13px] bg-white border border-gray-200 focus:border-black rounded-lg px-3 py-2 outline-none min-h-[70px] resize-y transition"
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={enviarPedido}
                      disabled={aTratar === aPedir.id}
                      className="text-xs bg-black text-white font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition"
                    >
                      {aTratar === aPedir.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Enviar pedido
                    </button>
                    <button
                      type="button"
                      onClick={voltarALista}
                      className="text-xs text-gray-500 hover:text-gray-900 px-2 py-2 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="max-h-[50vh] overflow-y-auto">
                    {/* ---------- pedidos por decidir (admin) ---------- */}
                    {isAdmin && pedidos.length > 0 && (
                      <div className="bg-amber-50/70 border-b border-amber-200">
                        <p className="px-5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Pedidos por decidir ({pedidos.length})
                        </p>
                        <ul className="divide-y divide-amber-100">
                          {pedidos.map(pedido => (
                            <li key={pedido.id} className="px-5 py-3">
                              <p className="text-[13px] font-semibold text-gray-900">
                                Remover “{pedido.templateName}”
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                Pedido por {pedido.requestedBy || 'desconhecido'}
                                {pedido.reason ? ` · ${pedido.reason}` : ''}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => decidir(pedido, 'aprovado')}
                                  disabled={aTratar === pedido.id}
                                  className="text-[11px] bg-white border border-gray-200 hover:border-black text-gray-900 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50 transition"
                                >
                                  {aTratar === pedido.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                  Aprovar e remover
                                </button>
                                <button
                                  type="button"
                                  onClick={() => decidir(pedido, 'recusado')}
                                  disabled={aTratar === pedido.id}
                                  className="text-[11px] text-gray-500 hover:text-gray-900 px-2 py-1.5 disabled:opacity-50 transition"
                                >
                                  Recusar
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* ---------- lista de modelos ---------- */}
                    {aCarregar ? (
                      <div className="px-5 py-8 flex items-center justify-center gap-2 text-xs text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        A carregar modelos…
                      </div>
                    ) : erro ? (
                      <div className="px-5 py-6 text-xs text-red-600">{erro}</div>
                    ) : lista.length === 0 ? (
                      <div className="px-5 py-8 text-center text-xs text-gray-400">
                        Ainda não há modelos guardados.
                        <br />
                        Monta um capítulo como gostas e guarda-o aqui em baixo.
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {lista.map(modelo => {
                          const jaPedido = !!modelo.id && meusPedidos.includes(modelo.id);
                          return (
                            <li
                              key={modelo.id}
                              className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition"
                            >
                              <button
                                type="button"
                                onClick={() => escolher(modelo)}
                                className="flex-1 min-w-0 text-left"
                              >
                                <span className="block text-[13px] font-semibold text-gray-900 truncate">
                                  {modelo.name}
                                </span>
                                <span className="block text-[11px] text-gray-400 mt-0.5">
                                  {modelo.items.length} artigo
                                  {modelo.items.length === 1 ? '' : 's'}
                                  {modelo.notes ? ` · ${modelo.notes}` : ''}
                                </span>
                              </button>

                              {isAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => setARemover(modelo)}
                                  title="Remover modelo da lista"
                                  className="text-gray-300 hover:text-red-500 p-1.5 transition shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : jaPedido ? (
                                <span
                                  title="Pedido de remoção já enviado"
                                  className="text-amber-500 p-1.5 shrink-0"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setAPedir(modelo)}
                                  title="Pedir remoção à administração"
                                  className="text-gray-300 hover:text-gray-900 p-1.5 transition shrink-0"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {/* ---------- guardar o capítulo atual ---------- */}
                  <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-4">
                    {aGuardar ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={nomeNovo}
                          onChange={e => setNomeNovo(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') guardar();
                          }}
                          placeholder="Nome do modelo (ex: Mobiliário Cozinha)"
                          className="flex-1 min-w-0 text-[13px] bg-white border border-gray-200 focus:border-black rounded-lg px-3 py-2 outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={guardar}
                          disabled={aGravar}
                          className="text-xs bg-black text-white font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition"
                        >
                          {aGravar ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAGuardar(false);
                            setNomeNovo('');
                          }}
                          className="text-gray-400 hover:text-gray-900 p-1.5 transition"
                          aria-label="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setNomeNovo(chapterTitle || '');
                          setAGuardar(true);
                        }}
                        disabled={capituloVazio}
                        title={
                          capituloVazio
                            ? 'O capítulo está vazio — não há nada para guardar'
                            : undefined
                        }
                        className="text-xs text-gray-700 hover:text-black font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Guardar este capítulo como modelo
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
