const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src/components/layout/Sidebar.tsx');
let c = fs.readFileSync(p, 'utf8');

const footerCode = `
      {/* NOVO RODAPÉ DE UTILIZADOR */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <button 
          onClick={() => setShowProfile(true)}
          className="flex flex-col text-left hover:bg-gray-200 p-2 rounded-xl transition-colors min-w-0"
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Operador</span>
          <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{currentUser}</span>
        </button>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowProfile(true)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Definições de Perfil"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              import('@/lib/supabase').then(({ supabase }) => {
                supabase.auth.signOut().then(() => {
                  window.location.href = '/login';
                });
              });
            }}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Terminar Sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showProfile && <ProfileSettingsModal onClose={() => setShowProfile(false)} />}
    </aside>
  );
}`;

c = c.replace(/\{\/\* RodapA[A-Za-z0-9]+ da Sidebar[\s\S]*?<\/aside>/m, footerCode);

fs.writeFileSync(p, c, 'utf8');
