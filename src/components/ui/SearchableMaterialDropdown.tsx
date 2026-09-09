import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Material } from '@/types';
import { Search, ChevronDown, Check } from 'lucide-react';

interface Props {
  materials: Material[];
  value: string; // materialCode
  onChange: (code: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchableMaterialDropdown({ materials, value, onChange, placeholder = "Selecione o material...", className = "" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedMaterial = materials.find(m => m.code === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter 
  const filteredMaterials = useMemo(() => {
    if (!search.trim()) return materials.slice(0, 50); // Show max 50 for performance if no search
    const lowerSearch = search.toLowerCase();
    return materials.filter(m => 
      m.name.toLowerCase().includes(lowerSearch) || 
      m.code.toLowerCase().includes(lowerSearch)
    ).slice(0, 100); // Limit to 100 results for rendering performance
  }, [materials, search]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border border-gray-200 rounded p-1.5 flex items-center justify-between font-semibold outline-none hover:border-gray-300 transition ${selectedMaterial ? 'text-gray-900' : 'text-gray-400'}`}
      >
        <span className="truncate text-[10px]">
          {selectedMaterial ? `${selectedMaterial.code} - ${selectedMaterial.name} (${selectedMaterial.price.toFixed(2)}€)` : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Pesquisar por nome ou referência..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none bg-transparent text-[11px]"
            />
          </div>
          
          <div className="overflow-y-auto flex-1 p-1">
            {filteredMaterials.length === 0 ? (
              <div className="p-3 text-center text-gray-400 text-[10px]">Nenhum material encontrado.</div>
            ) : (
              filteredMaterials.map(m => (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => {
                    onChange(m.code);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left p-2 rounded flex items-center justify-between hover:bg-gray-100 transition ${value === m.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-semibold text-[10px] truncate">{m.name}</span>
                    <span className="text-[9px] text-gray-400">Ref: {m.code}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-[10px]">{m.price.toFixed(2)}€</span>
                    {value === m.code && <Check className="w-3 h-3 text-blue-600" />}
                  </div>
                </button>
              ))
            )}
            
            {materials.length > 50 && !search.trim() && (
              <div className="p-2 text-center text-[9px] text-gray-400 border-t border-gray-50 bg-gray-50/50">
                A mostrar 50 de {materials.length} chapas. Use a pesquisa para encontrar mais.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
