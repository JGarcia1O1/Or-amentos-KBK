import fs from 'fs';
import path from 'path';

const filepath = path.join(process.cwd(), 'src', 'components', 'layout', 'Sidebar.tsx');
let content = fs.readFileSync(filepath, 'utf8');

const regex = /<div className="px-3 py-1\.5 text-\[10px\] font-bold text-gray-400 uppercase tracking-wider">\s*Módulos Ativos\s*<\/div>/g;
const replacement = `<div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Módulos Ativos
          </div>

          <button
            type="button"
            onClick={() => setCurrentView('dashboard')}
            className={\`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors \${
              currentView === 'dashboard'
                ? 'bg-gray-900 text-white font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }\`}
          >
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4" />
              <span>Dashboard / Gestão</span>
            </div>
          </button>`;

if (content.includes("<span>Dashboard / Gestão</span>")) {
  console.log("Already patched");
} else {
  // Try to replace, noticing encoding might be tricky because of "Módulos"
  // Let's use a safer regex ignoring exact special characters
  const safeRegex = /<div className="px-3 py-1\.5 text-\[10px\] font-bold text-gray-400 uppercase tracking-wider">[\s\S]*?Ativos[\s\S]*?<\/div>/g;
  
  const safeReplacement = `<div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Módulos Ativos
          </div>

          <button
            type="button"
            onClick={() => setCurrentView('dashboard')}
            className={\`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors \${
              currentView === 'dashboard'
                ? 'bg-gray-900 text-white font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }\`}
          >
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4" />
              <span>Gestão & Analytics</span>
            </div>
          </button>`;

  content = content.replace(safeRegex, safeReplacement);
  fs.writeFileSync(filepath, content, 'utf8');
  console.log('Sidebar.tsx patched successfully');
}
