import fs from 'fs';
import path from 'path';

const filepath = path.join(process.cwd(), 'src', 'context', 'AppContext.tsx');
let content = fs.readFileSync(filepath, 'utf8');

// Replace the ViewType interface definition
const regex1 = /currentView:\s*'visits-list'\s*\|\s*'visit-editor'\s*\|\s*'quotes-list'\s*\|\s*'quote-editor'\s*\|\s*'clients'\s*\|\s*'materials'\s*\|\s*'settings'\s*\|\s*'emails';/g;
const repl1 = "currentView: 'dashboard' | 'visits-list' | 'visit-editor' | 'quotes-list' | 'quote-editor' | 'clients' | 'materials' | 'settings' | 'emails';";

const regex2 = /setCurrentView:\s*\(\s*view:\s*'visits-list'\s*\|\s*'visit-editor'\s*\|\s*'quotes-list'\s*\|\s*'quote-editor'\s*\|\s*'clients'\s*\|\s*'materials'\s*\|\s*'settings'\s*\|\s*'emails'\s*\)\s*=>\s*void;/g;
const repl2 = "setCurrentView: (view: 'dashboard' | 'visits-list' | 'visit-editor' | 'quotes-list' | 'quote-editor' | 'clients' | 'materials' | 'settings' | 'emails') => void;";

// Replace the useState hook type definition
const regex3 = /const\s*\[currentView,\s*setCurrentView\]\s*=\s*useState<'visits-list'\s*\|\s*'visit-editor'\s*\|\s*'quotes-list'\s*\|\s*'quote-editor'\s*\|\s*'clients'\s*\|\s*'materials'\s*\|\s*'settings'\s*\|\s*'emails'>\('quotes-list'\);/g;
const repl3 = "const [currentView, setCurrentView] = useState<'dashboard' | 'visits-list' | 'visit-editor' | 'quotes-list' | 'quote-editor' | 'clients' | 'materials' | 'settings' | 'emails'>('quotes-list');";

content = content.replace(regex1, repl1);
content = content.replace(regex2, repl2);
content = content.replace(regex3, repl3);

fs.writeFileSync(filepath, content, 'utf8');
console.log('AppContext.tsx patched successfully');
