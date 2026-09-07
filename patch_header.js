const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src/components/layout/Header.tsx');
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/<div className="flex items-center gap-3 mr-4 border-r border-gray-200 pr-4">[\s\S]*?<\/div>\s*\{currentView === 'quotes-list'/m, "{currentView === 'quotes-list'");
// Remove imports UserCircle2, LogOut if needed, but not strictly necessary to fix right away

fs.writeFileSync(p, c, 'utf8');
