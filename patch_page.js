const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src/app/page.tsx');
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/import SettingsView from '@\/components\/settings\/SettingsView';/, "import SettingsView from '@/components/settings/SettingsView';\nimport EmailsView from '@/components/emails/EmailsView';");
c = c.replace(/\{currentView === 'settings' && <SettingsView \/>\}/, "{currentView === 'settings' && <SettingsView />}\n          {currentView === 'emails' && <EmailsView />}");

fs.writeFileSync(p, c, 'utf8');
