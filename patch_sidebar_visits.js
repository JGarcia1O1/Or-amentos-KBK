const fs = require('fs');
let c = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

const targetStr = `            {userRole !== 'trabalhador' && (
              <button
                type="button"
                onClick={() => setCurrentView('clients')}`;

const insertStr = `            {userRole !== 'trabalhador' && (
              <button
                type="button"
                onClick={() => {
                  setCurrentView('visits-list');
                }}
                className={\`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors \${
                  currentView.startsWith('visit')
                    ? 'bg-gray-900 text-white font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }\`}
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="w-4 h-4" />
                  <span>Fichas de Obra</span>
                </div>
              </button>
            )}
            
            {userRole !== 'trabalhador' && (
              <button
                type="button"
                onClick={() => setCurrentView('clients')}`;

// I also need to import ClipboardList from lucide-react if not present.
c = c.replace(/import \{([^}]+)\} from 'lucide-react';/, (match, p1) => {
  if (!p1.includes('ClipboardList')) {
    return `import { ClipboardList, ${p1} } from 'lucide-react';`;
  }
  return match;
});

c = c.replace(targetStr, insertStr);

fs.writeFileSync('src/components/layout/Sidebar.tsx', c);
console.log('Sidebar patched');
