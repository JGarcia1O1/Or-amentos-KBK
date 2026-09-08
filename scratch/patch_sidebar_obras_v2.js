import fs from 'fs';
import path from 'path';

const sidebarPath = path.join(process.cwd(), 'src', 'components', 'layout', 'Sidebar.tsx');
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

// 1. Ensure Hammer is imported
if (!sidebarContent.includes("Hammer,")) {
    sidebarContent = sidebarContent.replace("import { ClipboardList,", "import { ClipboardList,\n  Hammer,");
}

// 2. Insert the active Obras button under Gestão & Analytics
const dashboardButtonRegex = /<button\s*type="button"\s*onClick=\{\(\) => setCurrentView\('dashboard'\)\}[\s\S]*?<\/button>/;
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

if (!sidebarContent.includes("setCurrentView('obras')")) {
    sidebarContent = sidebarContent.replace(dashboardButtonRegex, match => match + obrasButton);
}

// 3. Remove the old greyed-out "Produção & Obras" button
// The exact string in the file has bad encoding, so we use regex targeting Factory
const disabledObrasRegex = /<div className="w-full flex items-center justify-between px-3 py-1\.5 rounded-lg text-xs text-gray-400 cursor-not-allowed">[\s\S]*?<Factory className="w-4 h-4" \/>[\s\S]*?<\/div>\s*<\/div>\s*/;
sidebarContent = sidebarContent.replace(disabledObrasRegex, "");

fs.writeFileSync(sidebarPath, sidebarContent, 'utf8');
console.log("Sidebar patched accurately.");
