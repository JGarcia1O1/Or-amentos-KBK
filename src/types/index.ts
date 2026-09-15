export type QuoteStatus = 'Rascunho' | 'Apresentado' | 'Adjudicado' | 'Recusado';

export type UserRole = 'admin' | 'gestor' | 'trabalhador';

/* ==========================================================
   PERMISSÕES POR MÓDULO (Gestão de Acessos)
   ========================================================== */

// Nível de acesso a um módulo.
// 'none' = não vê sequer o módulo | 'view' = só consulta | 'edit' = consulta e altera
export type PermissionLevel = 'none' | 'view' | 'edit';

// Chave de cada módulo do software. Ao adicionar um módulo novo no futuro,
// acrescenta aqui e em APP_MODULES (src/lib/permissions.ts).
export type ModuleKey =
  | 'dashboard'
  | 'obras'
  | 'quotes'
  | 'visits'
  | 'clients'
  | 'materials'
  | 'emails'
  | 'settings';

export type PermissionMap = Record<ModuleKey, PermissionLevel>;

// Utilizador da plataforma (tabela public.user_roles no Supabase)
export interface AppUser {
  userId: string;        // user_id
  email: string;         // email
  displayName: string;   // display_name
  role: UserRole;        // role
  permissions: PermissionMap; // permissions (jsonb)
  isActive: boolean;     // is_active
  createdAt?: string;    // created_at
  updatedAt?: string;    // updated_at
}

export interface PendingApproval {
  id: string;
  type: 
    | 'workstation_add' | 'workstation_edit' | 'workstation_delete' | 'company_info_edit'
    | 'material_add' | 'material_edit' | 'material_delete'
    | 'hardware_add' | 'hardware_edit' | 'hardware_delete'
    | 'edge_add' | 'edge_edit' | 'edge_delete';
  data: any;
  requestedBy: string;        // requested_by_name — nome de quem pediu
  requestedById?: string;     // requested_by — id da conta que pediu
  status?: 'pending' | 'approved' | 'rejected';
  createdAt: string;          // created_at (ISO)
}

export interface Client {
  id?: string;
  name: string;
  nif: string;
  address: string;
  postalCode?: string;
  city?: string;
  email: string;
  phone: string;
  notes?: string;
}

  export interface Material {
    id?: string;
    code: string; // Referência
    name: string; // Designação
    length?: number; // mm (opcional agora)
    width?: number;  // mm (opcional agora)
    thickness?: number; // mm (opcional agora)
    price: number;  // Preço unitário
    unit?: string;  // Unidade (ex: un, m2)
    quantity?: number; // Quantidade em armazém
    warehouse?: number; // Armazém
    total?: number; // Valor Total
    isActive?: boolean;
  }

export interface Workstation {
  id?: string;
  code: string; // 'SH', 'CNC', 'ORLADORA', 'MANUAL'
  name: string;
  rate: number; // €/h
}

export interface Hardware {
  id?: string;
  code: string;
  name: string;
  unit: 'un' | 'metro' | 'par' | 'conjunto';
  price: number;
}

export interface EdgeMaterial {
  id?: string;
  code: string;
  name: string;
  pricePerMeter: number;
}

export interface TechnicalPart {
  id?: string;
  name: string;
  length: number; // mm
  width: number;  // mm
  qty: number;
}

export interface TechnicalOperation {
  code: string;
  name: string;
  opMin: number;
  setupMin: number;
  hourlyRate: number;
}

export interface TechnicalSheet {
  dimensions: {
    height: number;
    width: number;
    depth: number;
    doors: number;
    drawers: number;
  };
  materialCode: string;
  parts: TechnicalPart[];
  operations: TechnicalOperation[];
  extraHardwareCost: number;
}

export interface AutomaticItemOperation {
  workstationCode: string;
  opMin: number;
  setupMin: number;
  isActive?: boolean;
}

export interface AutomaticItemHardware {
  hardwareCode: string;
  qty: number;
}

export interface AutomaticItemConfig {
  materialCode: string;
  sheetUsage: number;
  edgeCode?: string;
  edgeBandingMeters: number;
  edgeBandingRate?: number;
  operations: AutomaticItemOperation[];
  hardware: AutomaticItemHardware[];
}

/* ==========================================================
   CONFIGURADOR DE ORÇAMENTOS (Receitas)
   Uma receita é um tipo de mobiliário com custo conhecido por
   unidade — metro linear de cozinha, metro quadrado de roupeiro.
   ATENÇÃO: marginPercent é MARKUP sobre o custo, coerente com o
   resto do sistema (ver capítulo 3.4 do KUBIK_HANDOFF.md).
   ========================================================== */

export interface QuoteTemplate {
  id?: string;
  name: string;              // name
  category: string;          // category — vira título do capítulo
  unit: string;              // unit: 'm' | 'm2' | 'un'
  unitLabel?: string;        // unit_label: 'metro linear', 'metro quadrado'
  designation: string;       // designation — texto do artigo gerado
  costPerUnit: number;       // cost_per_unit
  marginPercent: number;     // margin_percent (markup)
  fixedExtra: number;        // fixed_extra
  automaticConfig?: AutomaticItemConfig; // automatic_config (fase por módulo)
  source?: string;           // source — de onde veio o custo
  isConfirmed: boolean;      // is_confirmed — validado pela produção
  isActive: boolean;         // is_active
  sortOrder: number;         // sort_order
  notes?: string;            // notes
  createdAt?: string;        // created_at
  updatedAt?: string;        // updated_at
}

// Linha escolhida no configurador antes de gerar o orçamento
export interface TemplateSelection {
  template: QuoteTemplate;
  quantity: number;
}

export interface QuoteItem {
  id: string;
  code: string;
  designation: string;
  unit: string;
  quantity: number;
  costUnit: number;
  marginPercent: number; // ex: 0.60 para 60%
  fixedExtra: number;    // ex: 200 para montagem/transporte
  calculationMode?: 'quick' | 'technical' | 'automatic';
  technicalSheet?: TechnicalSheet;
  automaticConfig?: AutomaticItemConfig;
  isSubItem?: boolean;
}

export interface QuoteChapter {
  id: number | string;
  title: string;
  items: QuoteItem[];
}

export interface Quote {
  id: string;
  number: string; // ex: '2026-009'
  clientName: string;
  clientNif: string;
  clientAddress: string;
  clientPostalCode?: string;
  clientCity?: string;
  clientEmail?: string;
  clientPhone?: string;
  date: string; // DD/MM/AAAA
  responsible: string; // ex: 'Departamento Comercial'
  projectName?: string;
  status: QuoteStatus;
  type?: 'manual' | 'automatic';
  chapters: QuoteChapter[];
  notes?: string;
  paymentConditions?: string;
  deliveryTerms?: string;
  validityDays?: number;
  // Âmbito da proposta — o que está e o que não está incluído.
  // Evita discussões do género "eu pensava que estava incluído".
  // Guardado no JSONB do orçamento; não exige migração de colunas.
  scopeIncluded?: string[];
  scopeExcluded?: string[];
  lockedBy?: string; // Para preparar ambiente Multi-user
  lastEditedAt?: number; // Timestamp da última edição
}

export interface CompanyInfo {
  name: string;
  legalName: string;
  nif: string;
  address: string;
  postalCode: string;
  phone: string;
  website: string;
  iban: string;
  bank: string;
  court: string;
  paymentTerms: string;
  validityDays: number;
  deliveryTerms?: string;
  transportTerms?: string;
  claimsTerms?: string;
  priceRevisionClause?: string;
  jurisdictionTerms?: string;
}


export type VisitStatus = 'Agendado' | 'Realizado' | 'Orcamentado';

export interface SiteVisit {
  id: string;
  number: string;
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  clientEmail?: string;
  clientNif?: string;
  checklist?: Record<string, boolean>;
  visitDate: string; // YYYY-MM-DD
  responsible: string;
  projectTypes: string[]; // e.g. ['Cozinha', 'Portas', 'Roupeiros']
  technicalNotes?: string;
  measurementsData?: any; // To be typed more strictly later if needed
  status: VisitStatus;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}
