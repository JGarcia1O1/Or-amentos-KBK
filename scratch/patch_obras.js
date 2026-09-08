import fs from 'fs';
import path from 'path';

// 1. Patch AppContext.tsx
const appCtxPath = path.join(process.cwd(), 'src', 'context', 'AppContext.tsx');
let appCtxContent = fs.readFileSync(appCtxPath, 'utf8');

const regex1 = /currentView:\s*'dashboard'\s*\|\s*'visits-list'\s*\|\s*'visit-editor'\s*\|\s*'quotes-list'\s*\|\s*'quote-editor'\s*\|\s*'clients'\s*\|\s*'materials'\s*\|\s*'settings'\s*\|\s*'emails';/g;
const repl1 = "currentView: 'dashboard' | 'obras' | 'visits-list' | 'visit-editor' | 'quotes-list' | 'quote-editor' | 'clients' | 'materials' | 'settings' | 'emails';";

const regex2 = /setCurrentView:\s*\(\s*view:\s*'dashboard'\s*\|\s*'visits-list'\s*\|\s*'visit-editor'\s*\|\s*'quotes-list'\s*\|\s*'quote-editor'\s*\|\s*'clients'\s*\|\s*'materials'\s*\|\s*'settings'\s*\|\s*'emails'\s*\)\s*=>\s*void;/g;
const repl2 = "setCurrentView: (view: 'dashboard' | 'obras' | 'visits-list' | 'visit-editor' | 'quotes-list' | 'quote-editor' | 'clients' | 'materials' | 'settings' | 'emails') => void;";

const regex3 = /useState<'dashboard'\s*\|\s*'visits-list'\s*\|\s*'visit-editor'\s*\|\s*'quotes-list'\s*\|\s*'quote-editor'\s*\|\s*'clients'\s*\|\s*'materials'\s*\|\s*'settings'\s*\|\s*'emails'>\('quotes-list'\);/g;
const repl3 = "useState<'dashboard' | 'obras' | 'visits-list' | 'visit-editor' | 'quotes-list' | 'quote-editor' | 'clients' | 'materials' | 'settings' | 'emails'>('quotes-list');";

appCtxContent = appCtxContent.replace(regex1, repl1);
appCtxContent = appCtxContent.replace(regex2, repl2);
appCtxContent = appCtxContent.replace(regex3, repl3);
fs.writeFileSync(appCtxPath, appCtxContent, 'utf8');


// 2. Patch Sidebar.tsx
const sidebarPath = path.join(process.cwd(), 'src', 'components', 'layout', 'Sidebar.tsx');
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

if (!sidebarContent.includes("'obras'")) {
    const sidebarRegex = /<button\s*type="button"\s*onClick=\{\(\) => setCurrentView\('quotes-list'\)/g;
    const sidebarRepl = `<button
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
              <span>Obras & Produção</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('quotes-list')`;

    // Ensure Hammer is imported
    if (!sidebarContent.includes("Hammer,")) {
        sidebarContent = sidebarContent.replace("import { ClipboardList,", "import { ClipboardList,\n  Hammer,");
    }
    
    sidebarContent = sidebarContent.replace(sidebarRegex, sidebarRepl);
    fs.writeFileSync(sidebarPath, sidebarContent, 'utf8');
}


// 3. Patch page.tsx
const pagePath = path.join(process.cwd(), 'src', 'app', 'page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

if (!pageContent.includes("ObrasView")) {
    pageContent = pageContent.replace(
        "import CompanyDashboard from '@/components/dashboard/CompanyDashboard';",
        "import CompanyDashboard from '@/components/dashboard/CompanyDashboard';\nimport ObrasView from '@/components/obras/ObrasView';"
    );
    
    pageContent = pageContent.replace(
        "{currentView === 'dashboard' && <CompanyDashboard />}",
        "{currentView === 'dashboard' && <CompanyDashboard />}\n          {currentView === 'obras' && <ObrasView />}"
    );
    
    fs.writeFileSync(pagePath, pageContent, 'utf8');
}

console.log("Patches applied");
