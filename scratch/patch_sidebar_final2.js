import fs from 'fs';
import path from 'path';

const filepath = path.join(process.cwd(), 'src', 'components', 'layout', 'Sidebar.tsx');
let content = fs.readFileSync(filepath, 'utf8');

// Ensure Hammer icon is imported
if (!content.includes('Hammer,')) {
    content = content.replace('ClipboardList,', 'ClipboardList,\n  Hammer,');
}

const dashboardRegex = /<button[\s\S]*?setCurrentView\('dashboard'\)[\s\S]*?<\/button>/;

const obrasButton = `

          <button
            type="button"
            onClick={() => setCurrentView('obras')}
            className={\`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors \${
              currentView === 'obras'
                ? 'bg-gray-900 text-white font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }\`}
          >
            <div className="flex items-center gap-2.5">
              <Hammer className="w-4 h-4" />
              <span>Produção & Obras</span>
            </div>
          </button>`;

if (!content.includes("setCurrentView('obras')")) {
    content = content.replace(dashboardRegex, match => match + obrasButton);
}

fs.writeFileSync(filepath, content, 'utf8');
console.log('Done 2!');
