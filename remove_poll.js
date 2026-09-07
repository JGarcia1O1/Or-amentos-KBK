const fs = require('fs');
const path = require('path');
const filepath = path.join(process.cwd(), 'src/context/AppContext.tsx');
let content = fs.readFileSync(filepath, 'utf8');

const regex = /const interval = setInterval\(async \(\) => \{[\s\S]*?\}, 5000\);\s*\/\/ Poll every 5s\s*return \(\) => clearInterval\(interval\);/;
content = content.replace(regex, '/* Polling do Excel removido para evitar excesso de pedidos na Vercel */');

fs.writeFileSync(filepath, content, 'utf8');
