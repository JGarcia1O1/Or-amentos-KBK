const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');

if (!c.includes('import VisitsView')) {
  c = c.replace("import EmailsView from '@/components/emails/EmailsView';", 
    "import EmailsView from '@/components/emails/EmailsView';\nimport VisitsView from '@/components/visits/VisitsView';\nimport VisitForm from '@/components/visits/VisitForm';");
  
  c = c.replace("{currentView === 'emails' && <EmailsView />}",
    "{currentView === 'emails' && <EmailsView />}\n          {currentView === 'visits-list' && <VisitsView />}\n          {currentView === 'visit-editor' && <VisitForm />}");
  
  fs.writeFileSync('src/app/page.tsx', c);
  console.log('page.tsx patched');
} else {
  console.log('page.tsx already patched');
}
