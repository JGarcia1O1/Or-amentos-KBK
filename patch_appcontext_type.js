const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src/context/AppContext.tsx');
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/useState<'quotes-list' \| 'quote-editor' \| 'clients' \| 'materials' \|[\s\S]*?'settings'>/g, "useState<'quotes-list' | 'quote-editor' | 'clients' | 'materials' | 'settings' | 'emails'>");

fs.writeFileSync(p, c, 'utf8');
