'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BottomTabs from '@/components/layout/BottomTabs';
import CompanyDashboard from '@/components/dashboard/CompanyDashboard';
import ObrasView from '@/components/obras/ObrasView';
import QuotesDashboard from '@/components/quotes/QuotesDashboard';
import QuoteEditor from '@/components/quotes/QuoteEditor';
import QuoteWizard from '@/components/quotes/QuoteWizard';
import QuotesTrashView from '@/components/quotes/QuotesTrashView';
import ClientsView from '@/components/clients/ClientsView';
import MaterialsView from '@/components/materials/MaterialsView';
import SettingsView from '@/components/settings/SettingsView';
import EmailsView from '@/components/emails/EmailsView';
import VisitsView from '@/components/visits/VisitsView';
import VisitForm from '@/components/visits/VisitForm';
import OfficialQuotePdfModal from '@/components/pdf/OfficialQuotePdfModal';
import AccessDenied from '@/components/layout/AccessDenied';
import { ModuleKey } from '@/types';
import { APP_MODULES, firstAllowedModule } from '@/lib/permissions';

// Liga cada vista da aplicação ao módulo que a controla
const VIEW_MODULE: Record<string, ModuleKey> = {
  'dashboard': 'dashboard',
  'obras': 'obras',
  'quotes-list': 'quotes',
  'quotes-trash': 'quotes',
  'quote-editor': 'quotes',
  'quote-wizard': 'quotes',
  'clients': 'clients',
  'materials': 'materials',
  'settings': 'settings',
  'emails': 'emails',
  'visits-list': 'visits',
  'visit-editor': 'visits',
};

// Vista inicial de cada módulo, para o redirecionamento automático
const MODULE_VIEW: Record<ModuleKey, string> = {
  dashboard: 'dashboard',
  obras: 'obras',
  quotes: 'quotes-list',
  visits: 'visits-list',
  clients: 'clients',
  materials: 'materials',
  emails: 'emails',
  settings: 'settings',
};

export default function HomePage() {
  const { currentView, setCurrentView, can, permissions, permissionsLoaded } = useApp();

  // Gaveta lateral: só existe abaixo de lg. Acima, a barra está sempre visível.
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Mudar de vista fecha a gaveta — evita ficar aberta por cima do conteúdo novo
  useEffect(() => {
    setDrawerOpen(false);
  }, [currentView]);

  // A tecla Escape fecha a gaveta
  useEffect(() => {
    if (!drawerOpen) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [drawerOpen]);

  const activeModule = VIEW_MODULE[currentView];
  const allowed = activeModule ? can(activeModule) : false;

  // Se o utilizador aterrar numa vista a que não tem acesso (ex: a vista
  // inicial por defeito), reencaminha para o primeiro módulo permitido.
  useEffect(() => {
    if (!permissionsLoaded) return;
    if (allowed) return;
    const target = firstAllowedModule(permissions);
    if (target) {
      setCurrentView(MODULE_VIEW[target] as any);
    }
  }, [permissionsLoaded, allowed, permissions, setCurrentView]);

  const moduleLabel = APP_MODULES.find((m) => m.key === activeModule)?.label;

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-gray-50">
      {/* 1. Barra Lateral Modular — fixa a partir de lg */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* 1b. A mesma barra em gaveta, abaixo de lg */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-gray-900/45"
          />
          <div className="relative z-10 h-full max-w-[86vw] shadow-2xl">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* 2. Área Central de Conteúdo */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-y-auto relative">
        {/* Topbar Fixa */}
        <Header onOpenMenu={() => setDrawerOpen(true)} />

        {/* Vistas Dinâmicas dos Módulos (filtradas por permissões).
            max-w-[1600px] impede que as tabelas se estiquem num monitor 4K.
            pb-14 deixa espaço para a barra de separadores do telemóvel. */}
        <div className="flex-1 min-w-0 w-full mx-auto max-w-[1600px] pb-16 md:pb-0">
          {!permissionsLoaded && (
            <div className="p-10 text-xs text-gray-400">A verificar permissões...</div>
          )}

          {permissionsLoaded && !allowed && <AccessDenied moduleLabel={moduleLabel} />}

          {permissionsLoaded && allowed && (
            <>
              {currentView === 'dashboard' && <CompanyDashboard />}
              {currentView === 'obras' && <ObrasView />}
              {currentView === 'quotes-list' && <QuotesDashboard />}
              {currentView === 'quotes-trash' && <QuotesTrashView />}
              {currentView === 'quote-editor' && <QuoteEditor />}
              {currentView === 'quote-wizard' && <QuoteWizard />}
              {currentView === 'clients' && <ClientsView />}
              {currentView === 'materials' && <MaterialsView />}
              {currentView === 'settings' && <SettingsView />}
              {currentView === 'emails' && <EmailsView />}
              {currentView === 'visits-list' && <VisitsView />}
              {currentView === 'visit-editor' && <VisitForm />}
            </>
          )}
        </div>
      </main>

      {/* 3. Separadores de navegação no telemóvel */}
      <BottomTabs onOpenMore={() => setDrawerOpen(true)} />

      {/* 4. Modal de Impressão do PDF Oficial KUBIK HOME */}
      <OfficialQuotePdfModal />
    </div>
  );
}
