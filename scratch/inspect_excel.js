const xlsx = require('xlsx');
const fs = require('fs');

const filePath = 'C:\\Users\\user\\Downloads\\KUBIK_Dashboard.xlsx';
if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

const workbook = xlsx.readFile(filePath);
console.log(`Workbook has ${workbook.SheetNames.length} sheets:`);

workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
    
    if (json.length === 0) {
        console.log('Empty sheet');
        return;
    }

    const numRowsToPrint = Math.min(6, json.length);
    for (let i = 0; i < numRowsToPrint; i++) {
        let row = json[i] || [];
        while(row.length > 0 && row[row.length - 1] === null) {
            row.pop();
        }
        console.log(`Row ${i + 1}:`, JSON.stringify(row));
    }
    console.log(`Total rows: ${json.length}`);
});
