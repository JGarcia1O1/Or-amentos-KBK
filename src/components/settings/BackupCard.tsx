'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Download, Upload, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import { QuoteService } from '@/services/quoteService';

export default function BackupCard() {
  const { quotes, clients, companyInfo, materials, hardware, workstations, edges } = useApp();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      a.download = "KUBIK_Backup_Total_" + new Date().toISOString().split('T')[0] + ".json";
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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backup = JSON.parse(content);
        
        if (!backup.data || !backup.data.quotes) {
          throw new Error('Formato de ficheiro invAlido.');
        }

        const quotesToImport = backup.data.quotes;
        
        if (confirm("Encontrados " + quotesToImport.length + " orcamentos no backup. Queres injetar estes orcamentos na base de dados (Supabase)?\\n\\nIsto nao vai apagar os existentes, apenas vai adicionar ou atualizar.")) {
          toast.info("A importar orcamentos, por favor aguarda...");
          
          await QuoteService.saveBulk(quotesToImport);
          
          toast.success("Backup importado com sucesso! Faz Refresh (F5) para veres os orcamentos.");
        }
      } catch (err: any) {
        toast.error("Erro ao ler o ficheiro: " + err.message);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <HardDrive className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-gray-900">
            Backup Global de Seguranca (Nuvem / PC)
          </h4>
          <p className="text-[11px] text-gray-500 max-w-xl">
            Podes exportar todos os orcamentos para o teu PC ou Importar um ficheiro de backup antigo para devolver orcamentos perdidos A base de dados.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={handleBackup}
          disabled={isExporting || isImporting}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold text-xs transition shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'A preparar...' : 'Exportar Backup Total'}</span>
        </button>

        <input 
          type="file" 
          accept=".json" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleImport}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isExporting || isImporting}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg font-bold text-xs transition shadow-sm disabled:opacity-50 border border-gray-300"
        >
          <Upload className="w-4 h-4" />
          <span>{isImporting ? 'A ler ficheiro...' : 'Restaurar / Importar'}</span>
        </button>
      </div>
    </div>
  );
}
