import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const EXCEL_FILE = path.join(process.cwd(), 'data', 'kubik_catalogo.xlsx');
const JSON_FILE = path.join(process.cwd(), 'data', 'catalog.json');

export async function GET() {
  try {
    const excelStats = await fs.stat(EXCEL_FILE);
    let jsonMtime = 0;
    try {
      const jsonStats = await fs.stat(JSON_FILE);
      jsonMtime = jsonStats.mtime.getTime();
    } catch (e) {}

    return NextResponse.json({ 
      exists: true, 
      excelMtime: excelStats.mtime.getTime(),
      jsonMtime: jsonMtime
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ exists: false, excelMtime: 0, jsonMtime: 0 });
    }
    return NextResponse.json({ error: 'Failed to check file status' }, { status: 500 });
  }
}
