'use client';

import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import CompanyDashboard from '@/components/dashboard/CompanyDashboard';
import ObrasView from '@/components/obras/ObrasView';
import QuotesDashboard from '@/components/quotes/QuotesDashboard';
import QuoteEditor from '@/components/quotes/QuoteEditor';
import QuoteWizard from '@/components/quotes/QuoteWizard';
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
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* 1. Barra Lateral Modular (Estilo Operum) */}
      <Sidebar />

      {/* 2. Área Central de Conteúdo */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-y-auto relative">
        {/* Topbar Fixa */}
        <Header />

        {/* Vistas Dinâmicas dos Módulos (filtradas por permissões) */}
        <div className="flex-1">
          {!permissionsLoaded && (
            <div className="p-10 text-xs text-gray-400">A verificar permissões...</div>
          )}

          {permissionsLoaded && !allowed && <AccessDenied moduleLabel={moduleLabel} />}

          {permissionsLoaded && allowed && (
            <>
              {currentView === 'dashboard' && <CompanyDashboard />}
              {currentView === 'obras' && <ObrasView />}
              {currentView === 'quotes-list' && <QuotesDashboard />}
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

      {/* 3. Modal de Impressão do PDF Oficial KUBIK HOME */}
      <OfficialQuotePdfModal />
    </div>
  );
}
