'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Building2,
  Database,
  Plus,
  Trash2,
  Save,
  Check,
  Cpu,
} from 'lucide-react';
import { toast } from 'sonner';
import { Workstation, CompanyInfo } from '@/types';
import ConditionsLivePreview from './ConditionsLivePreview';

export default function SettingsView() {
  const {
    companyInfo,
    updateCompanyInfo,
    userRole,
    pendingApprovals,
    approvePending,
    rejectPending,
  } = useApp();

  // Estado local para o formulário de dados da empresa
  const [formData, setFormData] = useState<CompanyInfo>(companyInfo);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyInfo(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="p-6 space-y-8 w-full">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Configurações Gerais
        </h2>
        <p className="text-xs text-gray-500">
          Dados institucionais e condições comerciais da KUBIK HOME.
        </p>
      </div>

      {/* ============================================================ */}
      {/* 0. APROVAÇÕES PENDENTES (Apenas Administrador)                */}
      {/* ============================================================ */}
      {userRole === 'admin' && pendingApprovals.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-amber-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Aprovações Pendentes ({pendingApprovals.length})
            </h3>
          </div>
          <div className="space-y-3">
            {pendingApprovals.map(p => (
              <div key={p.id} className="bg-white border border-amber-100 rounded-lg p-3 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-xs font-semibold text-gray-900">
                    Pedido de: <span className="text-blue-600">{p.requestedBy}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {p.type === 'workstation_edit' && `Alteração no Posto de Trabalho: ${p.data.code}`}
                    {p.type === 'workstation_add' && `Novo Posto de Trabalho: ${p.data.name}`}
                    {p.type === 'workstation_delete' && `Remover Posto de Trabalho: ${p.data.code}`}
                    {p.type === 'company_info_edit' && `Alteração de Dados da Empresa`}
                    {p.type === 'material_add' && `Nova Chapa: ${p.data.code}`}
                    {p.type === 'material_edit' && `Alterar Preço da Chapa: ${p.data.code} para ${p.data.updated.price}€`}
                    {p.type === 'material_delete' && `Remover Chapa: ${p.data.code}`}
                    {p.type === 'hardware_add' && `Nova Ferragem: ${p.data.code}`}
                    {p.type === 'hardware_edit' && `Alterar Preço da Ferragem: ${p.data.code} para ${p.data.updated.price}€`}
                    {p.type === 'hardware_delete' && `Remover Ferragem: ${p.data.code}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => rejectPending(p.id)} className="px-3 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition border border-red-100">
                    Rejeitar
                  </button>
                  <button onClick={() => approvePending(p.id)} className="px-3 py-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Aprovar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* ============================================================ */}
      {/* 2. DADOS OFICIAIS DA EMPRESA (FORMULÁRIO TOTALMENTE EDITÁVEL) */}
      {/* ============================================================ */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-gray-800" />
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Dados Oficiais da Empresa (KUBIK HOME & LIFE FURNITURE)
              </h3>
              <p className="text-[11px] text-gray-500">
                Estes dados alimentam diretamente os cabeçalhos, rodapés e condições gerais do PDF de 2 páginas.
              </p>
            </div>
          </div>

          {saveSuccess && (
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-fadeIn">
              <Check className="w-4 h-4" />
              <span>Guardado com Sucesso!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                Designação Comercial
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-semibold text-gray-900 focus:border-black outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                Razão Social / Denominação Legal
              </label>
              <input
                type="text"
                value={formData.legalName}
                onChange={e =>
                  setFormData({ ...formData, legalName: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-semibold text-gray-900 focus:border-black outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                NIF da Empresa
              </label>
              <input
                type="text"
                value={formData.nif}
                onChange={e =>
                  setFormData({ ...formData, nif: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-mono font-bold text-gray-900 focus:border-black outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                Telefone / Contacto
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-mono text-gray-900 focus:border-black outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                Website Oficial
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={e =>
                  setFormData({ ...formData, website: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-blue-600 focus:border-black outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                Validade dos Orçamentos (Dias)
              </label>
              <input
                type="number"
                min="1"
                value={formData.validityDays}
                onChange={e =>
                  setFormData({
                    ...formData,
                    validityDays: Number(e.target.value),
                  })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-mono text-gray-900 focus:border-black outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                Morada Fabril
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:border-black outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                Código Postal & Localidade
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={e =>
                  setFormData({ ...formData, postalCode: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:border-black outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                Banco de Pagamento
              </label>
              <input
                type="text"
                value={formData.bank}
                onChange={e =>
                  setFormData({ ...formData, bank: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:border-black outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                IBAN de Liquidação
              </label>
              <input
                type="text"
                value={formData.iban}
                onChange={e =>
                  setFormData({ ...formData, iban: e.target.value })
                }
                className="w-full bg-emerald-50/50 border border-emerald-300 rounded-lg p-2.5 font-mono font-bold text-emerald-900 focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                Tribunal / Comarca Jurídica Competente
              </label>
              <input
                type="text"
                value={formData.court}
                onChange={e =>
                  setFormData({ ...formData, court: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:border-black outline-none"
              />
            </div>

          </div>

          {/* Secção de Condições Gerais & Live Preview (Split Screen) */}
          <div className="pt-6 border-t border-gray-100">
            <div className="mb-4">
              <h4 className="font-bold text-gray-900 text-sm">Condições Gerais de Venda</h4>
              <p className="text-[11px] text-gray-500">As regras e informações legais impressas na última folha do orçamento.</p>
            </div>
            
            <div className="flex flex-col xl:flex-row gap-8 items-start">
              {/* Esquerda: Formulários */}
              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                    Condições de Pagamento
                  </label>
                  <textarea
                    rows={2}
                    value={formData.paymentTerms}
                    onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:border-black outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                    Cláusula de Revisão de Preços (Conjuntura)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.priceRevisionClause || ''}
                    onChange={e => setFormData({ ...formData, priceRevisionClause: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:border-black outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                    Prazos de Entrega
                  </label>
                  <textarea
                    rows={2}
                    value={formData.deliveryTerms || ''}
                    onChange={e => setFormData({ ...formData, deliveryTerms: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:border-black outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                    Transporte e Montagem
                  </label>
                  <textarea
                    rows={3}
                    value={formData.transportTerms || ''}
                    onChange={e => setFormData({ ...formData, transportTerms: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:border-black outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                    Reclamações & Reserva de Propriedade
                  </label>
                  <textarea
                    rows={3}
                    value={formData.claimsTerms || ''}
                    onChange={e => setFormData({ ...formData, claimsTerms: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:border-black outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">
                    Jurisdição (Foro Competente)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.jurisdictionTerms || ''}
                    onChange={e => setFormData({ ...formData, jurisdictionTerms: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:border-black outline-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Direita: Live Preview A4 */}
              <div className="hidden xl:block w-[420px] 2xl:w-[480px] shrink-0">
                <ConditionsLivePreview companyInfo={formData} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
            <button
              type="submit"
              className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Alterações da Empresa</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Base de Dados & Catálogo */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">
              Base de Dados e Catálogo (Master Excel)
            </h4>
            <p className="text-[11px] text-gray-500">
              O catálogo de materiais e ferragens é atualizado automaticamente quando o ficheiro Excel oficial é modificado.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch('/api/catalog/open-folder', { method: 'POST' });
              } catch (e) {
                console.error(e);
              }
            }}
            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold text-xs transition border border-blue-200"
          >
            <Database className="w-4 h-4" />
            <span>Abrir Ficheiro Excel Oficial</span>
          </button>
          
          <a
            href="/api/catalog/export"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-lg font-bold text-xs transition border border-gray-200"
            title="Download de uma cópia de segurança"
          >
            Download (Backup)
          </a>
          
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-gray-700 uppercase">
              Monitorização Excel Ativa
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
