'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo } from 'react';
import debounce from 'lodash/debounce';
import { toast } from 'sonner';
import { QuoteService } from '@/services/quoteService';
import { ConfirmModal } from '@/components/layout/ConfirmModal';
import {
  Quote,
  QuoteItem,
  QuoteChapter,
  Client,
  Material,
  Workstation,
  Hardware,
  EdgeMaterial,
  CompanyInfo,
  UserRole,
  PendingApproval,
} from '@/types';
import {
  COMPANY_INFO,
  INITIAL_CLIENTS,
  INITIAL_MATERIALS,
  INITIAL_HARDWARE,
  INITIAL_EDGES,
  INITIAL_QUOTES,
  INITIAL_WORKSTATIONS,
} from '@/lib/mockData';
import { supabase } from '@/lib/supabase';
import CatalogDiffModal from '@/components/settings/CatalogDiffModal';
import {
  calculateQuoteCost,
  calculateQuoteSubtotal,
  calculateQuoteTotalWithVat,
} from '@/lib/calculator';

interface AppContextType {
  // Navegação e Utilizador
  currentView: 'quotes-list' | 'quote-editor' | 'clients' | 'materials' | 'settings' | 'emails';
  setCurrentView: (view: 'quotes-list' | 'quote-editor' | 'clients' | 'materials' | 'settings' | 'emails') => void;
  currentUser: string;
  setCurrentUser: (user: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;

  // Aprovações (RBAC)
  pendingApprovals: PendingApproval[];
  setPendingApprovals: React.Dispatch<React.SetStateAction<PendingApproval[]>>;
  approvePending: (id: string) => void;
  rejectPending: (id: string) => void;

  // Dados Oficiais da Empresa
  companyInfo: CompanyInfo;
  updateCompanyInfo: (info: CompanyInfo) => void;

  // Clientes
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  addClient: (client: Client) => void;
  updateClient: (id: string, updated: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Materiais (Chapas & Painéis)
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  addMaterial: (m: Material) => void;
  updateMaterialPrice: (code: string, newPrice: number) => void;
  deleteMaterial: (code: string) => void;

  // Ferragens & Acessórios
  hardware: Hardware[];
  setHardware: React.Dispatch<React.SetStateAction<Hardware[]>>;
  addHardware: (h: Hardware) => void;
  updateHardwarePrice: (code: string, price: number) => void;
  deleteHardware: (code: string) => void;

  // Orlas
  edges: EdgeMaterial[];
  setEdges: React.Dispatch<React.SetStateAction<EdgeMaterial[]>>;
  addEdge: (e: EdgeMaterial) => void;
  updateEdgePrice: (code: string, price: number) => void;
  deleteEdge: (code: string) => void;

  // Postos de Trabalho & Máquinas
  workstations: Workstation[];
  setWorkstations: React.Dispatch<React.SetStateAction<Workstation[]>>;
  addWorkstation: (ws: Workstation) => void;
  updateWorkstation: (code: string, updated: Partial<Workstation>) => void;
  updateWorkstationRate: (code: string, newRate: number) => void;
  deleteWorkstation: (code: string) => void;

  // Orçamentos
  quotes: Quote[];
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  selectedQuote: Quote | null;
  setSelectedQuote: (quote: Quote | null) => void;
  createNewQuote: (type?: 'manual' | 'automatic') => Quote;
  editQuote: (quote: Quote) => void;
  updateSelectedQuote: (quote: Quote) => void;
  duplicateQuote: (quote: Quote) => void;
  deleteQuote: (id: string) => void;

  // Filtros
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;

  // PDF
  pdfQuote: Quote | null;
  showPdfModal: boolean;
  openPdfPreview: (quote: Quote) => void;
  closePdfPreview: () => void;

  // Totais Globais
  totalQuotedAmount: number;
  totalApprovedAmount: number;
  averageCostAmount: number;

  // Global Confirm Dialog
  confirmAction: (title: string, message: string, onConfirm: () => void) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm });
  };
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [currentView, setCurrentView] = useState<'quotes-list' | 'quote-editor' | 'clients' | 'materials' | 'settings' | 'emails'>('quotes-list');
  const [currentUser, setCurrentUser] = useState<string>('A Carregar...');
  const [userRole, setUserRole] = useState<UserRole>('admin');

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setCurrentUser(session.user.user_metadata?.display_name || 'Utilizador KUBIK');
        // Fetch role from Supabase DB
        supabase.from('user_roles').select('role').eq('user_id', session.user.id).single()
          .then(({ data }) => {
             if (data && data.role === 'admin') setUserRole('admin');
             else setUserRole('gestor'); // Fallback regular user
          });
      } else {
        setCurrentUser('Não autenticado');
      }
    });

    // Listen for changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user?.email) {
          setCurrentUser(session.user.user_metadata?.display_name || 'Utilizador KUBIK');
          supabase.from('user_roles').select('role').eq('user_id', session.user.id).single()
            .then(({ data }) => {
               if (data && data.role === 'admin') setUserRole('admin');
               else setUserRole('gestor');
            });
        } else {
          setCurrentUser('Não autenticado');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kubik_pending_approvals');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return [];
  });

  // Persistir aprovações
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kubik_pending_approvals', JSON.stringify(pendingApprovals));
    }
  }, [pendingApprovals]);

  // Dados da Empresa (Editáveis com persistência local)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kubik_company_info');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved);
          const merged = { ...COMPANY_INFO, ...parsed };
          
          // Se houver chaves vazias no cache antigo, forçamos o default
          if (!merged.paymentTerms) merged.paymentTerms = COMPANY_INFO.paymentTerms;
          if (!merged.priceRevisionClause) merged.priceRevisionClause = COMPANY_INFO.priceRevisionClause;
          if (!merged.deliveryTerms) merged.deliveryTerms = COMPANY_INFO.deliveryTerms;
          if (!merged.transportTerms) merged.transportTerms = COMPANY_INFO.transportTerms;
          if (!merged.claimsTerms) merged.claimsTerms = COMPANY_INFO.claimsTerms;
          if (!merged.jurisdictionTerms) merged.jurisdictionTerms = COMPANY_INFO.jurisdictionTerms;
          
          return merged;
        } catch (e) { console.error(e); }
      }
    }
    return COMPANY_INFO;
  });

  // Clientes
  const [clients, setClients] = useState<Client[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kubik_clients');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.map((c: any, i: number) => ({
              ...c,
              id: c.id || `legacy-c-${i}-${Date.now()}`
            }));
          }
        } catch (e) { console.error(e); }
      }
    }
    return INITIAL_CLIENTS;
  });

  // Materiais (Chapas)
  const [materials, setMaterials] = useState<Material[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kubik_materials');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return INITIAL_MATERIALS;
  });

  // Ferragens
  const [hardware, setHardware] = useState<Hardware[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kubik_hardware');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return INITIAL_HARDWARE;
  });

  const [edges, setEdges] = useState<EdgeMaterial[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kubik_edges');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return INITIAL_EDGES;
  });

  // Postos de Trabalho & Máquinas
  const [workstations, setWorkstations] = useState<Workstation[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kubik_workstations');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return INITIAL_WORKSTATIONS;
  });

  // Orçamentos
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [hasLoadedQuotes, setHasLoadedQuotes] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      QuoteService.getAll()
        .then(data => {
          if (Array.isArray(data)) {
            const savedLocal = localStorage.getItem('kubik_quotes');
            if (data.length === 0 && savedLocal) {
              try {
                let parsed: Quote[] = JSON.parse(savedLocal);
                if (parsed.length > 0) {
                  parsed = parsed.map(q =>
                    (!q.responsible || q.responsible === 'Luís Cunha')
                      ? { ...q, responsible: 'Departamento Comercial' }
                      : q
                  );
                  QuoteService.saveBulk(parsed).then(() => {
                    setQuotes(parsed);
                    setHasLoadedQuotes(true);
                    toast.success('Orçamentos migrados para o novo sistema!');
                  });
                  return;
                }
              } catch (e) {
                console.error('Migração de orçamentos falhou', e);
              }
            } else {
              setQuotes(data);
              setHasLoadedQuotes(true);
            }
          }
        })
        .catch(err => {
          console.error(err);
          toast.error('Erro ao carregar orçamentos');
        });
    }
  }, []);

  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  // Estado do PDF
  const [pdfQuote, setPdfQuote] = useState<Quote | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Persistência local automática
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kubik_company_info', JSON.stringify(companyInfo));
    }
  }, [companyInfo]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kubik_clients', JSON.stringify(clients));
    }
  }, [clients]);

  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [newExcelCatalog, setNewExcelCatalog] = useState<any>(null);
  const lastExcelMtime = useRef(0);
  const [initialCatalogHash, setInitialCatalogHash] = useState('');

  // Sync back to API when UI changes catalog
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kubik_materials', JSON.stringify(materials));
      localStorage.setItem('kubik_hardware', JSON.stringify(hardware));
      localStorage.setItem('kubik_workstations', JSON.stringify(workstations));
      localStorage.setItem('kubik_edges', JSON.stringify(edges));
      
      const currentHash = JSON.stringify({ materials, hardware, workstations, edges });
      
      // Prevent sync on first load, only sync if it really changed from what we fetched
      if (initialCatalogHash && currentHash !== initialCatalogHash) {
        const pushToAPI = async () => {
          try {
            await fetch('/api/catalog', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: currentHash,
            });
            // Gera também o ficheiro Excel logo de seguida para sincronizar UI -> Excel
            const expRes = await fetch('/api/catalog/export', { method: 'GET', cache: 'no-store' });
            if (expRes.headers.get('X-File-Locked')) {
              alert('A alteração foi guardada no software, mas não conseguiu reescrever o ficheiro Excel porque este encontra-se aberto. Feche o Excel para que sincronize da próxima vez.');
            } else {
              // Atualiza o lastExcelMtime para ignorarmos o ficheiro que acabámos de gerar
              const checkRes = await fetch('/api/catalog/check?t=' + Date.now(), { cache: 'no-store' });
              const checkData = await checkRes.json();
              if (checkData.exists) {
                lastExcelMtime.current = checkData.excelMtime;
              }
            }

            // Atualiza o hash original para evitar novos envios
            setInitialCatalogHash(currentHash);
          } catch (e) {
            console.error('Failed to sync to catalog API', e);
          }
        };
        pushToAPI();
      }
    }
  }, [materials, hardware, workstations, initialCatalogHash]);

  // Initial load & Polling for Excel changes
  useEffect(() => {
        const fetchCatalog = async () => {
      try {
        const [mRes, hRes, wRes, eRes, cRes, compRes] = await Promise.all([
          supabase.from('materials').select('*').order('created_at', { ascending: true }),
          supabase.from('hardware').select('*').order('created_at', { ascending: true }),
          supabase.from('workstations').select('*').order('created_at', { ascending: true }),
          supabase.from('edges').select('*').order('created_at', { ascending: true }),
          supabase.from('clients').select('*').order('created_at', { ascending: true }),
          supabase.from('company_info').select('*').limit(1).single()
        ]);

        if (mRes.data && mRes.data.length > 0) setMaterials(mRes.data);
        if (hRes.data && hRes.data.length > 0) setHardware(hRes.data);
        if (wRes.data && wRes.data.length > 0) setWorkstations(wRes.data);
        if (eRes.data && eRes.data.length > 0) {
          const mappedEdges = eRes.data.map(edge => ({
            ...edge,
            pricePerMeter: edge.price_per_meter || edge.pricePerMeter
          }));
          setEdges(mappedEdges);
        }
        if (cRes.data && cRes.data.length > 0) setClients(cRes.data);
        if (compRes.data) setCompanyInfo(compRes.data);

        // Fetch quotes
        const quotesData = await QuoteService.getAll();
        if (quotesData && quotesData.length > 0) setQuotes(quotesData);

      } catch (error) {
        console.error('Error fetching initial data from Supabase', error);
      }
    };

    fetchCatalog();

    /* Polling do Excel removido para evitar excesso de pedidos na Vercel */
  }, []);

  // Ações de Clientes
  const addClient = (client: Client) => {
    const newClient = { ...client, id: client.id || `c-${Date.now()}` };
    setClients(prev => [...prev, newClient]);
    supabase.from('clients').insert([newClient]).then();
    toast.success('Cliente adicionado com sucesso');
  };

  const updateClient = (id: string, updated: Partial<Client>) => {
    setClients(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));
    supabase.from('clients').update(updated).eq('id', id).then();
    toast.success('Cliente atualizado com sucesso');
  };

  const deleteClient = (id: string) => {
    confirmAction('Remover Cliente', 'Tem a certeza que deseja remover este cliente da sua base de dados?', () => {
      setClients(prev => prev.filter(c => c.id !== id));
        supabase.from('clients').delete().eq('id', id).then();
      toast.success('Cliente removido');
    });
  };

  // Ações de Materiais
  const addMaterial = (m: Material) => {
    if (userRole === 'gestor') {
      createPending('material_add', m);
    } else {
      setMaterials(prev => [...prev, m]);
      supabase.from('materials').insert([m]).then(res => { if(res.error) console.error('Erro supabase addMaterial:', res.error); });
    }
  };

  const updateMaterialPrice = (code: string, newPrice: number) => {
    if (userRole === 'gestor') {
      createPending('material_edit', { code, updated: { price: newPrice } });
    } else {
      setMaterials(prev => prev.map(m => (m.code === code ? { ...m, price: newPrice } : m)));
      supabase.from('materials').update({ price: newPrice }).eq('code', code).then();
    }
  };

  const deleteMaterial = (code: string) => {
    confirmAction('Remover Material', 'Deseja remover esta chapa do catálogo de materiais?', () => {
      if (userRole === 'gestor') {
        createPending('material_delete', { code });
      } else {
        setMaterials(prev => prev.filter(m => m.code !== code));
        supabase.from('materials').delete().eq('code', code).then();
      }
    });
  };

  // Ações de Ferragens
  const addHardware = (h: Hardware) => {
    if (userRole === 'gestor') {
      createPending('hardware_add', h);
    } else {
      setHardware(prev => [...prev, h]);
      supabase.from('hardware').insert([h]).then();
    }
  };

  const updateHardwarePrice = (code: string, price: number) => {
    if (userRole === 'gestor') {
      createPending('hardware_edit', { code, updated: { price } });
    } else {
      setHardware(prev => prev.map(h => (h.code === code ? { ...h, price } : h)));
      supabase.from('hardware').update({ price }).eq('code', code).then();
    }
  };

  const deleteHardware = (code: string) => {
    confirmAction('Remover Ferragem', 'Deseja remover esta ferragem do catálogo?', () => {
      if (userRole === 'gestor') {
        createPending('hardware_delete', { code });
      } else {
        setHardware(prev => prev.filter(h => h.code !== code));
        supabase.from('hardware').delete().eq('code', code).then();
      }
    });
  };

  const addEdge = (e: EdgeMaterial) => {
    setEdges(prev => [...prev, e]);
    supabase.from('edges').insert([e]).then();
  };

  const updateEdgePrice = (code: string, price: number) => {
    setEdges(prev => prev.map(edge => (edge.code === code ? { ...edge, pricePerMeter: price } : edge)));
    supabase.from('edges').update({ price_per_meter: price }).eq('code', code).then();
  };

  const deleteEdge = (code: string) => {
    confirmAction('Remover Orla', 'Deseja remover esta orla do catálogo?', () => {
      setEdges(prev => prev.filter(e => e.code !== code));
        supabase.from('edges').delete().eq('code', code).then();
    });
  };

  const approvePending = (id: string) => {
    const pending = pendingApprovals.find(p => p.id === id);
    if (!pending) return;

    if (pending.type === 'workstation_add') {
      setWorkstations(prev => [...prev, pending.data]);
    } else if (pending.type === 'workstation_edit') {
      setWorkstations(prev =>
        prev.map(ws => (ws.code === pending.data.code ? { ...ws, ...pending.data.updated } : ws))
      );
    } else if (pending.type === 'workstation_delete') {
      setWorkstations(prev => prev.filter(ws => ws.code !== pending.data.code));
    } else if (pending.type === 'company_info_edit') {
      setCompanyInfo(pending.data);
    } else if (pending.type === 'material_add') {
      setMaterials(prev => [...prev, pending.data]);
    } else if (pending.type === 'material_edit') {
      setMaterials(prev =>
        prev.map(m => (m.code === pending.data.code ? { ...m, ...pending.data.updated } : m))
      );
    } else if (pending.type === 'material_delete') {
      setMaterials(prev => prev.filter(m => m.code !== pending.data.code));
    } else if (pending.type === 'hardware_add') {
      setHardware(prev => [...prev, pending.data]);
    } else if (pending.type === 'hardware_edit') {
      setHardware(prev =>
        prev.map(h => (h.code === pending.data.code ? { ...h, ...pending.data.updated } : h))
      );
    } else if (pending.type === 'hardware_delete') {
      setHardware(prev => prev.filter(h => h.code !== pending.data.code));
    }

    setPendingApprovals(prev => prev.filter(p => p.id !== id));
  };

  const rejectPending = (id: string) => {
    setPendingApprovals(prev => prev.filter(p => p.id !== id));
  };

  const createPending = (type: PendingApproval['type'], data: any) => {
    const newPending: PendingApproval = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      data,
      requestedBy: currentUser,
      createdAt: Date.now(),
    };
    setPendingApprovals(prev => [...prev, newPending]);
    toast.info('A sua alteração foi enviada para aprovação do Administrador.');
  };

  // Ações de Postos de Trabalho & Máquinas
  const addWorkstation = (ws: Workstation) => {
    if (userRole === 'gestor') {
      createPending('workstation_add', ws);
    } else {
      setWorkstations(prev => [...prev, ws]);
    supabase.from('workstations').insert([ws]).then();
    }
  };

  const updateWorkstation = (code: string, updated: Partial<Workstation>) => {
    if (userRole === 'gestor') {
      createPending('workstation_edit', { code, updated });
    } else {
      setWorkstations(prev =>
        prev.map(ws => (ws.code === code ? { ...ws, ...updated } : ws))
      );
    }
  };

  const updateWorkstationRate = (code: string, newRate: number) => {
    if (userRole === 'gestor') {
      createPending('workstation_edit', { code, updated: { rate: newRate } });
    } else {
      setWorkstations(prev =>
        prev.map(ws => (ws.code === code ? { ...ws, rate: newRate } : ws))
      );
    }
  };

  const deleteWorkstation = (code: string) => {
    confirmAction('Remover Posto de Trabalho', 'Tem a certeza que deseja eliminar esta máquina/posto de trabalho?', () => {
      if (userRole === 'gestor') {
        createPending('workstation_delete', { code });
      } else {
        setWorkstations(prev => prev.filter(ws => ws.code !== code));
      }
    });
  };

  const updateCompanyInfo = (info: CompanyInfo) => {
    if (userRole === 'gestor') {
      createPending('company_info_edit', info);
    } else {
      setCompanyInfo(info);
    }
  };

  // Debounce do Serviço de Orçamentos (Guarda passados 1000ms sem alterações)
  const debouncedSaveQuote = useMemo(
    () =>
      debounce(async (quote: Quote) => {
        try {
          await QuoteService.save(quote);
        } catch (error) {
          toast.error('Erro ao guardar orçamento automaticamente');
        }
      }, 1000),
    []
  );

  // Limpa o debounce ao desmontar
  useEffect(() => {
    return () => {
      debouncedSaveQuote.cancel();
    };
  }, [debouncedSaveQuote]);

  // Ações de Orçamentos
  const createNewQuote = (type: 'manual' | 'automatic' = 'manual'): Quote => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = String(now.getDate()).padStart(2, '0');
    const baseNum = `${y}-${m}${d}`;
    
    let suffix = '';
    let duplicateCount = 0;
    while (quotes.some(q => q.number === `${baseNum}${suffix}`)) {
      duplicateCount++;
      suffix = `-${duplicateCount}`;
    }
    const nextNum = `${baseNum}${suffix}`;

    const defaultClient = clients[0] || {
      name: 'Cliente Exemplo',
      nif: '999999990',
      address: 'Rua Principal, Portugal',
    };

    const initialItem: QuoteItem =
      type === 'automatic'
        ? {
            id: '1.1',
            code: '1.1',
            designation: 'Móvel planeado por medida (Cálculo Automático de Fabrico)',
            unit: 'un',
            quantity: 1,
            costUnit: 147.5,
            marginPercent: 0.6,
            fixedExtra: 50.0,
            calculationMode: 'automatic',
            automaticConfig: {
              materialCode: materials[0]?.code || '502114',
              sheetUsage: 1,
              edgeBandingMeters: 12,
              edgeBandingRate: 0.7,
              operations: [
                { workstationCode: 'SH', opMin: 60, setupMin: 15 },
                { workstationCode: 'CNC', opMin: 45, setupMin: 15 },
                { workstationCode: 'ORLADORA', opMin: 30, setupMin: 10 },
                { workstationCode: 'MANUAL', opMin: 60, setupMin: 0 },
              ],
              hardware: [
                { hardwareCode: '524971', qty: 4 },
                { hardwareCode: '524966', qty: 2 },
              ],
            },
          }
        : {
            id: '1.1',
            code: '1.1',
            designation: 'Móvel personalizado em melamina e portas lacadas',
            unit: 'un',
            quantity: 1,
            costUnit: 500.0,
            marginPercent: 0.5,
            fixedExtra: 50.0,
            calculationMode: 'quick',
          };

    const newQuote: Quote = {
      id: `q-${Date.now()}`,
      number: nextNum,
      clientName: defaultClient.name,
      clientNif: defaultClient.nif,
      clientAddress: defaultClient.address,
      date: new Date().toLocaleDateString('pt-PT'),
      responsible: currentUser,
      projectName: type === 'automatic' ? 'Projeto Automático' : 'Projeto Manual',
      status: 'Rascunho',
      type: type,
      chapters: [
        { id: 1, title: 'Mobiliário Cozinha',    items: [initialItem] },
        { id: 2, title: 'Roupeiros',              items: [] },
        { id: 3, title: 'Mobiliário WC',          items: [] },
        { id: 4, title: 'Mobiliário Diversos',    items: [] },
        { id: 5, title: 'Portas',                 items: [] },
        { id: 6, title: 'Acessórios',             items: [] },
        { id: 7, title: 'Eletrodomésticos',       items: [] },
      ],
    };

    setQuotes(prev => [newQuote, ...prev]);
    setSelectedQuote(newQuote);
    setCurrentView('quote-editor');
    
    QuoteService.save(newQuote)
      .then(() => toast.success('Orçamento criado'))
      .catch((e) => toast.error('Erro Supabase: ' + (e.message || e.toString())));
      
    return newQuote;
  };

  const editQuote = (quote: Quote) => {
    setSelectedQuote(JSON.parse(JSON.stringify(quote)));
    setCurrentView('quote-editor');
  };

  const updateSelectedQuote = (updated: Quote) => {
    const timeStamped = { ...updated, lastEditedAt: Date.now() };
    setSelectedQuote(timeStamped);
    setQuotes(prev => prev.map(q => (q.id === timeStamped.id ? timeStamped : q)));
    // Autosave otimizado
    debouncedSaveQuote(timeStamped);
  };

  const duplicateQuote = (quote: Quote) => {
    const nextId = quotes.length + 1;
    const nextNum = `2026-${String(nextId).padStart(3, '0')}`;
    const duplicated: Quote = {
      ...JSON.parse(JSON.stringify(quote)),
      id: `q-${Date.now()}`,
      number: nextNum,
      projectName: `${quote.projectName || 'Projeto'} (Cópia)`,
      status: 'Rascunho',
      date: new Date().toLocaleDateString('pt-PT'),
      responsible: currentUser,
    };

    setQuotes(prev => [duplicated, ...prev]);
    setSelectedQuote(duplicated);
    setCurrentView('quote-editor');
    
    QuoteService.save(duplicated)
      .then(() => toast.success('Orçamento duplicado'))
      .catch(() => toast.error('Erro ao duplicar orçamento'));
  };

  const deleteQuote = (id: string) => {
    confirmAction('Eliminar Orçamento', 'Tem a certeza que deseja eliminar este orçamento? Esta ação não pode ser revertida.', () => {
      setQuotes(prev => prev.filter(q => q.id !== id));
      if (selectedQuote?.id === id) {
        setSelectedQuote(null);
        setCurrentView('quotes-list');
      }
      QuoteService.delete(id)
        .then(() => toast.success('Orçamento eliminado'))
        .catch(() => toast.error('Erro ao apagar orçamento'));
    });
  };

  const openPdfPreview = (quote: Quote) => {
    setPdfQuote(quote);
    setShowPdfModal(true);
  };

  const closePdfPreview = () => {
    setShowPdfModal(false);
  };

  // KPIs
  const totalQuotedAmount = quotes.reduce(
    (acc, q) => acc + calculateQuoteTotalWithVat(q),
    0
  );

  const totalApprovedAmount = quotes
    .filter(q => q.status === 'Adjudicado')
    .reduce((acc, q) => acc + calculateQuoteTotalWithVat(q), 0);

  const averageCostAmount = quotes.length
    ? quotes.reduce((acc, q) => acc + calculateQuoteCost(q), 0) / quotes.length
    : 0;

  if (!isMounted) return null;

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        currentUser,
        setCurrentUser,
        userRole,
        setUserRole,
        pendingApprovals,
        setPendingApprovals,
        approvePending,
        rejectPending,
        companyInfo,
        updateCompanyInfo,
        clients,
        setClients,
        addClient,
        updateClient,
        deleteClient,
        materials,
        setMaterials,
        addMaterial,
        updateMaterialPrice,
        deleteMaterial,
        hardware,
        setHardware,
        addHardware,
        updateHardwarePrice,
        deleteHardware,
        edges,
        setEdges,
        addEdge,
        updateEdgePrice,
        deleteEdge,
        workstations,
        setWorkstations,
        addWorkstation,
        updateWorkstation,
        updateWorkstationRate,
        deleteWorkstation,
        quotes,
        setQuotes,
        selectedQuote,
        setSelectedQuote,
        createNewQuote,
        editQuote,
        updateSelectedQuote,
        duplicateQuote,
        deleteQuote,
        searchQuery,
        setSearchQuery,
        filterStatus,
        setFilterStatus,
        pdfQuote,
        showPdfModal,
        openPdfPreview,
        closePdfPreview,
        totalQuotedAmount,
        totalApprovedAmount,
        averageCostAmount,
        confirmAction,
      }}
    >
      {children}
      
      <CatalogDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        currentCatalog={{ materials, hardware, workstations }}
        newCatalog={newExcelCatalog}
        onReject={async () => {
          setIsDiffModalOpen(false);
          setNewExcelCatalog(null);
          // Sobrescreve o ficheiro Excel com o conteúdo local atual para reverter as alterações
          try {
            const expRes = await fetch('/api/catalog/export', { method: 'GET', cache: 'no-store' });
            if (expRes.headers.get('X-File-Locked')) {
              alert('O ficheiro Excel foi rejeitado no software, mas não pôde ser revertido no disco porque está aberto no Microsoft Excel. Por favor, fecha o Excel e tenta de novo ou corrige manualmente.');
            }
            // Atualiza o mtime ignorado para a nova data do ficheiro revertido
            const res = await fetch('/api/catalog/check?t=' + Date.now(), { cache: 'no-store' });
            const data = await res.json();
            if (data.exists) {
              lastExcelMtime.current = data.excelMtime;
            }
          } catch (e) {
            console.error('Failed to revert excel file', e);
          }
        }}
        onApprove={(newCat) => {
          if (newCat.materials) setMaterials(newCat.materials);
          if (newCat.hardware) setHardware(newCat.hardware);
          if (newCat.workstations) setWorkstations(newCat.workstations);
          setIsDiffModalOpen(false);
          setNewExcelCatalog(null);
        }}
      />
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
