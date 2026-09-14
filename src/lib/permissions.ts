import {
  AppUser,
  ModuleKey,
  PermissionLevel,
  PermissionMap,
  UserRole,
} from '@/types';

/* ==========================================================
   REGISTO DE MÓDULOS DA PLATAFORMA
   Fonte única de verdade para o painel de permissões.
   Para acrescentar um módulo novo: adiciona a chave em ModuleKey
   (src/types/index.ts) e uma entrada aqui. O painel de administração
   passa a mostrá-lo automaticamente.
   ========================================================== */

export interface ModuleDefinition {
  key: ModuleKey;
  label: string;
  description: string;
}

export const APP_MODULES: ModuleDefinition[] = [
  { key: 'dashboard', label: 'Gestão & Analytics', description: 'Indicadores globais, volume orçamentado e adjudicado.' },
  { key: 'obras',     label: 'Produção & Obras',   description: 'Acompanhamento de obras em produção.' },
  { key: 'quotes',    label: 'Orçamentos',         description: 'Criar, editar e apresentar orçamentos e propostas.' },
  { key: 'visits',    label: 'Fichas de Obra',     description: 'Visitas técnicas, medições e levantamentos.' },
  { key: 'clients',   label: 'Clientes',           description: 'Ficheiro de clientes e dados de faturação.' },
  { key: 'materials', label: 'Chapas, Materiais & Máquinas', description: 'Catálogo, stock, ferragens, orlas e custos horários.' },
  { key: 'emails',    label: 'Emails Automáticos', description: 'Comunicações de cobrança e acompanhamento comercial.' },
  { key: 'settings',  label: 'Configurações Gerais', description: 'Dados da empresa, condições comerciais e backups.' },
];

export const MODULE_KEYS: ModuleKey[] = APP_MODULES.map((m) => m.key);

export const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  none: 'Sem acesso',
  view: 'Apenas consultar',
  edit: 'Consultar e alterar',
};

/* ==========================================================
   NÍVEIS E COMPARAÇÃO
   ========================================================== */

const LEVEL_ORDER: Record<PermissionLevel, number> = {
  none: 0,
  view: 1,
  edit: 2,
};

export function isValidLevel(value: unknown): value is PermissionLevel {
  return value === 'none' || value === 'view' || value === 'edit';
}

/* ==========================================================
   PERFIS BASE
   Servem de ponto de partida quando o administrador escolhe um perfil.
   A partir daí pode abrir ou fechar módulos individualmente.
   ========================================================== */

function buildMap(level: PermissionLevel, overrides: Partial<PermissionMap> = {}): PermissionMap {
  const base = MODULE_KEYS.reduce((acc, key) => {
    acc[key] = level;
    return acc;
  }, {} as PermissionMap);
  return { ...base, ...overrides };
}

export const ROLE_DEFAULTS: Record<UserRole, PermissionMap> = {
  // Administração: acesso total a tudo.
  admin: buildMap('edit'),

  // Gestor: opera o comercial e a produção, consulta o catálogo,
  // não mexe nas configurações da empresa.
  gestor: buildMap('edit', {
    materials: 'view',
    settings: 'none',
  }),

  // Trabalhador: apenas o essencial de produção, em modo consulta.
  trabalhador: buildMap('none', {
    obras: 'view',
    quotes: 'view',
  }),
};

export const EMPTY_PERMISSIONS: PermissionMap = buildMap('none');

/* ==========================================================
   NORMALIZAÇÃO
   O jsonb vindo do Supabase pode estar incompleto ou com chaves antigas.
   Esta função garante sempre um mapa completo e válido.
   ========================================================== */

export function normalizePermissions(raw: unknown): PermissionMap {
  const source = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
  return MODULE_KEYS.reduce((acc, key) => {
    const value = source[key];
    acc[key] = isValidLevel(value) ? value : 'none';
    return acc;
  }, {} as PermissionMap);
}

/* ==========================================================
   PERMISSÕES EFETIVAS
   O administrador tem sempre acesso total, independentemente do jsonb.
   Um utilizador desativado não acede a nada.
   ========================================================== */

export function effectivePermissions(user: AppUser | null): PermissionMap {
  if (!user || !user.isActive) return EMPTY_PERMISSIONS;
  if (user.role === 'admin') return ROLE_DEFAULTS.admin;
  return normalizePermissions(user.permissions);
}

export function hasAccess(
  permissions: PermissionMap,
  module: ModuleKey,
  required: PermissionLevel = 'view'
): boolean {
  if (required === 'none') return true;
  return LEVEL_ORDER[permissions[module] ?? 'none'] >= LEVEL_ORDER[required];
}

/* ==========================================================
   MAPEAMENTO camelCase (frontend) <-> snake_case (Supabase)
   ========================================================== */

export function mapUserFromDb(row: any): AppUser {
  return {
    userId: row.user_id,
    email: row.email ?? '',
    displayName: row.display_name || (row.email ? String(row.email).split('@')[0] : 'Utilizador'),
    role: (row.role as UserRole) ?? 'trabalhador',
    permissions: normalizePermissions(row.permissions),
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapUserToDb(user: AppUser) {
  return {
    user_id: user.userId,
    email: user.email,
    display_name: user.displayName,
    role: user.role,
    permissions: normalizePermissions(user.permissions),
    is_active: user.isActive,
  };
}

/* ==========================================================
   AUXILIAR DE NAVEGAÇÃO
   Primeiro módulo a que o utilizador tem acesso — usado para o
   redirecionar quando a vista atual lhe está vedada.
   ========================================================== */

export function firstAllowedModule(permissions: PermissionMap): ModuleKey | null {
  const found = MODULE_KEYS.find((key) => hasAccess(permissions, key, 'view'));
  return found ?? null;
}
