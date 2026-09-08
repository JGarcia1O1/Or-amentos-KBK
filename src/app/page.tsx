'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import CompanyDashboard from '@/components/dashboard/CompanyDashboard';
import QuotesDashboard from '@/components/quotes/QuotesDashboard';
import QuoteEditor from '@/components/quotes/QuoteEditor';
import ClientsView from '@/components/clients/ClientsView';
import MaterialsView from '@/components/materials/MaterialsView';
import SettingsView from '@/components/settings/SettingsView';
import EmailsView from '@/components/emails/EmailsView';
import VisitsView from '@/components/visits/VisitsView';
import VisitForm from '@/components/visits/VisitForm';
import OfficialQuotePdfModal from '@/components/pdf/OfficialQuotePdfModal';

export default function HomePage() {
  const { currentView } = useApp();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* 1. Barra Lateral Modular (Estilo Operum) */}
      <Sidebar />

      {/* 2. Área Central de Conteúdo */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-y-auto relative">
        {/* Topbar Fixa */}
        <Header />

        {/* Vistas Dinâmicas dos Módulos */}
        <div className="flex-1">
          {currentView === 'dashboard' && <CompanyDashboard />}
          {currentView === 'quotes-list' && <QuotesDashboard />}
          {currentView === 'quote-editor' && <QuoteEditor />}
          {currentView === 'clients' && <ClientsView />}
          {currentView === 'materials' && <MaterialsView />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'emails' && <EmailsView />}
          {currentView === 'visits-list' && <VisitsView />}
          {currentView === 'visit-editor' && <VisitForm />}
        </div>
      </main>

      {/* 3. Modal de Impressão do PDF Oficial KUBIK HOME */}
      <OfficialQuotePdfModal />
    </div>
  );
}
