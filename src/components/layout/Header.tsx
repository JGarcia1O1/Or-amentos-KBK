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
  UserCircle2,
  LogOut,
} from 'lucide-react';
import { UserRole } from '@/types';

export default function Header() {
  const {
    currentView,
    setCurrentView,
    createNewQuote,
    selectedQuote,
    openPdfPreview,
    userRole,
    setUserRole, currentUser,
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

  const getTitle = () => {
    switch (currentView) {
      case 'quotes-list':
        return 'Orçamentos & Propostas Comerciais';
      case 'quote-editor':
        return `Editor de Orçamento — ${selectedQuote?.number || 'Novo'}`;
      case 'clients':
        return 'Ficheiro de Clientes';
      case 'materials':
        return 'Catálogo de Chapas & Ferragens';
      case 'settings':
        return 'Postos de Trabalho & Custos Horários';
      default:
        return 'Plataforma KUBIK HOME';
    }
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-20">
      <div className="flex items-center gap-3">
        {currentView === 'quote-editor' && (
          <button
            type="button"
            onClick={() => setCurrentView('quotes-list')}
            className="p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Voltar à lista"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <span className="text-xs font-semibold text-gray-400">Plataforma</span>
        <span className="text-gray-300">/</span>
        <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
          {getTitle()}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 mr-4 border-r border-gray-200 pr-4">
          <UserCircle2 className="w-5 h-5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-700">{currentUser}</span>
          <button
            onClick={() => {
              import('@/lib/supabase').then(({ supabase }) => {
                supabase.auth.signOut().then(() => {
                  window.location.href = '/login';
                });
              });
            }}
            className="p-1.5 ml-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
            title="Terminar Sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {currentView === 'quotes-list' && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
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
                      Inserção direta de custos, margens e valores manuais (modo clássico).
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
                      <span className="bg-blue-200 text-blue-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
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
        )}

        {currentView === 'quote-editor' && selectedQuote && (
          <button
            type="button"
            onClick={() => openPdfPreview(selectedQuote)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Ver PDF Oficial</span>
          </button>
        )}
      </div>
    </header>
  );
}
