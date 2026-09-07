const fs=require('fs');
const p=require('path').join(process.cwd(), 'src/services/quoteService.ts');
let c=fs.readFileSync(p, 'utf8');
c=c.replace(/if \(error\) throw new Error\([^)]+\);/, 'if (error) { console.error("SUPABASE ERROR:", error); throw new Error(error.message); }');
fs.writeFileSync(p, c, 'utf8');
