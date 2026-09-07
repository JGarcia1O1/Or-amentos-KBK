const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'src/components/emails/EmailsView.tsx');
let c = fs.readFileSync(p, 'utf8');

// 1. Add `showTable` state
if (!c.includes('const [showTable, setShowTable] = useState(true);')) {
  c = c.replace(/const \[dataSource, setDataSource\] = useState<'auto' \| 'manual'>\('auto'\);/, "const [dataSource, setDataSource] = useState<'auto' | 'manual'>('auto');\n  const [showTable, setShowTable] = useState(true);");
}

// 2. Add the checkbox in the UI right below the manual radio label
const checkboxHtml = `
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showTable}
                  onChange={(e) => setShowTable(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Apresentar valores em Tabela</span>
              </label>
            </div>
`;
if (!c.includes('Apresentar valores em Tabela')) {
  c = c.replace(/<span className="text-sm text-gray-700 font-medium">Introduzir dados manualmente<\/span>\n\s*<\/label>\n\s*<\/div>/, `<span className="text-sm text-gray-700 font-medium">Introduzir dados manualmente</span>\n              </label>\n            </div>${checkboxHtml}`);
}

// 3. Modify tableHtml generation inside getBodyHtml()
// Wait, regex might fail here because of backticks and newlines. 
// I will replace the whole tableHtml block.
const searchTableHtmlBlock = `const tableHtml = \`
      <p>C/C de \${activeData.clientName || '[Nome do Cliente]'}</p>
      <table style="width: 100%; border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 13px; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #111827; color: white;">
            <th style="padding: 10px; text-align: left; border: 1px solid #374151;">Documento</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #374151;">N.º Documento</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #374151;">Movimento</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #374151;">Vencimento</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #374151;">Valor</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #374151;">Saldo</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #374151;">Dias em atraso</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px; border: 1px solid #d1d5db;">Factura</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">\${activeData.invoiceNum || '...'}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">\${activeData.invoiceDate || '...'}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">\${activeData.dueDate || '...'}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">\${valorFormatado}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">\${valorFormatado}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">\${activeData.delayDays || '0'}</td>
          </tr>
        </tbody>
      </table>
      <p><strong>Total em dívida: \${valorFormatado}</strong></p>
    \`;`;

const newTableHtmlBlock = `const tableHtml = showTable ? \`
      <table style="width: 100%; border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 13px; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #111827; color: white;">
            <th style="padding: 10px; text-align: left; border: 1px solid #374151;">Documento</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #374151;">N.º Documento</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #374151;">Movimento</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #374151;">Vencimento</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #374151;">Valor</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #374151;">Saldo</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #374151;">Dias em atraso</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px; border: 1px solid #d1d5db;">Factura</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">\${activeData.invoiceNum || '...'}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">\${activeData.invoiceDate || '...'}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">\${activeData.dueDate || '...'}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">\${valorFormatado}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">\${valorFormatado}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">\${activeData.delayDays || '0'}</td>
          </tr>
        </tbody>
      </table>
      <p><strong>Total em dívida: \${valorFormatado}</strong></p>
    \` : \`
      <div style="margin-bottom: 20px; padding: 15px; border-left: 3px solid #111827; background-color: #f9fafb;">
        <p style="margin: 0 0 5px 0;"><strong>Documento:</strong> Factura n.º \${activeData.invoiceNum || '...'}</p>
        <p style="margin: 0 0 5px 0;"><strong>Data de Movimento:</strong> \${activeData.invoiceDate || '...'}</p>
        <p style="margin: 0 0 5px 0;"><strong>Data de Vencimento:</strong> \${activeData.dueDate || '...'} (\${activeData.delayDays || '0'} dias em atraso)</p>
      </div>
      <p><strong>Total em dívida: \${valorFormatado}</strong></p>
    \`;`;

c = c.replace(searchTableHtmlBlock, newTableHtmlBlock);

fs.writeFileSync(p, c, 'utf8');
console.log('Patched');
