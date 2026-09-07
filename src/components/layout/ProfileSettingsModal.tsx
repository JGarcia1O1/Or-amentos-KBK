'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { X, User, Lock, Save, Shield } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function ProfileSettingsModal({ onClose }: { onClose: () => void }) {
  const { currentUser, setCurrentUser } = useApp();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || '');
        setDisplayName(user.user_metadata?.display_name || '');
      }
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: any = {};
      
      // Update Name
      if (displayName.trim()) {
        updates.data = { display_name: displayName.trim() };
      }

      // Update Password if filled
      if (newPassword.trim()) {
        if (newPassword.length < 6) {
          toast.error('A password deve ter pelo menos 6 caracteres');
          setIsSaving(false);
          return;
        }
        updates.password = newPassword.trim();
      }

      if (Object.keys(updates).length === 0) {
        toast.info('Nenhuma alteração para guardar');
        setIsSaving(false);
        return;
      }

      const { error } = await supabase.auth.updateUser(updates);
      
      if (error) throw error;

      if (updates.data?.display_name) {
        setCurrentUser(updates.data.display_name);
      }

      toast.success('Perfil atualizado com segurança');
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao atualizar: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Segurança do Perfil</h2>
              <p className="text-xs text-gray-500">Gerir a tua identidade na plataforma</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <User className="w-4 h-4" /> Nome de Apresentação
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: João Garcia"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              Este é o nome que vai aparecer visível para os teus colegas e nos orçamentos.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              E-mail (Acesso Privado)
            </label>
            <input
              type="text"
              value={email}
              disabled
              className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" /> Nova Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Deixar em branco para não alterar"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-black hover:bg-gray-800 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Segurança
          </button>
        </div>
      </div>
    </div>
  );
}
