const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'src', 'context', 'AppContext.tsx');
let content = fs.readFileSync(filepath, 'utf8');

// Material
content = content.replace(
  /setMaterials\(prev => \[\.\.\.prev, m\]\);/g,
  `setMaterials(prev => [...prev, m]);\n      supabase.from('materials').insert([m]).then(res => { if(res.error) console.error('Erro supabase addMaterial:', res.error); });`
);

content = content.replace(
  /setMaterials\(prev =>\s*prev\.map\(m => \(m\.code === code \? \{ \.\.\.m, price: newPrice \} : m\)\)\s*\);/g,
  `setMaterials(prev => prev.map(m => (m.code === code ? { ...m, price: newPrice } : m)));\n      supabase.from('materials').update({ price: newPrice }).eq('code', code).then();`
);

content = content.replace(
  /setMaterials\(prev => prev\.filter\(m => m\.code !== code\)\);/g,
  `setMaterials(prev => prev.filter(m => m.code !== code));\n        supabase.from('materials').delete().eq('code', code).then();`
);

// Hardware
content = content.replace(
  /setHardware\(prev => \[\.\.\.prev, h\]\);/g,
  `setHardware(prev => [...prev, h]);\n      supabase.from('hardware').insert([h]).then();`
);

content = content.replace(
  /setHardware\(prev =>\s*prev\.map\(h => \(h\.code === code \? \{ \.\.\.h, price \} : h\)\)\s*\);/g,
  `setHardware(prev => prev.map(h => (h.code === code ? { ...h, price } : h)));\n      supabase.from('hardware').update({ price }).eq('code', code).then();`
);

content = content.replace(
  /setHardware\(prev => prev\.filter\(h => h\.code !== code\)\);/g,
  `setHardware(prev => prev.filter(h => h.code !== code));\n        supabase.from('hardware').delete().eq('code', code).then();`
);

// Edge
content = content.replace(
  /setEdges\(prev => \[\.\.\.prev, e\]\);/g,
  `setEdges(prev => [...prev, e]);\n    supabase.from('edges').insert([e]).then();`
);

content = content.replace(
  /setEdges\(prev =>\s*prev\.map\(edge => \(edge\.code === code \? \{ \.\.\.edge, pricePerMeter: price \} : edge\)\)\s*\);/g,
  `setEdges(prev => prev.map(edge => (edge.code === code ? { ...edge, pricePerMeter: price } : edge)));\n    supabase.from('edges').update({ price_per_meter: price }).eq('code', code).then();`
);

content = content.replace(
  /setEdges\(prev => prev\.filter\(e => e\.code !== code\)\);/g,
  `setEdges(prev => prev.filter(e => e.code !== code));\n        supabase.from('edges').delete().eq('code', code).then();`
);

// Workstation
content = content.replace(
  /setWorkstations\(prev => \[\.\.\.prev, ws\]\);/g,
  `setWorkstations(prev => [...prev, ws]);\n    supabase.from('workstations').insert([ws]).then();`
);

content = content.replace(
  /setWorkstations\(prev =>\s*prev\.map\(w => \(w\.code === code \? \{ \.\.\.w, rate \} : w\)\)\s*\);/g,
  `setWorkstations(prev => prev.map(w => (w.code === code ? { ...w, rate } : w)));\n    supabase.from('workstations').update({ rate }).eq('code', code).then();`
);

content = content.replace(
  /setWorkstations\(prev => prev\.filter\(w => w\.code !== code\)\);/g,
  `setWorkstations(prev => prev.filter(w => w.code !== code));\n        supabase.from('workstations').delete().eq('code', code).then();`
);

// Client
content = content.replace(
  /setClients\(prev => \[\.\.\.prev, \{ \.\.\.client, id: client\.id \|\| `c-\$\{Date\.now\(\)\}` \}\]\);/g,
  `const newClient = { ...client, id: client.id || \`c-\${Date.now()}\` };\n    setClients(prev => [...prev, newClient]);\n    supabase.from('clients').insert([newClient]).then();`
);

content = content.replace(
  /setClients\(prev => prev\.map\(c => \(c\.id === id \? \{ \.\.\.c, \.\.\.updated \} : c\)\)\);/g,
  `setClients(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));\n    supabase.from('clients').update(updated).eq('id', id).then();`
);

content = content.replace(
  /setClients\(prev => prev\.filter\(c => c\.id !== id\)\);/g,
  `setClients(prev => prev.filter(c => c.id !== id));\n        supabase.from('clients').delete().eq('id', id).then();`
);

fs.writeFileSync(filepath, content, 'utf8');
