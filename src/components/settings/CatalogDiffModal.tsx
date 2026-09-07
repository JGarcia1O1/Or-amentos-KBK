'use client';

import React, { useMemo } from 'react';
import { Material, Hardware, Workstation } from '@/types';
import { Check, X, AlertTriangle, ArrowRight } from 'lucide-react';

interface CatalogDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (newCatalog: any) => void;
  onReject: () => void;
  currentCatalog: {
    materials: Material[];
    hardware: Hardware[];
    workstations: Workstation[];
  };
  newCatalog: {
    materials: Material[];
    hardware: Hardware[];
    workstations: Workstation[];
  };
}

export default function CatalogDiffModal({
  isOpen,
  onClose,
  onApprove,
  onReject,
  currentCatalog,
  newCatalog,
}: CatalogDiffModalProps) {
  
  const diffs = useMemo(() => {
    if (!newCatalog || !currentCatalog) return { added: [], removed: [], modified: [] };

    const added: any[] = [];
    const removed: any[] = [];
    const modified: any[] = [];

    // Helper para comparar arrays genéricos por 'code'
    const compareArrays = (type: string, currentArr: any[] = [], newArr: any[] = [], priceField: string) => {
      const currentMap = new Map(currentArr.map(item => [item.code, item]));
      const newMap = new Map(newArr.map(item => [item.code, item]));

      // Check for added and modified
      newArr.forEach(newItem => {
        const currentItem = currentMap.get(newItem.code);
        if (!currentItem) {
          added.push({ type, item: newItem });
        } else {
          // Check if price/rate or name changed
          const priceChanged = currentItem[priceField] !== newItem[priceField];
          const nameChanged = currentItem.name !== newItem.name;
          
          if (priceChanged || nameChanged) {
            modified.push({
              type,
              item: newItem,
              changes: {
                oldPrice: currentItem[priceField],
                newPrice: newItem[priceField],
                oldName: currentItem.name,
                newName: newItem.name,
                priceChanged,
                nameChanged
              }
            });
          }
        }
      });

      // Check for removed
      currentArr.forEach(currentItem => {
        if (!newMap.has(currentItem.code)) {
          removed.push({ type, item: currentItem });
        }
      });
    };

    compareArrays('Material', currentCatalog.materials, newCatalog.materials, 'price');
    compareArrays('Ferragem', currentCatalog.hardware, newCatalog.hardware, 'price');
    compareArrays('Máquina', currentCatalog.workstations, newCatalog.workstations, 'rate');

    return { added, removed, modified };
  }, [currentCatalog, newCatalog]);

  const hasChanges = diffs.added.length > 0 || diffs.removed.length > 0 || diffs.modified.length > 0;

  // Auto-close if no changes are detected when opened
  React.useEffect(() => {
    if (isOpen && !hasChanges) {
      onClose();
    }
  }, [isOpen, hasChanges, onClose]);

  if (!isOpen || !hasChanges) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="p-5 bg-amber-500 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-900" />
            <div>
              <h2 className="font-bold text-lg text-amber-950">Alteração detetada no Excel</h2>
              <p className="text-amber-900/80 text-sm">O ficheiro kubik_catalogo.xlsx foi modificado. Reveja as alterações antes de aplicar ao software.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-amber-900 hover:text-amber-950 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50 space-y-6">
          {!hasChanges ? (
            <div className="text-center text-gray-500 py-10">
              O Excel foi guardado mas não tem diferenças estruturais ou de preços.
            </div>
          ) : (
            <>
              {/* Adicionados */}
              {diffs.added.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-emerald-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Novos Itens ({diffs.added.length})
                  </h3>
                  <div className="bg-white border border-emerald-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-emerald-50/50 text-emerald-800">
                        <tr><th className="p-2 w-24">Tipo</th><th className="p-2 w-24">Cód.</th><th className="p-2">Nome</th><th className="p-2 w-24 text-right">Preço</th></tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50">
                        {diffs.added.map((d, i) => (
                          <tr key={i}>
                            <td className="p-2 text-emerald-600 font-semibold">{d.type}</td>
                            <td className="p-2 font-mono text-gray-500">{d.item.code}</td>
                            <td className="p-2 font-medium">{d.item.name}</td>
                            <td className="p-2 text-right font-bold text-gray-900">{d.item.price || d.item.rate} €</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Alterados */}
              {diffs.modified.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-amber-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Itens Alterados ({diffs.modified.length})
                  </h3>
                  <div className="bg-white border border-amber-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-amber-50/50 text-amber-800">
                        <tr><th className="p-2 w-24">Tipo</th><th className="p-2 w-24">Cód.</th><th className="p-2">Alterações</th></tr>
                      </thead>
                      <tbody className="divide-y divide-amber-50">
                        {diffs.modified.map((d, i) => (
                          <tr key={i}>
                            <td className="p-2 text-amber-700 font-semibold align-top">{d.type}</td>
                            <td className="p-2 font-mono text-gray-500 align-top">{d.item.code}</td>
                            <td className="p-2 space-y-1">
                              {d.changes.nameChanged && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 line-through">{d.changes.oldName}</span>
                                  <ArrowRight className="w-3 h-3 text-gray-400" />
                                  <span className="font-bold">{d.changes.newName}</span>
                                </div>
                              )}
                              {d.changes.priceChanged && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 line-through">{d.changes.oldPrice} €</span>
                                  <ArrowRight className="w-3 h-3 text-gray-400" />
                                  <span className="font-bold text-amber-700">{d.changes.newPrice} €</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Removidos */}
              {diffs.removed.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-red-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Itens Removidos ({diffs.removed.length})
                  </h3>
                  <div className="bg-white border border-red-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-red-50/50 text-red-800">
                        <tr><th className="p-2 w-24">Tipo</th><th className="p-2 w-24">Cód.</th><th className="p-2">Nome</th></tr>
                      </thead>
                      <tbody className="divide-y divide-red-50">
                        {diffs.removed.map((d, i) => (
                          <tr key={i}>
                            <td className="p-2 text-red-600 font-semibold">{d.type}</td>
                            <td className="p-2 font-mono text-gray-500 line-through">{d.item.code}</td>
                            <td className="p-2 text-gray-400 line-through">{d.item.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-5 bg-white border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
          <button 
            onClick={onReject}
            className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Rejeitar (Manter versão atual)
          </button>
          <button 
            onClick={() => onApprove(newCatalog)}
            disabled={!hasChanges}
            className="px-5 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Aprovar e Atualizar Software</span>
          </button>
        </div>

      </div>
    </div>
  );
}
