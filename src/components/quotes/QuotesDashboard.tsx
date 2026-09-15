'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  calculateQuoteCost,
  calculateQuoteSubtotal,
  calculateQuoteTotalWithVat,
  formatCurrency,
} from '@/lib/calculator';
import {
  TrendingUp,
  FileText,
  CheckCircle2,
  Euro,
  UserCheck,
  Search,
  Pencil,
  Copy,
  Trash2,
  Printer,
  Plus,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export default function QuotesDashboard() {
  const {
    quotes,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    currentUser,
    createNewQuote,
    editQuote,
    duplicateQuote,
    deleteQuote,
    openPdfPreview,
    totalQuotedAmount,
    totalApprovedAmount,
    averageCostAmount,
    hideInternal,
  } = useApp();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreate = (type: 'manual' | 'automatic') => {
    setShowDropdown(false);
    createNewQuote(type);
  };

  // Filtragem e ordenação
  const filteredQuotes = quotes
    .filter(q => {
      const matchQuery =
        q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.projectName &&
          q.projectName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        filterStatus === 'Todos' || q.status === filterStatus;

      return matchQuery && matchStatus;
    })
    // Do número mais alto para o mais baixo (2026-908 antes de 2026-901).
    // O 'numeric' compara 908 e 1000 como números, não como texto, por isso
    // continua certo quando a numeração passar das três casas ou mudar de ano.
    .sort((a, b) =>
      (b.number || '').localeCompare(a.number || '', 'pt', { numeric: true })
    );

  const approvedCount = quotes.filter(q => q.status === 'Adjudicado').length;
  const successRate = quotes.length
    ? Math.round((approvedCount / quotes.length) * 100)
    : 0;

  const pendingQuotes = quotes.filter(
    q => q.status === 'Apresentado' || q.status === 'Rascunho'
  );
  const pendingAmount = pendingQuotes.reduce(
    (acc, q) => acc + calculateQuoteTotalWithVat(q),
    0
  );

  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 w-full">
      {/* 1. Cartões de KPI no Topo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Orçado */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Orçado (Mês)
            </span>
            <Euro className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-xl font-bold text-gray-900 font-mono">
            {formatCurrency(totalQuotedAmount)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{quotes.length} Propostas Ativas</span>
          </div>
        </div>

        {/* Adjudicados */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Adjudicados (€)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 font-mono">
            {formatCurrency(totalApprovedAmount)}
          </div>
          <span className="text-[11px] text-gray-500 font-medium">
            Taxa de sucesso: {successRate}% ({approvedCount} ganhas)
          </span>
        </div>

        {/* Custo Médio — é valor interno, some no modo cliente */}
        {!hideInternal && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Custo Médio Produção
              </span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-gray-900 font-mono num-tabular">
              {formatCurrency(averageCostAmount)}
            </div>
            <span className="text-[11px] text-gray-400 font-medium">
              Valor interno
            </span>
          </div>
        )}

        {/* 4. Quarto Cartão: Pendentes */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Orçamentos Pendentes
            </span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-gray-900 font-mono">
            {formatCurrency(pendingAmount)}
          </div>
          <span className="text-[11px] text-amber-600 font-medium">
            {pendingQuotes.length} propostas em negociação
          </span>
        </div>
      </div>

      {/* 2. Filtros, Barra de Pesquisa & Botão Novo Orçamento */}
      <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-gray-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 lg:max-w-md bg-gray-50 border border-gray-200 rounded-lg px-3 h-10 text-[13px]">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por cliente, número ou projeto..."
            className="bg-transparent w-full outline-none text-gray-700 placeholder-gray-400 min-w-0"
          />
        </div>

        <div className="flex items-center gap-2 min-w-0">
          {/* Tira deslizante no telemóvel, para os cinco estados caberem */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto scroll-limpo flex-1 lg:flex-none">
            {['Todos', 'Apresentado', 'Adjudicado', 'Rascunho', 'Recusado'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`shrink-0 px-3 h-8 rounded-md text-xs transition-all ${
                  filterStatus === st
                    ? 'bg-white font-bold text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Botão Novo Orçamento com Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Orçamento</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-gray-300" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Escolha o Método de Cálculo
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCreate('manual')}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 flex items-start gap-2.5 transition border-b border-gray-50"
                >
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Pencil className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">
                      Orçamento Manual / Rápido
                    </div>
                    <div className="text-[11px] text-gray-500 leading-tight mt-0.5">
                      Inserção direta de custos e margens manuais (modo clássico).
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleCreate('automatic')}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/50 flex items-start gap-2.5 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <span>Orçamento Automático / Técnico</span>
                      <span className="bg-blue-200 text-blue-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        Novo
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 leading-tight mt-0.5">
                      Cálculo automático a partir de chapas, tempos de máquina (CNC/SH) e ferragens.
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Tabela de Orçamentos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Cartões — só no telemóvel */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredQuotes.length === 0 ? (
            <div className="py-10 px-4 text-center text-gray-400 space-y-3">
              <p className="text-sm">Nenhum orçamento encontrado.</p>
              <button
                onClick={() => handleCreate('manual')}
                className="h-11 px-4 text-xs text-white bg-black rounded-lg font-semibold"
              >
                Criar orçamento
              </button>
            </div>
          ) : (
            filteredQuotes.map(q => {
              const totalVat = calculateQuoteTotalWithVat(q);
              return (
                <div key={q.id} className="p-4">
                  <button
                    type="button"
                    onClick={() => editQuote(q)}
                    className="w-full text-left flex items-start gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[13px] font-bold text-gray-900">
                          {q.number}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            q.status === 'Adjudicado'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : q.status === 'Apresentado'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : q.status === 'Recusado'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <div className="text-[13px] font-semibold text-gray-900 mt-1 truncate">
                        {q.clientName}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">
                        {q.projectName || 'Obra Geral'} · {q.date}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        c/ IVA
                      </div>
                      <div className="font-mono text-sm font-bold text-gray-900 num-tabular">
                        {formatCurrency(totalVat)}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => editQuote(q)}
                      className="flex-1 h-10 rounded-lg bg-gray-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Abrir
                    </button>
                    <button
                      type="button"
                      onClick={() => openPdfPreview(q)}
                      className="w-11 h-10 rounded-lg border border-gray-200 text-emerald-600 flex items-center justify-center"
                      title="Ver PDF Oficial"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateQuote(q)}
                      className="w-11 h-10 rounded-lg border border-gray-200 text-gray-500 flex items-center justify-center"
                      title="Duplicar"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteQuote(q.id)}
                      className="w-11 h-10 rounded-lg border border-gray-200 text-gray-400 flex items-center justify-center"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tabela — a partir de md */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse num-tabular">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Nº Orçamento</th>
                <th className="py-3 px-4">Cliente & Projeto</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Responsável</th>
                {!hideInternal && (
                  <th className="py-3 px-4 text-right">Custo Est. (€)</th>
                )}
                <th className="py-3 px-4 text-right">Sub-Total (€)</th>
                <th className="py-3 px-4 text-right font-bold text-gray-900">
                  Total c/ IVA
                </th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={hideInternal ? 8 : 9} className="py-12 text-center text-gray-400 space-y-2">
                    <p className="text-sm">Nenhum orçamento encontrado.</p>
                    <div className="flex justify-center gap-2 pt-2">
                      <button
                        onClick={() => handleCreate('manual')}
                        className="text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium"
                      >
                        + Criar Manual
                      </button>
                      <button
                        onClick={() => handleCreate('automatic')}
                        className="text-xs text-white bg-black hover:bg-gray-800 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-blue-300" />
                        <span>+ Criar Automático</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map(q => {
                  const cost = calculateQuoteCost(q);
                  const subtotal = calculateQuoteSubtotal(q);
                  const totalVat = calculateQuoteTotalWithVat(q);

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-gray-400" />
                          <span>{q.number}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              q.type === 'automatic'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            {q.type === 'automatic' ? 'Automático' : 'Manual'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">
                          {q.clientName}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate max-w-xs">
                          {q.projectName || 'Obra Geral'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {q.date}
                      </td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {q.responsible}
                      </td>
                      {!hideInternal && (
                        <td className="py-3 px-4 text-right font-mono text-gray-500 whitespace-nowrap">
                          {formatCurrency(cost)}
                        </td>
                      )}
                      <td className="py-3 px-4 text-right font-mono text-gray-700 whitespace-nowrap">
                        {formatCurrency(subtotal)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                        {formatCurrency(totalVat)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            q.status === 'Adjudicado'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : q.status === 'Apresentado'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : q.status === 'Recusado'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => editQuote(q)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition"
                          title="Editar Orçamento"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openPdfPreview(q)}
                          className="p-1.5 hover:bg-emerald-50 rounded text-emerald-600 hover:text-emerald-800 transition"
                          title="Ver PDF Oficial KUBIK"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateQuote(q)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition"
                          title="Duplicar Orçamento"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteQuote(q.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition"
                          title="Eliminar Orçamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
