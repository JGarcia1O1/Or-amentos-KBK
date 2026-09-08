'use client';

import React from 'react';
import {
  TrendingUp,
  Banknote,
  Wrench,
  Users,
  ShoppingCart,
  Factory,
  BarChart4,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function CompanyDashboard() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <BarChart4 className="w-8 h-8 text-blue-600" />
            Dashboard de Gestão
          </h1>
          <p className="text-gray-500 mt-1">
            Indicadores de Desempenho e Telemetria (Preenchimento Híbrido)
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm">
          <Clock className="w-4 h-4 text-gray-400" />
          <select className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer">
            <option>Semana Atual (Sem. 35)</option>
            <option>Mês Atual</option>
            <option>Ano Acumulado (YTD)</option>
          </select>
        </div>
      </div>

      {/* Top Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard 
          title="Faturação Total (s/ IVA)" 
          value="€ 45.230" 
          target="€ 50.000" 
          trend="down" 
          trendValue="-9.5%" 
          icon={<Banknote className="w-6 h-6 text-emerald-600" />} 
          color="emerald"
        />
        <KPICard 
          title="Variação Tesouraria" 
          value="€ +12.400" 
          target="€ +5.000" 
          trend="up" 
          trendValue="+148%" 
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />} 
          color="blue"
        />
        <KPICard 
          title="Obras Concluídas" 
          value="14" 
          target="15" 
          trend="down" 
          trendValue="-1" 
          icon={<Factory className="w-6 h-6 text-purple-600" />} 
          color="purple"
        />
        <KPICard 
          title="Conversão Orçamentos" 
          value="68%" 
          target="60%" 
          trend="up" 
          trendValue="+8%" 
          icon={<CheckCircle2 className="w-6 h-6 text-amber-600" />} 
          color="amber"
        />
      </div>

      {/* Grid for the 6 Main Sections from the Excel */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* 1. FATURAÇÃO & VENDAS */}
        <DashboardSection title="1. Faturação por Categoria" icon={<ShoppingCart className="w-5 h-5 text-gray-500" />}>
          <div className="space-y-4">
            <ProgressRow label="Cozinhas" actual={25400} target={30000} />
            <ProgressRow label="Roupeiros" actual={12800} target={10000} />
            <ProgressRow label="Móveis WC" actual={4500} target={5000} />
            <ProgressRow label="Pedras / Planos" actual={2530} target={5000} />
          </div>
        </DashboardSection>

        {/* 2. PRODUÇÃO */}
        <DashboardSection title="2. Produção (Obras Concluídas)" icon={<Wrench className="w-5 h-5 text-gray-500" />}>
          <div className="space-y-4">
             <div className="flex items-center justify-between text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
               <span>Categoria</span>
               <div className="flex gap-8 w-1/2 justify-end">
                 <span>Custo</span>
                 <span>Venda</span>
                 <span>Margem</span>
               </div>
             </div>
             <ProductionRow label="Cozinhas" cost={14000} sale={25400} />
             <ProductionRow label="Roupeiros" cost={6000} sale={12800} />
             <ProductionRow label="Móveis WC" cost={2100} sale={4500} />
          </div>
        </DashboardSection>

        {/* 3. TESOURARIA E RECEBIMENTOS */}
        <DashboardSection title="3. Tesouraria & Recebimentos" icon={<Banknote className="w-5 h-5 text-gray-500" />}>
          <div className="space-y-3">
             <DataRow label="Recebimentos de clientes" value="€ 28.500" highlight />
             <DataRow label="Pagamentos a fornecedores" value="€ -9.400" />
             <DataRow label="Pagamentos salários/colab." value="€ -5.200" />
             <div className="border-t border-gray-100 my-2 pt-2"></div>
             <DataRow label="Saldo banco — Início" value="€ 42.100" />
             <DataRow label="Saldo banco — Fim" value="€ 56.000" highlight />
          </div>
        </DashboardSection>

        {/* 4. CLIENTES & COBRANÇAS */}
        <DashboardSection title="4. Clientes & Cobranças" icon={<Users className="w-5 h-5 text-gray-500" />}>
           <div className="space-y-3">
             <DataRow label="Saldo total dívida clientes" value="€ 14.200" isWarning />
             <DataRow label="Dívida vencida > 30 dias" value="€ 4.500" isWarning />
             <DataRow label="Prazo médio de recebimento" value="28 dias" />
             <div className="border-t border-gray-100 my-2 pt-2"></div>
             <DataRow label="Orçamentos enviados" value="24 un" />
             <DataRow label="Orçamentos aprovados" value="16 un" highlight />
          </div>
        </DashboardSection>

      </div>
    </div>
  );
}

// Helper Components
function KPICard({ title, value, target, trend, trendValue, icon, color }: any) {
  const trendColor = trend === 'up' ? 'text-emerald-600' : 'text-red-500';
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-${color}-50`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${trendColor} bg-${color}-50/50 px-2.5 py-1 rounded-full`}>
          <TrendIcon className="w-4 h-4" />
          {trendValue}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-xs text-gray-400 mt-2">Meta: {target}</p>
      </div>
    </div>
  );
}

function DashboardSection({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
        {icon}
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-6 flex-1">
        {children}
      </div>
    </div>
  );
}

function ProgressRow({ label, actual, target }: { label: string, actual: number, target: number }) {
  const percent = Math.min(100, Math.round((actual / target) * 100)) || 0;
  const isDanger = percent < 50;
  const isWarning = percent >= 50 && percent < 90;
  
  let barColor = 'bg-emerald-500';
  if (isDanger) barColor = 'bg-red-500';
  else if (isWarning) barColor = 'bg-amber-400';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-900 font-semibold">€ {actual.toLocaleString('pt-PT')} <span className="text-gray-400 font-normal text-xs">/ € {target.toLocaleString('pt-PT')}</span></span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full`} style={{ width: percent + '%' }}></div>
      </div>
    </div>
  );
}

function ProductionRow({ label, cost, sale }: { label: string, cost: number, sale: number }) {
  const margin = sale - cost;
  const marginPercent = sale > 0 ? Math.round((margin / sale) * 100) : 0;
  
  return (
    <div className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
      <span className="font-medium text-gray-700">{label}</span>
      <div className="flex gap-8 w-1/2 justify-end text-right">
        <span className="text-gray-500 w-16">€ {cost.toLocaleString('pt-PT')}</span>
        <span className="text-gray-900 font-semibold w-16">€ {sale.toLocaleString('pt-PT')}</span>
        <span className={`w-16 font-bold ${marginPercent >= 40 ? 'text-emerald-600' : 'text-amber-600'}`}>
          {marginPercent}%
        </span>
      </div>
    </div>
  );
}

function DataRow({ label, value, highlight = false, isWarning = false }: { label: string, value: string, highlight?: boolean, isWarning?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-gray-600 flex items-center gap-2">
        {isWarning && <AlertCircle className="w-4 h-4 text-red-400" />}
        {label}
      </span>
      <span className={`text-sm font-medium ${highlight ? 'text-gray-900 font-bold' : 'text-gray-700'} ${isWarning ? 'text-red-600 font-bold' : ''}`}>
        {value}
      </span>
    </div>
  );
}
