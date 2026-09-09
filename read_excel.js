const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

try {
  const filePath = 'C:\\Users\\user\\Downloads\\Intranet - Inventário de Stocks.xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // Skip the first row, header is on row 2 (which is index 1 for the parser if we skip the first row)
  const data = xlsx.utils.sheet_to_json(sheet, { range: 1 });

  const cleanData = data.map(row => ({
    code: String(row['Referência']).trim(),
    name: String(row['Designação']).trim(),
    unit: String(row['Unidade']).trim(),
    warehouse: Number(row['Armazém']) || 1,
    quantity: Number(row['Quantidade']) || 0,
    price: Number(row['Preço']) || 0,
    total: Number(row['Total']) || 0,
    is_active: true
  }));

  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const backupFile = path.join(backupDir, 'materials_backup.json');
  fs.writeFileSync(backupFile, JSON.stringify(cleanData, null, 2));

  console.log(`Successfully parsed ${cleanData.length} records.`);
  console.log(`Backup saved to ${backupFile}`);

} catch (error) {
  console.error("Error reading file:", error.message);
}
