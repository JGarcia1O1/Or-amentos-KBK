const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src/context/AppContext.tsx');
let c = fs.readFileSync(p, 'utf8');

const regex = /const createNewQuote = \(type: 'manual' \| 'automatic' = 'manual'\): Quote => \{[\s\S]*?const nextNum = [^\;]+;/;

const newLogic = `const createNewQuote = (type: 'manual' | 'automatic' = 'manual'): Quote => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    
    // Contagem sequencial do MAs
    let maxSeq = 0;
    quotes.forEach(q => {
      if (q.number && q.number.startsWith(\`\${y}-\${m}\`)) {
        const rightPart = q.number.replace(\`\${y}-\${m}\`, '');
        if (/^\\d+$/.test(rightPart)) {
          const seqInt = parseInt(rightPart, 10);
          if (!isNaN(seqInt) && seqInt > maxSeq) {
            maxSeq = seqInt;
          }
        }
      }
    });
    
    const seqStr = String(maxSeq + 1).padStart(2, '0');
    const nextNum = \`\${y}-\${m}\${seqStr}\`;`;

if (regex.test(c)) {
  c = c.replace(regex, newLogic);
  fs.writeFileSync(p, c, 'utf8');
  console.log('Fixed numbering successfully.');
} else {
  console.log('Regex did not match.');
}
