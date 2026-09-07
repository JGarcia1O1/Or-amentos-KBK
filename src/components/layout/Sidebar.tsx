'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  FileSpreadsheet,
  Users,
  Layers,
  Sliders,
  Factory,
  Package,
  Receipt,
  UserCheck, Mail,
} from 'lucide-react';

export default function Sidebar() {
  const {
    currentView,
    setCurrentView,
    currentUser,
    setCurrentUser,
    quotes,
    clients,
    materials,
    setSelectedQuote,
    userRole,
  } = useApp();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between flex-shrink-0 select-none z-20 h-screen">
      {/* Topo da Sidebar */}
      <div>
        {/* Seletor de Organização / Empresa */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-bold text-base shadow-sm">
              K
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider truncate">
                KUBIK HOME
              </h2>
              <p className="text-[11px] text-gray-400 truncate">
                Tortosendo - Portugal
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Sistema Online" />
          </div>
        </div>

        {/* Navegação de Módulos */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Módulos Ativos
          </div>

          {/* Módulo Orçamentos */}
          <button
            type="button"
            onClick={() => {
              setCurrentView('quotes-list');
              setSelectedQuote(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
              currentView.startsWith('quote')
                ? 'bg-gray-900 text-white font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Orçamentos</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                currentView.startsWith('quote')
                  ? 'bg-gray-800 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {quotes.length}
            </span>
          </button>

          {/* Módulo Clientes */}
          {userRole !== 'trabalhador' && (
            <button
              type="button"
              onClick={() => setCurrentView('clients')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                currentView === 'clients'
                  ? 'bg-gray-900 text-white font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Clientes</span>
              </div>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                {clients.length}
              </span>
            </button>
          )}

          {/* Módulo Chapas & Materiais */}
          {userRole !== 'trabalhador' && (
            <button
              type="button"
              onClick={() => setCurrentView('materials')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                currentView === 'materials'
                  ? 'bg-gray-900 text-white font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Layers className="w-4 h-4 shrink-0" />
                <span className="truncate">Chapas, Materiais & Máquinas</span>
              </div>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold shrink-0 ml-2">
                {materials.length}
              </span>
            </button>
          )}

          
          {/* Módulo Emails & Cobranças */}
          {userRole !== 'trabalhador' && (
            <button
              type="button"
              onClick={() => setCurrentView('emails')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                currentView === 'emails'
                  ? 'bg-gray-900 text-white font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4" />
                <span>Emails Automáticos</span>
              </div>
            </button>
          )}

          {/* Configurações Gerais */}
          {userRole !== 'trabalhador' && (
            <button
              type="button"
              onClick={() => setCurrentView('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                currentView === 'settings'
                  ? 'bg-gray-900 text-white font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span className="truncate">Configurações Gerais</span>
            </button>
          )}

          {/* Módulos Futuros (Arquitetura Modular Pluggable) */}
          <div className="pt-4 px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>Próximos Módulos</span>
            <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
              Modular
            </span>
          </div>

          <div className="opacity-50 space-y-0.5">
            <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-gray-400 cursor-not-allowed">
              <div className="flex items-center gap-2.5">
                <Factory className="w-4 h-4" />
                <span>Produção & Obras</span>
              </div>
              <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
                Em Breve
              </span>
            </div>
            <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-gray-400 cursor-not-allowed">
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>Stock & Encomendas</span>
              </div>
              <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
                Em Breve
              </span>
            </div>
            <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-gray-400 cursor-not-allowed">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4" />
                <span>Faturação</span>
              </div>
              <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
                Em Breve
              </span>
            </div>
          </div>
        </nav>
      </div>

      {/* Rodapé da Sidebar: Multi-Utilizador / Perfil */}
      {/* [MODO HIDDEN]: Mantido intacto no código a pedido. Para reativar no futuro, basta alterar SHOW_USER_PROFILE para true */}
      {(() => {
        const SHOW_USER_PROFILE = false;
        if (!SHOW_USER_PROFILE) {
          return (
            <div className="p-3 border-t border-gray-100 bg-gray-50/40 text-center">
              <p className="text-[10px] text-gray-400 font-medium">
                KUBIK HOME & LIFE FURNITURE
              </p>
            </div>
          );
        }
        return (
          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            <div className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-gray-400" />
              <span>Utilizador Ativo</span>
            </div>
            <div className="relative">
              <select
                value={currentUser}
                onChange={(e) => setCurrentUser(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-black outline-none cursor-pointer"
              >
                <option value="Luís Cunha">Luís Cunha (Comercial)</option>
                <option value="João Silva">João Silva (Comercial)</option>
                <option value="Gerência">Gerência (Direção)</option>
              </select>
            </div>
            <p className="text-[10px] text-gray-400 px-2 mt-1.5">
              3-4 utilizadores em simultâneo
            </p>
          </div>
        );
      })()}
    </aside>
  );
}
