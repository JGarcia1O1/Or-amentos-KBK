const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'src/types/index.ts');
let c = fs.readFileSync(p, 'utf8');

if (!c.includes('export interface SiteVisit')) {
  c += `
export type VisitStatus = 'Agendado' | 'Realizado' | 'Orcamentado';

export interface SiteVisit {
  id: string;
  number: string;
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  visitDate: string; // YYYY-MM-DD
  responsible: string;
  projectTypes: string[]; // e.g. ['Cozinha', 'Portas', 'Roupeiros']
  technicalNotes?: string;
  measurementsData?: any; // To be typed more strictly later if needed
  status: VisitStatus;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}
`;
  fs.writeFileSync(p, c, 'utf8');
  console.log('Appended SiteVisit types.');
} else {
  console.log('Types already exist.');
}
