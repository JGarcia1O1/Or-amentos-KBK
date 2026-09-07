const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src/components/emails/EmailsView.tsx');
let c = fs.readFileSync(p, 'utf8');

// 1. Add ChevronDown to lucide-react imports
if (!c.includes('ChevronDown')) {
  c = c.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, "import {$1, ChevronDown} from 'lucide-react';");
}

// 2. Add expandedInvoiceId state
if (!c.includes('expandedInvoiceId')) {
  c = c.replace(/const \[copied, setCopied\] = useState\(false\);/, "const [copied, setCopied] = useState(false);\n  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(invoices[0]?.id || null);");
}

// 3. Update addManualInvoice to expand the new invoice
const newAddManualInvoice = `  const addManualInvoice = () => {
    const newId = crypto.randomUUID();
    setInvoices(prev => [
      ...prev,
      { id: newId, invoiceNum: '', invoiceDate: '', dueDate: '', amount: '', delayDays: '' }
    ]);
    setExpandedInvoiceId(newId);
  };`;
c = c.replace(/const addManualInvoice = \(\) => \{[\s\S]*?\}\];\s*\};\s*/m, newAddManualInvoice + '\n\n');

// 4. Replace the manual invoice rendering block
const oldManualRenderBlock = /<div className="space-y-4">\s*\{invoices\.map\(\(inv, idx\) => \([\s\S]*?<button\s*onClick=\{addManualInvoice\}[\s\S]*?<\/button>\s*<\/div>/m;

const newManualRenderBlock = `<div className="space-y-3">
                {invoices.map((inv, idx) => {
                  const isExpanded = expandedInvoiceId === inv.id;
                  return (
                    <div key={inv.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all">
                      <button 
                        onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-bold text-gray-800">
                            {inv.invoiceNum ? \`Doc: \${inv.invoiceNum}\` : \`Fatura \${idx + 1}\`}
                          </span>
                          {inv.amount && <span className="text-xs text-gray-500 font-medium mt-0.5">{formatCurrencyPT(inv.amount)}</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          {invoices.length > 1 && (
                            <div 
                              onClick={(e) => { e.stopPropagation(); removeInvoice(inv.id); }}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="Remover Fatura"
                            >
                              <Trash2 className="w-4 h-4" />
                            </div>
                          )}
                          <div className="p-1.5 text-gray-400">
                            <ChevronDown className={\`w-4 h-4 transition-transform duration-200 \${isExpanded ? 'rotate-180' : ''}\`} />
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 space-y-4 border-t border-gray-200 bg-white animate-fadeIn">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                N.º da Factura <span className="text-red-500">*</span>
                              </label>
                              <input 
                                type="text" 
                                value={inv.invoiceNum}
                                onChange={(e) => updateInvoice(inv.id, 'invoiceNum', e.target.value)}
                                placeholder="Ex: 142"
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Valor <span className="text-red-500">*</span>
                              </label>
                              <input 
                                type="text" 
                                value={inv.amount}
                                onChange={(e) => updateInvoice(inv.id, 'amount', e.target.value)}
                                placeholder="Ex: 3789.38"
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Vencimento <span className="text-red-500">*</span>
                              </label>
                              <input 
                                type="text" 
                                value={inv.dueDate}
                                onChange={(e) => updateInvoice(inv.id, 'dueDate', e.target.value)}
                                placeholder="DD/MM/AAAA"
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Atraso (Dias)</label>
                              <input 
                                type="number" 
                                value={inv.delayDays}
                                onChange={(e) => updateInvoice(inv.id, 'delayDays', e.target.value)}
                                placeholder="Ex: 30"
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={addManualInvoice}
                  className="w-full mt-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Fatura Manual
                </button>
              </div>`;

c = c.replace(oldManualRenderBlock, newManualRenderBlock);

fs.writeFileSync(p, c, 'utf8');
console.log('Accordion patched');
