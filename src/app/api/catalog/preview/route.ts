import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import * as xlsx from 'xlsx';

export const dynamic = 'force-dynamic';

const EXCEL_FILE = path.join(process.cwd(), 'data', 'kubik_catalogo.xlsx');

export async function GET() {
  try {
    const buf = await fs.readFile(EXCEL_FILE);
    const wb = xlsx.read(buf, { type: 'buffer' });
    
    const result: any = {};

    if (wb.SheetNames.includes('Materiais')) {
      result.materials = xlsx.utils.sheet_to_json(wb.Sheets['Materiais']);
    }
    
    if (wb.SheetNames.includes('Ferragens')) {
      result.hardware = xlsx.utils.sheet_to_json(wb.Sheets['Ferragens']);
    }
    
    if (wb.SheetNames.includes('Maquinas')) {
      result.workstations = xlsx.utils.sheet_to_json(wb.Sheets['Maquinas']);
    }

    if (wb.SheetNames.includes('Orlas')) {
      result.edges = xlsx.utils.sheet_to_json(wb.Sheets['Orlas']);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error reading excel preview:', error);
    return NextResponse.json({ error: 'Failed to read Excel file' }, { status: 500 });
  }
}
