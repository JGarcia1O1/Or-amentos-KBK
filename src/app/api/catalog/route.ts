import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { INITIAL_MATERIALS, INITIAL_HARDWARE, INITIAL_WORKSTATIONS } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const CATALOG_FILE = path.join(DATA_DIR, 'catalog.json');

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

export async function GET() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(CATALOG_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error: any) {
    // Se o ficheiro não existir, cria com base nos mocks iniciais
    if (error.code === 'ENOENT') {
      const initialCatalog = {
        materials: INITIAL_MATERIALS,
        hardware: INITIAL_HARDWARE,
        workstations: INITIAL_WORKSTATIONS,
      };
      await fs.writeFile(CATALOG_FILE, JSON.stringify(initialCatalog, null, 2));
      return NextResponse.json(initialCatalog);
    }
    return NextResponse.json({ error: 'Failed to read catalog' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await ensureDataDir();
  try {
    const body = await request.json();
    await fs.writeFile(CATALOG_FILE, JSON.stringify(body, null, 2));
    
    // Atualiza a timestamp do ficheiro JSON
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save catalog' }, { status: 500 });
  }
}
