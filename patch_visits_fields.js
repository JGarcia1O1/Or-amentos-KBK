const fs = require('fs');

// 1. UPDATE TYPES
let types = fs.readFileSync('src/types/index.ts', 'utf8');
types = types.replace('clientAddress?: string;', "clientAddress?: string;\n  clientEmail?: string;\n  clientNif?: string;\n  checklist?: Record<string, boolean>;");
fs.writeFileSync('src/types/index.ts', types);

// 2. UPDATE SERVICE
let service = fs.readFileSync('src/services/visitService.ts', 'utf8');
service = service.replace('client_address: visit.clientAddress,', "client_address: visit.clientAddress,\n      client_email: visit.clientEmail,\n      client_nif: visit.clientNif,\n      checklist: visit.checklist,");
service = service.replace('clientAddress: row.client_address,', "clientAddress: row.client_address,\n      clientEmail: row.client_email,\n      clientNif: row.client_nif,\n      checklist: row.checklist || {},");
fs.writeFileSync('src/services/visitService.ts', service);

console.log('Types and Service updated.');
