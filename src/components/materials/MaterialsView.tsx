'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { Material, Hardware, Workstation, EdgeMaterial } from '@/types';
import {
  Layers,
  Wrench,
  Plus,
  Trash2,
  Search,
  Check,
  X,
  Cpu,
  Scissors,
} from 'lucide-react';

export default function MaterialsView() {
  const {
    materials,
    updateMaterialPrice,
    addMaterial,
    deleteMaterial,
    hardware,
    updateHardwarePrice,
    addHardware,
    deleteHardware,
    edges,
    addEdge,
    updateEdgePrice,
    deleteEdge,
    workstations,
    updateWorkstation,
    updateWorkstationRate,
    addWorkstation,
    deleteWorkstation,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'materials' | 'hardware' | 'edges' | 'workstations'>('materials');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Orla
  const [showAddEdgeModal, setShowAddEdgeModal] = useState(false);
  const [newEdge, setNewEdge] = useState<EdgeMaterial>({
    code: '',
    name: '',
    pricePerMeter: 0.7,
  });

  // Modal Máquina
  const [showAddMachineModal, setShowAddMachineModal] = useState(false);
  const [newMachine, setNewMachine] = useState<Workstation>({
    code: '',
    name: '',
    rate: 25.0,
  });

  // Modal Chapa
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Material>({
    code: '',
    name: '',
    length: 2800,
    width: 2070,
    thickness: 19,
    price: 45.0,
    isActive: true,
  });

  // Modal Ferragem
  const [showAddHardwareModal, setShowAddHardwareModal] = useState(false);
  const [newHardware, setNewHardware] = useState<Hardware>({
    code: '',
    name: '',
    unit: 'un',
    price: 5.0,
  });

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.name.trim() || !newMaterial.code.trim()) {
      alert('Por favor preencha o código e a designação da chapa.');
      return;
    }
    if (materials.some(m => m.code === newMaterial.code.trim())) {
      alert('Já existe uma chapa com este código de referência!');
      return;
    }
    addMaterial({
      ...newMaterial,
      code: newMaterial.code.trim(),
      length: Number(newMaterial.length) || 2800,
      width: Number(newMaterial.width) || 2070,
      thickness: Number(newMaterial.thickness) || 19,
      price: Number(newMaterial.price) || 0,
    });
    setNewMaterial({
      code: '',
      name: '',
      length: 2800,
      width: 2070,
      thickness: 19,
      price: 45.0,
      isActive: true,
    });
    setShowAddMaterialModal(false);
  };

  const handleAddHardware = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHardware.name.trim() || !newHardware.code.trim()) {
      alert('Por favor preencha o código e a designação da ferragem.');
      return;
    }
    if (hardware.some(h => h.code === newHardware.code.trim())) {
      alert('Já existe uma ferragem com este código de referência!');
      return;
    }
    addHardware({
      ...newHardware,
      code: newHardware.code.trim(),
      price: Number(newHardware.price) || 0,
    });
    setNewHardware({
      code: '',
      name: '',
      unit: 'un',
      price: 5.0,
    });
    setShowAddHardwareModal(false);
  };

  const handleAddEdge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEdge.name.trim() || !newEdge.code.trim()) {
      alert('Por favor preencha o código e a designação da orla.');
      return;
    }
    if (edges.some(h => h.code === newEdge.code.trim())) {
      alert('Já existe uma orla com este código de referência!');
      return;
    }
    addEdge({
      ...newEdge,
      code: newEdge.code.trim(),
      pricePerMeter: Number(newEdge.pricePerMeter) || 0,
    });
    setNewEdge({ code: '', name: '', pricePerMeter: 0.7 });
    setShowAddEdgeModal(false);
  };

  const handleCreateMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachine.code.trim() || !newMachine.name.trim()) {
      alert('Por favor preencha o código e o nome da máquina.');
      return;
    }
    const codeUpper = newMachine.code.trim().toUpperCase();
    if (workstations.some(w => w.code === codeUpper)) {
      alert('Já existe uma máquina com esse código!');
      return;
    }
    addWorkstation({
      ...newMachine,
      code: codeUpper,
      rate: Number(newMachine.rate) || 0,
    });
    setNewMachine({ code: '', name: '', rate: 25.0 });
    setShowAddMachineModal(false);
  };

  const filteredMaterials = materials.filter(
    m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHardware = hardware.filter(
    h =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEdges = edges.filter(
    e =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWorkstations = workstations.filter(
    w =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Chapas / Materiais / Máquinas & Custos
          </h2>
          <p className="text-xs text-gray-500">
            Gestão de catálogos de matérias-primas e custos horários das máquinas de produção.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'materials' && (
            <button
              type="button"
              onClick={() => setShowAddMaterialModal(true)}
              className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Nova Chapa</span>
            </button>
          )}
          {activeTab === 'hardware' && (
            <button
              type="button"
              onClick={() => setShowAddHardwareModal(true)}
              className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Ferragem</span>
            </button>
          )}
          {activeTab === 'edges' && (
            <button
              type="button"
              onClick={() => setShowAddEdgeModal(true)}
              className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Orla</span>
            </button>
          )}
          {activeTab === 'workstations' && (
            <button
              type="button"
              onClick={() => setShowAddMachineModal(true)}
              className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Nova Máquina</span>
            </button>
          )}
        </div>
      </div>

      {/* Navegação entre Abas e Pesquisa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'materials'
                ? 'bg-black text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Chapas & Painéis ({materials.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'hardware'
                ? 'bg-black text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Ferragens & Acessórios ({hardware.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('edges')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'edges'
                ? 'bg-black text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Orlas & Fitas ({edges.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('workstations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'workstations'
                ? 'bg-black text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Máquinas & Custos ({workstations.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 max-w-xs w-full text-xs">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome ou código..."
            className="bg-transparent border-none outline-none w-full text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* TABELA DE CHAPAS */}
      {activeTab === 'materials' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">Ref.</th>
                  <th className="py-3.5 px-4">Designação da Chapa</th>
                  <th className="py-3.5 px-4 text-center">Comprimento</th>
                  <th className="py-3.5 px-4 text-center">Largura</th>
                  <th className="py-3.5 px-4 text-center">Espessura</th>
                  <th className="py-3.5 px-4 text-right font-bold text-gray-900">
                    Preço / Chapa (€)
                  </th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMaterials.map(m => (
                  <tr key={m.code} className="hover:bg-gray-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-600">
                      {m.code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {m.name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-gray-600">
                      {m.length} mm
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-gray-600">
                      {m.width} mm
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-gray-600">
                      {m.thickness} mm
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          defaultValue={m.price}
                          onBlur={e => {
                            const val = Number(e.target.value);
                            if (val !== m.price) updateMaterialPrice(m.code, val);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-20 text-right bg-gray-50 border border-gray-200 rounded-lg p-1 outline-none font-bold focus:border-black"
                        />
                        <span>€</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => deleteMaterial(m.code)}
                        title="Eliminar chapa"
                        className="text-gray-300 hover:text-red-500 transition p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABELA DE FERRAGENS */}
      {activeTab === 'hardware' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">Ref. / Código</th>
                  <th className="py-3.5 px-4">Designação da Ferragem</th>
                  <th className="py-3.5 px-4 text-center">Unidade</th>
                  <th className="py-3.5 px-4 text-right font-bold text-gray-900">
                    Preço de Custo (€)
                  </th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredHardware.map(h => (
                  <tr key={h.code} className="hover:bg-gray-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-600">
                      {h.code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {h.name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-gray-500 uppercase text-[11px]">
                      {h.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          defaultValue={h.price}
                          onBlur={e => {
                            const val = Number(e.target.value);
                            if (val !== h.price) updateHardwarePrice(h.code, val);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-20 text-right bg-gray-50 border border-gray-200 rounded-lg p-1 outline-none font-bold focus:border-black"
                        />
                        <span>€</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => deleteHardware(h.code)}
                        title="Eliminar ferragem"
                        className="text-gray-300 hover:text-red-500 transition p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABELA DE ORLAS */}
      {activeTab === 'edges' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">Ref. / Código</th>
                  <th className="py-3.5 px-4">Designação da Orla</th>
                  <th className="py-3.5 px-4 text-center">Unidade</th>
                  <th className="py-3.5 px-4 text-right font-bold text-gray-900">
                    Preço de Custo (€)
                  </th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEdges.map(e => (
                  <tr key={e.code} className="hover:bg-gray-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-600">
                      {e.code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {e.name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-gray-500 uppercase text-[11px]">
                      METRO
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          defaultValue={e.pricePerMeter}
                          onBlur={evt => {
                            const val = Number(evt.target.value);
                            if (val !== e.pricePerMeter) updateEdgePrice(e.code, val);
                          }}
                          onKeyDown={evt => {
                            if (evt.key === 'Enter') {
                              evt.currentTarget.blur();
                            }
                          }}
                          className="w-20 text-right bg-gray-50 border border-gray-200 rounded-lg p-1 outline-none font-bold focus:border-black"
                        />
                        <span>€</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => deleteEdge(e.code)}
                        title="Eliminar orla"
                        className="text-gray-300 hover:text-red-500 transition p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABELA DE MÁQUINAS / POSTOS DE TRABALHO */}
      {activeTab === 'workstations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredWorkstations.map(ws => (
            <div
              key={ws.code}
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3 hover:border-gray-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-black uppercase tracking-wider font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {ws.code}
                  </span>
                  {workstations.length > 1 && (
                    <button
                      onClick={() => deleteWorkstation(ws.code)}
                      title="Eliminar máquina"
                      className="text-gray-300 hover:text-red-500 transition p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={ws.name}
                  onChange={e =>
                    updateWorkstation(ws.code, { name: e.target.value })
                  }
                  placeholder="Nome do posto"
                  className="w-full font-bold text-xs text-gray-900 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-black outline-none pb-0.5 transition"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">
                  Taxa Horária:
                </span>
                <div className="flex items-center gap-1 font-mono font-bold text-gray-900 text-sm">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={ws.rate}
                    onChange={e =>
                      updateWorkstationRate(ws.code, Number(e.target.value))
                    }
                    className="w-16 text-right bg-gray-50 border border-gray-200 rounded p-1 outline-none font-mono focus:border-black"
                  />
                  <span className="text-xs text-gray-500">€/h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Adicionar Chapa */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-gray-900">
                Nova Chapa de Madeira / Painel
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMaterialModal(false)}
                className="text-gray-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-500 font-bold mb-1">
                    Ref. / Código *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMaterial.code}
                    onChange={e =>
                      setNewMaterial({ ...newMaterial, code: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono"
                    placeholder="502300"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-500 font-bold mb-1">
                    Designação *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMaterial.name}
                    onChange={e =>
                      setNewMaterial({ ...newMaterial, name: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-semibold"
                    placeholder="Ex: Carvalho Natural 19mm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-500 font-bold mb-1">
                    Comp (mm)
                  </label>
                  <input
                    type="number"
                    value={newMaterial.length}
                    onChange={e =>
                      setNewMaterial({
                        ...newMaterial,
                        length: Number(e.target.value),
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 font-bold mb-1">
                    Larg (mm)
                  </label>
                  <input
                    type="number"
                    value={newMaterial.width}
                    onChange={e =>
                      setNewMaterial({
                        ...newMaterial,
                        width: Number(e.target.value),
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 font-bold mb-1">
                    Espessura (mm)
                  </label>
                  <input
                    type="number"
                    value={newMaterial.thickness}
                    onChange={e =>
                      setNewMaterial({
                        ...newMaterial,
                        thickness: Number(e.target.value),
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-bold mb-1">
                  Preço por Chapa Inteira (€)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newMaterial.price}
                  onChange={e =>
                    setNewMaterial({
                      ...newMaterial,
                      price: Number(e.target.value),
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono font-bold text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-semibold"
                >
                  Gravar Chapa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar Ferragem */}
      {showAddHardwareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-gray-900">
                Nova Ferragem / Acessório
              </h3>
              <button
                type="button"
                onClick={() => setShowAddHardwareModal(false)}
                className="text-gray-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddHardware} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 font-bold mb-1">
                  Código de Referência *
                </label>
                <input
                  type="text"
                  required
                  value={newHardware.code}
                  onChange={e =>
                    setNewHardware({ ...newHardware, code: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono"
                  placeholder="Ex: 524980"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-bold mb-1">
                  Designação da Ferragem *
                </label>
                <input
                  type="text"
                  required
                  value={newHardware.name}
                  onChange={e =>
                    setNewHardware({ ...newHardware, name: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-semibold"
                  placeholder="Ex: Dobradiça Blum Clip-Top 110º"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 font-bold mb-1">
                    Unidade
                  </label>
                  <select
                    value={newHardware.unit}
                    onChange={e =>
                      setNewHardware({
                        ...newHardware,
                        unit: e.target.value as any,
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2"
                  >
                    <option value="un">un (Unidade)</option>
                    <option value="metro">metro (Metros Lineares)</option>
                    <option value="par">par (Par)</option>
                    <option value="conjunto">conjunto (Conjunto / Kit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 font-bold mb-1">
                    Preço de Custo (€)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newHardware.price}
                    onChange={e =>
                      setNewHardware({
                        ...newHardware,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddHardwareModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-semibold"
                >
                  Gravar Ferragem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar Orla */}
      {showAddEdgeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-gray-900">
                Nova Orla
              </h3>
              <button
                type="button"
                onClick={() => setShowAddEdgeModal(false)}
                className="text-gray-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEdge} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 font-bold mb-1">
                  Código de Referência *
                </label>
                <input
                  type="text"
                  required
                  value={newEdge.code}
                  onChange={e =>
                    setNewEdge({ ...newEdge, code: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono"
                  placeholder="Ex: ORL-PVC-BRANCO"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-bold mb-1">
                  Designação da Orla *
                </label>
                <input
                  type="text"
                  required
                  value={newEdge.name}
                  onChange={e =>
                    setNewEdge({ ...newEdge, name: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-semibold"
                  placeholder="Ex: Orla PVC 1mm Branca"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-bold mb-1">
                  Preço de Custo por Metro (€)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={newEdge.pricePerMeter}
                  onChange={e =>
                    setNewEdge({
                      ...newEdge,
                      pricePerMeter: Number(e.target.value),
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddEdgeModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-semibold"
                >
                  Gravar Orla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar Máquina */}
      {showAddMachineModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-gray-900">
                Adicionar Posto de Trabalho / Máquina
              </h3>
              <button
                onClick={() => setShowAddMachineModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMachine} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Código Curto da Operação (ex: SH, CNC, FURADORA, PINTURA)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: LACAGEM"
                  value={newMachine.code}
                  onChange={e =>
                    setNewMachine({ ...newMachine, code: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-mono uppercase font-bold focus:border-black outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Nome do Posto de Trabalho
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cabine de Lacagem e Acabamentos"
                  value={newMachine.name}
                  onChange={e =>
                    setNewMachine({ ...newMachine, name: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:border-black outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Custo / Taxa Horária (€/h)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  placeholder="25.00"
                  value={newMachine.rate}
                  onChange={e =>
                    setNewMachine({
                      ...newMachine,
                      rate: Number(e.target.value),
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-mono text-sm focus:border-black outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMachineModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-semibold"
                >
                  Criar Máquina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
