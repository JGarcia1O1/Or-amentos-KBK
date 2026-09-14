'use client';

import React from 'react';
import { ShieldOff } from 'lucide-react';

interface AccessDeniedProps {
  moduleLabel?: string;
}

export default function AccessDenied({ moduleLabel }: AccessDeniedProps) {
  return (
    <div className="flex items-center justify-center h-full w-full p-10">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-xs p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-4">
          <ShieldOff className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">
          Sem acesso a este módulo
        </h3>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          {moduleLabel
            ? `A tua conta não tem permissão para aceder a ${moduleLabel}.`
            : 'A tua conta não tem permissão para aceder a esta área.'}
          {' '}
          Se precisas deste acesso, fala com a administração.
        </p>
      </div>
    </div>
  );
}
