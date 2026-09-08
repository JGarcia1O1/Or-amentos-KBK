const xlsx = require('xlsx');
const wb = xlsx.readFile('C:\\Users\\user\\Downloads\\KUBIK_Dashboard.xlsx');

const sheetsToInspect = ['Painel Obras_ORC_Montagens', 'Orçamentos', 'Obras', 'Clientes'];

sheetsToInspect.forEach(sheetName => {
    console.log(`\n=== SHEET: ${sheetName} ===`);
    if (!wb.Sheets[sheetName]) {
        console.log('Not found.');
        return;
    }
    const json = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: null });
    const numRows = Math.min(10, json.length);
    for (let i = 0; i < numRows; i++) {
        let row = json[i] || [];
        while(row.length > 0 && row[row.length - 1] === null) row.pop();
        if(row.length > 0) console.log(`Row ${i+1}:`, JSON.stringify(row));
    }
});
