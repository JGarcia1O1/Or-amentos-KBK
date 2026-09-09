'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
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
import { SearchableMaterialDropdown } from '@/components/ui/SearchableMaterialDropdown';
import {
  ArrowLeft,
  Calculator,
  Plus,
  Trash2,
  X,
  FileCheck,
  FolderPlus,
  Sparkles,
  Pencil,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Wrench,
} from 'lucide-react';

export default function QuoteEditor() {
  const {
    selectedQuote,
    updateSelectedQuote,
    setCurrentView,
    confirmAction,
    clients,
    materials,
    workstations,
    hardware,
    edges,
    openPdfPreview,
  } = useApp();

  // Itens expandidos para o painel de fabrico automático
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

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

  const handleStatusChange = (newStatus: QuoteStatus) => {
    if (newStatus === 'Adjudicado' && quote.status !== 'Adjudicado') {
      confirmAction(
        'Aprovar Orçamento e Abater Stock',
        'Deseja aprovar este orçamento? Esta ação irá abater automaticamente as chapas e materiais utilizados ao stock do armazém.',
        () => {
          handleTopFieldChange('status', newStatus);
          // O abatimento na BD será executado aqui via API ou Supabase RPC
          // Assim que a tabela estiver devidamente migrada.
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

  // Cálculos Globais
  const totalCost = calculateQuoteCost(quote);
  const subtotal = calculateQuoteSubtotal(quote);
  const totalWithVat = calculateQuoteTotalWithVat(quote);
  const grossProfit = subtotal - totalCost;
  const overallMargin = calculateQuoteMarginPercent(quote);

  return (
    <div className="p-6 space-y-6 pb-28 w-full">
      {/* 1. Cabeçalho de Dados Gerais do Orçamento */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
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
                <option value="Recusado">Recusado</option>
              </select>
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
              Morada de Entrega / Obra
            </label>
            <input
              type="text"
              value={quote.clientAddress}
              onChange={e => handleTopFieldChange('clientAddress', e.target.value)}
              placeholder="Morada completa da obra"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none"
            />
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

      {/* 2. Tabela Hierárquica de Capítulos & Artigos */}
      <div className="space-y-6">
        {quote.chapters.map((chap, cIdx) => (
          <div
            key={chap.id}
            className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden"
          >
            {/* Cabeçalho do Capítulo */}
            <div className="bg-gray-100/70 px-4 py-3 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-2 flex-1">
                <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                  {cIdx + 1}
                </span>
                <input
                  type="text"
                  value={chap.title}
                  onChange={e => handleUpdateChapterTitle(cIdx, e.target.value)}
                  placeholder="Título do Capítulo (ex: Roupeiros, Portas, Mob. Diverso)"
                  className="font-bold text-xs bg-transparent border-b border-dashed border-gray-400 focus:border-black outline-none px-1 text-gray-900 w-80"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddItem(cIdx)}
                  className="text-xs bg-white border border-gray-200 hover:border-black text-gray-800 font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Artigo</span>
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50/50 text-gray-400 font-semibold text-[10px] uppercase border-b border-gray-100">
                  <tr>
                    <th className="py-2.5 px-3 w-12">Art.</th>
                    <th className="py-2.5 px-3 min-w-[280px]">
                      Designação Técnica do Móvel / Serviço
                    </th>
                    <th className="py-2.5 px-3 w-16 text-center">Un.</th>
                    <th className="py-2.5 px-3 w-16 text-center">Qtd</th>
                    <th className="py-2.5 px-3 w-36 text-right bg-amber-50/40 text-amber-800">
                      Custo Unit (€)
                    </th>
                    <th className="py-2.5 px-3 w-20 text-center bg-amber-50/40 text-amber-800">
                      Margem %
                    </th>
                    <th className="py-2.5 px-3 w-24 text-right bg-amber-50/40 text-amber-800">
                      Extra (€)
                    </th>
                    <th className="py-2.5 px-3 w-28 text-right font-bold text-gray-800">
                      Venda Unit (€)
                    </th>
                    <th className="py-2.5 px-3 w-28 text-right font-bold text-gray-900">
                      Venda Total (€)
                    </th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {chap.items.map((item, iIdx) => {
                    const sellUnit = calculateItemSellUnit(item);
                    const sellTotal = calculateItemSellTotal(item);
                    const isAuto = item.calculationMode === 'automatic';
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
                        <tr className={`hover:bg-gray-50/50 ${isAuto ? 'bg-blue-50/10' : ''}`}>
                          {/* Código do Artigo */}
                          <td className="py-3 px-3 font-mono font-bold text-gray-400 text-[11px] align-top">
                            {item.code}
                          </td>

                          {/* Designação e Toggle de Modo */}
                          <td className="py-3 px-3 align-top space-y-1.5">
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
                            <input
                              type="number"
                              step="0.05"
                              value={item.marginPercent}
                              onFocus={e => e.target.select()}
                              onChange={e =>
                                handleUpdateItem(
                                  cIdx,
                                  iIdx,
                                  'marginPercent',
                                  Number(e.target.value)
                                )
                              }
                              className="w-12 text-center font-mono font-bold bg-white border border-gray-200 rounded py-0.5 outline-none"
                            />
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

                          {/* Preço de Venda Unitário Calculado */}
                          <td className="py-3 px-3 text-right font-mono font-semibold text-gray-700 align-top">
                            {formatCurrency(sellUnit)}
                          </td>

                          {/* Preço de Venda Total Calculado */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-gray-900 align-top">
                            {formatCurrency(sellTotal)}
                          </td>

                          {/* Remover Artigo */}
                          <td className="py-3 px-2 text-center align-top">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(cIdx, iIdx)}
                              className="text-gray-300 hover:text-red-500 transition"
                              title="Remover Artigo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>

                        {/* SUB-LINHA: PAINEL DE FABRICO & CÁLCULO AUTOMÁTICO */}
                        {isAuto && isExpanded && (
                          <tr className="bg-blue-50/20 border-b border-blue-100">
                            <td colSpan={10} className="p-4 space-y-4">
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
                                              <span className="text-[9px] text-gray-400 font-mono">
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
                                              <span className="text-[9px] text-gray-400">m</span>
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
                  })}
                </tbody>
              </table>
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

      {/* 3. Barra Fixa Inferior de Rentabilidade (Sticky Footer) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-8 py-3.5 z-40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Custo Estimado
            </span>
            <span className="font-mono text-base font-bold text-gray-700">
              {formatCurrency(totalCost)}
            </span>
          </div>

          <div className="h-7 w-px bg-gray-200" />

          <div>
            <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Margem Média
            </span>
            <span className="font-mono text-base font-bold text-blue-600">
              {overallMargin}%
            </span>
          </div>

          <div className="h-7 w-px bg-gray-200" />

          <div>
            <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Lucro Bruto Previsto
            </span>
            <span className="font-mono text-base font-bold text-emerald-600">
              {formatCurrency(grossProfit)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Subtotal Venda
            </span>
            <span className="font-mono text-lg font-extrabold text-gray-900">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="bg-black text-white px-5 py-2 rounded-xl text-right">
            <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">
              Total com IVA (23%)
            </span>
            <span className="font-mono text-lg font-black text-emerald-400">
              {formatCurrency(totalWithVat)}
            </span>
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
