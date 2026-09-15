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
  AppUser,
  ModuleKey,
  PermissionLevel,
  PermissionMap,
} from '@/types';
import {
  effectivePermissions,
  hasAccess,
  mapUserFromDb,
} from '@/lib/permissions';
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
  currentView: 'dashboard' | 'obras' | 'visits-list' | 'visit-editor' | 'quotes-list' | 'quote-editor' | 'quote-wizard' | 'clients' | 'materials' | 'settings' | 'emails';
  setCurrentView: (view: 'dashboard' | 'obras' | 'visits-list' | 'visit-editor' | 'quotes-list' | 'quote-editor' | 'quote-wizard' | 'clients' | 'materials' | 'settings' | 'emails') => void;
  currentUser: string;
  setCurrentUser: (user: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;

  // Permissões por Módulo (Gestão de Acessos)
  currentUserId: string | null;
  userProfile: AppUser | null;
  permissions: PermissionMap;
  permissionsLoaded: boolean;
  isAdmin: boolean;
  can: (module: ModuleKey, required?: PermissionLevel) => boolean;
  refreshUserProfile: () => Promise<void>;

  // Apresentação — esconder custos, margens e lucro do ecrã.
  // É conveniência para mostrar um orçamento ao cliente, NÃO é segurança:
  // quem não pode ver custos continua a ser travado pelas permissões.
  hideInternal: boolean;
  setHideInternal: (value: boolean) => void;
  toggleHideInternal: () => void;

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
  createNewQuote: (type?: 'manual' | 'automatic', customChapters?: QuoteChapter[]) => Quote;
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

  const [currentView, setCurrentView] = useState<'dashboard' | 'obras' | 'visits-list' | 'visit-editor' | 'quotes-list' | 'quote-editor' | 'quote-wizard' | 'clients' | 'materials' | 'settings' | 'emails'>('quotes-list');
  const [currentUser, setCurrentUser] = useState<string>('A Carregar...');
  const [userRole, setUserRole] = useState<UserRole>('trabalhador');

  // ============================================================
  // MODO CLIENTE — esconde custo, margem, extra e lucro do ecrã.
  // Guardado no aparelho, por isso mantém-se entre sessões.
  // Não altera dados nem cálculos: é só apresentação.
  // ============================================================
  const [hideInternal, setHideInternalState] = useState(false);

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem('kubik:hideInternal');
      if (guardado === '1') setHideInternalState(true);
    } catch {
      // localStorage indisponível (janela privada, por exemplo) — segue com o valor por defeito
    }
  }, []);

  const setHideInternal = React.useCallback((value: boolean) => {
    setHideInternalState(value);
    try {
      window.localStorage.setItem('kubik:hideInternal', value ? '1' : '0');
    } catch {
      // sem persistência, mas o ecrã reage na mesma
    }
  }, []);

  const toggleHideInternal = React.useCallback(() => {
    setHideInternalState(prev => {
      const proximo = !prev;
      try {
        window.localStorage.setItem('kubik:hideInternal', proximo ? '1' : '0');
      } catch {
        // idem
      }
      return proximo;
    });
  }, []);

  // ============================================================
  // PERMISSÕES POR MÓDULO
  // O perfil vive na tabela public.user_roles e é a fonte de verdade.
  // Enquanto não carregar, o utilizador não tem acesso a nada — evita
  // o "flash" de módulos a que afinal não tem direito.
  // ============================================================
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const permissions = useMemo(() => effectivePermissions(userProfile), [userProfile]);
  const isAdmin = userProfile?.role === 'admin' && userProfile?.isActive === true;

  const can = React.useCallback(
    (module: ModuleKey, required: PermissionLevel = 'view') => hasAccess(permissions, module, required),
    [permissions]
  );

  const loadUserProfile = React.useCallback(async (userId: string, fallbackName: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id, email, display_name, role, permissions, is_active, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[KUBIK] Falha ao carregar permissões:', error.message);
      setUserProfile(null);
      setUserRole('trabalhador');
      setPermissionsLoaded(true);
      return;
    }

    if (!data) {
      // Sem linha em user_roles: utilizador autenticado mas ainda sem acessos atribuídos.
      console.warn('[KUBIK] Utilizador sem perfil de permissões atribuído.');
      setUserProfile(null);
      setUserRole('trabalhador');
      setPermissionsLoaded(true);
      return;
    }

    const profile = mapUserFromDb(data);
    setUserProfile(profile);
    setUserRole(profile.role);
    setCurrentUser(profile.displayName || fallbackName);
    setPermissionsLoaded(true);
  }, []);

  const refreshUserProfile = React.useCallback(async () => {
    if (!currentUserId) return;
    await loadUserProfile(currentUserId, currentUser);
  }, [currentUserId, currentUser, loadUserProfile]);

  useEffect(() => {
    const applySession = (session: any) => {
      if (session?.user?.email) {
        const fallbackName = session.user.user_metadata?.display_name || 'Utilizador KUBIK';
        setCurrentUserId(session.user.id);
        setCurrentUser(fallbackName);
        loadUserProfile(session.user.id, fallbackName);
      } else {
        setCurrentUserId(null);
        setCurrentUser('Não autenticado');
        setUserProfile(null);
        setUserRole('trabalhador');
        setPermissionsLoaded(true);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => applySession(session));

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      applySession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  // ============================================================
  // PEDIDOS DE APROVAÇÃO
  // Vivem na tabela public.pending_approvals, partilhada entre todos.
  // (Antes viviam no localStorage de quem pedia, pelo que nunca chegavam
  //  ao administrador — a mensagem de "enviado" era falsa.)
  // ============================================================
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);

  const mapPendingFromDb = (row: any): PendingApproval => ({
    id: row.id,
    type: row.type,
    data: row.data,
    requestedBy: row.requested_by_name || 'Utilizador',
    requestedById: row.requested_by,
    status: row.status,
    createdAt: row.created_at,
  });

  const loadPendingApprovals = React.useCallback(async () => {
    if (!currentUserId) {
      setPendingApprovals([]);
      return;
    }
    const { data, error } = await supabase
      .from('pending_approvals')
      .select('id, type, data, requested_by, requested_by_name, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[KUBIK] Falha ao carregar pedidos de aprovação:', error.message);
      return;
    }
    setPendingApprovals((data || []).map(mapPendingFromDb));
  }, [currentUserId]);

  useEffect(() => {
    loadPendingApprovals();
  }, [loadPendingApprovals]);

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
              setQuotes(data.length > 0 ? data : INITIAL_QUOTES);
              setHasLoadedQuotes(true);
            }
          }
        })
        .catch(err => {
          console.error('Erro ao carregar orçamentos:', err);
          setQuotes(INITIAL_QUOTES);
          setHasLoadedQuotes(true);
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
        // Paginate materials to bypass 1000 max-rows limit on Supabase PostgREST
        let allMaterials: Material[] = [];
        let from = 0;
        const step = 1000;
        let fetchMore = true;

        while (fetchMore) {
          const { data, error } = await supabase
            .from('materials')
            .select('*')
            .order('created_at', { ascending: true })
            .range(from, from + step - 1);
          
          if (error) break;
          if (data) {
            allMaterials = [...allMaterials, ...data];
            if (data.length < step) {
              fetchMore = false;
            } else {
              from += step;
            }
          } else {
            fetchMore = false;
          }
        }

        const [hRes, wRes, eRes, cRes, compRes] = await Promise.all([
          supabase.from('hardware').select('*').order('created_at', { ascending: true }),
          supabase.from('workstations').select('*').order('created_at', { ascending: true }),
          supabase.from('edges').select('*').order('created_at', { ascending: true }),
          supabase.from('clients').select('*').order('created_at', { ascending: true }),
          supabase.from('company_info').select('*').limit(1).single()
        ]);

        if (allMaterials.length > 0) setMaterials(allMaterials);
        if (hRes.data && hRes.data.length > 0) setHardware(hRes.data);
        if (wRes.data && wRes.data.length > 0) setWorkstations(wRes.data);
        if (eRes.data && eRes.data.length > 0) {
          const mappedEdges = eRes.data.map(edge => ({
            ...edge,
            pricePerMeter: edge.price_per_meter || edge.pricePerMeter
          }));
          setEdges(mappedEdges);
        }
        if (cRes.data && cRes.data.length > 0) {
          const mappedClients = cRes.data.map(client => ({
            id: client.id,
            name: client.name,
            nif: client.nif,
            address: client.address,
            postalCode: client.postal_code || client.postalCode,
            city: client.city,
            email: client.email,
            phone: client.phone,
            notes: client.notes
          }));
          setClients(mappedClients);
        }
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
    
    const dbPayload = {
      id: newClient.id,
      name: newClient.name,
      nif: newClient.nif,
      address: newClient.address,
      postal_code: newClient.postalCode,
      city: newClient.city,
      email: newClient.email,
      phone: newClient.phone,
      notes: newClient.notes
    };
    
    supabase.from('clients').insert([dbPayload]).then(res => {
      if (res.error) console.error('Erro ao adicionar cliente', res.error);
    });
    toast.success('Cliente adicionado com sucesso');
  };

  const updateClient = (id: string, updated: Partial<Client>) => {
    setClients(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));
    
    const dbPayload: any = { ...updated };
    if ('postalCode' in dbPayload) {
      dbPayload.postal_code = dbPayload.postalCode;
      delete dbPayload.postalCode;
    }
    
    supabase.from('clients').update(dbPayload).eq('id', id).then(res => {
      if (res.error) console.error('Erro ao atualizar cliente', res.error);
    });
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
    if (needsApproval('materials')) {
      createPending('material_add', m);
    } else {
      setMaterials(prev => [...prev, m]);
      supabase.from('materials').insert([m]).then(res => { if(res.error) console.error('Erro supabase addMaterial:', res.error); });
    }
  };

  const updateMaterialPrice = (code: string, newPrice: number) => {
    if (needsApproval('materials')) {
      createPending('material_edit', { code, updated: { price: newPrice } });
    } else {
      setMaterials(prev => prev.map(m => (m.code === code ? { ...m, price: newPrice } : m)));
      supabase.from('materials').update({ price: newPrice }).eq('code', code).then();
    }
  };

  const deleteMaterial = (code: string) => {
    confirmAction('Remover Material', 'Deseja remover esta chapa do catálogo de materiais?', () => {
      if (needsApproval('materials')) {
        createPending('material_delete', { code });
      } else {
        setMaterials(prev => prev.filter(m => m.code !== code));
        supabase.from('materials').delete().eq('code', code).then();
      }
    });
  };

  // Ações de Ferragens
  const addHardware = (h: Hardware) => {
    if (needsApproval('materials')) {
      createPending('hardware_add', h);
    } else {
      setHardware(prev => [...prev, h]);
      supabase.from('hardware').insert([h]).then();
    }
  };

  const updateHardwarePrice = (code: string, price: number) => {
    if (needsApproval('materials')) {
      createPending('hardware_edit', { code, updated: { price } });
    } else {
      setHardware(prev => prev.map(h => (h.code === code ? { ...h, price } : h)));
      supabase.from('hardware').update({ price }).eq('code', code).then();
    }
  };

  const deleteHardware = (code: string) => {
    confirmAction('Remover Ferragem', 'Deseja remover esta ferragem do catálogo?', () => {
      if (needsApproval('materials')) {
        createPending('hardware_delete', { code });
      } else {
        setHardware(prev => prev.filter(h => h.code !== code));
        supabase.from('hardware').delete().eq('code', code).then();
      }
    });
  };

  // Mapeamento camelCase -> snake_case para a tabela edges
  const edgeToDb = (e: EdgeMaterial) => ({
    code: e.code,
    name: e.name,
    price_per_meter: e.pricePerMeter,
  });

  const addEdge = (e: EdgeMaterial) => {
    if (needsApproval('materials')) {
      createPending('edge_add', e);
    } else {
      setEdges(prev => [...prev, e]);
      supabase.from('edges').insert([edgeToDb(e)]).then(res => {
        if (res.error) console.error('Erro supabase addEdge:', res.error);
      });
    }
  };

  const updateEdgePrice = (code: string, price: number) => {
    if (needsApproval('materials')) {
      createPending('edge_edit', { code, updated: { pricePerMeter: price } });
    } else {
      setEdges(prev => prev.map(edge => (edge.code === code ? { ...edge, pricePerMeter: price } : edge)));
      supabase.from('edges').update({ price_per_meter: price }).eq('code', code).then();
    }
  };

  const deleteEdge = (code: string) => {
    confirmAction('Remover Orla', 'Deseja remover esta orla do catálogo?', () => {
      if (needsApproval('materials')) {
        createPending('edge_delete', { code });
      } else {
        setEdges(prev => prev.filter(e => e.code !== code));
        supabase.from('edges').delete().eq('code', code).then();
      }
    });
  };

  // Aplica a alteração pedida — no estado local E no Supabase.
  // (Antes só mexia no estado local: aprovar um posto de trabalho ou os
  //  dados da empresa não gravava nada e a alteração perdia-se.)
  const applyPending = async (pending: PendingApproval): Promise<boolean> => {
    try {
      switch (pending.type) {
        case 'workstation_add': {
          const { error } = await supabase.from('workstations').insert([pending.data]);
          if (error) throw error;
          setWorkstations(prev => [...prev, pending.data]);
          break;
        }
        case 'workstation_edit': {
          const { error } = await supabase
            .from('workstations').update(pending.data.updated).eq('code', pending.data.code);
          if (error) throw error;
          setWorkstations(prev =>
            prev.map(ws => (ws.code === pending.data.code ? { ...ws, ...pending.data.updated } : ws))
          );
          break;
        }
        case 'workstation_delete': {
          const { error } = await supabase.from('workstations').delete().eq('code', pending.data.code);
          if (error) throw error;
          setWorkstations(prev => prev.filter(ws => ws.code !== pending.data.code));
          break;
        }
        case 'material_add': {
          const { error } = await supabase.from('materials').insert([pending.data]);
          if (error) throw error;
          setMaterials(prev => [...prev, pending.data]);
          break;
        }
        case 'material_edit': {
          const { error } = await supabase
            .from('materials').update(pending.data.updated).eq('code', pending.data.code);
          if (error) throw error;
          setMaterials(prev =>
            prev.map(m => (m.code === pending.data.code ? { ...m, ...pending.data.updated } : m))
          );
          break;
        }
        case 'material_delete': {
          const { error } = await supabase.from('materials').delete().eq('code', pending.data.code);
          if (error) throw error;
          setMaterials(prev => prev.filter(m => m.code !== pending.data.code));
          break;
        }
        case 'hardware_add': {
          const { error } = await supabase.from('hardware').insert([pending.data]);
          if (error) throw error;
          setHardware(prev => [...prev, pending.data]);
          break;
        }
        case 'hardware_edit': {
          const { error } = await supabase
            .from('hardware').update(pending.data.updated).eq('code', pending.data.code);
          if (error) throw error;
          setHardware(prev =>
            prev.map(h => (h.code === pending.data.code ? { ...h, ...pending.data.updated } : h))
          );
          break;
        }
        case 'hardware_delete': {
          const { error } = await supabase.from('hardware').delete().eq('code', pending.data.code);
          if (error) throw error;
          setHardware(prev => prev.filter(h => h.code !== pending.data.code));
          break;
        }
        case 'edge_add': {
          const { error } = await supabase.from('edges').insert([edgeToDb(pending.data)]);
          if (error) throw error;
          setEdges(prev => [...prev, pending.data]);
          break;
        }
        case 'edge_edit': {
          const { error } = await supabase
            .from('edges')
            .update({ price_per_meter: pending.data.updated.pricePerMeter })
            .eq('code', pending.data.code);
          if (error) throw error;
          setEdges(prev =>
            prev.map(e => (e.code === pending.data.code
              ? { ...e, pricePerMeter: pending.data.updated.pricePerMeter }
              : e))
          );
          break;
        }
        case 'edge_delete': {
          const { error } = await supabase.from('edges').delete().eq('code', pending.data.code);
          if (error) throw error;
          setEdges(prev => prev.filter(e => e.code !== pending.data.code));
          break;
        }
        case 'company_info_edit': {
          setCompanyInfo(pending.data);
          break;
        }
      }
      return true;
    } catch (err: any) {
      console.error('[KUBIK] Falha ao aplicar pedido aprovado:', err?.message || err);
      toast.error('A alteração não pôde ser aplicada. O pedido continua pendente.');
      return false;
    }
  };

  const resolvePending = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('pending_approvals')
      .update({
        status,
        resolved_by: currentUserId,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[KUBIK] Falha ao resolver pedido:', error.message);
      toast.error('Não foi possível registar a decisão.');
      return false;
    }

    setPendingApprovals(prev => prev.filter(p => p.id !== id));
    return true;
  };

  const approvePending = async (id: string) => {
    const pending = pendingApprovals.find(p => p.id === id);
    if (!pending) return;

    // Só marca como aprovado se a alteração tiver sido mesmo aplicada.
    const applied = await applyPending(pending);
    if (!applied) return;

    const resolved = await resolvePending(id, 'approved');
    if (resolved) toast.success('Alteração aprovada e aplicada.');
  };

  const rejectPending = async (id: string) => {
    const resolved = await resolvePending(id, 'rejected');
    if (resolved) toast.info('Pedido rejeitado.');
  };

  const createPending = async (type: PendingApproval['type'], data: any) => {
    if (!currentUserId) {
      toast.error('Sessão não identificada. Volta a entrar na plataforma.');
      return;
    }

    const { data: row, error } = await supabase
      .from('pending_approvals')
      .insert({
        type,
        data,
        requested_by: currentUserId,
        requested_by_name: currentUser,
      })
      .select('id, type, data, requested_by, requested_by_name, status, created_at')
      .single();

    if (error) {
      console.error('[KUBIK] Falha ao criar pedido de aprovação:', error.message);
      toast.error('Não foi possível enviar o pedido. Tenta novamente.');
      return;
    }

    setPendingApprovals(prev => [...prev, mapPendingFromDb(row)]);
    toast.info('Pedido enviado. Um administrador vai rever a alteração.');
  };

  // Dispara um pedido de aprovação em vez da alteração direta quando o
  // utilizador só tem 'apenas consultar' no módulo em causa.
  const needsApproval = (module: ModuleKey) =>
    can(module, 'view') && !can(module, 'edit');

  // Ações de Postos de Trabalho & Máquinas
  const addWorkstation = (ws: Workstation) => {
    if (needsApproval('materials')) {
      createPending('workstation_add', ws);
    } else {
      setWorkstations(prev => [...prev, ws]);
    supabase.from('workstations').insert([ws]).then();
    }
  };

  const updateWorkstation = (code: string, updated: Partial<Workstation>) => {
    if (needsApproval('materials')) {
      createPending('workstation_edit', { code, updated });
    } else {
      setWorkstations(prev =>
        prev.map(ws => (ws.code === code ? { ...ws, ...updated } : ws))
      );
    }
  };

  const updateWorkstationRate = (code: string, newRate: number) => {
    if (needsApproval('materials')) {
      createPending('workstation_edit', { code, updated: { rate: newRate } });
    } else {
      setWorkstations(prev =>
        prev.map(ws => (ws.code === code ? { ...ws, rate: newRate } : ws))
      );
    }
  };

  const deleteWorkstation = (code: string) => {
    confirmAction('Remover Posto de Trabalho', 'Tem a certeza que deseja eliminar esta máquina/posto de trabalho?', () => {
      if (needsApproval('materials')) {
        createPending('workstation_delete', { code });
      } else {
        setWorkstations(prev => prev.filter(ws => ws.code !== code));
      }
    });
  };

  const updateCompanyInfo = (info: CompanyInfo) => {
    if (needsApproval('settings')) {
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
        } catch (error: any) {
          console.error("Autosave error:", error);
          toast.error('Erro ao guardar: ' + (error?.message || 'Erro desconhecido'));
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
  // customChapters: usado pelo Configurador, que já traz os capítulos e
  // artigos montados a partir das receitas. Sem isso, mantém-se o
  // comportamento de sempre (capítulos vazios e um artigo de exemplo).
  const createNewQuote = (
    type: 'manual' | 'automatic' = 'manual',
    customChapters?: QuoteChapter[]
  ): Quote => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    
    // Contagem sequencial do MAs
    let maxSeq = 0;
    quotes.forEach(q => {
      if (q.number && q.number.startsWith(`${y}-${m}`)) {
        const rightPart = q.number.replace(`${y}-${m}`, '');
        if (/^\d+$/.test(rightPart)) {
          const seqInt = parseInt(rightPart, 10);
          if (!isNaN(seqInt) && seqInt > maxSeq) {
            maxSeq = seqInt;
          }
        }
      }
    });
    
    const seqStr = String(maxSeq + 1).padStart(2, '0');
    const nextNum = `${y}-${m}${seqStr}`;

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
      projectName: customChapters
        ? 'Projeto do Configurador'
        : type === 'automatic'
        ? 'Projeto Automático'
        : 'Projeto Manual',
      status: 'Rascunho',
      type: type,
      chapters: customChapters && customChapters.length > 0 ? customChapters : [
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
        currentUserId,
        userProfile,
        permissions,
        permissionsLoaded,
        isAdmin,
        can,
        refreshUserProfile,
        hideInternal,
        setHideInternal,
        toggleHideInternal,
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
