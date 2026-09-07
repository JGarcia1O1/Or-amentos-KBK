import React from 'react';
import { SiteVisit } from '@/types';
import { Printer, X } from 'lucide-react';

interface SiteVisitPdfPreviewProps {
  visit: SiteVisit | Partial<SiteVisit>;
  onClose: () => void;
}

const CHECKLIST_ITEMS = [
  { id: 'pe_direito', label: 'Medida Pé Direito' },
  { id: 'pe_direito_sanca', label: 'Medida Pé Drt./ Sanca' },
  { id: 'tubos_esgotos', label: 'Verificar saídas de tubos/esgotos' },
  { id: 'eletricidade', label: 'Verificar saídas de eletricidade/tomadas' },
  { id: 'esquadria', label: 'Verificar esquadria de paredes/recortes' },
  { id: 'altura_janelas', label: 'Verificar altura das janelas' }
];

export default function SiteVisitPdfPreview({ visit, onClose }: SiteVisitPdfPreviewProps) {
  const handlePrint = () => {
    const originalTitle = document.title;
    const nameParts = (visit.clientName || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const displayName = lastName ? (firstName + ' ' + lastName) : firstName;
    
    document.title = 'KUBIK Ficha de Obra ' + visit.number + ' (' + displayName + ')';
    window.print();
    
    setTimeout(() => {
    document.title = 'KUBIK Ficha de Obra ' + visit.number + ' (' + displayName + ')';
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 flex flex-col overflow-hidden max-h-[95vh]">
        
        {/* Barra de Ações Superior do Modal (Não aparece na impressão) */}
        <div className="p-3.5 bg-gray-900 text-white flex items-center justify-between no-print flex-shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold">
              Preview da Ficha de Obra KUBIK HOME - {visit.number}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar em PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DOCUMENTO IMPRIMÍVEL */}
        <div
          id="pdf-printable-area"
          className="px-8 bg-white overflow-y-auto space-y-6 font-sans text-xs text-gray-900 leading-normal pb-8"
        >
          <table className="w-full h-full min-h-[297mm]">
            <thead className="w-full table-header-group">
              <tr>
                <td className="pb-8" style={{ paddingTop: '15mm' }}>
                  {/* Cabeçalho Oficial (Logotipo + Titulo) */}
                  <div className="flex items-start justify-between border-b border-gray-300 pb-6">
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/logo_kubik.png"
                        alt="KUBIK HOME"
                        className="h-14 object-contain"
                      />
                    </div>

                    <div className="text-right">
                      <h1 className="text-base font-extrabold text-gray-900 tracking-wider">
                        FICHA DE OBRA
                      </h1>
                      <div className="mt-1 text-[11px] font-bold text-gray-800 uppercase tracking-widest">
                        Levantamento & Medições
                      </div>
                      <div className="mt-2 text-[11px] font-bold text-gray-800 font-mono">
                        Ref: {visit.number}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Data: {visit.visitDate}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Responsável: {visit.responsible}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </thead>
            
            <tbody className="w-full align-top">
              <tr>
                <td>
                  <div className="space-y-6">
                    
                    {/* Caixa de Dados do Cliente */}
                    <div className="border border-gray-300 rounded p-4 text-[11px] space-y-2 bg-gray-50/50">
                      <div className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-2">
                        Dados do Cliente
                      </div>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                        <div>
                          <span className="font-bold">Nome:</span> {visit.clientName}
                        </div>
                        <div>
                          <span className="font-bold">NIF:</span> {visit.clientNif}
                        </div>
                        <div>
                          <span className="font-bold">Email:</span> {visit.clientEmail}
                        </div>
                        <div>
                          <span className="font-bold">Tel:</span> {visit.clientPhone}
                        </div>
                        <div className="col-span-2">
                          <span className="font-bold">Morada:</span> {visit.clientAddress}
                        </div>
                      </div>
                    </div>

                    {/* Checklist (Estilo Minimalista) */}
                    <div className="border border-gray-300 rounded p-4 text-[11px] bg-white">
                      <div className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-4">
                        Verificações Técnicas
                      </div>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                        {CHECKLIST_ITEMS.map((item) => {
                          const isChecked = visit.checklist?.[item.id];
                          let label = item.label;
                          label = label.replace(/Pé/g, 'Pé');
                          label = label.replace(/saídas/g, 'saídas');
                          return (
                            <div key={item.id} className="flex items-center gap-2">
                              <div className="w-3.5 h-3.5 border border-gray-400 bg-white flex items-center justify-center">
                                {isChecked && <div className="w-2 h-2 bg-gray-900" />}
                              </div>
                              <span className="text-gray-800">{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Area de Notas / Desenho */}
                    <div className="border border-gray-300 rounded overflow-hidden flex flex-col" style={{ minHeight: '120mm' }}>
                      <div className="bg-gray-50 border-b border-gray-300 px-4 py-2 font-bold text-gray-900 uppercase text-[10px] tracking-wider">
                        Desenho para Análise / Notas Técnicas
                      </div>
                      
                      <div className="relative flex-1 bg-white">
                        <div 
                          className="absolute inset-0 z-0 opacity-[0.3]"
                          style={{
                            backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 0)',
                            backgroundSize: '15px 15px',
                            backgroundPosition: '0 0'
                          }}
                        />
                        <div className="relative z-10 p-6 text-sm font-mono whitespace-pre-wrap text-gray-900">
                          {visit.technicalNotes}
                        </div>
                      </div>
                    </div>

                  </div>
                </td>
              </tr>
            </tbody>

            <tfoot className="table-footer-group">
              <tr>
                <td className="pt-10">
                  <div className="text-center text-[9px] text-gray-400 border-t border-gray-200 pt-3">
                    IMP190-00 - KUBIK Home & Life Furniture - Processado eletronicamente
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>
    </div>
  );
}
