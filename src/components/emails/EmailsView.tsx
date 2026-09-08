'use client';

import React, { useState } from 'react';
import { Mail, Briefcase, FileSpreadsheet } from 'lucide-react';
import CrmEmailsView from './CrmEmailsView';
import BillingEmailsView from './BillingEmailsView';

export default function EmailsView() {
  const [activeTab, setActiveTab] = useState<'crm' | 'billing'>('crm');

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full pb-24">
      {/* Header and Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-600" />
            Emails Automáticos
          </h1>
          <p className="text-gray-500 mt-1">
            Geração de templates otimizados para Orçamentos e Faturação.
          </p>
        </div>

        {/* Custom Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('crm')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'crm' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Orçamentos & Follow-up
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'billing' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Avisos de Cobrança
          </button>
        </div>
      </div>

      {/* Render the selected view */}
      {activeTab === 'crm' ? <CrmEmailsView /> : <BillingEmailsView />}
    </div>
  );
}
