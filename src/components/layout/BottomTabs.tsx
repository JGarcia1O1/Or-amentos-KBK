'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { ModuleKey } from '@/types';
import {
  FileSpreadsheet,
  ClipboardList,
  Users,
  Layers,
  Sliders,
  Hammer,
  Mail,
  MoreHorizontal,
} from 'lucide-react';

interface BottomTabsProps {
  /** Abre a gaveta lateral com os restantes módulos */
  onOpenMore: () => void;
}

type TabDef = {
  module: ModuleKey;
  label: string;
  view: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Vistas que contam como este separador estar ativo */
  matches: (view: string) => boolean;
};

// Ordem de prioridade. Só os quatro primeiros a que o utilizador tem
// acesso é que aparecem; o resto fica atrás do botão "Mais".
const TABS: TabDef[] = [
  {
    module: 'quotes',
    label: 'Orçamentos',
    view: 'quotes-list',
    icon: FileSpreadsheet,
    matches: v => v.startsWith('quote'),
  },
  {
    module: 'visits',
    label: 'Obras',
    view: 'visits-list',
    icon: ClipboardList,
    matches: v => v.startsWith('visit'),
  },
  {
    module: 'clients',
    label: 'Clientes',
    view: 'clients',
    icon: Users,
    matches: v => v === 'clients',
  },
  {
    module: 'materials',
    label: 'Materiais',
    view: 'materials',
    icon: Layers,
    matches: v => v === 'materials',
  },
  {
    module: 'obras',
    label: 'Produção',
    view: 'obras',
    icon: Hammer,
    matches: v => v === 'obras',
  },
  {
    module: 'dashboard',
    label: 'Gestão',
    view: 'dashboard',
    icon: Sliders,
    matches: v => v === 'dashboard',
  },
  {
    module: 'emails',
    label: 'Emails',
    view: 'emails',
    icon: Mail,
    matches: v => v === 'emails',
  },
];

export default function BottomTabs({ onOpenMore }: BottomTabsProps) {
  const { currentView, setCurrentView, setSelectedQuote, can } = useApp();

  const permitidos = TABS.filter(t => can(t.module));
  const visiveis = permitidos.slice(0, 4);
  const haMais = permitidos.length > visiveis.length;

  // Sem módulos não há barra nenhuma para mostrar
  if (visiveis.length === 0) return null;

  const irPara = (tab: TabDef) => {
    if (tab.module === 'quotes') setSelectedQuote(null);
    setCurrentView(tab.view as any);
  };

  const colunas = visiveis.length + (haMais ? 1 : 0);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 pb-safe"
      aria-label="Navegação principal"
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}
      >
        {visiveis.map(tab => {
          const Icone = tab.icon;
          const ativo = tab.matches(currentView);
          return (
            <button
              key={tab.module}
              type="button"
              onClick={() => irPara(tab)}
              aria-current={ativo ? 'page' : undefined}
              className={`h-14 flex flex-col items-center justify-center gap-1 transition-colors ${
                ativo ? 'text-gray-900' : 'text-gray-400 active:bg-gray-50'
              }`}
            >
              <Icone className="w-[19px] h-[19px]" />
              <span
                className={`text-[10px] leading-none truncate max-w-full px-1 ${
                  ativo ? 'font-bold' : 'font-semibold'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {haMais && (
          <button
            type="button"
            onClick={onOpenMore}
            className="h-14 flex flex-col items-center justify-center gap-1 text-gray-400 active:bg-gray-50 transition-colors"
          >
            <MoreHorizontal className="w-[19px] h-[19px]" />
            <span className="text-[10px] leading-none font-semibold">Mais</span>
          </button>
        )}
      </div>
    </nav>
  );
}
