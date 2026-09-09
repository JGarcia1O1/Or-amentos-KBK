const fs = require('fs');

try {
  const rawData = fs.readFileSync('./backups/materials_backup.json', 'utf-8');
  const materials = JSON.parse(rawData);

  let sql = 'INSERT INTO public.materials (code, name, unit, warehouse, quantity, price, total, is_active) VALUES\n';

  const values = materials.map(m => {
    // Escape single quotes in strings
    const code = m.code ? m.code.replace(/'/g, "''") : '';
    const name = m.name ? m.name.replace(/'/g, "''") : '';
    const unit = m.unit ? m.unit.replace(/'/g, "''") : '';
    const warehouse = m.warehouse || 1;
    const quantity = m.quantity || 0;
    const price = m.price || 0;
    const total = m.total || 0;
    const isActive = m.is_active ? 'true' : 'false';

    return `('${code}', '${name}', '${unit}', ${warehouse}, ${quantity}, ${price}, ${total}, ${isActive})`;
  });

  sql += values.join(',\n') + ';';

  fs.writeFileSync('./insert_materials_seed.sql', sql);
  console.log(`Generated SQL script with ${materials.length} rows.`);

} catch (err) {
  console.error("Error generating SQL:", err);
}
