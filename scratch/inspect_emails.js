const xlsx = require('xlsx');
const wb = xlsx.readFile('C:\\Users\\user\\Downloads\\Email.xlsx');

wb.SheetNames.forEach(sheetName => {
    console.log(`\n=== SHEET: ${sheetName} ===`);
    const json = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: null });
    const numRows = Math.min(50, json.length);
    for (let i = 0; i < numRows; i++) {
        let row = json[i] || [];
        while(row.length > 0 && row[row.length - 1] === null) row.pop();
        if(row.length > 0) console.log(`Row ${i+1}:`, JSON.stringify(row));
    }
});
