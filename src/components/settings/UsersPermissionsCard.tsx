'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Loader2,
  Save,
  RefreshCw,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  AppUser,
  ModuleKey,
  PermissionLevel,
  PermissionMap,
  UserRole,
} from '@/types';
import {
  APP_MODULES,
  PERMISSION_LABELS,
  ROLE_DEFAULTS,
  mapUserFromDb,
  normalizePermissions,
} from '@/lib/permissions';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  trabalhador: 'Trabalhador',
};

const LEVELS: PermissionLevel[] = ['none', 'view', 'edit'];

export default function UsersPermissionsCard() {
  const { currentUserId, refreshUserProfile } = useApp();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id, email, display_name, role, permissions, is_active, created_at, updated_at')
      .order('role', { ascending: true });

    if (error) {
      toast.error('Não foi possível carregar os utilizadores.');
      console.error('[KUBIK] user_roles select:', error.message);
      setUsers([]);
    } else {
      setUsers((data || []).map(mapUserFromDb));
    }
    setDirtyIds(new Set());
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markDirty = (userId: string) => {
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });
  };

  const patchUser = (userId: string, patch: Partial<AppUser>) => {
    setUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, ...patch } : u)));
    markDirty(userId);
  };

  // Mudar o perfil base repõe as permissões padrão desse perfil.
  // A partir daí o administrador pode ajustar módulo a módulo.
  const handleRoleChange = (user: AppUser, role: UserRole) => {
    patchUser(user.userId, {
      role,
      permissions: { ...ROLE_DEFAULTS[role] } as PermissionMap,
    });
  };

  const handleLevelChange = (user: AppUser, module: ModuleKey, level: PermissionLevel) => {
    patchUser(user.userId, {
      permissions: { ...user.permissions, [module]: level },
    });
  };

  const handleSave = async (user: AppUser) => {
    setSavingId(user.userId);

    // Mapeamento camelCase (frontend) -> snake_case (Supabase)
    const { error } = await supabase
      .from('user_roles')
      .update({
        role: user.role,
        permissions: normalizePermissions(user.permissions),
        is_active: user.isActive,
        display_name: user.displayName,
      })
      .eq('user_id', user.userId);

    setSavingId(null);

    if (error) {
      toast.error('Erro ao gravar permissões.');
      console.error('[KUBIK] user_roles update:', error.message);
      return;
    }

    toast.success(`Permissões de ${user.displayName} atualizadas.`);
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.delete(user.userId);
      return next;
    });

    // Se o administrador alterou as suas próprias permissões, recarrega-as.
    if (user.userId === currentUserId) {
      await refreshUserProfile();
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-gray-800" />
          <div>
            <h3 className="font-bold text-sm text-gray-900">
              Utilizadores &amp; Permissões
            </h3>
            <p className="text-[11px] text-gray-500">
              Define que módulos cada colaborador vê e o que pode fazer em cada um.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-semibold transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-6">
          <Loader2 className="w-4 h-4 animate-spin" />
          A carregar utilizadores...
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl p-4">
          Não há utilizadores na tabela de permissões. Cria os utilizadores no
          dashboard do Supabase (Authentication &rarr; Users); o perfil de permissões
          é criado automaticamente e aparece aqui.
        </div>
      )}

      <div className="space-y-4">
        {users.map((user) => {
          const isDirty = dirtyIds.has(user.userId);
          const isSelf = user.userId === currentUserId;

          return (
            <div
              key={user.userId}
              className="border border-gray-200 rounded-xl p-4 space-y-4 bg-gray-50/40"
            >
              {/* Cabeçalho do utilizador */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 truncate">
                      {user.displayName}
                    </span>
                    {isSelf && (
                      <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Tu
                      </span>
                    )}
                    {!user.isActive && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Desativado
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">{user.email}</div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-black focus:border-black transition"
                  >
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => patchUser(user.userId, { isActive: !user.isActive })}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                      user.isActive
                        ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                    }`}
                    title={user.isActive ? 'Desativar acesso' : 'Reativar acesso'}
                  >
                    {user.isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </button>

                  <button
                    type="button"
                    disabled={!isDirty || savingId === user.userId}
                    onClick={() => handleSave(user)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {savingId === user.userId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Gravar
                  </button>
                </div>
              </div>

              {/* Matriz de módulos */}
              {user.role === 'admin' ? (
                <div className="text-[11px] text-gray-500 bg-white border border-gray-100 rounded-lg p-3">
                  O perfil <strong>Administrador</strong> tem acesso total a todos os
                  módulos, incluindo esta página. Não há nada para configurar.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {APP_MODULES.map((mod) => (
                    <div
                      key={mod.key}
                      className="flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-lg px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-gray-900 truncate">
                          {mod.label}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {mod.description}
                        </div>
                      </div>
                      <select
                        value={user.permissions[mod.key]}
                        onChange={(e) =>
                          handleLevelChange(user, mod.key, e.target.value as PermissionLevel)
                        }
                        className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white shrink-0 focus:ring-2 focus:ring-black focus:border-black transition"
                      >
                        {LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {PERMISSION_LABELS[level]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {isDirty && (
                <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Há alterações por gravar neste utilizador.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
