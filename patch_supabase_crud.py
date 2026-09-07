import re
import os

filepath = 'src/context/AppContext.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Material
content = re.sub(
    r'setMaterials\(prev => \[\.\.\.prev, m\]\);',
    r"setMaterials(prev => [...prev, m]);\n      supabase.from('materials').insert([m]).then(res => { if(res.error) console.error('Erro supabase addMaterial:', res.error); });",
    content
)

# Update Material Price
content = re.sub(
    r'setMaterials\(prev =>\s*prev\.map\(m => \(m\.code === code \? \{ \.\.\.m, price: newPrice \} : m\)\)\s*\);',
    r"setMaterials(prev => prev.map(m => (m.code === code ? { ...m, price: newPrice } : m)));\n      supabase.from('materials').update({ price: newPrice }).eq('code', code).then();",
    content
)

# Delete Material
content = re.sub(
    r'setMaterials\(prev => prev\.filter\(m => m\.code !== code\)\);',
    r"setMaterials(prev => prev.filter(m => m.code !== code));\n        supabase.from('materials').delete().eq('code', code).then();",
    content
)

# Add Hardware
content = re.sub(
    r'setHardware\(prev => \[\.\.\.prev, h\]\);',
    r"setHardware(prev => [...prev, h]);\n      supabase.from('hardware').insert([h]).then();",
    content
)

# Update Hardware Price
content = re.sub(
    r'setHardware\(prev =>\s*prev\.map\(h => \(h\.code === code \? \{ \.\.\.h, price \} : h\)\)\s*\);',
    r"setHardware(prev => prev.map(h => (h.code === code ? { ...h, price } : h)));\n      supabase.from('hardware').update({ price }).eq('code', code).then();",
    content
)

# Delete Hardware
content = re.sub(
    r'setHardware\(prev => prev\.filter\(h => h\.code !== code\)\);',
    r"setHardware(prev => prev.filter(h => h.code !== code));\n        supabase.from('hardware').delete().eq('code', code).then();",
    content
)

# Add Edge
content = re.sub(
    r'setEdges\(prev => \[\.\.\.prev, e\]\);',
    r"setEdges(prev => [...prev, e]);\n    supabase.from('edges').insert([e]).then();",
    content
)

# Update Edge
content = re.sub(
    r'setEdges\(prev =>\s*prev\.map\(edge => \(edge\.code === code \? \{ \.\.\.edge, pricePerMeter: price \} : edge\)\)\s*\);',
    r"setEdges(prev => prev.map(edge => (edge.code === code ? { ...edge, pricePerMeter: price } : edge)));\n    supabase.from('edges').update({ price_per_meter: price }).eq('code', code).then();",
    content
)

# Delete Edge
content = re.sub(
    r'setEdges\(prev => prev\.filter\(e => e\.code !== code\)\);',
    r"setEdges(prev => prev.filter(e => e.code !== code));\n        supabase.from('edges').delete().eq('code', code).then();",
    content
)

# Add Workstation
content = re.sub(
    r'setWorkstations\(prev => \[\.\.\.prev, ws\]\);',
    r"setWorkstations(prev => [...prev, ws]);\n    supabase.from('workstations').insert([ws]).then();",
    content
)

# Update Workstation
content = re.sub(
    r'setWorkstations\(prev =>\s*prev\.map\(w => \(w\.code === code \? \{ \.\.\.w, rate \} : w\)\)\s*\);',
    r"setWorkstations(prev => prev.map(w => (w.code === code ? { ...w, rate } : w)));\n    supabase.from('workstations').update({ rate }).eq('code', code).then();",
    content
)

# Delete Workstation
content = re.sub(
    r'setWorkstations\(prev => prev\.filter\(w => w\.code !== code\)\);',
    r"setWorkstations(prev => prev.filter(w => w.code !== code));\n        supabase.from('workstations').delete().eq('code', code).then();",
    content
)

# Add Client
content = re.sub(
    r'setClients\(prev => \[\.\.\.prev, \{ \.\.\.client, id: client\.id \|\| `c-\$\{Date\.now\(\)\}` \}\]\);',
    r"const newClient = { ...client, id: client.id || `c-${Date.now()}` };\n    setClients(prev => [...prev, newClient]);\n    supabase.from('clients').insert([newClient]).then();",
    content
)

# Update Client
content = re.sub(
    r'setClients\(prev => prev\.map\(c => \(c\.id === id \? \{ \.\.\.c, \.\.\.updated \} : c\)\)\);',
    r"setClients(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));\n    supabase.from('clients').update(updated).eq('id', id).then();",
    content
)

# Delete Client
content = re.sub(
    r'setClients\(prev => prev\.filter\(c => c\.id !== id\)\);',
    r"setClients(prev => prev.filter(c => c.id !== id));\n        supabase.from('clients').delete().eq('id', id).then();",
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
