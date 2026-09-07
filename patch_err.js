const fs=require('fs');
const p=require('path').join(process.cwd(), 'src/context/AppContext.tsx');
let c=fs.readFileSync(p, 'utf8');
c=c.replace(/\.catch\(\(\) => toast\.error\('.*? criar.*?'\)\);/g, ".catch((e) => toast.error('Erro Supabase: ' + (e.message || e.toString())));");
fs.writeFileSync(p, c, 'utf8');
