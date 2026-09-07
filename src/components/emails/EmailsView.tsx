'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Copy, Check, Info, FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { calculateQuoteTotalWithVat } from '@/lib/calculator';

interface EmailInvoice {
  id: string;
  invoiceNum: string;
  invoiceDate: string;
  dueDate: string;
  amount: string;
  delayDays: string;
  quoteId?: string;
}

export default function EmailsView() {
  const { quotes } = useApp();

  const [templateType, setTemplateType] = useState('lembrete');
  const [dataSource, setDataSource] = useState<'auto' | 'manual'>('auto');
  const [showTable, setShowTable] = useState(true);

  // Global field
  const [clientName, setClientName] = useState('');

  // Multi-invoice state
  const [invoices, setInvoices] = useState<EmailInvoice[]>([
    { id: crypto.randomUUID(), invoiceNum: '', invoiceDate: '', dueDate: '', amount: '', delayDays: '' }
  ]);

  const [copied, setCopied] = useState(false);

  // Helper to parse DD/MM/YYYY
  const parseDateStr = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return null;
  };

  const formatDatePT = (date: Date) => {
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Auto mode: Add a quote
  const addInvoiceFromQuote = (quoteId: string) => {
    if (!quoteId) return;
    
    const q = quotes.find(q => q.id === quoteId);
    if (!q) return;

    if (!clientName) {
      setClientName(q.clientName || '');
    }

    const total = calculateQuoteTotalWithVat(q);
    
    let dDate = '';
    let dDays = '0';
    const parsedMovementDate = parseDateStr(q.date);
    
    if (parsedMovementDate) {
      const validity = q.validityDays || 30;
      const due = new Date(parsedMovementDate.getTime() + validity * 24 * 60 * 60 * 1000);
      dDate = formatDatePT(due);

      const now = new Date();
      const diffTime = now.getTime() - due.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      dDays = diffDays > 0 ? diffDays.toString() : '0';
    }

    const newInvoice: EmailInvoice = {
      id: crypto.randomUUID(),
      invoiceNum: q.number || '',
      invoiceDate: q.date || '',
      dueDate: dDate,
      amount: total.toFixed(2),
      delayDays: dDays,
      quoteId: q.id
    };

    // If there is only one empty invoice, replace it. Otherwise append.
    setInvoices(prev => {
      if (prev.length === 1 && !prev[0].invoiceNum && !prev[0].amount) {
        return [newInvoice];
      }
      // check if already added to avoid duplicates
      if (prev.some(inv => inv.quoteId === quoteId)) {
        toast.info('Documento já adicionado.');
        return prev;
      }
      return [...prev, newInvoice];
    });
  };

  const removeInvoice = (id: string) => {
    setInvoices(prev => {
      if (prev.length === 1) {
        return [{ id: crypto.randomUUID(), invoiceNum: '', invoiceDate: '', dueDate: '', amount: '', delayDays: '' }];
      }
      return prev.filter(inv => inv.id !== id);
    });
  };

  const addManualInvoice = () => {
    setInvoices(prev => [
      ...prev,
      { id: crypto.randomUUID(), invoiceNum: '', invoiceDate: '', dueDate: '', amount: '', delayDays: '' }
    ]);
  };

  const updateInvoice = (id: string, field: keyof EmailInvoice, value: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== id) return inv;
      const updated = { ...inv, [field]: value };
      
      // Auto-calc delay days if due date is typed properly
      if (field === 'dueDate') {
        const parsed = parseDateStr(value);
        if (parsed) {
          const now = new Date();
          const diffTime = now.getTime() - parsed.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          updated.delayDays = diffDays > 0 ? diffDays.toString() : '0';
        }
      }
      return updated;
    }));
  };

  const totalAmountValue = useMemo(() => {
    return invoices.reduce((acc, inv) => {
      const num = parseFloat(inv.amount.replace(',', '.'));
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }, [invoices]);

  const canGenerate = clientName.trim() !== '' && invoices.every(inv => inv.invoiceNum && inv.dueDate && inv.amount && !isNaN(parseFloat(inv.amount.replace(',', '.'))));

  // Formatting
  const formatCurrencyPT = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
    if (isNaN(num)) return '0,00 €';
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(num);
  };

  const getSubject = () => {
    const nome = clientName.trim() || '[Nome do Cliente]';
    switch (templateType) {
      case 'lembrete': return `Lembrete de Pagamento | ${nome}`;
      case '1_aviso': return `1.º Aviso — Valores Pendentes | ${nome}`;
      case '2_aviso': return `2.º Aviso — Valores Pendentes | ${nome}`;
      case '3_aviso': return `3.º Aviso — Pré-Contencioso | ${nome}`;
      default: return '';
    }
  };

  const getBodyHtml = () => {
    let intro = '';
    let closing = '';

    if (templateType === 'lembrete') {
      intro = `<p>Exmo.(a) Senhor(a),</p><p>Esperamos que se encontre bem.</p><p>Verificámos que se encontra pendente a regularização do(s) documento(s) abaixo indicado(s). Assim, agradecemos que, caso o pagamento ainda não tenha sido efectuado, proceda à respectiva liquidação com a maior brevidade possível.</p>`;
      closing = `<p>Após a realização do pagamento, agradecemos o envio do respectivo comprovativo de transferência em resposta a este e-mail.</p><p>Caso o pagamento já tenha sido efectuado, agradecemos que desconsidere esta mensagem.</p>`;
    } else if (templateType === '1_aviso') {
      intro = `<p>Exmo.(a) Senhor(a),</p><p>Esperamos que se encontre bem.</p><p>Verificámos que, até à presente data, não temos registo da regularização dos documentos abaixo indicados, entretanto vencidos.</p><p>Nesse sentido, solicitamos a liquidação dos valores pendentes com a maior brevidade possível.</p>`;
      closing = `<p>Após a realização do pagamento, agradecemos o envio do respectivo comprovativo de transferência em resposta a este e-mail.</p><p>Caso a situação já tenha sido regularizada, agradecemos que desconsidere esta comunicação.</p>`;
    } else if (templateType === '2_aviso') {
      intro = `<p>Exmo.(a) Senhor(a),</p><p>Esperamos que se encontre bem.</p><p>Na sequência da nossa anterior comunicação, verificamos que permanecem por regularizar os valores correspondentes aos documentos abaixo indicados.</p><p>Até à presente data, não temos registo do respectivo pagamento.</p><p>Solicitamos, por isso, que proceda à regularização dos valores pendentes no prazo máximo de 5 dias, de forma a evitar o encaminhamento da situação para as diligências subsequentes.</p>`;
      closing = `<p>Após a realização do pagamento, agradecemos o envio do respectivo comprovativo de transferência em resposta a este e-mail.</p><p>Caso o pagamento já tenha sido efectuado, agradecemos que desconsidere esta comunicação e, se possível, nos envie o respectivo comprovativo.</p>`;
    } else if (templateType === '3_aviso') {
      intro = `<p>Exmo.(a) Senhor(a),</p><p>Na sequência das nossas anteriores comunicações, verificamos que permanecem por regularizar os valores relativos aos documentos abaixo indicados.</p><p>Apesar dos avisos anteriormente enviados, não temos, até à presente data, registo da regularização da totalidade do montante em dívida.</p><p>Solicitamos, assim, a regularização integral dos valores pendentes no prazo máximo de 8 dias.</p><p>Findo esse prazo sem que a situação seja regularizada, o processo poderá ser encaminhado para o nosso departamento jurídico, para análise e eventual adopção das diligências legais adequadas.</p>`;
      closing = `<p>Após a realização do pagamento, agradecemos o envio do respectivo comprovativo de transferência em resposta a este e-mail.</p><p>Caso a situação tenha sido entretanto regularizada, agradecemos que desconsidere esta comunicação e nos envie o respectivo comprovativo, para que possamos actualizar os nossos registos.</p>`;
    }

    const totalFormatado = formatCurrencyPT(totalAmountValue);

    let itemsHtml = '';
    
    if (showTable) {
      const rows = invoices.map(inv => `
        <tr>
          <td style="padding: 10px; border: 1px solid #d1d5db;">Factura</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">${inv.invoiceNum || '...'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">${inv.invoiceDate || '...'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">${inv.dueDate || '...'}</td>
          <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">${formatCurrencyPT(inv.amount)}</td>
          <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">${formatCurrencyPT(inv.amount)}</td>
          <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">${inv.delayDays || '0'}</td>
        </tr>
      `).join('');

      itemsHtml = `
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
            ${rows}
          </tbody>
        </table>
      `;
    } else {
      itemsHtml = invoices.map(inv => `
        <div style="margin-bottom: 12px; padding: 12px 15px; border-left: 3px solid #111827; background-color: #f9fafb;">
          <p style="margin: 0 0 4px 0;"><strong>Documento:</strong> Factura n.º ${inv.invoiceNum || '...'}</p>
          <p style="margin: 0 0 4px 0;"><strong>Data de Movimento:</strong> ${inv.invoiceDate || '...'}</p>
          <p style="margin: 0 0 4px 0;"><strong>Data de Vencimento:</strong> ${inv.dueDate || '...'} (${inv.delayDays || '0'} dias em atraso)</p>
          <p style="margin: 0;"><strong>Valor:</strong> ${formatCurrencyPT(inv.amount)}</p>
        </div>
      `).join('') + '<br/>';
    }

    const dataBlock = `
      ${itemsHtml}
      <p><strong>Total em dívida: ${totalFormatado}</strong></p>
    `;

    const paymentInfo = `
      <br>
      <p><strong>Dados para pagamento</strong><br>
      Bankinter<br>
      IBAN: PT50 0269 0343 00205777602 83</p>
    `;

    const signature = `
      <br>
      <p>Com os melhores cumprimentos,</p>
      <p>Departamento Financeiro<br>
      Kubik Home, Lda.</p>
    `;

    return `
      <div style="font-family: Calibri, Arial, sans-serif; font-size: 14px; color: #1f2937; line-height: 1.5; max-width: 800px;">
        ${intro}
        ${dataBlock}
        ${paymentInfo}
        ${closing}
        ${signature}
      </div>
    `;
  };

  const getTextPlain = () => {
    const el = document.createElement('div');
    el.innerHTML = getBodyHtml();
    let text = el.innerText;
    return text.replace(/\n\n+/g, '\n\n').trim();
  };

  const handleCopy = async () => {
    if (!canGenerate) {
      toast.error('Preencha os campos obrigatórios corretamente em todas as faturas.');
      return;
    }
    try {
      const html = getBodyHtml();
      const blobHtml = new Blob([html], { type: 'text/html' });
      const blobText = new Blob([getTextPlain()], { type: 'text/plain' });
      const data = [new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })];
      await navigator.clipboard.write(data);
      
      setCopied(true);
      toast.success('E-mail copiado');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao copiar formatação rica. A usar texto simples.');
      navigator.clipboard.writeText(getTextPlain());
    }
  };

  return (
    <div className="h-full bg-white p-6 max-w-7xl mx-auto space-y-6 overflow-y-auto">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
          <Mail className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Módulo de E-mails</h1>
          <p className="text-sm text-gray-500">Gere e-mails de cobrança consistentes e profissionais.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-5 bg-gray-50 p-5 rounded-2xl border border-gray-100">
          
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase text-gray-700 tracking-wider">Tipo de E-mail</h2>
            <div>
              <select 
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white font-medium"
              >
                <option value="lembrete">Lembrete Amigável</option>
                <option value="1_aviso">1.º Aviso — Valores Pendentes</option>
                <option value="2_aviso">2.º Aviso — Valores Pendentes</option>
                <option value="3_aviso">3.º Aviso — Pré-Contencioso</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-4">
            <h2 className="text-sm font-bold uppercase text-gray-700 tracking-wider">Fonte dos Dados</h2>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="datasource" 
                  value="auto" 
                  checked={dataSource === 'auto'}
                  onChange={() => setDataSource('auto')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700 font-medium">Utilizar dados do sistema</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="datasource" 
                  value="manual" 
                  checked={dataSource === 'manual'}
                  onChange={() => setDataSource('manual')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700 font-medium">Introduzir dados manualmente</span>
              </label>
            </div>

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

            {dataSource === 'auto' && (
              <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                <label className="block text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Documentos Adicionados
                </label>
                
                {invoices.filter(inv => inv.quoteId).map((inv, idx) => (
                  <div key={inv.id} className="flex items-center justify-between bg-white border border-blue-200 p-2.5 rounded-lg text-sm">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800">Doc: {inv.invoiceNum}</span>
                      <span className="text-xs text-gray-500">{formatCurrencyPT(inv.amount)}</span>
                    </div>
                    <button onClick={() => removeInvoice(inv.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <select 
                  onChange={(e) => {
                    addInvoiceFromQuote(e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full border border-blue-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">+ Adicionar Documento do Sistema</option>
                  {quotes.map(q => (
                    <option key={q.id} value={q.id}>{q.number} - {q.clientName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {dataSource === 'manual' && (
            <div className="pt-4 border-t border-gray-200 space-y-4 animate-fadeIn">
              <h2 className="text-sm font-bold uppercase text-gray-700 tracking-wider">Dados Manuais</h2>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nome do Cliente <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Cliente Exemplo, Lda."
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 transition-all bg-white"
                />
              </div>

              <div className="space-y-4">
                {invoices.map((inv, idx) => (
                  <div key={inv.id} className="p-4 bg-white border border-gray-200 rounded-xl relative space-y-4 shadow-sm">
                    {invoices.length > 1 && (
                      <button 
                        onClick={() => removeInvoice(inv.id)}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Remover Fatura"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    
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
                ))}

                <button
                  onClick={addManualInvoice}
                  className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Fatura Manual
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={handleCopy}
              disabled={!canGenerate}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                copied ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 
                canGenerate ? 'bg-black text-white hover:bg-gray-800 hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              } shadow-md`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? '✓ E-mail copiado' : 'Copiar E-mail'}
            </button>
          </div>
          
        </div>

        <div className="col-span-1 lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pré-visualização do Assunto</p>
                <p className="text-sm font-bold text-gray-900">{getSubject()}</p>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(getSubject());
                  toast.success('Assunto copiado');
                }}
                className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500 transition-colors"
                title="Copiar Assunto"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-white flex-1">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: getBodyHtml() }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}