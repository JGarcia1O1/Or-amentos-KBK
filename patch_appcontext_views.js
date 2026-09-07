const fs = require('fs');
let c = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

c = c.replace(/currentView: 'quotes-list'/g, "currentView: 'visits-list' | 'visit-editor' | 'quotes-list'");
c = c.replace(/setCurrentView: \(view: 'quotes-list'/g, "setCurrentView: (view: 'visits-list' | 'visit-editor' | 'quotes-list'");

// The default state hook:
// const [currentView, setCurrentView] = useState<'quotes-list' | 'quote-editor' | 'clients' | 'materials' | 'settings' | 'emails'>('quotes-list');
c = c.replace(/useState<'quotes-list' \|/g, "useState<'visits-list' | 'visit-editor' | 'quotes-list' |");

fs.writeFileSync('src/context/AppContext.tsx', c);
console.log('AppContext views patched');
