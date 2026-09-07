'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { VisitService } from '@/services/visitService';
import { SiteVisit, VisitStatus } from '@/types';
import { Printer,  Check,  ArrowLeft, Save, MapPin, Phone, User, Calendar, Mail, FileText, CheckSquare   } from 'lucide-react';
import { toast } from 'sonner';
import SiteVisitPdfPreview from '@/components/pdf/SiteVisitPdfPreview';

const CHECKLIST_ITEMS = [
  { id: 'pe_direito', label: 'Medida Pé Direito' },
  { id: 'pe_direito_sanca', label: 'Medida Pé Drt./ Sanca' },
  { id: 'tubos_esgotos', label: 'Verificar saídas de tubos/esgotos' },
  { id: 'eletricidade', label: 'Verificar saídas de eletricidade/tomadas' },
  { id: 'esquadria', label: 'Verificar esquadria de paredes/recortes' },
  { id: 'altura_janelas', label: 'Verificar altura das janelas' }
];

export default function VisitForm() {
  const { setCurrentView } = useApp();
  const [isSaving, setIsSaving] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [formData, setFormData] = useState<Partial<SiteVisit>>({
    number: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    clientNif: '',
    visitDate: new Date().toISOString().split('T')[0],
    checklist: {},
    technicalNotes: '',
    status: 'Agendado'
  });

  useEffect(() => {
    const saved = localStorage.getItem('selectedVisit');
    if (saved) {
      setFormData(JSON.parse(saved));
    } else {
      const now = new Date();
      const n = 'VIS-' + now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0');
      setFormData(prev => ({ ...prev, number: n }));
    }
  }, []);

  const toggleChecklist = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: {
        ...(prev.checklist || {}),
        [id]: !(prev.checklist?.[id])
      }
    }));
  };

  const handleSave = async () => {
    if (!formData.clientName) {
      toast.error('O nome do cliente é obrigatório.');
      return;
    }

    try {
      setIsSaving(true);
      const visitToSave = {
        id: formData.id || ('temp-' + Date.now()),
        ...formData,
        projectTypes: [], // Deprecated in favor of the new structure, but keeping for DB compatibility
      } as SiteVisit;

      await VisitService.save(visitToSave);
      toast.success('Ficha de Obra guardada!');
      setCurrentView('visits-list' as any);
    } catch (err: any) {
      toast.error('Erro ao guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Topbar Actions */}
      <div className="flex-none bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentView('visits-list' as any)}
            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">
              {formData.id ? 'Editar Ficha' : 'Nova Ficha: Info Cliente & Projecto'}
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-mono">{formData.number}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value as VisitStatus })}
            className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
          >
            <option value="Agendado">Agendado</option>
            <option value="Realizado">Realizado</option>
            <option value="Orcamentado">Orcamentado</option>
          </select>

          <button
            onClick={() => setShowPdf(true)}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-bold text-sm transition border border-gray-300"
          >
            <Printer className="w-4 h-4" />
            Imprimir Ficha
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'A guardar...' : 'Guardar Ficha'}
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Dados Gerais (Baseado no Cabecalho do Papel) */}
          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Informações de Cliente & Projecto
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Data</label>
                <input
                  type="date"
                  value={formData.visitDate}
                  onChange={e => setFormData({ ...formData, visitDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Mail className="w-3 h-3"/> Email</label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={e => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Phone className="w-3 h-3"/> Tel.</label>
                <input
                  type="text"
                  value={formData.clientPhone}
                  onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Morada</label>
                <input
                  type="text"
                  value={formData.clientAddress}
                  onChange={e => setFormData({ ...formData, clientAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">NIF</label>
                <input
                  type="text"
                  value={formData.clientNif}
                  onChange={e => setFormData({ ...formData, clientNif: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </section>

          {/* Checklist de Verificacoes Tecnicas (A Faixa Castanha) */}
          <section className="bg-[#b39b82]/10 p-6 rounded-xl border border-[#b39b82]/30 shadow-sm">
            <h2 className="text-sm font-bold text-[#8a7258] mb-4 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Verificações Técnicas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6">
              {CHECKLIST_ITEMS.map(item => {
                const isChecked = !!formData.checklist?.[item.id];
                return (
                  <label key={item.id} className="flex items-start gap-3 cursor-pointer group" onClick={(e) => { e.preventDefault(); toggleChecklist(item.id); }}>
                    <div className={'mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ' + (isChecked ? 'bg-[#b39b82] border-[#b39b82]' : 'bg-white border-gray-300 group-hover:border-[#b39b82]')}>
                      {isChecked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                    <span className={'text-sm font-medium select-none ' + (isChecked ? 'text-gray-900' : 'text-gray-600')}>
                      {item.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Desenho p/ analise */}
          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Desenho p/ análise / Notas
            </h2>
            <div>
              <textarea
                value={formData.technicalNotes}
                onChange={e => setFormData({ ...formData, technicalNotes: e.target.value })}
                rows={15}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed font-mono resize-y"
                style={{
                  backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 0)',
                  backgroundSize: '20px 20px'
                }}
                placeholder="Podes usar este espaço para apontar medidas ou notas da obra..."
              />
            </div>
          </section>

        </div>
      </div>

      {showPdf && (
        <SiteVisitPdfPreview 
          visit={formData as SiteVisit} 
          onClose={() => setShowPdf(false)} 
        />
      )}
    </div>
  );
}
