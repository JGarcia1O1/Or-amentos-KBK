export type QuoteStatus = 'Rascunho' | 'Apresentado' | 'Adjudicado' | 'Recusado';

export type UserRole = 'admin' | 'gestor' | 'trabalhador';

export interface PendingApproval {
  id: string;
  type: 
    | 'workstation_add' | 'workstation_edit' | 'workstation_delete' | 'company_info_edit'
    | 'material_add' | 'material_edit' | 'material_delete'
    | 'hardware_add' | 'hardware_edit' | 'hardware_delete';
  data: any;
  requestedBy: string;
  createdAt: number;
}

export interface Client {
  id?: string;
  name: string;
  nif: string;
  address: string;
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
