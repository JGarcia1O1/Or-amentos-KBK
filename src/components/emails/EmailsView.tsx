'use client';

import React, { useState } from 'react';
import { Mail, Copy, Check, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmailsView() {
  const [templateType, setTemplateType] = useState('1_aviso');
  const [clientName, setClientName] = useState('');
  const [invoiceNum, setInvoiceNum] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [delayDays, setDelayDays] = useState('');
  const [copied, setCopied] = useState(false);

  // Geração do Assunto com base no template
  const getSubject = () => {
    switch (templateType) {
      case 'lembrete':
        return `Lembrete Amigável - Valores Pendentes | Cliente: ${clientName || '[Nome do Cliente]'}`;
      case '1_aviso':
        return `1º Aviso - Valores Pendentes | Cliente: ${clientName || '[Nome do Cliente]'}`;
      case '2_aviso':
        return `2º Aviso - Valores Pendentes | Cliente: ${clientName || '[Nome do Cliente]'}`;
      case '3_aviso':
        return `3º Aviso - Notificação de Pré-Contencioso | Cliente: ${clientName || '[Nome do Cliente]'}`;
      default:
        return '';
    }
  };

  // Geração do Corpo com base no template (HTML Formatted para colar no Outlook)
  const getBodyHtml = () => {
    let intro = '';
    let body = '';
    let closing = '';

    const formatAmount = (val: string) => {
      const num = parseFloat(val.replace(',', '.'));
      return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
    };

    if (templateType === 'lembrete') {
      intro = `<p>Exmos. Senhores,</p><p>Vimos por este meio lembrar V. Exas., que já se venceram as faturas conforme anexo, pelo que solicitamos previsão da sua liquidação.</p>`;
      body = `<p>Caso esta nossa solicitação se cruze com o vosso pagamento, queiram, por favor, ignorar a mesma.</p>`;
      closing = `<p>Para qualquer esclarecimento adicional por favor contacte-nos por esta via e/ou por telefone para o 234 790 180 (chamada para a rede fixa nacional).</p><p>Agradecemos a atenção dispensada e colocamo-nos à sua inteira disposição para aquilo que entender necessário.</p>`;
    } else if (templateType === '1_aviso') {
      intro = `<p>Estimado Cliente,</p><p>Esperamos que se encontre bem.</p><p>Uma vez que, até ao momento, não temos registo de pagamento dos documentos já vencidos até à data, serve o presente para solicitar a liquidação urgente dos mesmos.</p>`;
      closing = `<p>Poderá proceder à liquidação dos documentos pendentes através do seguinte meio de pagamento:<br><strong>Bankinter - PT50 0269 0343 00205777602 83</strong></p><p>Agradecemos o envio do respetivo comprovativo de transferência em resposta a este e-mail.</p><p>Se esta informação se cruzou, entretanto, com a regularização dos documentos acima discriminados, queiram desde já aceitar as nossas desculpas e ignorar esta mensagem.</p>`;
    } else if (templateType === '2_aviso') {
      intro = `<p>Estimado Cliente,</p><p>Esperamos que se encontre bem.</p><p>Uma vez que, até ao momento, não temos registo de pagamento dos documentos já vencidos até à data, serve o presente para solicitar, uma vez mais, a liquidação urgente dos mesmos.</p><p><strong>Solicitamos que proceda à liquidação destes valores num prazo máximo de 5 dias, por forma a mantermos a normalidade da nossa relação comercial.</strong></p>`;
      closing = `<p>Poderá proceder à liquidação dos documentos pendentes através do seguinte meio de pagamento:<br><strong>Bankinter - PT50 0269 0343 00205777602 83</strong></p><p>Agradecemos o envio do respetivo comprovativo de transferência em resposta a este e-mail.</p><p>Se esta informação se cruzou, entretanto, com a regularização dos documentos acima discriminados, queiram desde já aceitar as nossas desculpas e ignorar esta mensagem.</p>`;
    } else if (templateType === '3_aviso') {
      intro = `<p>Estimado Cliente,</p><p>Esperamos que se encontre bem.</p><p>Face à ausência de regularização dos valores pendentes e não obstante as nossas sucessivas interpelações, servimo-nos da presente para notificar formalmente V. Exas. de que os documentos abaixo discriminados permanecem por liquidar.</p><p><strong>Cumpre-nos informar que, caso a liquidação total do montante em dívida não ocorra no prazo improrrogável de 8 dias, o processo será imediatamente remetido ao nosso departamento jurídico para instauração da competente ação executiva.</strong></p>`;
      closing = `<p>Poderá proceder à liquidação dos documentos pendentes através do seguinte meio de pagamento:<br><strong>Bankinter - PT50 0269 0343 00205777602 83</strong></p><p>Aguardamos a receção do respetivo comprovativo de transferência com a máxima urgência para suspendermos as diligências legais.</p>`;
    }

    const tableHtml = (templateType !== 'lembrete') ? `
      <p>C/C de Cliente - ${clientName || '[Nome do Cliente]'}:</p>
      <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 12px; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #111827; color: white;">
            <th style="padding: 8px; text-align: left; border: 1px solid #374151;">Documento</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #374151;">Nº Documento</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #374151;">Movimento</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #374151;">Vencimento</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #374151;">Valor</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #374151;">Saldo</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #374151;">Idade Vencimento</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">N/Factura</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #e5e7eb;">${invoiceNum || '...'}</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #e5e7eb;">${invoiceDate || '...'}</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #e5e7eb;">${dueDate || '...'}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${formatAmount(amount)}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${formatAmount(amount)}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${delayDays || '...'}</td>
          </tr>
        </tbody>
      </table>
      <p><strong>O Total de Não Regularizado é: ${formatAmount(amount)}</strong></p>
    ` : '';

    const signature = `
      <br>
      <p>Com os melhores cumprimentos,<br>
      Departamento Financeiro<br>
      Kubik Home, Lda</p>
    `;

    return `
      <div style="font-family: Calibri, Arial, sans-serif; font-size: 14px; color: #333; max-width: 800px;">
        ${intro}
        ${tableHtml}
        ${body}
        ${closing}
        ${signature}
      </div>
    `;
  };

  const handleCopy = async () => {
    try {
      const html = getBodyHtml();
      const subject = getSubject();

      // Creates a temporary element to copy HTML properly formatted for Outlook
      const blobHtml = new Blob([html], { type: 'text/html' });
      const blobText = new Blob([html.replace(/<[^>]+>/g, '')], { type: 'text/plain' });
      
      const data = [new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })];
      await navigator.clipboard.write(data);
      
      setCopied(true);
      toast.success('Corpo do e-mail copiado! Cole diretamente no Outlook.');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error(err);
      toast.error('O seu browser não suporta cópia rica. Tente copiar o texto manualmente.');
    }
  };

  return (
    <div className="h-full bg-white p-6 max-w-7xl mx-auto space-y-6 overflow-y-auto">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
          <Mail className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Módulo de E-mails e Cobranças</h1>
          <p className="text-sm text-gray-500">Gere e-mails automáticos padronizados para envio a clientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lado Esquerdo: Formulário */}
        <div className="col-span-1 space-y-5 bg-gray-50 p-5 rounded-2xl border border-gray-100">
          <h2 className="text-sm font-bold uppercase text-gray-700 tracking-wider">Dados do E-mail</h2>
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tipo de Aviso / Urgência</label>
            <select 
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
            >
              <option value="lembrete">Lembrete Amigável</option>
              <option value="1_aviso">1º Aviso - Valores Pendentes</option>
              <option value="2_aviso">2º Aviso - Valores Pendentes</option>
              <option value="3_aviso">3º Aviso - Pré-Contencioso (Ação Legal)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nome da Entidade / Cliente</label>
            <input 
              type="text" 
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: CAMIPAR - Gestão Imobiliária..."
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {templateType !== 'lembrete' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nº Fatura</label>
                  <input 
                    type="text" 
                    value={invoiceNum}
                    onChange={(e) => setInvoiceNum(e.target.value)}
                    placeholder="Ex: 142"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Valor em Dívida (€)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 3789.38"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Data Vencimento</label>
                  <input 
                    type="text" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="DD.MM.AAAA"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Dias Atraso</label>
                  <input 
                    type="number" 
                    value={delayDays}
                    onChange={(e) => setDelayDays(e.target.value)}
                    placeholder="Ex: 30"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                copied ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-black text-white hover:bg-gray-800 hover:shadow-lg'
              } shadow-md`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copiado para o Outlook!' : 'Copiar Texto do E-mail'}
            </button>
          </div>
          
          <div className="bg-blue-50/50 p-3 rounded-lg flex gap-2 items-start text-xs text-blue-700 border border-blue-100">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Este sistema cria a formatação em HTML. Ao colar diretamente na caixa de mensagem do Outlook, a tabela e o texto ficam perfeitos!</p>
          </div>
        </div>

        {/* Lado Direito: Preview do E-mail */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-1">Assunto do E-mail</p>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-gray-900 flex-1">{getSubject()}</p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(getSubject());
                    toast.success('Assunto copiado!');
                  }}
                  className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500 transition-colors"
                  title="Copiar Assunto"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto bg-white flex-1">
              <div 
                className="prose prose-sm max-w-none prose-p:my-2"
                dangerouslySetInnerHTML={{ __html: getBodyHtml() }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
