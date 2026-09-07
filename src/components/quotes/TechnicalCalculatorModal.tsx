'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Material, QuoteItem, TechnicalOperation, TechnicalPart } from '@/types';
import {
  formatCurrency,
  calculatePartYield,
  calculatePartMaterialCost,
  calculateOperationCost,
  calculateTechnicalSheetGrandTotal,
} from '@/lib/calculator';
import {
  Cpu,
  X,
  Ruler,
  Clock,
  Box,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';

interface TechnicalCalculatorModalProps {
  item: QuoteItem;
  isOpen: boolean;
  onClose: () => void;
  onApplyCost: (cost: number) => void;
}

export default function TechnicalCalculatorModal({
  item,
  isOpen,
  onClose,
  onApplyCost,
}: TechnicalCalculatorModalProps) {
  const { materials, workstations } = useApp();

  const [selectedMaterialCode, setSelectedMaterialCode] = useState<string>('502114');

  const [dimensions, setDimensions] = useState({
    height: 2450,
    width: 2790,
    depth: 600,
    doors: 3,
    drawers: 4,
  });

  const [operations, setOperations] = useState<TechnicalOperation[]>([
    {
      code: 'SH',
      name: 'Seccionadora (Corte)',
      opMin: 120,
      setupMin: 30,
      hourlyRate: workstations.find(w => w.code === 'SH')?.rate || 35.0,
    },
    {
      code: 'CNC',
      name: 'Centro Maquinação CNC',
      opMin: 120,
      setupMin: 45,
      hourlyRate: workstations.find(w => w.code === 'CNC')?.rate || 18.09,
    },
    {
      code: 'ORLADORA',
      name: 'Orladora (Colagem)',
      opMin: 120,
      setupMin: 30,
      hourlyRate: workstations.find(w => w.code === 'ORLADORA')?.rate || 25.0,
    },
    {
      code: 'MANUAL',
      name: 'Montagem Bancada',
      opMin: 180,
      setupMin: 10,
      hourlyRate: workstations.find(w => w.code === 'MANUAL')?.rate || 25.0,
    },
  ]);

  const [parts, setParts] = useState<TechnicalPart[]>([
    { name: 'Costa Frente', length: 1125, width: 1538, qty: 2 },
    { name: 'Lateral', length: 1125, width: 480, qty: 4 },
    { name: 'Lat Gaveta', length: 200, width: 480, qty: 6 },
    { name: 'Costa/Frente Gaveta', length: 500, width: 200, qty: 6 },
  ]);

  const [extraHardwareCost, setExtraHardwareCost] = useState<number>(78.04);

  if (!isOpen) return null;

  const currentMaterial =
    materials.find(m => m.code === selectedMaterialCode) || materials[0];

  // Totais
  const { materialsCost, operationsCost, hardwareCost, grandTotal } =
    calculateTechnicalSheetGrandTotal(
      parts,
      currentMaterial,
      operations,
      extraHardwareCost
    );

  const handleAddPart = () => {
    setParts(prev => [
      ...prev,
      { name: 'Nova Peça', length: 800, width: 500, qty: 2 },
    ]);
  };

  const handleRemovePart = (index: number) => {
    setParts(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePart = (
    index: number,
    field: keyof TechnicalPart,
    val: any
  ) => {
    setParts(prev =>
      prev.map((p, i) => (i === index ? { ...p, [field]: val } : p))
    );
  };

  const handleUpdateOperation = (
    code: string,
    field: 'opMin' | 'setupMin',
    val: number
  ) => {
    setOperations(prev =>
      prev.map(op => (op.code === code ? { ...op, [field]: val } : op))
    );
  };

  const handleApply = () => {
    onApplyCost(Number(grandTotal.toFixed(2)));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Cabeçalho do Modal */}
        <div className="p-4 bg-gray-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">
                Calculadora de Custo Técnico de Produção
              </h3>
              <p className="text-[11px] text-gray-400">
                Modelo fiel às fórmulas da folha &quot;Aparador&quot; (KUBIK HOME) — Artigo {item.code}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com as Abas / Seções */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* 1. Medidas Globais do Móvel */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-blue-600" />
              <span>1. Dimensões Globais do Móvel (mm)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] text-gray-500 font-semibold block mb-1">
                  Altura (mm)
                </label>
                <input
                  type="number"
                  value={dimensions.height}
                  onChange={e =>
                    setDimensions({ ...dimensions, height: Number(e.target.value) })
                  }
                  className="w-full bg-white border border-gray-200 rounded-lg p-1.5 font-bold font-mono text-center outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 font-semibold block mb-1">
                  Largura (mm)
                </label>
                <input
                  type="number"
                  value={dimensions.width}
                  onChange={e =>
                    setDimensions({ ...dimensions, width: Number(e.target.value) })
                  }
                  className="w-full bg-white border border-gray-200 rounded-lg p-1.5 font-bold font-mono text-center outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 font-semibold block mb-1">
                  Profundidade (mm)
                </label>
                <input
                  type="number"
                  value={dimensions.depth}
                  onChange={e =>
                    setDimensions({ ...dimensions, depth: Number(e.target.value) })
                  }
                  className="w-full bg-white border border-gray-200 rounded-lg p-1.5 font-bold font-mono text-center outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 font-semibold block mb-1">
                  Nº Portas
                </label>
                <input
                  type="number"
                  value={dimensions.doors}
                  onChange={e =>
                    setDimensions({ ...dimensions, doors: Number(e.target.value) })
                  }
                  className="w-full bg-white border border-gray-200 rounded-lg p-1.5 font-bold font-mono text-center outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 font-semibold block mb-1">
                  Nº Gavetas
                </label>
                <input
                  type="number"
                  value={dimensions.drawers}
                  onChange={e =>
                    setDimensions({ ...dimensions, drawers: Number(e.target.value) })
                  }
                  className="w-full bg-white border border-gray-200 rounded-lg p-1.5 font-bold font-mono text-center outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* 2. Tempos de Máquina e Mão de Obra */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>2. Tempos de Operação e Setup de Máquinas</span>
              </h4>
              <span className="font-mono font-bold text-gray-900">
                Total Operações: {formatCurrency(operationsCost)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left bg-white border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-500 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-2 px-3">Posto</th>
                    <th className="py-2 px-3 text-center">Tempo Op. (min)</th>
                    <th className="py-2 px-3 text-center">Setup (min)</th>
                    <th className="py-2 px-3 text-right">Taxa (€/h)</th>
                    <th className="py-2 px-3 text-right">Op. Direta (€)</th>
                    <th className="py-2 px-3 text-right">Setup (€)</th>
                    <th className="py-2 px-3 text-right font-bold">Subtotal (€)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {operations.map(op => {
                    const { direct, setup, total } = calculateOperationCost(op);
                    return (
                      <tr key={op.code}>
                        <td className="py-2 px-3 font-bold font-sans">
                          {op.name}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            value={op.opMin}
                            onChange={e =>
                              handleUpdateOperation(
                                op.code,
                                'opMin',
                                Number(e.target.value)
                              )
                            }
                            className="w-16 text-center bg-gray-50 border border-gray-200 rounded p-1 outline-none focus:border-black"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            value={op.setupMin}
                            onChange={e =>
                              handleUpdateOperation(
                                op.code,
                                'setupMin',
                                Number(e.target.value)
                              )
                            }
                            className="w-16 text-center bg-gray-50 border border-gray-200 rounded p-1 outline-none focus:border-black"
                          />
                        </td>
                        <td className="py-2 px-3 text-right text-gray-500">
                          {op.hourlyRate.toFixed(2)} €
                        </td>
                        <td className="py-2 px-3 text-right">
                          {formatCurrency(direct)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {formatCurrency(setup)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-gray-900">
                          {formatCurrency(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Rendimento e Otimização de Corte de Chapas (ROUNDDOWN) */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                <Box className="w-4 h-4 text-emerald-600" />
                <span>3. Rendimento e Otimização de Corte de Chapas</span>
              </h4>
              <span className="font-mono font-bold text-gray-900">
                Total Materiais: {formatCurrency(materialsCost + hardwareCost)}
              </span>
            </div>

            {/* Seletor de Chapa */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Chapa Selecionada:</span>
                <select
                  value={selectedMaterialCode}
                  onChange={e => setSelectedMaterialCode(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 font-semibold outline-none cursor-pointer"
                >
                  {materials.map(m => (
                    <option key={m.code} value={m.code}>
                      {m.name} ({m.length}x{m.width}mm — {m.price.toFixed(2)} €)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">Orla & Ferragens Extra:</span>
                <input
                  type="number"
                  step="1"
                  value={extraHardwareCost}
                  onChange={e => setExtraHardwareCost(Number(e.target.value))}
                  className="w-20 text-right bg-gray-50 border border-gray-200 rounded p-1 font-mono font-bold outline-none"
                />
                <span className="text-gray-500">€</span>
              </div>
            </div>

            {/* Tabela de Peças */}
            <div className="overflow-x-auto">
              <table className="w-full text-left bg-white border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-500 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-2 px-3">Peça</th>
                    <th className="py-2 px-3 text-center">Comp (mm)</th>
                    <th className="py-2 px-3 text-center">Larg (mm)</th>
                    <th className="py-2 px-3 text-center">Qtd</th>
                    <th className="py-2 px-3 text-center text-blue-700">
                      Rendimento (Pçs/Ch)
                    </th>
                    <th className="py-2 px-3 text-center">Utilização</th>
                    <th className="py-2 px-3 text-right font-bold">Valor (€)</th>
                    <th className="py-2 px-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {parts.map((part, pIdx) => {
                    const yieldVal = calculatePartYield(part, currentMaterial);
                    const usage = part.qty / yieldVal;
                    const val = usage * currentMaterial.price;

                    return (
                      <tr key={pIdx} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 font-sans font-medium">
                          <input
                            type="text"
                            value={part.name}
                            onChange={e =>
                              handleUpdatePart(pIdx, 'name', e.target.value)
                            }
                            className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-black outline-none font-semibold text-gray-900"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            value={part.length}
                            onChange={e =>
                              handleUpdatePart(
                                pIdx,
                                'length',
                                Number(e.target.value)
                              )
                            }
                            className="w-16 text-center bg-gray-50 border border-gray-200 rounded p-1 outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            value={part.width}
                            onChange={e =>
                              handleUpdatePart(
                                pIdx,
                                'width',
                                Number(e.target.value)
                              )
                            }
                            className="w-16 text-center bg-gray-50 border border-gray-200 rounded p-1 outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            value={part.qty}
                            onChange={e =>
                              handleUpdatePart(
                                pIdx,
                                'qty',
                                Number(e.target.value)
                              )
                            }
                            className="w-12 text-center bg-gray-50 border border-gray-200 rounded p-1 font-bold outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-center text-blue-700 font-bold">
                          {yieldVal} pçs
                        </td>
                        <td className="py-2 px-3 text-center text-gray-600">
                          {usage.toFixed(2)} ch
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-gray-900">
                          {formatCurrency(val)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemovePart(pIdx)}
                            className="p-1 text-gray-300 hover:text-red-500 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={handleAddPart}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Peça ao Desdobramento</span>
            </button>
          </div>
        </div>

        {/* Rodapé do Modal com Total Final e Botão de Aplicação */}
        <div className="p-4 bg-gray-100 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Custo Total Calculado
              </span>
              <span className="text-xl font-black font-mono text-gray-900">
                {formatCurrency(grandTotal)}
              </span>
            </div>
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">
              Inclui mão de obra, chapas ({formatCurrency(materialsCost)}), orlas e ferragens.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800 shadow-sm flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aplicar Custo ao Artigo ({formatCurrency(grandTotal)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
