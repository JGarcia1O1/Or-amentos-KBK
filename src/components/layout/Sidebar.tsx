'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ClipboardList,
  Hammer, 
  FileSpreadsheet,
  Users,
  Layers,
  Sliders,
  Factory,
  Package,
  Receipt,
  UserCheck, Settings, LogOut, Mail,
 } from 'lucide-react';

import ProfileSettingsModal from './ProfileSettingsModal';

export default function Sidebar() {
  const [showProfile, setShowProfile] = useState(false);
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

          <button
            type="button"
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
              currentView === 'dashboard'
                ? 'bg-gray-900 text-white font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4" />
              <span>Gestão & Analytics</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('obras')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
              currentView === 'obras'
                ? 'bg-gray-900 text-white font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Hammer className="w-4 h-4" />
              <span>Produção & Obras</span>
            </div>
          </button>

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
                onClick={() => {
                  setCurrentView('visits-list');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                  currentView.startsWith('visit')
                    ? 'bg-gray-900 text-white font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="w-4 h-4" />
                  <span>Fichas de Obra</span>
                </div>
              </button>
            )}
            
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

            {/* NOVO RODAPÉ DE UTILIZADOR */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <button 
          onClick={() => setShowProfile(true)}
          className="flex flex-col text-left hover:bg-gray-200 p-2 rounded-xl transition-colors min-w-0"
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Operador</span>
          <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{currentUser}</span>
        </button>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowProfile(true)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Definições de Perfil"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              import('@/lib/supabase').then(({ supabase }) => {
                supabase.auth.signOut().then(() => {
                  window.location.href = '/login';
                });
              });
            }}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Terminar Sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showProfile && <ProfileSettingsModal onClose={() => setShowProfile(false)} />}
    </aside>
  );
}
