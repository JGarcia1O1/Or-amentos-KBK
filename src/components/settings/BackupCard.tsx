'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Download, HardDrive } from 'lucide-react';
import { toast } from 'sonner';

export default function BackupCard() {
  const { quotes, clients, companyInfo, materials, hardware, workstations, edges } = useApp();
  const [isExporting, setIsExporting] = useState(false);

  const handleBackup = async () => {
    try {
      setIsExporting(true);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        data: {
          quotes,
          clients,
          companyInfo,
          catalog: {
            materials,
            hardware,
            workstations,
            edges
          }
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KUBIK_Backup_Total_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Backup Global concluA-do com sucesso!");
    } catch (err) {
      toast.error("Falha ao gerar backup.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <HardDrive className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-gray-900">
            Backup Global de SeguranA a (Nuvem para PC)
          </h4>
          <p className="text-[11px] text-gray-500 max-w-xl">
            Transfere todos os orA amentos, clientes, regras e configuraA AAes num ficheiro estruturado seguro para o teu computador.
            Usa isto se quiseres ter um arquivo fA-sico extra de tudo o que estA guardado no Supabase.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={handleBackup}
          disabled={isExporting}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold text-xs transition shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'A preparar...' : 'Exportar Backup Total'}</span>
        </button>
      </div>
    </div>
  );
}
