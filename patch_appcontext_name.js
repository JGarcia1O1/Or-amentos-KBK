const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src/context/AppContext.tsx');
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/setCurrentUser\(session\.user\.email\);/g, "setCurrentUser(session.user.user_metadata?.display_name || 'Utilizador KUBIK');");

fs.writeFileSync(p, c, 'utf8');
