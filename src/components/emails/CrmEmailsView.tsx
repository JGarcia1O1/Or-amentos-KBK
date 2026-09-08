'use client';

import React, { useState } from 'react';
import { Mail, Copy, Check, FileText } from 'lucide-react';
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

    return `<div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #333333; line-height: 1.6;">
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
      toast.success('E-mail copiado para a área de transferência com sucesso!');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error('Erro ao copiar. Tente selecionar o texto manualmente.');
    }
  };

  return (
    <div className="h-full space-y-6 overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Esquerda: Configurações */}
        <div className="col-span-1 space-y-5 bg-gray-50 p-5 rounded-2xl border border-gray-100">
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase text-gray-700 tracking-wider">Tipo de E-mail</h2>
            <div>
              <select 
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white font-medium"
              >
                <option value="1_rececao">1. Acusar receção do pedido</option>
                <option value="2_envio">2. Envio do orçamento</option>
                <option value="3_followup1">3. Follow-up 1 (3.º dia útil)</option>
                <option value="4_followup2">4. Follow-up 2 (8.º dia)</option>
                <option value="5_followup3">5. Follow-up 3 e último (15.º dia)</option>
                <option value="6_adjudicada">6. Proposta adjudicada</option>
                <option value="7_recusada">7. Proposta não adjudicada</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-4">
            <h2 className="text-sm font-bold uppercase text-gray-700 tracking-wider">Dados do Orçamento</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">Nome do Cliente</label>
                <input 
                  type="text" 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                  placeholder="Ex: João Garcia"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">Obra / Referência</label>
                <input 
                  type="text" 
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                  placeholder="Ex: Cozinha Moradia Faro"
                />
              </div>

              {templateType !== '1_rececao' && (
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1">N.º Orçamento</label>
                  <input 
                    type="text" 
                    value={quoteNum}
                    onChange={(e) => setQuoteNum(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                    placeholder="Ex: 2026-001"
                  />
                </div>
              )}

              {templateType === '2_envio' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 font-medium mb-1">Valor Total (€)</label>
                      <input 
                        type="text" 
                        value={quoteValue}
                        onChange={(e) => setQuoteValue(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 font-medium mb-1">Validade</label>
                      <input 
                        type="text" 
                        value={validity}
                        onChange={(e) => setValidity(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1">Prazo de Execução</label>
                    <input 
                      type="text" 
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1">Condições</label>
                    <input 
                      type="text" 
                      value={conditions}
                      onChange={(e) => setConditions(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1">Inclui</label>
                    <input 
                      type="text" 
                      value={inclusions}
                      onChange={(e) => setInclusions(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1">Não Inclui (Exclusões)</label>
                    <input 
                      type="text" 
                      value={exclusions}
                      onChange={(e) => setExclusions(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </>
              )}

              {templateType === '1_rececao' && (
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1">Data de Resposta (Prometida)</label>
                  <input 
                    type="text" 
                    value={responseDate}
                    onChange={(e) => setResponseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              )}

              {templateType === '3_followup1' && (
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1">Data de Envio do Orçamento</label>
                  <input 
                    type="text" 
                    value={sendDate}
                    onChange={(e) => setSendDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              )}

              {(templateType === '4_followup2' || templateType === '5_followup3') && (
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1">Validade do Orçamento</label>
                  <input 
                    type="text" 
                    value={validity}
                    onChange={(e) => setValidity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              )}
              
              {templateType === '6_adjudicada' && (
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1">Prazo de Execução</label>
                  <input 
                    type="text" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Signature Area */}
          <div className="pt-4 border-t border-gray-200 space-y-4">
             <h2 className="text-sm font-bold uppercase text-gray-700 tracking-wider">A Minha Assinatura</h2>
             <div className="space-y-3">
               <input 
                type="text" 
                value={respName}
                onChange={(e) => setRespName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                placeholder="O Teu Nome"
               />
               <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    value={respPhone}
                    onChange={(e) => setRespPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                    placeholder="Telemóvel"
                  />
                  <input 
                    type="text" 
                    value={respEmail}
                    onChange={(e) => setRespEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                    placeholder="Email"
                  />
               </div>
             </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
                copied 
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copiado!' : 'Copiar E-mail'}
            </button>
          </div>
        </div>

        {/* Direita: Preview do Email */}
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
                className="prose prose-sm max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: generateEmailHtml() }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
