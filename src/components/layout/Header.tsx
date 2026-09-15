'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  ArrowLeft,
  Plus,
  Printer,
  ChevronDown,
  Pencil,
  Sparkles,
  Wand2,
  Menu,
  Eye,
  EyeOff,
} from 'lucide-react';

interface HeaderProps {
  /** Abre a gaveta lateral (só existe abaixo de lg) */
  onOpenMenu?: () => void;
}

export default function Header({ onOpenMenu }: HeaderProps = {}) {
  const {
    currentView,
    setCurrentView,
    createNewQuote,
    selectedQuote,
    openPdfPreview,
    hideInternal,
    toggleHideInternal,
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

  // Título em duas linhas: módulo por cima, documento por baixo.
  // Assim a segunda linha pode truncar sem empurrar os botões.
  const getTitulo = (): { modulo: string; documento: string } => {
    switch (currentView) {
      case 'quotes-list':
        return { modulo: 'Orçamentos', documento: 'Propostas comerciais' };
      case 'quote-editor':
        return {
          modulo: 'Orçamento',
          documento: selectedQuote?.number
            ? `${selectedQuote.number}${
                selectedQuote.projectName ? ` — ${selectedQuote.projectName}` : ''
              }`
            : 'Novo',
        };
      case 'quote-wizard':
        return { modulo: 'Orçamentos', documento: 'Configurador' };
      case 'clients':
        return { modulo: 'Clientes', documento: 'Ficheiro de clientes' };
      case 'materials':
        return { modulo: 'Catálogo', documento: 'Chapas, ferragens e máquinas' };
      case 'settings':
        return { modulo: 'Configurações', documento: 'Postos de trabalho e custos' };
      case 'visits-list':
        return { modulo: 'Fichas de obra', documento: 'Visitas e medições' };
      case 'visit-editor':
        return { modulo: 'Ficha de obra', documento: 'Edição' };
      case 'emails':
        return { modulo: 'Emails', documento: 'Envios automáticos' };
      case 'obras':
        return { modulo: 'Produção', documento: 'Obras em curso' };
      case 'dashboard':
        return { modulo: 'Gestão', documento: 'Indicadores da empresa' };
      default:
        return { modulo: 'Plataforma', documento: 'KUBIK HOME' };
    }
  };

  const { modulo, documento } = getTitulo();

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between gap-3 px-3 sm:px-5 lg:px-6 flex-shrink-0 z-20 sticky top-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Menu — só abaixo de lg, onde a barra lateral está recolhida */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menu"
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <Menu className="w-[17px] h-[17px]" />
        </button>

        {/* Voltar à lista, dentro do editor */}
        {(currentView === 'quote-editor' || currentView === 'quote-wizard') && (
          <button
            type="button"
            onClick={() => setCurrentView('quotes-list')}
            className="hidden lg:flex w-9 h-9 items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Voltar à lista"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        <div className="min-w-0">
          <div className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-tight">
            {modulo}
          </div>
          <div className="text-[13px] sm:text-sm font-bold text-gray-900 truncate leading-tight">
            {documento}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Modo cliente: esconde custos, margens e lucro do ecrã */}
        <button
          type="button"
          onClick={toggleHideInternal}
          aria-pressed={hideInternal}
          title={
            hideInternal
              ? 'Valores internos escondidos — tocar para voltar a mostrar'
              : 'Esconder custos, margens e lucro para mostrar ao cliente'
          }
          className={`h-9 flex items-center gap-1.5 px-2.5 rounded-lg border text-xs font-semibold transition-colors ${
            hideInternal
              ? 'bg-gray-900 border-gray-900 text-white'
              : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          {hideInternal ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {hideInternal ? 'Cliente' : 'Interno'}
          </span>
        </button>

        {currentView === 'quotes-list' && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold h-9 px-2.5 sm:px-3 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Novo Orçamento</span>
              <span className="sm:hidden">Novo</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-gray-300" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-gray-100">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Escolha o Método de Cálculo
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCreate('manual')}
                  className="w-full text-left px-3.5 py-3 hover:bg-gray-50 flex items-start gap-2.5 transition border-b border-gray-50"
                >
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Pencil className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-gray-900">
                      Orçamento Manual / Rápido
                    </div>
                    <div className="text-[11px] text-gray-500 leading-snug mt-0.5">
                      Inserção direta de custos, margens e valores manuais (modo clássico).
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleCreate('automatic')}
                  className="w-full text-left px-3.5 py-3 hover:bg-blue-50/50 flex items-start gap-2.5 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-blue-900 flex items-center gap-1.5">
                      <span>Orçamento Automático / Técnico</span>
                      <span className="bg-blue-200 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        Novo
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 leading-snug mt-0.5">
                      Cálculo automático a partir de chapas, tempos de máquina (CNC/SH) e ferragens.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false);
                    setCurrentView('quote-wizard');
                  }}
                  className="w-full text-left px-3.5 py-3 hover:bg-gray-50 flex items-start gap-2.5 transition border-t border-gray-50"
                >
                  <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Wand2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-gray-900">
                      Orçamento com Configurador
                    </div>
                    <div className="text-[11px] text-gray-500 leading-snug mt-0.5">
                      Indica os metros de cozinha ou de roupeiro e o orçamento monta-se sozinho.
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'quote-editor' && selectedQuote && (
          <button
            type="button"
            onClick={() => openPdfPreview(selectedQuote)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-2.5 sm:px-3 rounded-lg shadow-sm transition-all"
            title="Ver PDF Oficial"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ver PDF Oficial</span>
          </button>
        )}
      </div>
    </header>
  );
}
