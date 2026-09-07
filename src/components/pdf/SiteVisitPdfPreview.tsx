import React, { useEffect } from 'react';
import { SiteVisit } from '@/types';
import { Printer, X, Download } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface SiteVisitPdfPreviewProps {
  visit: SiteVisit | Partial<SiteVisit>;
  onClose: () => void;
}

const CHECKLIST_ITEMS = [
  { id: 'pe_direito', label: 'Medida PAe Direito' },
  { id: 'pe_direito_sanca', label: 'Medida PAe Drt./ Sanca' },
  { id: 'tubos_esgotos', label: 'Verificar saídas de tubos/esgotos' },
  { id: 'eletricidade', label: 'Verificar saídas de eletricidade/tomadas' },
  { id: 'esquadria', label: 'Verificar esquadria de paredes/recortes' },
  { id: 'altura_janelas', label: 'Verificar altura das janelas' }
];

export default function SiteVisitPdfPreview({ visit, onClose }: SiteVisitPdfPreviewProps) {
  const { companyInfo } = useApp();

  // Fix encodings on the fly just in case
  const fixEncoding = (str: string) => {
    let s = str;
    s = s.replace(/PAe/g, 'Pé');
    s = s.replace(/saídas/g, 'saídas'); // Actually, I'll use raw unicode below to be safe
    return s;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900/80 backdrop-blur-sm print:bg-white print:backdrop-blur-none">
      
      {/* Topbar do Preview (NAo aparece na impressAo) */}
      <div className="flex-none bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-gray-900">Preview da Ficha de Obra</h2>
            <p className="text-xs text-gray-500">{visit.number || 'Rascunho'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Gravar PDF
          </button>
        </div>
      </div>

      {/* Area Central (com scroll) */}
      <div className="flex-1 overflow-auto p-8 print:p-0 print:overflow-visible flex justify-center bg-gray-100 print:bg-white">
        
        {/* Folha A4 */}
        <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none print:w-full print:h-auto relative">
          
          <div className="p-[12mm] h-full flex flex-col">
            
            {/* CABECALHO KUBIK */}
            <div className="flex border-b-[6px] border-black pb-1 mb-6">
              <div className="flex-1 flex items-center gap-3 bg-black text-white px-4 py-3 rounded-tr-[30px] rounded-bl-[30px]">
                {/* Logo Placeholder - KUBIK Style */}
                <div className="w-10 h-10 border border-white rounded flex items-center justify-center font-bold text-2xl tracking-tighter">
                  K
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-widest leading-none">KUBIK</h1>
                  <p className="text-[9px] uppercase tracking-widest font-medium">Home & Life Furniture</p>
                </div>
              </div>
              <div className="w-[45%] bg-[#333333] text-white flex flex-col justify-center items-end px-6 rounded-tl-[30px] rounded-br-[30px] ml-1">
                <h2 className="text-lg font-bold tracking-widest">ORÇAMENTO</h2>
                <p className="text-xs">Informações de Cliente & Projecto</p>
              </div>
            </div>

            {/* DADOS DO CLIENTE */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8 px-4">
              <div className="flex items-end gap-2">
                <span className="text-xs font-bold text-gray-900 w-14">Nome:</span>
                <div className="flex-1 border-b border-gray-400 pb-0.5 text-sm font-medium">
                  {visit.clientName || ' '}
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-xs font-bold text-gray-900 w-10">Data:</span>
                <div className="flex-1 border-b border-gray-400 pb-0.5 text-sm font-medium">
                  {visit.visitDate || ' '}
                </div>
              </div>
              
              <div className="flex items-end gap-2">
                <span className="text-xs font-bold text-gray-900 w-14">Email:</span>
                <div className="flex-1 border-b border-gray-400 pb-0.5 text-sm font-medium">
                  {visit.clientEmail || ' '}
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-xs font-bold text-gray-900 w-10">Tel.:</span>
                <div className="flex-1 border-b border-gray-400 pb-0.5 text-sm font-medium">
                  {visit.clientPhone || ' '}
                </div>
              </div>

              <div className="flex items-end gap-2">
                <span className="text-xs font-bold text-gray-900 w-14">Morada:</span>
                <div className="flex-1 border-b border-gray-400 pb-0.5 text-sm font-medium truncate">
                  {visit.clientAddress || ' '}
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-xs font-bold text-gray-900 w-10">NIF:</span>
                <div className="flex-1 border-b border-gray-400 pb-0.5 text-sm font-medium">
                  {visit.clientNif || ' '}
                </div>
              </div>
            </div>

            {/* FAIXA CASTANHA - CHECKLIST */}
            <div className="bg-[#b39b82]/40 border border-[#b39b82] p-4 mb-2 flex-none" style={{ backgroundColor: 'rgba(179, 155, 130, 0.4)' }}>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                {CHECKLIST_ITEMS.map((item, idx) => {
                  const isChecked = visit.checklist?.[item.id];
                  // Raw label to avoid typescript/encoding messes right now
                  let label = item.label;
                  label = label.replace(/PAe/g, 'Pé');
                  label = label.replace(/saídas/g, 'saídas');
                  label = label.replace(/esquadria de paredes\/recortes/, 'esquadria de paredes/recortes');
                  
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-4 h-4 border border-black bg-white flex items-center justify-center">
                        {isChecked && <div className="w-2.5 h-2.5 bg-black" />}
                      </div>
                      <span className="text-xs text-black font-medium">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AREA PONTILHADA DE DESENHO */}
            <div className="flex-1 border border-gray-300 relative rounded-sm mt-2 flex flex-col">
              <div className="absolute top-2 left-3 text-xs text-gray-500 font-medium z-10 bg-white/80 px-1">
                Desenho p/ análise
              </div>
              {/* O fundo pontilhado */}
              <div 
                className="absolute inset-0 z-0 opacity-50"
                style={{
                  backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 0)',
                  backgroundSize: '15px 15px',
                  backgroundPosition: '0 0'
                }}
              />
              {/* Texto das notas técnicas */}
              <div className="relative z-10 p-8 pt-10 text-sm font-mono whitespace-pre-wrap text-black">
                {visit.technicalNotes}
              </div>
            </div>

            {/* Rodapé do doc */}
            <div className="text-center text-[8px] text-gray-400 mt-2">
              IMP190-00 - {visit.number}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
