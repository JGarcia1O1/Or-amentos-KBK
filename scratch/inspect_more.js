const xlsx = require('xlsx');
const sheet = xlsx.readFile('C:\\Users\\user\\Downloads\\KUBIK_Dashboard.xlsx').Sheets['S35'];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
json.forEach((row, i) => {
    let cleanRow = row || [];
    while(cleanRow.length > 0 && cleanRow[cleanRow.length - 1] === null) cleanRow.pop();
    if(cleanRow.length > 0) console.log(`Row ${i + 1}:`, JSON.stringify(cleanRow));
});
