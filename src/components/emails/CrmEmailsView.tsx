'use client';

import React, { useState, useMemo } from 'react';
import { Mail, Copy, Check, FileText, Settings, User } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';

export default function CrmEmailsView() {
  const { companyInfo } = useApp();

  const [templateType, setTemplateType] = useState('1_rececao');

  // Form Fields
  const [clientName, setClientName] = useState('');
  const [reference, setReference] = useState('');
  const [quoteNum, setQuoteNum] = useState('');
  const [quoteValue, setQuoteValue] = useState('');
  const [deadline, setDeadline] = useState('30 a 45 dias úteis');
  const [conditions, setConditions] = useState('50% adjudicação, 40% montagem, 10% conclusão');
  const [validity, setValidity] = useState('30 dias');
  const [inclusions, setInclusions] = useState('transporte e montagem');
  const [exclusions, setExclusions] = useState('eletrodomésticos, pichelaria e eletricidade');
  const [responseDate, setResponseDate] = useState('brevemente');
  const [sendDate, setSendDate] = useState('alguns dias');
  
  // Responsible Person
  const [respName, setRespName] = useState('A Equipa');
  const [respPhone, setRespPhone] = useState(companyInfo.phone || '');
  const [respEmail, setRespEmail] = useState('geral@kubikhome.com');

  const [copied, setCopied] = useState(false);

  const getSubject = () => {
    switch (templateType) {
      case '1_rececao': return `Receção do seu pedido de orçamento — ${reference || '[Obra/Referência]'}`;
      case '2_envio': return `Orçamento n.º ${quoteNum || '[N.º]'} — ${reference || '[Obra/Referência]'}`;
      case '3_followup1': return `Seguimento do orçamento n.º ${quoteNum || '[N.º]'} — ${reference || '[Obra/Referência]'}`;
      case '4_followup2': return `Orçamento n.º ${quoteNum || '[N.º]'} — disponíveis para esclarecimentos`;
      case '5_followup3': return `Orçamento n.º ${quoteNum || '[N.º]'} — validade a terminar`;
      case '6_adjudicada': return `Confirmação de adjudicação — orçamento n.º ${quoteNum || '[N.º]'}`;
      case '7_recusada': return `Orçamento n.º ${quoteNum || '[N.º]'} — agradecimento`;
      default: return '';
    }
  };

  const generateEmailHtml = () => {
    let body = '';
    const cn = clientName || '[Nome do Cliente]';
    const ref = reference || '[Obra/Referência]';
    const qn = quoteNum || '[N.º Orçamento]';

    switch (templateType) {
      case '1_rececao':
        body = `<p>Exmo(a). Senhor(a) ${cn},</p>
<p>Agradecemos o seu pedido de orçamento para ${ref}.</p>
<p>Confirmamos a receção de toda a informação enviada e informamos que a nossa proposta será remetida até ${responseDate || '[Data de resposta]'}. Caso seja necessário algum esclarecimento adicional ou uma visita ao local, entraremos em contacto entretanto.</p>
<p>Ficamos ao seu inteiro dispor.</p>`;
        break;
      case '2_envio':
        body = `<p>Exmo(a). Senhor(a) ${cn},</p>
<p>Conforme solicitado, enviamos em anexo o orçamento n.º ${qn} referente a ${ref}.</p>
<p><strong>Resumo da proposta:</strong><br>
· Âmbito: Fornecimento e montagem de carpintarias<br>
· Valor total: ${quoteValue || '[Valor]'} € + IVA à taxa legal<br>
· Prazo de execução: ${deadline || '[Prazo]'} após confirmação e validação de medidas<br>
· Condições de pagamento: ${conditions || '[Condições]'}<br>
· Validade da proposta: ${validity || '[Validade]'}</p>
<p>A proposta inclui ${inclusions || '[Inclusões]'} e exclui ${exclusions || '[Exclusões]'}.</p>
<p>Ficamos disponíveis para apresentar a proposta pessoalmente ou para ajustar soluções, materiais e acabamentos.</p>
<p>Agradecemos desde já a atenção dispensada.</p>`;
        break;
      case '3_followup1':
        body = `<p>Exmo(a). Senhor(a) ${cn},</p>
<p>Esperamos que se encontre bem.</p>
<p>Enviámos no passado dia ${sendDate || '[Data de envio]'} o orçamento n.º ${qn} relativo a ${ref} e gostaríamos de confirmar que o recebeu sem problemas.</p>
<p>Caso pretenda, podemos esclarecer qualquer ponto da proposta ou analisar alternativas de materiais e acabamentos.</p>
<p>Ficamos a aguardar o seu contacto.</p>`;
        break;
      case '4_followup2':
        body = `<p>Exmo(a). Senhor(a) ${cn},</p>
<p>Voltamos ao contacto a propósito do orçamento n.º ${qn} para ${ref}.</p>
<p>Sabemos que uma decisão desta natureza exige análise, pelo que ficamos ao dispor para ajustar o âmbito dos trabalhos, apresentar alternativas de materiais ou rever prazos e faseamento da obra.</p>
<p>Recordamos que a proposta é válida até ${validity || '[Validade]'} e que o prazo de execução depende da carteira de encomendas no momento da confirmação.</p>
<p>Agradecemos uma breve indicação sobre o estado da sua decisão.</p>`;
        break;
      case '5_followup3':
        body = `<p>Exmo(a). Senhor(a) ${cn},</p>
<p>Informamos que a validade do orçamento n.º ${qn}, referente a ${ref}, termina a ${validity || '[Validade]'}.</p>
<p>Caso mantenha interesse, agradecemos que nos comunique até essa data para garantirmos as condições e o prazo apresentados. Se o projeto tiver sido adiado ou seguido outro caminho, agradecemos igualmente que nos informe — ficamos com o seu contacto para futuras oportunidades.</p>
<p>Obrigado pela confiança e disponibilidade.</p>`;
        break;
      case '6_adjudicada':
        body = `<p>Exmo(a). Senhor(a) ${cn},</p>
<p>Agradecemos a confirmação do orçamento n.º ${qn} para ${ref}.</p>
<p><strong>Próximos passos:</strong><br>
1. Confirmação final de materiais e acabamentos;<br>
2. Retificação de medidas no local;<br>
3. Entrada em produção, com prazo de execução de ${deadline || '[Prazo]'};<br>
4. Agendamento da montagem com antecedência.</p>
<p>O seu contacto na KUBIK para esta obra será ${respName || '[Nome]'} (${respPhone} · ${respEmail}).</p>
<p>Agradecemos a confiança depositada nos nossos serviços.</p>`;
        break;
      case '7_recusada':
        body = `<p>Exmo(a). Senhor(a) ${cn},</p>
<p>Agradecemos a oportunidade de apresentar a nossa proposta para ${ref}.</p>
<p>Tendo tomado conhecimento de que a decisão seguiu outro caminho, agradecíamos, se possível, uma breve indicação do motivo (preço, prazo, solução técnica ou outro). Essa informação é importante para continuarmos a melhorar as nossas propostas.</p>
<p>Mantemo-nos ao dispor para futuros projetos.</p>`;
        break;
    }

    const signature = `<p>Com os melhores cumprimentos,<br>
<br>
<strong>${respName || '[Nome]'}</strong><br>
KUBIK HOME<br>
${respPhone} · ${respEmail}<br>
${companyInfo.website || 'www.kubikhome.com'}</p>`;

    return `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6;">
      ${body}
      <br>
      ${signature}
    </div>`;
  };

  const handleCopy = async () => {
    try {
      const htmlContent = generateEmailHtml();
      
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
        'text/plain': new Blob([htmlContent.replace(/<[^>]+>/g, '')], { type: 'text/plain' })
      });
      
      await navigator.clipboard.write([clipboardItem]);
      setCopied(true);
      toast.success('Email copiado para a área de transferência com sucesso!');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error('Erro ao copiar. Tente selecionar o texto manualmente.');
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Esquerda: Configurações */}
      <div className="w-[450px] bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-140px)]">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Configurar Email CRM
          </h2>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Momento (Template)</label>
            <select 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value)}
            >
              <option value="1_rececao">1. Acusar receção do pedido (24h)</option>
              <option value="2_envio">2. Envio do orçamento</option>
              <option value="3_followup1">3. Follow-up 1 (3.º dia útil)</option>
              <option value="4_followup2">4. Follow-up 2 (8.º dia)</option>
              <option value="5_followup3">5. Follow-up 3 e último (15.º dia)</option>
              <option value="6_adjudicada">6. Proposta adjudicada</option>
              <option value="7_recusada">7. Proposta não adjudicada</option>
            </select>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Nome do Cliente</label>
              <input 
                type="text" 
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                placeholder="Ex: João Garcia"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Obra / Referência</label>
              <input 
                type="text" 
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                placeholder="Ex: Cozinha Moradia Faro"
              />
            </div>

            {templateType !== '1_rececao' && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">N.º Orçamento</label>
                <input 
                  type="text" 
                  value={quoteNum}
                  onChange={(e) => setQuoteNum(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  placeholder="Ex: 2026-001"
                />
              </div>
            )}

            {templateType === '2_envio' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Valor Total (€)</label>
                    <input 
                      type="text" 
                      value={quoteValue}
                      onChange={(e) => setQuoteValue(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Validade</label>
                    <input 
                      type="text" 
                      value={validity}
                      onChange={(e) => setValidity(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Prazo de Execução</label>
                  <input 
                    type="text" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Condições</label>
                  <input 
                    type="text" 
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Inclui</label>
                  <input 
                    type="text" 
                    value={inclusions}
                    onChange={(e) => setInclusions(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Não Inclui (Exclusões)</label>
                  <input 
                    type="text" 
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </>
            )}

            {templateType === '1_rececao' && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Data de Resposta (Prometida)</label>
                <input 
                  type="text" 
                  value={responseDate}
                  onChange={(e) => setResponseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                />
              </div>
            )}

            {templateType === '3_followup1' && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Data de Envio do Orçamento</label>
                <input 
                  type="text" 
                  value={sendDate}
                  onChange={(e) => setSendDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                />
              </div>
            )}

            {(templateType === '4_followup2' || templateType === '5_followup3') && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Validade do Orçamento</label>
                <input 
                  type="text" 
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                />
              </div>
            )}
            
            {templateType === '6_adjudicada' && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Prazo de Execução (Semanas/Dias)</label>
                <input 
                  type="text" 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                />
              </div>
            )}

            {/* Signature Area */}
            <div className="pt-4 mt-4 border-t border-gray-100">
               <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">A Minha Assinatura</label>
               <div className="space-y-3">
                 <input 
                  type="text" 
                  value={respName}
                  onChange={(e) => setRespName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  placeholder="O Teu Nome"
                 />
                 <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      value={respPhone}
                      onChange={(e) => setRespPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                      placeholder="Telemóvel"
                    />
                    <input 
                      type="text" 
                      value={respEmail}
                      onChange={(e) => setRespEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                      placeholder="Email"
                    />
                 </div>
               </div>
            </div>

          </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50/50">
          <button 
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-medium transition-all shadow-sm ${
              copied ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copiado para a área de transferência!' : 'Copiar Email Formatado'}
          </button>
        </div>
      </div>

      {/* Direita: Preview do Email */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-140px)]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 leading-tight">Pré-visualização</h3>
              <p className="text-xs text-gray-500">O que o cliente vai receber</p>
            </div>
          </div>
        </div>

        <div className="p-8 flex-1 overflow-y-auto bg-gray-50/30">
          <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Subject Line */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex gap-4">
                <span className="text-sm font-semibold text-gray-500 w-16">Assunto:</span>
                <span className="text-sm font-bold text-gray-900">{getSubject()}</span>
              </div>
            </div>
            
            {/* Body */}
            <div 
              className="px-6 py-8"
              dangerouslySetInnerHTML={{ __html: generateEmailHtml() }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
