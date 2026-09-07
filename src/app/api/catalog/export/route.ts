import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import * as xlsx from 'xlsx';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const CATALOG_FILE = path.join(DATA_DIR, 'catalog.json');
const EXCEL_FILE = path.join(DATA_DIR, 'kubik_catalogo.xlsx');

export async function GET() {
  try {
    const data = await fs.readFile(CATALOG_FILE, 'utf-8');
    const catalog = JSON.parse(data);

    const wb = xlsx.utils.book_new();

    // 1. Materiais
    if (catalog.materials) {
      const wsMateriais = xlsx.utils.json_to_sheet(catalog.materials);
      xlsx.utils.book_append_sheet(wb, wsMateriais, 'Materiais');
    }

    // 2. Ferragens
    if (catalog.hardware) {
      const wsFerragens = xlsx.utils.json_to_sheet(catalog.hardware);
      xlsx.utils.book_append_sheet(wb, wsFerragens, 'Ferragens');
    }

    // 3. Máquinas
    if (catalog.workstations) {
      const wsMaquinas = xlsx.utils.json_to_sheet(catalog.workstations);
      xlsx.utils.book_append_sheet(wb, wsMaquinas, 'Maquinas');
    }

    // 4. Orlas
    if (catalog.edges) {
      const wsOrlas = xlsx.utils.json_to_sheet(catalog.edges);
      xlsx.utils.book_append_sheet(wb, wsOrlas, 'Orlas');
    }

    // Gerar o buffer
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Grava também na pasta partilhada para servir de master / backup
    let isLocked = false;
    try {
      await fs.writeFile(EXCEL_FILE, buf);
    } catch (writeErr: any) {
      console.warn('Aviso: Não foi possível reescrever o ficheiro Excel (pode estar aberto noutro programa):', writeErr.message);
      isLocked = true;
    }

    const headers: any = {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="kubik_catalogo.xlsx"',
    };
    if (isLocked) {
      headers['X-File-Locked'] = 'true';
    }

    return new NextResponse(buf, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error generating Excel:', error);
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 });
  }
}
