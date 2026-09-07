'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { VisitService } from '@/services/visitService';
import { SiteVisit, VisitStatus } from '@/types';
import { Search, Plus, MapPin, Calendar, HardHat, FileText, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function VisitsView() {
  const { setCurrentView } = useApp();
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadVisits = async () => {
    try {
      setLoading(true);
      const data = await VisitService.getAll();
      setVisits(data);
    } catch (err: any) {
      toast.error('Erro ao carregar Fichas de Obra: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Tens a certeza que queres apagar esta Ficha de Obra?')) {
      try {
        await VisitService.delete(id);
        toast.success('Ficha apagada com sucesso');
        loadVisits();
      } catch (err: any) {
        toast.error('Erro ao apagar: ' + err.message);
      }
    }
  };

  const filtered = visits.filter(v => 
    v.number.toLowerCase().includes(search.toLowerCase()) || 
    v.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: VisitStatus) => {
    switch (status) {
      case 'Agendado': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Realizado': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Orcamentado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fichas de Obra</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gere todos os levantamentos, visitas e medições em obra.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar ficha ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          
          <button
            onClick={() => {
              // We need to pass state that we are creating a new one. 
              // Usually we do this by setting a global selectedVisit, but to keep it simple, we can just navigate and let the form component start empty.
              // We'll dispatch a custom event or use context. Let's just use setCurrentView.
              // To pass data, we could use localStorage temporarily or add selectedVisit to AppContext.
              // Since I can't easily change AppContext selectedVisit without more patching, I'll use localStorage.
              localStorage.removeItem('selectedVisit');
              setCurrentView('visit-editor' as any);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Visita
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold w-32">N.º Obra</th>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Data / Local</th>
                <th className="px-6 py-4 font-semibold w-40 text-center">Estado</th>
                <th className="px-6 py-4 font-semibold w-32 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    A carregar visitas...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {search ? 'Nenhuma visita encontrada.' : 'Ainda não existem visitas de obra registadas.'}
                  </td>
                </tr>
              ) : (
                filtered.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-mono text-indigo-600 font-medium">{visit.number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{visit.clientName}</div>
                      {visit.projectTypes.length > 0 && (
                        <div className="text-[11px] text-gray-500 mt-1 flex gap-1 flex-wrap">
                          {visit.projectTypes.map(t => (
                            <span key={t} className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{t}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{visit.visitDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate max-w-[200px]">{visit.clientAddress || 'S/ Morada'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={'px-2.5 py-1 text-[11px] font-semibold border rounded-full ' + getStatusColor(visit.status)}>
                        {visit.status === 'Orcamentado' ? 'Orçamentado' : visit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            localStorage.setItem('selectedVisit', JSON.stringify(visit));
                            setCurrentView('visit-editor' as any);
                          }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Editar Ficha"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(visit.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Apagar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
