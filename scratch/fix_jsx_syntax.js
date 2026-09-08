import fs from 'fs';
import path from 'path';

// Fix CrmEmailsView.tsx
const crmPath = path.join(process.cwd(), 'src', 'components', 'emails', 'CrmEmailsView.tsx');
let crmContent = fs.readFileSync(crmPath, 'utf8');

// The issue: "{\`... \${ ... }\`}" was literally written as "{\`... \${ ... }\`}" because of backslash escaping!
crmContent = crmContent.replace(/\{\\\`/g, "{`");
crmContent = crmContent.replace(/\\\`\}/g, "`}");
crmContent = crmContent.replace(/\\\$\{/g, "${");

fs.writeFileSync(crmPath, crmContent, 'utf8');

// Fix EmailsView.tsx
const evPath = path.join(process.cwd(), 'src', 'components', 'emails', 'EmailsView.tsx');
let evContent = fs.readFileSync(evPath, 'utf8');

evContent = evContent.replace(/\{\\\`/g, "{`");
evContent = evContent.replace(/\\\`\}/g, "`}");
evContent = evContent.replace(/\\\$\{/g, "${");

fs.writeFileSync(evPath, evContent, 'utf8');
console.log("Syntax fixed");
