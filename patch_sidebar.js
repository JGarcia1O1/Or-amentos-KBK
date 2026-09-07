const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src/components/layout/Sidebar.tsx');
let c = fs.readFileSync(p, 'utf8');

if (!c.includes('Mail')) {
  c = c.replace(/import \{([\s\S]*?)UserCheck,([\s\S]*?)\} from 'lucide-react';/, "import {$1UserCheck, Mail,$2} from 'lucide-react';");
}

const emailButton = `
          {/* Módulo Emails & Cobranças */}
          {userRole !== 'trabalhador' && (
            <button
              type="button"
              onClick={() => setCurrentView('emails')}
              className={\`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors \${
                currentView === 'emails'
                  ? 'bg-gray-900 text-white font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }\`}
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4" />
                <span>Emails Automáticos</span>
              </div>
            </button>
          )}
`;

c = c.replace(/\{\/\* ConfiguraA Aes Gerais \*\/\}/g, "{/* Configurações Gerais */}").replace(/\{\/\* Configurações Gerais \*\/\}/, emailButton + "\n          {/* Configurações Gerais */}");

fs.writeFileSync(p, c, 'utf8');
