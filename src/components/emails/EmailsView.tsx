'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Copy, Check, Info, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { calculateQuoteTotalWithVat } from '@/lib/calculator';

export default function EmailsView() {
  const { quotes } = useApp();

  const [templateType, setTemplateType] = useState('lembrete');
  const [dataSource, setDataSource] = useState<'auto' | 'manual'>('auto');
  const [selectedQuoteId, setSelectedQuoteId] = useState('');

  // Manual fields
  const [clientName, setClientName] = useState('');
  const [invoiceNum, setInvoiceNum] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [delayDays, setDelayDays] = useState('');

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

  // Sync auto data when selectedQuoteId changes
  useEffect(() => {
    if (dataSource === 'auto' && selectedQuoteId) {
      const q = quotes.find(q => q.id === selectedQuoteId);
      if (q) {
        setClientName(q.clientName || '');
        setInvoiceNum(q.number || '');
        setInvoiceDate(q.date || '');
        
        const total = calculateQuoteTotalWithVat(q);
        setAmount(total.toFixed(2));

        // Calculate due date based on validity days
        let dDate = '';
        let dDays = '';
        const parsedMovementDate = parseDateStr(q.date);
        
        if (parsedMovementDate) {
          const validity = q.validityDays || 30;
          const due = new Date(parsedMovementDate.getTime() + validity * 24 * 60 * 60 * 1000);
          dDate = formatDatePT(due);
          setDueDate(dDate);

          const now = new Date();
          const diffTime = now.getTime() - due.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          dDays = diffDays > 0 ? diffDays.toString() : '0';
          setDelayDays(dDays);
        } else {
          setDueDate('');
          setDelayDays('');
        }
      }
    }
  }, [dataSource, selectedQuoteId, quotes]);

  const activeData = useMemo(() => {
    return {
      clientName: clientName.trim(),
      invoiceNum: invoiceNum.trim(),
      invoiceDate: invoiceDate.trim(),
      dueDate: dueDate.trim(),
      amount: amount.trim(),
      delayDays: delayDays.trim(),
    };
  }, [clientName, invoiceNum, invoiceDate, dueDate, amount, delayDays]);

  const isValidAmount = !isNaN(parseFloat(activeData.amount.replace(',', '.')));
  
  const canGenerate = !!activeData.clientName && !!activeData.invoiceNum && !!activeData.dueDate && !!activeData.amount && isValidAmount;

  // Formatting
  const formatCurrencyPT = (val: string) => {
    const num = parseFloat(val.replace(',', '.'));
    if (isNaN(num)) return '0,00 €';
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(num);
  };

  const getSubject = () => {
    const nome = activeData.clientName || '[Nome do Cliente]';
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

    const valorFormatado = formatCurrencyPT(activeData.amount);

    const tableHtml = `
      <p>C/C de ${activeData.clientName || '[Nome do Cliente]'}</p>
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
            <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">${activeData.invoiceNum || '...'}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">${activeData.invoiceDate || '...'}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">${activeData.dueDate || '...'}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">${valorFormatado}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">${valorFormatado}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">${activeData.delayDays || '0'}</td>
          </tr>
        </tbody>
      </table>
      <p><strong>Total em dívida: ${valorFormatado}</strong></p>
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
        ${tableHtml}
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
      toast.error('Preencha os campos obrigatórios corretamente.');
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

            {dataSource === 'auto' && (
              <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                <label className="block text-xs font-semibold text-blue-800 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Selecione o Documento
                </label>
                <select 
                  value={selectedQuoteId}
                  onChange={(e) => setSelectedQuoteId(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">-- Selecione uma proposta --</option>
                  {quotes.map(q => (
                    <option key={q.id} value={q.id}>{q.number} - {q.clientName}</option>
                  ))}
                </select>
                {!selectedQuoteId && <p className="text-[11px] text-blue-600 mt-2">Escolha um documento para preencher automaticamente.</p>}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    N.º da Factura <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={invoiceNum}
                    onChange={(e) => setInvoiceNum(e.target.value)}
                    placeholder="Ex: 142"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Valor em dívida <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 3789.38"
                    className={`w-full border ${amount && !isValidAmount ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} rounded-xl p-2.5 text-sm outline-none transition-all bg-white`}
                  />
                  {amount && !isValidAmount && <p className="text-[10px] text-red-500 mt-1">Introduza um valor válido.</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Data de vencimento <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={dueDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDueDate(val);
                      const parsed = parseDateStr(val);
                      if (parsed) {
                        const now = new Date();
                        const diffTime = now.getTime() - parsed.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        setDelayDays(diffDays > 0 ? diffDays.toString() : '0');
                      }
                    }}
                    placeholder="DD/MM/AAAA"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Dias em atraso</label>
                  <input 
                    type="number" 
                    value={delayDays}
                    onChange={(e) => setDelayDays(e.target.value)}
                    placeholder="Ex: 30"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 transition-all bg-white"
                  />
                </div>
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
          
          <div className="bg-blue-50/50 p-3 rounded-lg flex gap-2 items-start text-xs text-blue-700 border border-blue-100">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Os e-mails mantêm a formatação original quando colados no Outlook (Tabelas, negritos e hierarquia).</p>
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