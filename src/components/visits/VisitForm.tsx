'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { VisitService } from '@/services/visitService';
import { SiteVisit, VisitStatus } from '@/types';
import { ArrowLeft, Save, MapPin, Phone, User, Calendar, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const PROJECT_TYPES = ['Cozinha', 'Roupeiros', 'Portas', 'Chao / Flutuante', 'Mobiliario WC', 'Paineis / Revestimentos', 'Outros'];

export default function VisitForm() {
  const { setCurrentView } = useApp();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<SiteVisit>>({
    number: '',
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    visitDate: new Date().toISOString().split('T')[0],
    responsible: '',
    projectTypes: [],
    technicalNotes: '',
    measurementsData: [],
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

  const toggleProjectType = (pt: string) => {
    setFormData(prev => {
      const types = prev.projectTypes || [];
      if (types.includes(pt)) return { ...prev, projectTypes: types.filter(t => t !== pt) };
      return { ...prev, projectTypes: [...types, pt] };
    });
  };

  const handleSave = async () => {
    if (!formData.clientName) {
      toast.error('O nome do cliente e obrigatorio.');
      return;
    }

    try {
      setIsSaving(true);
      const visitToSave = {
        id: formData.id || ('temp-' + Date.now()),
        ...formData
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
              {formData.id ? 'Editar Ficha de Obra' : 'Nova Ficha de Obra'}
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
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'A guardar...' : 'Guardar Ficha'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              1. Dados do Cliente e Local
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Ex: Sr. Manuel Antonio"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Phone className="w-3 h-3"/> Contacto</label>
                <input
                  type="text"
                  value={formData.clientPhone}
                  onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Ex: 912 345 678"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Morada da Obra</label>
                <input
                  type="text"
                  value={formData.clientAddress}
                  onChange={e => setFormData({ ...formData, clientAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Rua, Codigo Postal, Localidade..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Data da Visita</label>
                <input
                  type="date"
                  value={formData.visitDate}
                  onChange={e => setFormData({ ...formData, visitDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Tecnico Responsavel</label>
                <input
                  type="text"
                  value={formData.responsible}
                  onChange={e => setFormData({ ...formData, responsible: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Nome de quem foi a obra"
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              2. Tipo de Intervencao
            </h2>
            <div className="flex flex-wrap gap-2">
              {PROJECT_TYPES.map(type => {
                const isActive = (formData.projectTypes || []).includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleProjectType(type)}
                    className={'px-4 py-2 rounded-lg text-xs font-semibold transition-all border ' + (isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4">
              3. Levantamento e Medidas
            </h2>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Apontamentos da Obra</label>
              <textarea
                value={formData.technicalNotes}
                onChange={e => setFormData({ ...formData, technicalNotes: e.target.value })}
                rows={10}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed font-mono"
                placeholder="Detalhes..."
              />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
