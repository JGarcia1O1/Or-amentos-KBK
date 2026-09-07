'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Client, Quote } from '@/types';
import { Users, Plus, MapPin, Mail, Phone, FileText, Check, X, Pencil, Trash2, FileSpreadsheet, ChevronRight, ExternalLink } from 'lucide-react';

export default function ClientsView() {
  const { clients, addClient, updateClient, deleteClient, quotes, openPdfPreview } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [showAllQuotesModal, setShowAllQuotesModal] = useState<string | null>(null); // Guardará o ID do cliente
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Client>({
    name: '',
    nif: '',
    address: '',
    email: '',
    phone: '',
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', nif: '', address: '', email: '', phone: '', notes: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingId(client.id || null);
    setFormData(client);
    setShowModal(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    if (editingId) {
      updateClient(editingId, formData);
    } else {
      addClient(formData);
    }
    setShowModal(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Base de Clientes</h2>
          <p className="text-xs text-gray-500">
            Contactos, NIFs e moradas de obra associados aos orçamentos
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Cliente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clients.map((c, idx) => (
          <div
            key={c.id || idx}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-2.5 hover:border-gray-300 transition group relative"
          >
            {/* Ações de Edição/Remoção (Visíveis em hover ou mobile) */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenEdit(c)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                title="Editar Cliente"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (c.id) deleteClient(c.id);
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                title="Remover Cliente"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between pr-16">
              <h3 className="font-bold text-sm text-gray-900">{c.name}</h3>
              <span className="text-[11px] font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-semibold">
                NIF: {c.nif || 'Consumidor Final'}
              </span>
            </div>

            <p className="text-xs text-gray-600 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{c.address || 'Sem morada registada'}</span>
            </p>

            <div className="text-[11px] text-gray-500 flex flex-wrap items-center gap-4 pt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-gray-400" />
                <span>{c.email || 'N/A'}</span>
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-gray-400" />
                <span>{c.phone || 'N/A'}</span>
              </span>
            </div>

            {c.notes && (
              <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 flex items-center gap-1">
                <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="truncate">{c.notes}</span>
              </div>
            )}

            {/* Secção de Orçamentos do Cliente */}
            {(() => {
              const clientQuotes = quotes
                .filter(q => q.clientName === c.name)
                .sort((a, b) => {
                  const [d1, m1, y1] = a.date.split('/');
                  const [d2, m2, y2] = b.date.split('/');
                  return new Date(`${y2}-${m2}-${d2}`).getTime() - new Date(`${y1}-${m1}-${d1}`).getTime();
                });
              
              if (clientQuotes.length === 0) return null;

              const visibleQuotes = clientQuotes.slice(0, 3);
              const hasMore = clientQuotes.length > 3;

              return (
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Orçamentos Recentes
                    </span>
                    {hasMore && (
                      <button
                        onClick={() => c.id && setShowAllQuotesModal(c.id)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition"
                      >
                        Ver todos ({clientQuotes.length})
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    {visibleQuotes.map(q => (
                      <button
                        key={q.id}
                        onClick={() => openPdfPreview(q)}
                        className="w-full text-left flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition group"
                        title="Ver PDF do Orçamento"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                          <div className="flex flex-col truncate">
                            <span className="text-xs font-bold text-gray-900 group-hover:text-blue-900 truncate">
                              {q.number} {q.projectName ? `- ${q.projectName}` : ''}
                            </span>
                            <span className="text-[9px] text-gray-500">
                              {q.date} • {q.status}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      {/* Modal Adicionar/Editar Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="font-bold text-sm text-gray-900">
                {editingId ? 'Editar Cliente' : 'Adicionar Novo Cliente'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 font-bold mb-1">
                  Nome do Cliente / Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none"
                  placeholder="Ex: João Ferreira / Atelier Design"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-bold mb-1">
                  NIF (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.nif}
                  onChange={e =>
                    setFormData({ ...formData, nif: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none font-mono"
                  placeholder="Ex: 519021916"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-bold mb-1">
                  Morada de Obra / Faturação
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none"
                  placeholder="Rua, Código Postal, Localidade"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 font-bold mb-1">Email</label>
                  <input
                    type="text"
                    value={formData.email}
                    onChange={e =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none"
                    placeholder="cliente@email.pt"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 font-bold mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none"
                    placeholder="910 000 000"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 font-semibold shadow-sm flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Guardar Alterações' : 'Guardar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Todos os Orçamentos */}
      {showAllQuotesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
            {(() => {
              const activeClient = clients.find(c => c.id === showAllQuotesModal);
              if (!activeClient) return null;
              
              const allQuotes = quotes
                .filter(q => q.clientName === activeClient.name)
                .sort((a, b) => {
                  const [d1, m1, y1] = a.date.split('/');
                  const [d2, m2, y2] = b.date.split('/');
                  return new Date(`${y2}-${m2}-${d2}`).getTime() - new Date(`${y1}-${m1}-${d1}`).getTime();
                });

              return (
                <>
                  <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">Histórico de Orçamentos</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{activeClient.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAllQuotesModal(null)}
                      className="text-gray-400 hover:text-black transition p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-5 overflow-y-auto custom-scrollbar space-y-2">
                    {allQuotes.map(q => (
                      <button
                        key={q.id}
                        onClick={() => openPdfPreview(q)}
                        className="w-full text-left flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 group-hover:border-blue-300 group-hover:text-blue-600 transition-colors">
                            <FileSpreadsheet className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 group-hover:text-blue-900">
                              {q.number} {q.projectName ? `- ${q.projectName}` : ''}
                            </span>
                            <span className="text-xs text-gray-500">
                              {q.date} • {q.status}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
