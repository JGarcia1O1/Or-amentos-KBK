const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src/context/AppContext.tsx');
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/currentView: 'quotes-list' \| 'quote-editor' \| 'clients' \| 'materials' \| 'settings';/g, "currentView: 'quotes-list' | 'quote-editor' | 'clients' | 'materials' | 'settings' | 'emails';");
c = c.replace(/setCurrentView: \(view: 'quotes-list' \| 'quote-editor' \| 'clients' \| 'materials' \| 'settings'\) => void;/g, "setCurrentView: (view: 'quotes-list' | 'quote-editor' | 'clients' | 'materials' | 'settings' | 'emails') => void;");
c = c.replace(/useState<'quotes-list' \| 'quote-editor' \| 'clients' \| 'materials' \| \r?\n'settings'>/g, "useState<'quotes-list' | 'quote-editor' | 'clients' | 'materials' | 'settings' | 'emails'>");

fs.writeFileSync(p, c, 'utf8');
