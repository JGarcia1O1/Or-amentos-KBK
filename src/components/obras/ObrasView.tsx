'use client';

import React, { useState } from 'react';
import { 
  Hammer, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Plus,
  Filter,
  MoreVertical,
  CalendarDays,
  Truck,
  Euro
} from 'lucide-react';

const MOCK_OBRAS = [
  { id: 'OB-001', orcamento: '2026-014', client: 'António Pais', title: 'Moradia - Carpintaria Geral', status: 'Em Produção', startDate: '2026-09-10', deadline: '2026-10-15', margin: 45, cost: 6699.89, sale: 11000 },
  { id: 'OB-002', orcamento: '2026-032', client: 'Antonio Salvado', title: 'Cozinha e Roupeiros', status: 'Montagem', startDate: '2026-08-20', deadline: '2026-09-12', margin: 38, cost: 14211.26, sale: 24827.14 },
  { id: 'OB-003', orcamento: '2026-026', client: 'Atelier Vasco Pinho', title: 'Móvel TV e Painel', status: 'Entregue', startDate: '2026-07-15', deadline: '2026-08-01', margin: 77, cost: 356.56, sale: 1601 },
];

export default function ObrasView() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Hammer className="w-8 h-8 text-blue-600" />
            Produção & Obras
          </h1>
          <p className="text-gray-500 mt-1">
            Gestão do ciclo de vida: do desenho à montagem final.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-sm font-medium text-sm">
          <Plus className="w-4 h-4" />
          Nova Obra
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Pesquisar por obra, cliente ou orçamento..." 
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm">
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Kanban / Cards View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Coluna 1: Em Produção */}
        <div className="bg-gray-50/50 rounded-2xl border border-gray-200 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Em Produção
            </h3>
            <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">1</span>
          </div>
          {MOCK_OBRAS.filter(o => o.status === 'Em Produção').map(obra => (
            <ObraCard key={obra.id} obra={obra} />
          ))}
        </div>

        {/* Coluna 2: Montagem */}
        <div className="bg-gray-50/50 rounded-2xl border border-gray-200 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              Montagem / Obra
            </h3>
            <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">1</span>
          </div>
          {MOCK_OBRAS.filter(o => o.status === 'Montagem').map(obra => (
            <ObraCard key={obra.id} obra={obra} />
          ))}
        </div>

        {/* Coluna 3: Entregue */}
        <div className="bg-gray-50/50 rounded-2xl border border-gray-200 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Entregue / Fechada
            </h3>
            <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">1</span>
          </div>
          {MOCK_OBRAS.filter(o => o.status === 'Entregue').map(obra => (
            <ObraCard key={obra.id} obra={obra} />
          ))}
        </div>

      </div>
    </div>
  );
}

function ObraCard({ obra }: { obra: any }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-blue-600 mb-1">{obra.id}</span>
          <h4 className="font-bold text-gray-900 leading-tight">{obra.client}</h4>
          <span className="text-sm text-gray-500 mt-0.5 line-clamp-1">{obra.title}</span>
        </div>
        <button className="text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2 mt-4">
        <div className="flex items-center text-xs text-gray-600 gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
          Prazo: <span className="font-medium text-gray-900">{obra.deadline}</span>
        </div>
        <div className="flex items-center text-xs text-gray-600 gap-2">
          <Euro className="w-3.5 h-3.5 text-gray-400" />
          Margem Atual: <span className={`font-bold ${obra.margin >= 40 ? 'text-emerald-600' : 'text-amber-600'}`}>{obra.margin}%</span>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        <span className="text-gray-500">Ref: {obra.orcamento}</span>
        <button className="text-blue-600 font-medium hover:underline">Ver Detalhes</button>
      </div>
    </div>
  );
}
