'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { X, User, Lock, Save, Shield, KeyRound } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function ProfileSettingsModal({ onClose }: { onClose: () => void }) {
  const { setCurrentUser } = useApp();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // States for Password Change
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
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
      // 1. Update Password (if user toggled the password change form)
      if (isChangingPassword) {
        if (!oldPassword.trim() || !newPassword.trim()) {
          toast.error('Preencha a password antiga e a nova password.');
          setIsSaving(false);
          return;
        }
        if (newPassword.length < 6) {
          toast.error('A nova password deve ter pelo menos 6 caracteres.');
          setIsSaving(false);
          return;
        }

        // Verify old password by attempting to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: oldPassword
        });

        if (signInError) {
          toast.error('A password antiga está incorreta. Acesso negado.');
          setIsSaving(false);
          return;
        }

        // If old password is correct, update to new password
        const { error: updatePwError } = await supabase.auth.updateUser({ password: newPassword.trim() });
        if (updatePwError) throw updatePwError;
      }

      // 2. Update Name
      if (displayName.trim()) {
        const { error: updateNameError } = await supabase.auth.updateUser({ 
          data: { display_name: displayName.trim() } 
        });
        if (updateNameError) throw updateNameError;
        setCurrentUser(displayName.trim());
      }

      toast.success(isChangingPassword ? 'Nome e password atualizados com segurança!' : 'Perfil atualizado com sucesso!');
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao atualizar: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
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
        <div className="p-6 space-y-5 overflow-y-auto">
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

          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer group mb-4">
              <input 
                type="checkbox" 
                checked={isChangingPassword}
                onChange={(e) => setIsChangingPassword(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" />
                Quero alterar a minha password
              </span>
            </label>

            {isChangingPassword && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Password Atual
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Insira a password atual"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Nova Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Insira a nova password"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-auto">
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

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}