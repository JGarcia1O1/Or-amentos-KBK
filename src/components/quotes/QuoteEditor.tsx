'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  Quote,
  QuoteChapter,
  QuoteItem,
  QuoteStatus,
  AutomaticItemConfig,
} from '@/types';
import {
  formatCurrency,
  calculateItemSellUnit,
  calculateItemSellTotal,
  calculateQuoteCost,
  calculateQuoteSubtotal,
  calculateQuoteTotalWithVat,
  calculateQuoteMarginPercent,
} from '@/lib/calculator';
import TechnicalCalculatorModal from './TechnicalCalculatorModal';
import QuotePaymentsPanel from './QuotePaymentsPanel';
import { SearchableMaterialDropdown } from '@/components/ui/SearchableMaterialDropdown';
import {
  ArrowLeft,
  Calculator,
  Plus,
  Trash2,
  X,
  CornerDownRight,
  FileCheck,
  FolderPlus,
  Sparkles,
  Pencil,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Wrench,
  Copy,
  CheckCircle2,
  XCircle,
  Lock,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export default function QuoteEditor() {
  const {
    selectedQuote,
    updateSelectedQuote,
    setCurrentView,
    confirmAction,
    clients,
    materials,
    setMaterials,
    workstations,
    hardware,
    edges,
    openPdfPreview,
    hideInternal,
    isAdmin,
  } = useApp();

  // Itens expandidos para o painel de fabrico automático
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Margem global (em % inteiros) aplicada a todos os artigos do orçamento
  const [margemGlobal, setMargemGlobal] = useState<number>(() => {
    const primeiro = selectedQuote?.chapters?.[0]?.items?.[0];
    return Math.round((primeiro?.marginPercent ?? 0.6) * 100);
  });

  // Cartões abertos no telemóvel (a lista arranca toda fechada)
  const [cartaoAberto, setCartaoAberto] = useState<Record<string, boolean>>({});

  // Arrastar artigos, só no computador.
  // A linha só fica arrastável enquanto a pega está premida — se estivesse
  // sempre, não se conseguia selecionar texto dentro dos campos da linha.
  const [linhaArrastavel, setLinhaArrastavel] = useState<string | null>(null);
  const [aArrastar, setAArrastar] = useState<{ cIdx: number; iIdx: number } | null>(null);
  // Guarda também de que lado da linha está o cursor, para desenhar o traço
  // por cima ou por baixo e o utilizador ver onde é que aquilo vai cair.
  const [linhaAlvo, setLinhaAlvo] = useState<{ id: string; acima: boolean } | null>(null);

  // Barra de rentabilidade no telemóvel: fechada mostra só o total
  const [rentabilidadeAberta, setRentabilidadeAberta] = useState(false);

  // Estado do Modal da Calculadora Técnica (Aparador / Peça a Peça)
  const [activeItemForCalc, setActiveItemForCalc] = useState<{
    chapterIndex: number;
    itemIndex: number;
    item: QuoteItem;
  } | null>(null);

  if (!selectedQuote) {
    return (
      <div className="p-12 text-center text-gray-500">
        Nenhum orçamento selecionado.{' '}
        <button
          type="button"
          onClick={() => setCurrentView('quotes-list')}
          className="text-black font-semibold underline"
        >
          Voltar à lista
        </button>
      </div>
    );
  }

  const quote = selectedQuote;

  const toggleExpandItem = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Atualização dos campos de topo
  const handleTopFieldChange = (field: keyof Quote, val: any) => {
    updateSelectedQuote({
      ...quote,
      [field]: val,
    });
  };

  // Aplicar a margem global a todos os artigos de todos os capítulos
  const aplicarMargemGlobal = () => {
    const percentagem = Number(margemGlobal) || 0;
    const fracao = percentagem / 100;

    const totalLinhas = quote.chapters.reduce(
      (acc, ch) => acc + (ch.items?.length || 0),
      0
    );

    if (totalLinhas === 0) {
      toast.error('Não existem artigos para aplicar a margem.');
      return;
    }

    confirmAction(
      'Aplicar Margem Global',
      `Vai aplicar ${percentagem}% de margem a ${totalLinhas} artigo(s) deste orçamento. As margens definidas linha a linha serão substituídas. Confirma?`,
      () => {
        const newChapters = quote.chapters.map(chap => ({
          ...chap,
          items: chap.items.map(it => ({
            ...it,
            marginPercent: fracao,
          })),
        }));

        updateSelectedQuote({ ...quote, chapters: newChapters });
        toast.success(
          `Margem de ${percentagem}% aplicada a ${totalLinhas} artigo(s).`
        );
      }
    );
  };

  const handleStatusChange = (newStatus: QuoteStatus) => {
    if (newStatus === 'Adjudicado' && quote.status !== 'Adjudicado') {
      confirmAction(
        'Aprovar Orçamento e Abater Stock',
        'Deseja aprovar este orçamento? Esta ação irá abater automaticamente as chapas e materiais utilizados ao stock do armazém.',
        async () => {
          handleTopFieldChange('status', newStatus);
          
          try {
            // Calcular materiais utilizados no modo automático
            const usedMaterials: Record<string, number> = {};
            
            quote.chapters.forEach(ch => {
              ch.items.forEach(item => {
                if (item.calculationMode === 'automatic' && item.automaticConfig) {
                  const code = item.automaticConfig.materialCode;
                  const qty = item.quantity || 1;
                  const sheetsPerUnit = item.automaticConfig.sheetUsage || 0;
                  const totalSheets = qty * sheetsPerUnit;
                  
                  if (code && totalSheets > 0) {
                    usedMaterials[code] = (usedMaterials[code] || 0) + totalSheets;
                  }
                }
              });
            });

            const codes = Object.keys(usedMaterials);
            if (codes.length === 0) {
              toast.success('Estado atualizado. (Nenhum material automático para abater)');
              return;
            }

            // Fazer a atualização
            let updatedMaterials = [...materials];

            for (const code of codes) {
              const deductAmount = usedMaterials[code];
              const currentMat = updatedMaterials.find(m => m.code === code);
              
              if (currentMat) {
                const currentStock = currentMat.quantity || 0;
                // Prevenir valores negativos no front-end por segurança, mas permite se necessário dependendo das regras
                const newQty = Math.max(0, currentStock - deductAmount);
                
                // Atualizar Supabase
                const { error } = await supabase
                  .from('materials')
                  .update({ quantity: newQty })
                  .eq('code', code);
                  
                if (error) throw error;
                
                // Atualizar Estado Local
                updatedMaterials = updatedMaterials.map(m => 
                  m.code === code ? { ...m, quantity: newQty } : m
                );
              }
            }

            setMaterials(updatedMaterials);
            toast.success(`Stock de ${codes.length} materiais abatido com sucesso!`);
          } catch (err: any) {
            console.error('Erro ao abater stock:', err);
            toast.error('Ocorreu um erro ao abater stock na Base de Dados.');
          }
        }
      );
    } else {
      handleTopFieldChange('status', newStatus);
    }
  };

  // Quando muda o cliente, preenche automaticamente os seus dados
  const handleClientChange = (clientName: string) => {
    const client = clients.find(c => c.name === clientName);
    updateSelectedQuote({
      ...quote,
      clientName,
      clientNif: client ? client.nif : quote.clientNif,
      clientAddress: client ? client.address : quote.clientAddress,
      clientPostalCode: client ? client.postalCode : quote.clientPostalCode,
      clientCity: client ? client.city : quote.clientCity,
      clientPhone: client ? client.phone : quote.clientPhone,
      clientEmail: client ? client.email : quote.clientEmail,
    });
  };

  // Gestão de Capítulos
  const handleAddChapter = () => {
    const nextChapterNum = quote.chapters.length + 1;
    const isAuto = quote.type === 'automatic';

    const initialItem: QuoteItem = isAuto
      ? {
          id: `${nextChapterNum}.1`,
          code: `${nextChapterNum}.1`,
          designation: 'Mobiliário por medida (Cálculo Automático)',
          unit: 'un',
          quantity: 1,
          costUnit: 147.5,
          marginPercent: 0.6,
          fixedExtra: 50.0,
          calculationMode: 'automatic',
          automaticConfig: {
            materialCode: materials[0]?.code || '502114',
            sheetUsage: 1,
            edgeBandingMeters: 10,
            edgeBandingRate: 0.7,
            operations: workstations.map(ws => ({
              workstationCode: ws.code,
              opMin: ws.code === 'SH' ? 60 : ws.code === 'CNC' ? 45 : ws.code === 'ORLADORA' ? 30 : 60,
              setupMin: 15,
            })),
            hardware: [
              { hardwareCode: hardware[0]?.code || '524971', qty: 4 },
              { hardwareCode: hardware[6]?.code || '524966', qty: 2 },
            ],
          },
        }
      : {
          id: `${nextChapterNum}.1`,
          code: `${nextChapterNum}.1`,
          designation: 'Novo artigo personalizado',
          unit: 'un',
          quantity: 1,
          costUnit: 100,
          marginPercent: 0.5,
          fixedExtra: 0,
          calculationMode: 'quick',
        };

    const newChapter: QuoteChapter = {
      id: nextChapterNum,
      title: 'Novo Capítulo',
      items: [initialItem],
    };

    updateSelectedQuote({
      ...quote,
      chapters: [...quote.chapters, newChapter],
    });
  };

  const handleRemoveChapter = (chapterIndex: number) => {
    confirmAction('Remover Capítulo', 'Tem a certeza que deseja remover este capítulo e todos os seus artigos?', () => {
      updateSelectedQuote({
        ...quote,
        chapters: quote.chapters.filter((_, idx) => idx !== chapterIndex),
      });
    });
  };

  const handleUpdateChapterTitle = (chapterIndex: number, title: string) => {
    const newChapters = quote.chapters.map((chap, idx) =>
      idx === chapterIndex ? { ...chap, title } : chap
    );
    updateSelectedQuote({ ...quote, chapters: newChapters });
  };

  // Gestão de Artigos dentro de um Capítulo
  const handleAddItem = (chapterIndex: number) => {
    const targetChapter = quote.chapters[chapterIndex];
    const nextItemNum = targetChapter.items.length + 1;
    const newItemCode = `${chapterIndex + 1}.${nextItemNum}`;
    const isAuto = quote.type === 'automatic';

    const newItem: QuoteItem = isAuto
      ? {
          id: `${chapterIndex + 1}.${Date.now()}`,
          code: newItemCode,
          designation: 'Mobiliário por medida (Cálculo Automático)',
          unit: 'un',
          quantity: 1,
          costUnit: 147.5,
          marginPercent: 0.6,
          fixedExtra: 50.0,
          calculationMode: 'automatic',
          automaticConfig: {
            materialCode: materials[0]?.code || '502114',
            sheetUsage: 1,
            edgeBandingMeters: 10,
            edgeBandingRate: 0.7,
            operations: workstations.map(ws => ({
              workstationCode: ws.code,
              opMin: ws.code === 'SH' ? 60 : ws.code === 'CNC' ? 45 : ws.code === 'ORLADORA' ? 30 : 60,
              setupMin: 15,
            })),
            hardware: [
              { hardwareCode: hardware[0]?.code || '524971', qty: 4 },
              { hardwareCode: hardware[6]?.code || '524966', qty: 2 },
            ],
          },
        }
      : {
          id: `${chapterIndex + 1}.${Date.now()}`,
          code: newItemCode,
          designation: 'Mobiliário por medida',
          unit: 'un',
          quantity: 1,
          costUnit: 250,
          marginPercent: 0.5,
          fixedExtra: 0,
          calculationMode: 'quick',
        };

    const newChapters = quote.chapters.map((chap, idx) =>
      idx === chapterIndex
        ? { ...chap, items: [...chap.items, newItem] }
        : chap
    );

    updateSelectedQuote({ ...quote, chapters: newChapters });
  };

  const handleRemoveItem = (chapterIndex: number, itemIndex: number) => {
    const newChapters = quote.chapters.map((chap, idx) => {
      if (idx === chapterIndex) {
        return {
          ...chap,
          items: chap.items.filter((_, iIdx) => iIdx !== itemIndex),
        };
      }
      return chap;
    });

    updateSelectedQuote({ ...quote, chapters: newChapters });
  };

  // Duplicar Artigo — em cozinhas e roupeiros os módulos repetem-se com
  // pequenas variações, por isso copiar e ajustar poupa muito tempo.
  // A cópia leva tudo (modo de cálculo, configuração automática, ferragens),
  // com id novo e um código provisório; a numeração final é sempre gerada
  // on-the-fly a partir da posição e da flag isSubItem.
  const handleDuplicateItem = (chapterIndex: number, itemIndex: number) => {
    const original = quote.chapters[chapterIndex].items[itemIndex];

    const copy: QuoteItem = {
      ...JSON.parse(JSON.stringify(original)),
      id: `${chapterIndex + 1}.${Date.now()}`,
    };

    const newChapters = quote.chapters.map((chap, idx) => {
      if (idx !== chapterIndex) return chap;
      const items = [...chap.items];
      items.splice(itemIndex + 1, 0, copy); // entra logo a seguir ao original
      return { ...chap, items };
    });

    updateSelectedQuote({ ...quote, chapters: newChapters });
    toast.success('Artigo duplicado.');
  };

  // ============================================================
  // REORDENAR ARTIGOS
  // Um artigo principal anda sempre com os sub-artigos que vêm logo a
  // seguir — decisão do João. Um sub-artigo move-se sozinho.
  // A numeração (1.2, 1.2.1) nunca é gravada: é gerada a partir da posição
  // e da flag isSubItem, por isso acerta-se sozinha depois de qualquer
  // movimento. Não é preciso mexer em códigos aqui.
  // ============================================================

  /** Quantos artigos andam juntos a partir deste índice. */
  const tamanhoDoBloco = (items: QuoteItem[], idx: number): number => {
    if (!items[idx] || items[idx].isSubItem) return 1;
    let n = 1;
    while (idx + n < items.length && items[idx + n].isSubItem) n++;
    return n;
  };

  /** Índice do artigo principal a que este pertence. */
  const inicioDoBloco = (items: QuoteItem[], idx: number): number => {
    let i = idx;
    while (i > 0 && items[i]?.isSubItem) i--;
    return i;
  };

  /** Grava a nova ordem, garantindo que o primeiro artigo nunca é sub-artigo. */
  const aplicarOrdem = (chapterIndex: number, items: QuoteItem[]) => {
    const normalizados =
      items.length > 0 && items[0].isSubItem
        ? [{ ...items[0], isSubItem: false }, ...items.slice(1)]
        : items;

    const newChapters = quote.chapters.map((chap, cIdx) =>
      cIdx === chapterIndex ? { ...chap, items: normalizados } : chap
    );
    updateSelectedQuote({ ...quote, chapters: newChapters });
  };

  /**
   * Largar um artigo em cima de outro (arrastar no computador).
   * `acima` diz se o cursor estava na metade de cima da linha de destino —
   * é isso que decide se entra antes ou depois dela.
   */
  const reordenarArtigo = (
    chapterIndex: number,
    de: number,
    para: number,
    acima: boolean
  ) => {
    const items = [...quote.chapters[chapterIndex].items];
    if (!items[de]) return;

    const tam = tamanhoDoBloco(items, de);
    // Largar dentro do próprio bloco não faz nada
    if (para >= de && para < de + tam) return;

    let destino: number;
    if (items[de].isSubItem) {
      destino = acima ? para : para + 1;
    } else {
      // Um artigo principal nunca se mete entre outro pai e os filhos dele:
      // encosta sempre ao início, ou ao fim, do bloco de destino.
      const inicio = inicioDoBloco(items, para);
      destino = acima ? inicio : inicio + tamanhoDoBloco(items, inicio);
    }

    if (destino === de) return;

    const bloco = items.splice(de, tam);
    const ajustado = destino > de ? destino - tam : destino;
    items.splice(Math.max(0, Math.min(ajustado, items.length)), 0, ...bloco);

    aplicarOrdem(chapterIndex, items);
  };

  /** Setas para cima/baixo (telemóvel). */
  const moverArtigo = (chapterIndex: number, iIdx: number, direcao: -1 | 1) => {
    const items = [...quote.chapters[chapterIndex].items];
    const alvo = items[iIdx];
    if (!alvo) return;

    if (alvo.isSubItem) {
      const destino = iIdx + direcao;
      if (destino < 0 || destino >= items.length) return;
      const copia = [...items];
      copia[iIdx] = items[destino];
      copia[destino] = items[iIdx];
      aplicarOrdem(chapterIndex, copia);
      return;
    }

    const tam = tamanhoDoBloco(items, iIdx);

    if (direcao === -1) {
      if (iIdx === 0) return;
      const anterior = inicioDoBloco(items, iIdx - 1);
      const bloco = items.splice(iIdx, tam);
      items.splice(anterior, 0, ...bloco);
    } else {
      const seguinte = iIdx + tam;
      if (seguinte >= items.length) return;
      const tamSeguinte = tamanhoDoBloco(items, seguinte);
      const bloco = items.splice(iIdx, tam);
      items.splice(iIdx + tamSeguinte, 0, ...bloco);
    }

    aplicarOrdem(chapterIndex, items);
  };

  const limparArrasto = () => {
    setAArrastar(null);
    setLinhaAlvo(null);
    setLinhaArrastavel(null);
  };

  // ============================================================
  // ÂMBITO DA PROPOSTA — o que está incluído e o que fica de fora.
  // Listas simples de texto, guardadas no orçamento.
  // ============================================================
  type ScopeList = 'scopeIncluded' | 'scopeExcluded';

  const handleAddScope = (list: ScopeList) => {
    const current = quote[list] || [];
    updateSelectedQuote({ ...quote, [list]: [...current, ''] });
  };

  const handleUpdateScope = (list: ScopeList, index: number, value: string) => {
    const current = [...(quote[list] || [])];
    current[index] = value;
    updateSelectedQuote({ ...quote, [list]: current });
  };

  const handleRemoveScope = (list: ScopeList, index: number) => {
    const current = (quote[list] || []).filter((_, i) => i !== index);
    updateSelectedQuote({ ...quote, [list]: current });
  };

  const handleUpdateItem = (
    chapterIndex: number,
    itemIndex: number,
    field: keyof QuoteItem,
    val: any
  ) => {
    const newChapters = quote.chapters.map((chap, cIdx) => {
      if (cIdx === chapterIndex) {
        const newItems = chap.items.map((item, iIdx) =>
          iIdx === itemIndex ? { ...item, [field]: val } : item
        );
        return { ...chap, items: newItems };
      }
      return chap;
    });

    updateSelectedQuote({ ...quote, chapters: newChapters });
  };

  // Alternar entre modo manual e automático para um artigo
  const handleToggleItemMode = (
    chapterIndex: number,
    itemIndex: number,
    targetMode: 'quick' | 'automatic'
  ) => {
    const currentItem = quote.chapters[chapterIndex].items[itemIndex];
    let newConfig = currentItem.automaticConfig;

    if (targetMode === 'automatic' && !newConfig) {
      newConfig = {
        materialCode: materials[0]?.code || '502114',
        sheetUsage: 1,
        edgeBandingMeters: 10,
        edgeBandingRate: 0.7,
        operations: workstations.map(ws => ({
          workstationCode: ws.code,
          opMin: ws.code === 'SH' ? 60 : ws.code === 'CNC' ? 45 : ws.code === 'ORLADORA' ? 30 : 60,
          setupMin: 15,
        })),
        hardware: [
          { hardwareCode: hardware[0]?.code || '524971', qty: 4 },
        ],
      };
    }

    let calculatedCost = currentItem.costUnit;
    if (targetMode === 'automatic' && newConfig) {
      calculatedCost = calculateUnitCostFromConfig(newConfig);
    }

    const newChapters = quote.chapters.map((chap, cIdx) => {
      if (cIdx === chapterIndex) {
        const newItems = chap.items.map((it, iIdx) =>
          iIdx === itemIndex
            ? {
                ...it,
                calculationMode: targetMode,
                automaticConfig: newConfig,
                costUnit: targetMode === 'automatic' ? calculatedCost : it.costUnit,
              }
            : it
        );
        return { ...chap, items: newItems };
      }
      return chap;
    });

    setExpandedItems(prev => ({
      ...prev,
      [currentItem.id]: targetMode === 'automatic' ? true : prev[currentItem.id],
    }));

    updateSelectedQuote({ ...quote, chapters: newChapters });
  };

  // Fórmula de Cálculo Automático do Custo Unitário
  const calculateUnitCostFromConfig = (cfg: AutomaticItemConfig): number => {
    // 1. Material
    const mat = materials.find(m => m.code === cfg.materialCode);
    const matCost = (cfg.sheetUsage || 0) * (mat ? mat.price : 0);

    // 2. Orlas
    let edgeRate = 0.7; // Fallback
    if (cfg.edgeCode) {
      const edgeMat = edges.find(e => e.code === cfg.edgeCode);
      if (edgeMat) {
        edgeRate = edgeMat.pricePerMeter;
      }
    } else if (cfg.edgeBandingRate !== undefined) {
      edgeRate = cfg.edgeBandingRate;
    }
    const edgeCost = (cfg.edgeBandingMeters || 0) * edgeRate;

    // 3. Máquinas
    let opsCost = 0;
    cfg.operations.forEach(op => {
      if (op.isActive !== false) { // Se não estiver explicitamente false, assume true (para suportar orçamentos antigos)
        const ws = workstations.find(w => w.code === op.workstationCode);
        const rate = ws ? ws.rate : 0;
        opsCost += ((op.opMin || 0) * rate) / 60 + ((op.setupMin || 0) * rate) / 60;
      }
    });

    // 4. Ferragens
    let hwCost = 0;
    cfg.hardware.forEach(h => {
      const item = hardware.find(x => x.code === h.hardwareCode);
      const price = item ? item.price : 0;
      hwCost += (h.qty || 0) * price;
    });

    return Math.round((matCost + edgeCost + opsCost + hwCost) * 100) / 100;
  };

  // Atualizar a configuração automática de um artigo
  const handleUpdateItemAutomaticConfig = (
    chapterIndex: number,
    itemIndex: number,
    newConfig: AutomaticItemConfig
  ) => {
    const calculatedCost = calculateUnitCostFromConfig(newConfig);

    const newChapters = quote.chapters.map((chap, cIdx) => {
      if (cIdx === chapterIndex) {
        const newItems = chap.items.map((it, iIdx) =>
          iIdx === itemIndex
            ? {
                ...it,
                automaticConfig: newConfig,
                costUnit: calculatedCost,
              }
            : it
        );
        return { ...chap, items: newItems };
      }
      return chap;
    });

    updateSelectedQuote({ ...quote, chapters: newChapters });
  };

  // Aplica o custo vindo da calculadora técnica (Aparador)
  const handleApplyTechnicalCost = (cost: number) => {
    if (!activeItemForCalc) return;
    const { chapterIndex, itemIndex } = activeItemForCalc;
    handleUpdateItem(chapterIndex, itemIndex, 'costUnit', cost);
    setActiveItemForCalc(null);
  };

  // Numera os artigos e calcula os valores de venda uma única vez por capítulo.
  // A mesma lista serve a tabela do desktop e os cartões do telemóvel.
  const enriquecerItens = (chap: QuoteChapter, cIdx: number) => {
    let principal = 0;
    let sub = 0;
    return chap.items.map((item, iIdx) => {
      if (item.isSubItem) {
        sub++;
      } else {
        principal++;
        sub = 0;
      }
      return {
        item,
        iIdx,
        displayCode: item.isSubItem
          ? `${cIdx + 1}.${principal}.${sub}`
          : `${cIdx + 1}.${principal}`,
        sellUnit: calculateItemSellUnit(item),
        sellTotal: calculateItemSellTotal(item),
        isAuto: item.calculationMode === 'automatic',
      };
    });
  };

  const alternarCartao = (id: string) =>
    setCartaoAberto(prev => ({ ...prev, [id]: !prev[id] }));

  // Passos dos botões − e + no telemóvel
  const passoMargem = (cIdx: number, iIdx: number, atual: number, delta: number) => {
    const emPercent = Math.round((atual || 0) * 100) + delta;
    handleUpdateItem(cIdx, iIdx, 'marginPercent', Math.max(0, emPercent) / 100);
  };

  const passoQuantidade = (cIdx: number, iIdx: number, atual: number, delta: number) => {
    handleUpdateItem(cIdx, iIdx, 'quantity', Math.max(0, (atual || 0) + delta));
  };

  // Saltar para um capítulo a partir da barra deslizante
  const irParaCapitulo = (cIdx: number) => {
    const alvo = document.getElementById(`capitulo-${cIdx}`);
    if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Cálculos Globais
  const totalCost = calculateQuoteCost(quote);
  const subtotal = calculateQuoteSubtotal(quote);
  const totalWithVat = calculateQuoteTotalWithVat(quote);
  const grossProfit = subtotal - totalCost;
  const overallMargin = calculateQuoteMarginPercent(quote);

  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 pb-44 md:pb-28 w-full">
      {/* Barra deslizante de capítulos — só no telemóvel */}
      {quote.chapters.length > 1 && (
        <div className="md:hidden -mx-4 px-4 sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm py-2 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto scroll-limpo">
            {quote.chapters.map((chap, cIdx) => (
              <button
                key={chap.id}
                type="button"
                onClick={() => irParaCapitulo(cIdx)}
                className="shrink-0 h-8 px-3 rounded-full bg-white border border-gray-200 text-gray-600 text-xs font-semibold active:bg-gray-100 transition-colors max-w-[60vw] truncate"
              >
                {cIdx + 1} · {chap.title || 'Sem título'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 1. Cabeçalho de Dados Gerais do Orçamento */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentView('quotes-list')}
              className="text-gray-400 hover:text-black transition"
              title="Voltar à lista"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-base font-bold text-gray-900">
                  <span>Orçamento nº</span>
                  <input
                    type="text"
                    value={quote.number}
                    onChange={e => handleTopFieldChange('number', e.target.value)}
                    className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black focus:outline-none px-1 py-0.5 w-32 font-bold"
                  />
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    quote.type === 'automatic'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {quote.type === 'automatic'
                    ? 'Modo Automático / Fabrico'
                    : 'Modo Manual / Rápido'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 font-medium">Estado:</label>
              <select
                value={quote.status}
                onChange={e => handleStatusChange(e.target.value as QuoteStatus)}
                className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 outline-none cursor-pointer"
              >
                <option value="Rascunho">Rascunho</option>
                <option value="Apresentado">Apresentado</option>
                <option value="Adjudicado">Adjudicado (Aprovado)</option>
                {/* Realizado não se escolhe à mão: é o software que o põe
                    quando as duas metades ficam marcadas como pagas. */}
                <option value="Realizado" disabled>
                  Realizado (pago na totalidade)
                </option>
                <option value="Recusado">Recusado</option>
              </select>
            </div>

            {/* Margem Global — aplica a todos os artigos do orçamento */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 font-medium">
                Margem global:
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={margemGlobal}
                  onFocus={e => e.target.select()}
                  onChange={e => setMargemGlobal(Number(e.target.value))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      aplicarMargemGlobal();
                    }
                  }}
                  className="w-14 text-center text-xs font-mono font-bold bg-transparent px-1 py-1 outline-none"
                />
                <span className="text-xs text-gray-400 pr-2">%</span>
                <button
                  type="button"
                  onClick={aplicarMargemGlobal}
                  title="Aplicar esta margem a todos os artigos do orçamento"
                  className="text-xs font-semibold bg-gray-900 hover:bg-black text-white px-3 py-1 transition"
                >
                  Aplicar
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openPdfPreview(quote)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>PDF Oficial</span>
            </button>
          </div>
        </div>

        {/* Campos de Identificação */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-gray-500 font-bold mb-1">Cliente</label>
            <select
              value={quote.clientName}
              onChange={e => handleClientChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-semibold outline-none cursor-pointer"
            >
              {clients.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-500 font-bold mb-1">
              NIF do Cliente
            </label>
            <input
              type="text"
              value={quote.clientNif}
              onChange={e => handleTopFieldChange('clientNif', e.target.value)}
              placeholder="Ex: 514288256"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-gray-500 font-bold mb-1">
              Data de Emissão
            </label>
            <input
              type="text"
              value={quote.date}
              onChange={e => handleTopFieldChange('date', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-gray-500 font-bold mb-1">
              Responsável Comercial
            </label>
            <input
              type="text"
              value={quote.responsible}
              onChange={e => handleTopFieldChange('responsible', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-500 font-bold mb-1">
              Morada de Obra / Faturação *
            </label>
            <input
              type="text"
              value={quote.clientAddress || ''}
              onChange={e => handleTopFieldChange('clientAddress', e.target.value)}
              placeholder="Morada de obra/faturação"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none mb-2"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={quote.clientPostalCode || ''}
                onChange={e => handleTopFieldChange('clientPostalCode', e.target.value)}
                placeholder="C. Postal (Ex: 4000-123)"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none font-mono text-sm"
              />
              <input
                type="text"
                value={quote.clientCity || ''}
                onChange={e => handleTopFieldChange('clientCity', e.target.value)}
                placeholder="Localidade (Ex: Porto)"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none text-sm"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-500 font-bold mb-1">
              Nome do Projeto / Obra (Opcional)
            </label>
            <input
              type="text"
              value={quote.projectName || ''}
              onChange={e => handleTopFieldChange('projectName', e.target.value)}
              placeholder="Ex: Residência da Boavista"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-500 font-bold mb-1">
              Telemóvel do Cliente
            </label>
            <input
              type="text"
              value={quote.clientPhone || ''}
              onChange={e => handleTopFieldChange('clientPhone', e.target.value)}
              placeholder="Ex: 910 000 000"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-500 font-bold mb-1">
              Email do Cliente
            </label>
            <input
              type="email"
              value={quote.clientEmail || ''}
              onChange={e => handleTopFieldChange('clientEmail', e.target.value)}
              placeholder="Ex: cliente@email.com"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none"
            />
          </div>

          {/* Campo de Observações / Faturação */}
          <div className="md:col-span-4 mt-2">
            <label className="block text-gray-500 font-bold mb-1">
              Observações (Obra e Faturação)
            </label>
            <textarea
              value={quote.notes || ''}
              onChange={e => handleTopFieldChange('notes', e.target.value)}
              placeholder="Adicione aqui documentação referente à obra, dados de faturação, ou outras notas relevantes..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none min-h-[80px] resize-y leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* 1.5. Recebimentos — só em orçamentos adjudicados e só para a
          administração. Painel interno: vive em tabelas próprias, não toca
          no orçamento e nunca aparece no PDF. */}
      {isAdmin &&
        (quote.status === 'Adjudicado' || quote.status === 'Realizado') && (
          <QuotePaymentsPanel quote={quote} />
        )}

      {/* 2. Tabela Hierárquica de Capítulos & Artigos */}
      <div className="space-y-6">
        {quote.chapters.map((chap, cIdx) => (
          <div
            key={chap.id}
            id={`capitulo-${cIdx}`}
            className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden scroll-mt-20"
          >
            {/* Cabeçalho do Capítulo */}
            <div className="bg-gray-100/70 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 border-b border-gray-200">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="w-5 h-5 shrink-0 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                  {cIdx + 1}
                </span>
                <input
                  type="text"
                  value={chap.title}
                  onChange={e => handleUpdateChapterTitle(cIdx, e.target.value)}
                  placeholder="Título do Capítulo (ex: Roupeiros, Portas, Mob. Diverso)"
                  className="font-bold text-[13px] bg-transparent border-b border-dashed border-gray-400 focus:border-black outline-none px-1 text-gray-900 w-full sm:w-80 min-w-0"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAddItem(cIdx)}
                  className="text-xs bg-white border border-gray-200 hover:border-black text-gray-800 font-semibold px-2.5 h-9 rounded-lg flex items-center gap-1 transition shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Adicionar Artigo</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveChapter(cIdx)}
                  className="text-gray-400 hover:text-red-500 p-1.5 transition"
                  title="Remover Capítulo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tabela de Artigos do Capítulo — ou estado vazio */}
            {chap.items.length === 0 ? (
              <div className="px-4 py-5 flex items-center gap-3 text-xs text-gray-400 border-t border-gray-100">
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 border border-dashed border-gray-300 px-3 py-1.5 rounded-lg font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M4 6h16M4 18h16" /></svg>
                  Capítulo vazio — não aparece na fatura
                </span>
                <span className="text-gray-300">Clique em "Adicionar Artigo" para começar.</span>
              </div>
            ) : (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse num-tabular">
                <thead className="text-gray-400 font-semibold uppercase border-b border-gray-100">
                  {/* Faixa que separa o que é interno do que o cliente vê */}
                  <tr className="text-[11px] tracking-wider">
                    <th colSpan={4} className="pt-2.5 pb-1 px-3 font-semibold">
                      Artigo
                    </th>
                    {!hideInternal && (
                      <th
                        colSpan={3}
                        className="pt-2.5 pb-1 px-3 font-semibold bg-amber-50/70 text-amber-700"
                      >
                        Interno · não sai no PDF
                      </th>
                    )}
                    <th colSpan={3} className="pt-2.5 pb-1 px-3 font-semibold text-right">
                      Venda ao cliente
                    </th>
                  </tr>
                  <tr className="bg-gray-50/50 text-[11px]">
                    <th className="py-2 px-3 w-12 font-semibold">Art.</th>
                    <th className="py-2 px-3 min-w-[280px] font-semibold">
                      Designação Técnica do Móvel / Serviço
                    </th>
                    <th className="py-2 px-3 w-16 text-center font-semibold">Un.</th>
                    <th className="py-2 px-3 w-16 text-center font-semibold">Qtd</th>
                    {!hideInternal && (
                      <>
                        <th className="py-2 px-3 w-36 text-right bg-amber-50/40 text-amber-800 font-semibold">
                          Custo Unit (€)
                        </th>
                        <th className="py-2 px-3 w-20 text-center bg-amber-50/40 text-amber-800 font-semibold">
                          Margem %
                        </th>
                        <th className="py-2 px-3 w-24 text-right bg-amber-50/40 text-amber-800 font-semibold">
                          Extra (€)
                        </th>
                      </>
                    )}
                    <th className="py-2 px-3 w-28 text-right font-bold text-gray-800">
                      Venda Unit (€)
                    </th>
                    <th className="py-2 px-3 w-28 text-right font-bold text-gray-900">
                      Venda Total (€)
                    </th>
                    <th className="py-2 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enriquecerItens(chap, cIdx).map(
                    ({ item, iIdx, displayCode, sellUnit, sellTotal, isAuto }) => {
                      const isExpanded = isAuto && (expandedItems[item.id] !== false);

                      const autoCfg: AutomaticItemConfig = item.automaticConfig || {
                        materialCode: materials[0]?.code || '502114',
                        sheetUsage: 1,
                        edgeCode: edges[0]?.code || '',
                        edgeBandingMeters: 10,
                        edgeBandingRate: 0.7,
                        operations: workstations.map(w => ({
                          workstationCode: w.code,
                          opMin: 60,
                          setupMin: 15,
                          isActive: true,
                        })),
                        hardware: [],
                      };

                      const selectedMat = materials.find(
                        m => m.code === autoCfg.materialCode
                      );
                      const matCost =
                        (autoCfg.sheetUsage || 0) * (selectedMat ? selectedMat.price : 0);
                      const edgeCost =
                        (autoCfg.edgeBandingMeters || 0) *
                        (autoCfg.edgeBandingRate !== undefined
                          ? autoCfg.edgeBandingRate
                          : 0.7);

                      return (
                        <React.Fragment key={item.id}>
                          <tr
                            draggable={linhaArrastavel === item.id}
                            onDragStart={e => {
                              setAArrastar({ cIdx, iIdx });
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={e => {
                              if (aArrastar && aArrastar.cIdx === cIdx) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                // Metade de cima da linha = entra por cima;
                                // metade de baixo = entra por baixo.
                                const caixa = e.currentTarget.getBoundingClientRect();
                                const acima = e.clientY < caixa.top + caixa.height / 2;
                                if (linhaAlvo?.id !== item.id || linhaAlvo?.acima !== acima) {
                                  setLinhaAlvo({ id: item.id, acima });
                                }
                              }
                            }}
                            onDrop={e => {
                              e.preventDefault();
                              if (aArrastar && aArrastar.cIdx === cIdx) {
                                const caixa = e.currentTarget.getBoundingClientRect();
                                const acima = e.clientY < caixa.top + caixa.height / 2;
                                reordenarArtigo(cIdx, aArrastar.iIdx, iIdx, acima);
                              }
                              limparArrasto();
                            }}
                            onDragEnd={limparArrasto}
                            className={`transition-all duration-150 ease-out ${
                              isAuto ? 'bg-blue-50/10' : ''
                            } ${
                              // Separador só entre artigos principais: assim um
                              // artigo e os seus sub-artigos leem-se como um grupo
                              !item.isSubItem && iIdx > 0 ? 'border-t border-gray-200' : ''
                            } ${
                              // Traço âmbar a marcar onde o artigo vai cair
                              linhaAlvo?.id === item.id && linhaAlvo.acima
                                ? '[&>td]:border-t-2 [&>td]:border-t-amber-500 bg-amber-50/40'
                                : ''
                            } ${
                              linhaAlvo?.id === item.id && !linhaAlvo.acima
                                ? '[&>td]:border-b-2 [&>td]:border-b-amber-500 bg-amber-50/40'
                                : ''
                            } ${
                              aArrastar?.cIdx === cIdx && aArrastar.iIdx === iIdx
                                ? 'opacity-30 scale-[0.99]'
                                : 'hover:bg-gray-50/50'
                            }`}
                          >
                            {/* Código do Artigo */}
                            <td className="py-4 px-3 font-mono font-bold text-gray-400 text-[11px] align-top">
                              <div className="flex flex-col gap-1 items-start">
                                <div className="flex items-center gap-1">
                                  <span
                                    onMouseDown={() => setLinhaArrastavel(item.id)}
                                    onMouseUp={() => setLinhaArrastavel(null)}
                                    title="Arrastar para mudar de posição"
                                    className="cursor-grab active:cursor-grabbing text-amber-700 hover:bg-amber-100 rounded p-0.5 -ml-1 transition"
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </span>
                                  <span>{displayCode}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItem(cIdx, iIdx, 'isSubItem', !item.isSubItem)}
                                  className={`p-1 rounded ${item.isSubItem ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-400'}`}
                                  title={item.isSubItem ? 'Remover Sub-tópico' : 'Tornar Sub-tópico'}
                                >
                                  <CornerDownRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* Designação e Toggle de Modo */}
                            <td className={`py-3 px-3 align-top space-y-1.5 ${item.isSubItem ? 'pl-8 border-l-2 border-gray-100' : ''}`}>
                              <textarea
                              value={item.designation}
                              onChange={e =>
                                handleUpdateItem(
                                  cIdx,
                                  iIdx,
                                  'designation',
                                  e.target.value
                                )
                              }
                              rows={2}
                              placeholder="Descrição técnica do móvel, acabamentos, ferragens..."
                              className="w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-gray-300 focus:bg-white rounded p-1 text-xs outline-none resize-none font-medium text-gray-900"
                            />

                            {/* Barra de alternância Manual vs Automático */}
                            <div className="flex items-center gap-2">
                              {isAuto ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                                    <Sparkles className="w-3 h-3 text-blue-600" />
                                    <span>Cálculo Automático por Materiais</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandItem(item.id)}
                                    className="text-[10px] text-blue-700 hover:text-blue-900 font-semibold underline flex items-center gap-0.5"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <span>Ocultar Painel</span>
                                        <ChevronUp className="w-3 h-3" />
                                      </>
                                    ) : (
                                      <>
                                        <span>Editar Fabrico / Materiais</span>
                                        <ChevronDown className="w-3 h-3" />
                                      </>
                                    )}
                                  </button>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleItemMode(cIdx, iIdx, 'quick')
                                    }
                                    className="text-[10px] text-gray-500 hover:text-gray-800 font-medium"
                                  >
                                    Mudar para Manual
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleItemMode(cIdx, iIdx, 'automatic')
                                  }
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50/60 hover:bg-blue-100 px-2 py-0.5 rounded-md transition"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Calcular por Chapas & Máquinas</span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Unidade */}
                          <td className="py-3 px-3 text-center align-top">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={e =>
                                handleUpdateItem(cIdx, iIdx, 'unit', e.target.value)
                              }
                              className="w-10 text-center bg-transparent border-b border-gray-200 outline-none"
                            />
                          </td>

                          {/* Quantidade */}
                          <td className="py-3 px-3 text-center align-top">
                            <input
                              type="number"
                              step="1"
                              value={item.quantity}
                              onFocus={e => e.target.select()}
                              onChange={e =>
                                handleUpdateItem(
                                  cIdx,
                                  iIdx,
                                  'quantity',
                                  Number(e.target.value)
                                )
                              }
                              className="w-12 text-center bg-transparent font-bold border-b border-gray-200 outline-none"
                            />
                          </td>

                          {/* Custo, margem e extra — escondidos no modo cliente */}
                          {!hideInternal && (
                          <>
                          {/* Custo Unitário com Botão para Ficha Técnica */}
                          <td className="py-3 px-3 text-right bg-amber-50/20 align-top">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveItemForCalc({
                                    chapterIndex: cIdx,
                                    itemIndex: iIdx,
                                    item,
                                  })
                                }
                                className="p-1 hover:bg-amber-100 text-amber-700 rounded transition"
                                title="Desdobramento Peça a Peça (ROUNDDOWN)"
                              >
                                <Calculator className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                step="0.5"
                                value={item.costUnit}
                                onFocus={e => e.target.select()}
                                onChange={e =>
                                  handleUpdateItem(
                                    cIdx,
                                    iIdx,
                                    'costUnit',
                                    Number(e.target.value)
                                  )
                                }
                                className={`w-20 text-right font-mono font-semibold bg-white border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-amber-500 ${
                                  isAuto ? 'text-blue-900 border-blue-300' : ''
                                }`}
                              />
                            </div>
                          </td>

                          {/* Margem Comercial % */}
                          <td className="py-3 px-3 text-center bg-amber-50/20 align-top">
                            <div className="flex items-center justify-center gap-0.5">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={Math.round((item.marginPercent || 0) * 100)}
                                onFocus={e => e.target.select()}
                                onChange={e =>
                                  handleUpdateItem(
                                    cIdx,
                                    iIdx,
                                    'marginPercent',
                                    (Number(e.target.value) || 0) / 100
                                  )
                                }
                                className="w-12 text-center font-mono font-bold bg-white border border-gray-200 rounded py-0.5 outline-none"
                              />
                              <span className="text-[10px] text-gray-400 font-semibold">%</span>
                            </div>
                          </td>

                          {/* Extra Fixo (Montagem/Transporte) */}
                          <td className="py-3 px-3 text-right bg-amber-50/20 align-top">
                            <input
                              type="number"
                              step="10"
                              value={item.fixedExtra}
                              onFocus={e => e.target.select()}
                              onChange={e =>
                                handleUpdateItem(
                                  cIdx,
                                  iIdx,
                                  'fixedExtra',
                                  Number(e.target.value)
                                )
                              }
                              className="w-16 text-right font-mono bg-white border border-gray-200 rounded px-1 py-0.5 outline-none"
                            />
                          </td>
                          </>
                          )}

                          {/* Preço de Venda Unitário Calculado */}
                          <td className="py-3 px-3 text-right font-mono font-semibold text-gray-700 align-top">
                            {formatCurrency(sellUnit)}
                          </td>

                          {/* Preço de Venda Total Calculado */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-gray-900 align-top">
                            {formatCurrency(sellTotal)}
                          </td>

                          {/* Duplicar / Remover Artigo */}
                          <td className="py-3 px-2 text-center align-top">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDuplicateItem(cIdx, iIdx)}
                                className="text-gray-300 hover:text-gray-900 transition"
                                title="Duplicar Artigo"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(cIdx, iIdx)}
                                className="text-gray-300 hover:text-red-500 transition"
                                title="Remover Artigo"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* SUB-LINHA: PAINEL DE FABRICO & CÁLCULO AUTOMÁTICO */}
                        {isAuto && isExpanded && (
                          <tr className="bg-blue-50/20 border-b border-blue-100">
                            <td colSpan={hideInternal ? 7 : 10} className="p-4 space-y-4">
                              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs space-y-4 text-xs">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                  <div className="flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-blue-600" />
                                    <span className="font-bold text-gray-900">
                                      Composição Técnica & Cálculo Automático de Custo
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-mono text-blue-700 font-semibold">
                                    Custo Unitário Calculado: {formatCurrency(item.costUnit)}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  {/* 1. Seleção de Chapa & Quantidade */}
                                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                                    <div className="flex items-center gap-1.5 font-bold text-gray-700">
                                      <Layers className="w-3.5 h-3.5 text-gray-500" />
                                      <span>Chapa / Material</span>
                                    </div>
                                    <SearchableMaterialDropdown
                                      materials={materials}
                                      value={autoCfg.materialCode}
                                      onChange={(val) => 
                                        handleUpdateItemAutomaticConfig(cIdx, iIdx, {
                                          ...autoCfg,
                                          materialCode: val,
                                        })
                                      }
                                    />
                                    <div className="flex items-center justify-between pt-1">
                                      <span className="text-gray-500">Chapas Usadas:</span>
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={autoCfg.sheetUsage}
                                        onChange={e =>
                                          handleUpdateItemAutomaticConfig(cIdx, iIdx, {
                                            ...autoCfg,
                                            sheetUsage: Number(e.target.value),
                                          })
                                        }
                                        className="w-16 text-right bg-white border border-gray-200 rounded p-1 font-mono font-bold"
                                      />
                                    </div>
                                    <div className="text-right text-[11px] font-bold text-gray-700 pt-1 border-t border-gray-200">
                                      Subtotal Chapa: {formatCurrency(matCost)}
                                    </div>
                                  </div>

                                  {/* 2. Orlas */}
                                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                                    <div className="flex items-center gap-1.5 font-bold text-gray-700">
                                      <Wrench className="w-3.5 h-3.5 text-gray-500" />
                                      <span>Orlas & Fitas</span>
                                    </div>
                                    <select
                                      value={autoCfg.edgeCode || edges[0]?.code || ''}
                                      onChange={e =>
                                        handleUpdateItemAutomaticConfig(cIdx, iIdx, {
                                          ...autoCfg,
                                          edgeCode: e.target.value,
                                        })
                                      }
                                      className="w-full bg-white border border-gray-200 rounded p-1.5 font-semibold text-gray-900 outline-none text-xs"
                                    >
                                      {edges.map(edge => (
                                        <option key={edge.code} value={edge.code}>
                                          {edge.name} ({edge.pricePerMeter} €/m)
                                        </option>
                                      ))}
                                    </select>
                                    <div className="flex items-center justify-between pt-1">
                                      <span className="text-gray-500">Metros de Orla:</span>
                                      <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={autoCfg.edgeBandingMeters}
                                        onChange={e =>
                                          handleUpdateItemAutomaticConfig(cIdx, iIdx, {
                                            ...autoCfg,
                                            edgeBandingMeters: Number(e.target.value),
                                          })
                                        }
                                        className="w-16 text-right bg-white border border-gray-200 rounded p-1 font-mono font-bold"
                                      />
                                    </div>
                                    <div className="text-right text-[11px] font-bold text-gray-700 pt-1 border-t border-gray-200">
                                      Subtotal Orlas: {formatCurrency(edgeCost)}
                                    </div>
                                  </div>

                                  {/* 3. Tempos de Máquina */}
                                  <div className="md:col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                                    <div className="flex items-center justify-between font-bold text-gray-700">
                                      <div className="flex items-center gap-1.5">
                                        <Cpu className="w-3.5 h-3.5 text-gray-500" />
                                        <span>Postos de Trabalho & Tempos de Máquina</span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                      {workstations.map(ws => {
                                        const op = autoCfg.operations.find(
                                          o => o.workstationCode === ws.code
                                        ) || { workstationCode: ws.code, opMin: 0, setupMin: 0, isActive: false };
                                        
                                        const isActive = op.isActive !== false;

                                        const wsCost = isActive
                                          ? ((op.opMin || 0) * ws.rate) / 60 + ((op.setupMin || 0) * ws.rate) / 60
                                          : 0;

                                        return (
                                          <div
                                            key={ws.code}
                                            className={`bg-white p-2 rounded border space-y-1 transition ${
                                              isActive ? 'border-blue-300 ring-1 ring-blue-300' : 'border-gray-200'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                  type="checkbox"
                                                  checked={isActive}
                                                  onChange={e => {
                                                    const checked = e.target.checked;
                                                    const newOps = autoCfg.operations.map(o =>
                                                      o.workstationCode === ws.code
                                                        ? { ...o, isActive: checked }
                                                        : o
                                                    );
                                                    if (!newOps.some(o => o.workstationCode === ws.code)) {
                                                      newOps.push({
                                                        workstationCode: ws.code,
                                                        opMin: 0,
                                                        setupMin: 0,
                                                        isActive: checked,
                                                      });
                                                    }
                                                    handleUpdateItemAutomaticConfig(cIdx, iIdx, {
                                                      ...autoCfg,
                                                      operations: newOps,
                                                    });
                                                  }}
                                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                                                />
                                                <span className={`font-bold text-[10px] ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                                  {ws.code}
                                                </span>
                                              </label>
                                              <span className="text-[10px] text-gray-400 font-mono">
                                                {ws.rate}€/h
                                              </span>
                                            </div>
                                            <div className={`flex items-center gap-1 text-[10px] ${!isActive && 'opacity-40 pointer-events-none'}`}>
                                              <span className="text-gray-400 w-8">Op:</span>
                                              <input
                                                type="number"
                                                step="5"
                                                min="0"
                                                value={op.opMin}
                                                disabled={!isActive}
                                                onChange={e => {
                                                  const newOps = autoCfg.operations.map(o =>
                                                    o.workstationCode === ws.code
                                                      ? { ...o, opMin: Number(e.target.value) }
                                                      : o
                                                  );
                                                  if (!newOps.some(o => o.workstationCode === ws.code)) {
                                                    newOps.push({
                                                      workstationCode: ws.code,
                                                      opMin: Number(e.target.value),
                                                      setupMin: 0,
                                                      isActive: true,
                                                    });
                                                  }
                                                  handleUpdateItemAutomaticConfig(cIdx, iIdx, {
                                                    ...autoCfg,
                                                    operations: newOps,
                                                  });
                                                }}
                                                className="w-full bg-gray-50 border border-gray-200 rounded px-1 text-right font-mono"
                                              />
                                              <span className="text-[10px] text-gray-400">m</span>
                                            </div>
                                            <div className={`text-[10px] font-bold text-right pt-0.5 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                              {formatCurrency(wsCost)}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>

                                {/* Barra de Resumo da Fórmula KUBIK */}
                                <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-2 text-blue-950 font-medium">
                                    <span>Material: <b>{formatCurrency(matCost)}</b></span>
                                    <span>+</span>
                                    <span>Orlas: <b>{formatCurrency(edgeCost)}</b></span>
                                    <span>+</span>
                                    <span>Máquinas: <b>{formatCurrency(
                                      autoCfg.operations.reduce((acc, op) => {
                                        if (op.isActive === false) return acc;
                                        const ws = workstations.find(w => w.code === op.workstationCode);
                                        return acc + ((op.opMin * (ws?.rate || 0))/60) + ((op.setupMin * (ws?.rate || 0))/60);
                                      }, 0)
                                    )}</b></span>
                                    <span>+</span>
                                    <span>Ferragens: <b>{formatCurrency(
                                      autoCfg.hardware.reduce((acc, h) => {
                                        const hw = hardware.find(x => x.code === h.hardwareCode);
                                        return acc + h.qty * (hw?.price || 0);
                                      }, 0)
                                    )}</b></span>
                                  </div>
                                  <div className="font-bold text-blue-900 font-mono text-sm">
                                    Total Custo Unitário: {formatCurrency(item.costUnit)}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
            )}

            {/* Lista em cartões — só no telemóvel */}
            {chap.items.length > 0 && (
              <div className="md:hidden divide-y divide-gray-100">
                {enriquecerItens(chap, cIdx).map(
                  ({ item, iIdx, displayCode, sellUnit, sellTotal, isAuto }) => {
                    const aberto = !!cartaoAberto[item.id];
                    return (
                      <div key={item.id} className={isAuto ? 'bg-blue-50/20' : ''}>
                        {/* Linha fechada: designação, medida e total */}
                        <button
                          type="button"
                          onClick={() => alternarCartao(item.id)}
                          aria-expanded={aberto}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-gray-50 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2">
                              {item.designation || 'Sem designação'}
                            </div>
                            <div className="font-mono text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                              <span>{displayCode}</span>
                              <span>·</span>
                              <span>
                                {item.quantity} {item.unit}
                              </span>
                              {isAuto && (
                                <>
                                  <span>·</span>
                                  <span className="text-blue-600 font-semibold">auto</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="font-mono text-sm font-bold text-gray-900 num-tabular shrink-0">
                            {formatCurrency(sellTotal)}
                          </div>
                          {aberto ? (
                            <ChevronUp className="w-4 h-4 text-gray-300 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-300 shrink-0" />
                          )}
                        </button>

                        {/* Cartão aberto: campos editáveis */}
                        {aberto && (
                          <div className="px-4 pb-4 space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Designação
                              </label>
                              <textarea
                                value={item.designation}
                                onChange={e =>
                                  handleUpdateItem(cIdx, iIdx, 'designation', e.target.value)
                                }
                                rows={2}
                                placeholder="Descrição técnica do móvel, acabamentos, ferragens..."
                                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none resize-none focus:border-gray-400"
                              />
                            </div>

                            <div className="flex gap-2">
                              <div className="flex-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                  Quantidade
                                </label>
                                <div className="flex items-center h-11 border border-gray-200 rounded-lg bg-white overflow-hidden">
                                  <button
                                    type="button"
                                    aria-label="Menos um"
                                    onClick={() =>
                                      passoQuantidade(cIdx, iIdx, item.quantity, -1)
                                    }
                                    className="w-11 h-full bg-gray-50 border-r border-gray-200 text-gray-600 text-lg active:bg-gray-100"
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    value={item.quantity}
                                    onFocus={e => e.target.select()}
                                    onChange={e =>
                                      handleUpdateItem(
                                        cIdx,
                                        iIdx,
                                        'quantity',
                                        Number(e.target.value)
                                      )
                                    }
                                    className="flex-1 min-w-0 text-center font-mono font-bold outline-none bg-transparent"
                                  />
                                  <button
                                    type="button"
                                    aria-label="Mais um"
                                    onClick={() =>
                                      passoQuantidade(cIdx, iIdx, item.quantity, 1)
                                    }
                                    className="w-11 h-full bg-gray-50 border-l border-gray-200 text-gray-600 text-lg active:bg-gray-100"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="w-24">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                  Unidade
                                </label>
                                <input
                                  type="text"
                                  value={item.unit}
                                  onChange={e =>
                                    handleUpdateItem(cIdx, iIdx, 'unit', e.target.value)
                                  }
                                  className="w-full h-11 px-3 border border-gray-200 rounded-lg bg-white outline-none focus:border-gray-400"
                                />
                              </div>
                            </div>

                            {/* Bloco interno — desaparece no modo cliente */}
                            {!hideInternal && (
                              <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 space-y-2.5">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                  <Lock className="w-3 h-3" />
                                  Interno · não sai no PDF
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="w-16 shrink-0 text-xs font-semibold text-amber-800">
                                    Custo
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveItemForCalc({
                                        chapterIndex: cIdx,
                                        itemIndex: iIdx,
                                        item,
                                      })
                                    }
                                    className="w-11 h-11 shrink-0 flex items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700 active:bg-amber-100"
                                    title="Desdobramento peça a peça"
                                  >
                                    <Calculator className="w-4 h-4" />
                                  </button>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.5"
                                    value={item.costUnit}
                                    onFocus={e => e.target.select()}
                                    onChange={e =>
                                      handleUpdateItem(
                                        cIdx,
                                        iIdx,
                                        'costUnit',
                                        Number(e.target.value)
                                      )
                                    }
                                    className="flex-1 min-w-0 h-11 px-3 text-right font-mono font-semibold border border-amber-200 rounded-lg bg-white outline-none focus:border-amber-400"
                                  />
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="w-16 shrink-0 text-xs font-semibold text-amber-800">
                                    Margem
                                  </span>
                                  <div className="flex-1 flex items-center h-11 border border-amber-200 rounded-lg bg-white overflow-hidden">
                                    <button
                                      type="button"
                                      aria-label="Menos cinco por cento"
                                      onClick={() =>
                                        passoMargem(cIdx, iIdx, item.marginPercent, -5)
                                      }
                                      className="w-11 h-full bg-amber-50 border-r border-amber-200 text-amber-700 text-lg active:bg-amber-100"
                                    >
                                      −
                                    </button>
                                    <div className="flex-1 min-w-0 flex items-center justify-center gap-1">
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        step="1"
                                        min="0"
                                        value={Math.round((item.marginPercent || 0) * 100)}
                                        onFocus={e => e.target.select()}
                                        onChange={e =>
                                          handleUpdateItem(
                                            cIdx,
                                            iIdx,
                                            'marginPercent',
                                            (Number(e.target.value) || 0) / 100
                                          )
                                        }
                                        className="w-12 text-right font-mono font-bold outline-none bg-transparent"
                                      />
                                      <span className="text-xs text-gray-400 font-semibold">%</span>
                                    </div>
                                    <button
                                      type="button"
                                      aria-label="Mais cinco por cento"
                                      onClick={() =>
                                        passoMargem(cIdx, iIdx, item.marginPercent, 5)
                                      }
                                      className="w-11 h-full bg-amber-50 border-l border-amber-200 text-amber-700 text-lg active:bg-amber-100"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="w-16 shrink-0 text-xs font-semibold text-amber-800">
                                    Extra
                                  </span>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="10"
                                    value={item.fixedExtra}
                                    onFocus={e => e.target.select()}
                                    onChange={e =>
                                      handleUpdateItem(
                                        cIdx,
                                        iIdx,
                                        'fixedExtra',
                                        Number(e.target.value)
                                      )
                                    }
                                    className="flex-1 min-w-0 h-11 px-3 text-right font-mono border border-amber-200 rounded-lg bg-white outline-none focus:border-amber-400"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex items-end justify-between pt-1 border-t border-gray-100">
                              <div className="pt-2">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                  Venda unitária
                                </div>
                                <div className="font-mono text-[13px] text-gray-500 num-tabular">
                                  {formatCurrency(sellUnit)}
                                </div>
                              </div>
                              <div className="pt-2 text-right">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                  Total da linha
                                </div>
                                <div className="font-mono text-lg font-extrabold text-gray-900 num-tabular">
                                  {formatCurrency(sellTotal)}
                                </div>
                              </div>
                            </div>

                            {/* Mudar de posição — no telemóvel não há arrastar */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => moverArtigo(cIdx, iIdx, -1)}
                                disabled={iIdx === 0}
                                className="h-11 flex-1 rounded-lg border border-gray-200 bg-white text-gray-500 flex items-center justify-center gap-1.5 text-xs font-semibold active:bg-gray-50 disabled:opacity-30"
                                title="Mover para cima"
                              >
                                <ArrowUp className="w-4 h-4" />
                                Subir
                              </button>
                              <button
                                type="button"
                                onClick={() => moverArtigo(cIdx, iIdx, 1)}
                                disabled={iIdx === chap.items.length - 1}
                                className="h-11 flex-1 rounded-lg border border-gray-200 bg-white text-gray-500 flex items-center justify-center gap-1.5 text-xs font-semibold active:bg-gray-50 disabled:opacity-30"
                                title="Mover para baixo"
                              >
                                <ArrowDown className="w-4 h-4" />
                                Descer
                              </button>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateItem(cIdx, iIdx, 'isSubItem', !item.isSubItem)
                                }
                                className={`h-11 flex-1 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                                  item.isSubItem
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'bg-white border-gray-200 text-gray-500'
                                }`}
                              >
                                <CornerDownRight className="w-3.5 h-3.5" />
                                Sub-tópico
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateItem(cIdx, iIdx)}
                                className="h-11 w-11 rounded-lg border border-gray-200 bg-white text-gray-500 flex items-center justify-center active:bg-gray-50"
                                title="Duplicar artigo"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(cIdx, iIdx)}
                                className="h-11 w-11 rounded-lg border border-gray-200 bg-white text-gray-400 flex items-center justify-center active:bg-red-50 active:text-red-500"
                                title="Remover artigo"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {isAuto && (
                              <p className="text-[11px] text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-2.5 leading-relaxed">
                                Este artigo tem cálculo automático por chapas e máquinas.
                                O painel de fabrico abre-se no computador.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        ))}


        {/* Botão Adicionar Capítulo */}
        <button
          type="button"
          onClick={handleAddChapter}
          className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-black rounded-xl text-xs font-bold text-gray-500 hover:text-black transition flex items-center justify-center gap-2 bg-white"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Adicionar Novo Capítulo</span>
        </button>
      </div>

      {/* 2.1 ÂMBITO DA PROPOSTA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        {([
          {
            list: 'scopeIncluded' as ScopeList,
            title: 'Incluído no Âmbito',
            hint: 'Ex: Desmontagem do mobiliário existente, transporte e montagem.',
            icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          },
          {
            list: 'scopeExcluded' as ScopeList,
            title: 'Excluído do Âmbito',
            hint: 'Ex: Trabalhos de eletricidade, canalização e alvenaria.',
            icon: <XCircle className="w-4 h-4 text-red-500" />,
          },
        ]).map(section => {
          const entries = quote[section.list] || [];
          return (
            <div
              key={section.list}
              className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  {section.icon}
                  <h3 className="text-xs font-bold text-gray-900">{section.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddScope(section.list)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar
                </button>
              </div>

              {entries.length === 0 ? (
                <p className="text-[11px] text-gray-400 leading-relaxed py-1">
                  {section.hint}
                </p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={entry}
                        onChange={e => handleUpdateScope(section.list, idx, e.target.value)}
                        placeholder={section.hint}
                        className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none focus:border-black transition"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveScope(section.list, idx)}
                        className="text-gray-300 hover:text-red-500 transition p-1"
                        title="Remover linha"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botão flutuante para adicionar artigo — só no telemóvel */}
      {quote.chapters.length > 0 && (
        <button
          type="button"
          onClick={() => handleAddItem(quote.chapters.length - 1)}
          aria-label="Adicionar artigo ao último capítulo"
          className="md:hidden fixed right-4 bottom-[9.5rem] z-40 w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-xl active:bg-black transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* 3. Barra Fixa Inferior de Rentabilidade */}
      {/* No telemóvel assenta por cima dos separadores (bottom-14) e abre ao tocar.
          No computador fica colada ao fundo, como sempre esteve. */}
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40 shadow-xl">
        {/* Telemóvel — linha fechada */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setRentabilidadeAberta(v => !v)}
            aria-expanded={rentabilidadeAberta}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left"
          >
            {hideInternal ? (
              <span className="text-xs font-semibold text-gray-500">
                Total do orçamento
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <Lock className="w-3 h-3" />
                Interno
                {rentabilidadeAberta ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </span>
            )}
            <span className="flex items-baseline gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                c/ IVA
              </span>
              <span className="font-mono text-[15px] font-extrabold text-gray-900 num-tabular">
                {formatCurrency(totalWithVat)}
              </span>
            </span>
          </button>

          {rentabilidadeAberta && (
            <div className="px-4 pb-3 space-y-3 border-t border-gray-100 pt-3">
              {!hideInternal && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      Custo
                    </span>
                    <span className="font-mono text-sm font-bold text-gray-700 num-tabular">
                      {formatCurrency(totalCost)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      Margem
                    </span>
                    <span className="font-mono text-sm font-bold text-blue-600 num-tabular">
                      {overallMargin}%
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      Lucro
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-600 num-tabular">
                      {formatCurrency(grossProfit)}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Subtotal sem IVA
                </span>
                <span className="font-mono text-sm font-bold text-gray-900 num-tabular">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Computador — tudo à vista */}
        <div className="hidden md:flex items-center justify-between gap-4 px-6 lg:px-8 py-3.5">
          <div className="flex items-center gap-6">
            {!hideInternal ? (
              <>
                {/* Marca que estes números são internos e não saem na proposta */}
                <div
                  className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider"
                  title="Custo, margem e lucro são valores internos — não aparecem no PDF enviado ao cliente"
                >
                  <Lock className="w-3 h-3" />
                  Interno
                </div>

                <div className="h-7 w-px bg-gray-200" />

                <div>
                  <span className="block text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                    Custo Estimado
                  </span>
                  <span className="font-mono text-lg font-bold text-gray-700 num-tabular">
                    {formatCurrency(totalCost)}
                  </span>
                </div>

                <div className="h-7 w-px bg-gray-200" />

                <div>
                  <span className="block text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                    Margem Média
                  </span>
                  <span className="font-mono text-lg font-bold text-blue-600 num-tabular">
                    {overallMargin}%
                  </span>
                </div>

                <div className="h-7 w-px bg-gray-200" />

                <div>
                  <span className="block text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                    Lucro Bruto Previsto
                  </span>
                  <span className="font-mono text-lg font-bold text-emerald-600 num-tabular">
                    {formatCurrency(grossProfit)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <Lock className="w-3 h-3" />
                Valores internos escondidos
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="block text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                Subtotal Venda
              </span>
              <span className="font-mono text-lg font-extrabold text-gray-900 num-tabular">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="bg-black text-white px-5 py-2 rounded-xl text-right">
              <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Total com IVA (23%)
              </span>
              <span className="font-mono text-lg font-black text-emerald-400 num-tabular">
                {formatCurrency(totalWithVat)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal da Calculadora Técnica (ROUNDDOWN Peça a Peça / Aparador) */}
      {activeItemForCalc && (
        <TechnicalCalculatorModal
          item={activeItemForCalc.item}
          isOpen={!!activeItemForCalc}
          onClose={() => setActiveItemForCalc(null)}
          onApplyCost={handleApplyTechnicalCost}
        />
      )}
    </div>
  );
}
