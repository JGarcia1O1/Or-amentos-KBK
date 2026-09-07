import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'Orcamentos_Data');

const MONTH_NAMES = [
  '01-Janeiro', '02-Fevereiro', '03-Marco', '04-Abril',
  '05-Maio', '06-Junho', '07-Julho', '08-Agosto',
  '09-Setembro', '10-Outubro', '11-Novembro', '12-Dezembro'
];

// Funções Auxiliares
function getSafeFilename(name: string) {
  return name.replace(/[^a-z0-9áéíóúãõç]/gi, '_').replace(/_+/g, '_');
}

function parseQuoteDate(dateString: string) {
  // Assume formato DD/MM/YYYY
  if (!dateString) {
    const d = new Date();
    return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
  }
  
  const parts = dateString.split('/');
  if (parts.length === 3) {
    return {
      day: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      year: parseInt(parts[2], 10)
    };
  }
  // Fallback
  const d = new Date();
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
}

function getQuoteFilePath(quote: any) {
  const { month, year } = parseQuoteDate(quote.date);
  const monthName = MONTH_NAMES[month - 1] || '00-Desconhecido';
  
  const clientParts = (quote.clientName || 'Sem Cliente').trim().split(/\s+/);
  const firstName = clientParts[0] || '';
  const lastName = clientParts.length > 1 ? clientParts[clientParts.length - 1] : '';
  const displayName = lastName ? `${firstName} ${lastName}` : firstName;
  
  const fileName = `KUBIK_Orcamento_${getSafeFilename(quote.number || '000')}_${getSafeFilename(displayName)}.json`;
  
  return path.join(DATA_DIR, year.toString(), monthName, fileName);
}

// Procurar e apagar um orçamento antigo pelo ID para evitar duplicados se mudar de data/cliente
function deleteQuoteById(targetId: string) {
  if (!fs.existsSync(DATA_DIR)) return false;

  let deleted = false;
  const walkSync = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkSync(fullPath);
      } else if (file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const q = JSON.parse(content);
          if (q.id === targetId) {
            fs.unlinkSync(fullPath);
            deleted = true;
          }
        } catch (e) {
          console.error('Error reading file to delete', fullPath, e);
        }
      }
    }
  };
  
  walkSync(DATA_DIR);
  return deleted;
}

const pdf = require('pdf-parse');

export async function GET() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      return NextResponse.json([]);
    }

    const quotes: any[] = [];
    const pdfFilesToParse: string[] = [];
    
    const walkSync = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walkSync(fullPath);
        } else if (file.endsWith('.json')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            quotes.push(JSON.parse(content));
          } catch (e) {
            console.error('Error reading JSON:', fullPath, e);
          }
        } else if (file.toLowerCase().endsWith('.pdf') && !file.includes('.imported.')) {
          pdfFilesToParse.push(fullPath);
        }
      }
    };

    walkSync(DATA_DIR);
    
    // Parse pending PDFs
    for (const pdfPath of pdfFilesToParse) {
      try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        const text = data.text;
        
        // Extract basic data
        let numberMatch = text.match(/(?:Orçamento|Cotação)[^\w]*([0-9]{4}-[A-Za-z0-9]+)/i);
        let number = numberMatch ? numberMatch[1] : `Recuperado-${Date.now().toString().slice(-4)}`;
        
        // Check if we already have a JSON quote with this number
        if (quotes.some(q => q.number === number)) {
           continue; // Already imported or exists
        }
        
        let dateMatch = text.match(/Data:\s*([\d\/\-]+)/i);
        let date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('pt-PT');
        
        const importedQuote = {
          id: `q-pdf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          number,
          clientName: 'Cliente Importado do PDF',
          clientNif: '',
          clientAddress: '',
          date,
          responsible: 'Sistema de Importação',
          projectName: 'Orçamento Recuperado (PDF)',
          status: 'Rascunho', 
          type: 'manual',
          chapters: [
             {
               id: 1,
               title: 'Artigos Importados',
               items: [
                 {
                   id: '1.1',
                   code: '1.1',
                   designation: 'Verifique o PDF original para ver os artigos detalhados. A importação extraiu os dados gerais.',
                   unit: 'cj',
                   quantity: 1,
                   costUnit: 0,
                   marginPercent: 0,
                   fixedExtra: 0,
                   calculationMode: 'quick'
                 }
               ]
             }
          ],
          notes: '⚠️ Este orçamento foi recriado automaticamente através do PDF.\nComo os PDFs não contêm as fórmulas nem as margens de lucro de bastidores, este orçamento foi convertido para o Modo Manual.',
        };
        
        // Try to parse Total Value
        const totalMatch = text.match(/Valor Final da Proposta[^\d]*([\d\s,]+)/i);
        if (totalMatch && importedQuote.chapters[0].items[0]) {
           const valRaw = totalMatch[1].replace(/\s/g, '').replace(',', '.');
           const val = parseFloat(valRaw);
           if (!isNaN(val)) {
             importedQuote.chapters[0].items[0].costUnit = val;
             importedQuote.chapters[0].items[0].designation += `\n(Valor Global Encontrado: ${val} €)`;
           }
        }
        
        // Save it immediately as JSON
        const filePath = getQuoteFilePath(importedQuote);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(importedQuote, null, 2), 'utf8');
        
        quotes.push(importedQuote);
        
        // Rename PDF to avoid parsing again and again
        fs.renameSync(pdfPath, pdfPath.replace(/\.pdf$/i, '.imported.pdf'));
        
      } catch (e) {
        console.error('Failed to parse PDF', pdfPath, e);
      }
    }
    
    // Sort quotes by date descending
    quotes.sort((a, b) => {
      const dateA = parseQuoteDate(a.date);
      const dateB = parseQuoteDate(b.date);
      const valA = dateA.year * 10000 + dateA.month * 100 + dateA.day;
      const valB = dateB.year * 10000 + dateB.month * 100 + dateB.day;
      return valB - valA; // Descending
    });

    return NextResponse.json(quotes);
  } catch (error: any) {
    console.error('GET Quotes Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Suportar um array de orçamentos (para a migração do localStorage inicial)
    const quotes = Array.isArray(data) ? data : [data];
    
    for (const quote of quotes) {
      if (!quote || !quote.id) continue;

      // Apaga a versão anterior se existir noutra pasta / com outro nome
      deleteQuoteById(quote.id);

      const filePath = getQuoteFilePath(quote);
      const dir = path.dirname(filePath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(quote, null, 2), 'utf8');
    }

    return NextResponse.json({ success: true, count: quotes.length });
  } catch (error: any) {
    console.error('POST Quotes Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'No ID provided' }, { status: 400 });

    const deleted = deleteQuoteById(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
