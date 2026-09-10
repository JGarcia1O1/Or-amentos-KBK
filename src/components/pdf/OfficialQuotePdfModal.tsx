'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  formatCurrency,
  calculateItemSellUnit,
  calculateItemSellTotal,
  calculateQuoteSubtotal,
  calculateQuoteTotalWithVat,
} from '@/lib/calculator';
import { FileCheck, Printer, X } from 'lucide-react';

export default function OfficialQuotePdfModal() {
  const { pdfQuote, showPdfModal, closePdfPreview, companyInfo } = useApp();

  if (!showPdfModal || !pdfQuote) return null;

  const quote = pdfQuote;
  const activeChapters = quote.chapters.filter(ch => ch.items.length > 0);
  const subtotal = calculateQuoteSubtotal(quote);
  const totalWithVat = calculateQuoteTotalWithVat(quote);

  const handlePrint = () => {
    // Definir nome do ficheiro PDF (O browser usa o document.title como nome padrão no Guardar como PDF)
    const originalTitle = document.title;
    
    // Extrair primeiro e último nome do cliente
    const nameParts = quote.clientName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const displayName = lastName ? `${firstName} ${lastName}` : firstName;
    
    document.title = `KUBIK Orçamento ${quote.number} (${displayName})`;
    
    window.print();
    
    // Restaurar título original após imprimir/guardar
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 flex flex-col overflow-hidden max-h-[95vh]">
        {/* Barra de Ações Superior do Modal (não aparece na impressão) */}
        <div className="p-3.5 bg-gray-900 text-white flex items-center justify-between no-print flex-shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">
              Pré-visualização da Proposta Oficial KUBIK HOME — {quote.number}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar em PDF</span>
            </button>
            <button
              type="button"
              onClick={closePdfPreview}
              className="text-gray-400 hover:text-white p-1 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DOCUMENTO IMPRIMÍVEL (Página 1 + Quebra de Página + Página 2) */}
        <div
          id="pdf-printable-area"
          className="px-8 bg-white overflow-y-auto space-y-12 font-sans text-xs text-gray-900 leading-normal"
        >
          {/* ============================================================ */}
          {/* TABELA MESTRA PARA REPETIÇÃO DE CABEÇALHOS                   */}
          {/* ============================================================ */}
          <table className="w-full">
            <thead className="w-full table-header-group">
              <tr>
                <td className="pb-10" style={{ paddingTop: '15mm' }}>
                  {/* Cabeçalho com Logótipo e Título da Cotação (Repete em todas as páginas) */}
                  <div className="flex items-start justify-between border-b border-gray-300 pb-6">
                    <div>
                      {/* Imagem do Logótipo Oficial */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/logo_kubik.png"
                        alt="KUBIK HOME"
                        className="h-14 object-contain"
                      />
                    </div>

                    <div className="text-right">
                      <h1 className="text-base font-extrabold text-gray-900 tracking-wider">
                        COTAÇÃO DE PROJETO
                      </h1>
                      <div className="mt-1 text-xs font-bold text-gray-800 font-mono">
                        Orçamento: {quote.number}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Data: {quote.date}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Responsável: {quote.responsible}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </thead>
            <tbody className="w-full">
              <tr>
                <td>
                  <div className="space-y-6">
                    {/* Caixa de Dados do Cliente */}
            <div className="border border-gray-300 rounded p-3 text-[11px] space-y-1 bg-gray-50/50">
              <div className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">
                Dados do Cliente
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold">Nome:</span> {quote.clientName}
                </div>
                {quote.clientNif && (
                  <div>
                    <span className="font-bold">NIF:</span>{' '}
                    {quote.clientNif}
                  </div>
                )}
                {quote.clientPhone && (
                  <div>
                    <span className="font-bold">Telemóvel:</span>{' '}
                    {quote.clientPhone}
                  </div>
                )}
                {quote.clientEmail && (
                  <div>
                    <span className="font-bold">Email:</span>{' '}
                    {quote.clientEmail}
                  </div>
                )}
                {quote.clientAddress && (
                  <div className="col-span-2">
                    <span className="font-bold">Morada:</span>{' '}
                    {quote.clientAddress}
                    {(quote.clientPostalCode || quote.clientCity) && (
                      <div>
                        <span className="font-bold opacity-0">Morada:</span>{' '}
                        {quote.clientPostalCode ? `${quote.clientPostalCode} ` : ''}{quote.clientCity || ''}
                      </div>
                    )}
                  </div>
                )}
                {quote.projectName && (
                  <div className="col-span-2 text-blue-900 font-semibold">
                    <span className="font-bold">Projeto / Obra:</span>{' '}
                    {quote.projectName}
                  </div>
                )}
              </div>
            </div>

            {/* ============================================================ */}
            {/* Tabela de Artigos Comerciais (Capítulos Independentes)       */}
            {/* ============================================================ */}
            <div className="mt-8">
              {/* Fake Table Header (Separado dos Capítulos) */}
              <table className="w-full text-left text-xs border-collapse mb-1">
                <colgroup>
                  <col className="w-10" />
                  <col />
                  <col className="w-10" />
                  <col className="w-12" />
                  <col className="w-24" />
                  <col className="w-28" />
                </colgroup>
                <thead>
                  <tr className="text-gray-400 font-bold text-[9px] uppercase border-y border-gray-200">
                    <th className="py-3 px-2 text-center">Art.</th>
                    <th className="py-3 px-3">Designação Técnica</th>
                    <th className="py-3 px-2 text-center">Un.</th>
                    <th className="py-3 px-2 text-center">Qtd</th>
                    <th className="py-3 px-3 text-right">Preço Unit.</th>
                    <th className="py-3 px-3 text-right">Preço Total</th>
                  </tr>
                </thead>
              </table>

              {/* Capítulos Independentes */}
              <div className="space-y-10">
                {activeChapters.map((chap, chapIdx) => {
                  const chapterSubtotal = chap.items.reduce((sum, item) => sum + calculateItemSellTotal(item), 0);

                  return (
                    <table key={chap.id} className="w-full text-left text-xs border-collapse break-inside-avoid">
                      <colgroup>
                        <col className="w-10" />
                        <col />
                        <col className="w-10" />
                        <col className="w-12" />
                        <col className="w-24" />
                        <col className="w-28" />
                      </colgroup>
                      <tbody>
                        {/* Título do Capítulo */}
                        <tr>
                          <td className="pt-4 pb-2 px-2 text-center font-extrabold text-gray-900 text-[13px]">
                            {chapIdx + 1}
                          </td>
                          <td colSpan={5} className="pt-4 pb-2 px-3 uppercase tracking-wider text-[13px] font-extrabold text-gray-900">
                            {chap.title}
                          </td>
                        </tr>

                        {/* Linhas dos Artigos (Minimalistas) */}
                        {chap.items.map((item, itemIdx) => {
                          const sellUnit = calculateItemSellUnit(item);
                          const sellTotal = calculateItemSellTotal(item);
                          const pdfCode = `${chapIdx + 1}.${itemIdx + 1}`;

                          return (
                            <tr key={item.id} className="align-top bg-white border-b border-gray-100 last-of-type:border-b-0">
                              <td className="py-3 px-2 text-center font-mono text-[10px] text-gray-500">
                                {pdfCode}
                              </td>
                              <td className="py-3 px-3 text-[11px] whitespace-pre-line break-words text-gray-800 font-medium">
                                {item.designation}
                              </td>
                              <td className="py-3 px-2 text-center text-[10px] text-gray-400">
                                {item.unit}
                              </td>
                              <td className="py-3 px-2 text-center font-bold text-gray-800">
                                {item.quantity}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-gray-600">
                                {formatCurrency(sellUnit)}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                                {formatCurrency(sellTotal)}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Subtotal do Capítulo */}
                        <tr>
                          <td colSpan={5} className="pt-4 pb-2 px-3 text-right text-gray-500 text-[10px] font-medium border-t border-gray-100">
                            Subtotal {chap.title}
                          </td>
                          <td className="pt-4 pb-2 px-3 text-right font-mono font-bold text-gray-900 text-[11px] border-t border-gray-100">
                            {formatCurrency(chapterSubtotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  );
                })}
              </div>
            </div>

            {/* Secção Final: Observações + Totais */}
              <div className="flex justify-between items-end pt-8 pb-4 break-inside-avoid gap-8">
                {/* Observações da Obra / Faturação */}
                <div className="flex-1 min-w-0 w-0 text-[11px] text-gray-700">
                  {quote.notes && (
                    <div className="bg-gray-50/50 p-4 border-l-2 border-gray-300 rounded-r-lg mt-4">
                      <div className="font-bold text-gray-900 mb-2 uppercase text-[9px] tracking-wider">Observações / Dados de Faturação:</div>
                      <div className="whitespace-pre-line break-all leading-relaxed">{quote.notes}</div>
                    </div>
                  )}
                </div>

              {/* Bloco de Totais Final (Minimalista) */}
              <div className="w-80 space-y-3 text-right text-[11px] shrink-0">
                <div className="border-t border-gray-200 pt-4 flex justify-between text-gray-600 font-medium">
                  <span>Sub-Total</span>
                  <span className="font-mono text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Valor Final da Proposta</span>
                  <span className="font-mono text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-2 flex justify-between text-gray-900 font-bold text-[13px]">
                  <span>Total com IVA (23%)</span>
                  <span className="font-mono">{formatCurrency(totalWithVat)}</span>
                </div>
              </div>
            </div>
            
                  </div>
                </td>
              </tr>
            </tbody>

            {/* ============================================================ */}
            {/* PÁGINA FINAL: CONDIÇÕES GERAIS DE VENDA                      */}
            {/* ============================================================ */}
            <tbody className="w-full page-break">
              <tr>
                <td className="pt-8">
                  <div className="space-y-4 text-[10px] text-gray-700 leading-relaxed">
                    <div className="text-center font-bold text-xs uppercase text-gray-900 border-b border-gray-300 pb-2">
              CONDIÇÕES GERAIS DE VENDA
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <span className="font-bold text-gray-900">
                  Condições de pagamento:
                </span>{' '}
                {companyInfo.paymentTerms}
                <br />
                <span className="font-mono font-semibold text-gray-900">
                  IBAN {companyInfo.bank}: {companyInfo.iban}
                </span>
                <br />
                {companyInfo.priceRevisionClause || 'Os valores indicados poderão sofrer alterações como consequência da conjuntura mundial, pelo que poderá haver revisão de preços antes da execução da obra.'}
              </div>

              <div>
                <span className="font-bold text-gray-900">Prazos de entrega:</span>{' '}
                {companyInfo.deliveryTerms || 'A ser acordado após adjudicação formal.'}
              </div>

              <div>
                <span className="font-bold text-gray-900">
                  Validade do Orçamento:
                </span>{' '}
                Este orçamento tem uma validade de {companyInfo.validityDays}{' '}
                dias a partir da data da sua apresentação. Findo este prazo, o
                orçamento deverá ser revisto pelo nosso Departamento Comercial.
              </div>

              <div>
                <span className="font-bold text-gray-900">
                  Transporte e Montagem:
                </span>{' '}
                {companyInfo.transportTerms || 'O transporte é por nossa conta e risco quando assim acordado com o cliente. As montagens serão efetuadas de acordo com as boas práticas e diretrizes dos fabricantes.'}
              </div>

              <div>
                <span className="font-bold text-gray-900">
                  Reclamações & Reserva de Propriedade:
                </span>{' '}
                {companyInfo.claimsTerms || 'As reclamações deverão ser apresentadas num período de 5 dias após a data de entrega. A venda com pagamento diferido é realizada sob reserva de propriedade até ao pagamento integral do valor faturado.'}
              </div>

              <div>
                <span className="font-bold text-gray-900">Jurisdição:</span>{' '}
                {companyInfo.jurisdictionTerms || `Para eventual situação de litígio decorrente do presente contrato de fornecimento, é exclusivamente competente o ${companyInfo.court}.`}
              </div>
            </div>

            {/* Campos de Assinatura */}
            <div className="pt-14 grid grid-cols-3 gap-8 text-center text-[10px]">
              <div className="border-t border-gray-400 pt-2 font-semibold text-gray-800">
                Departamento Comercial
              </div>
              <div className="border-t border-gray-400 pt-2 font-semibold text-gray-800">
                Gerência
              </div>
              <div className="border-t border-gray-400 pt-2 font-semibold text-gray-800">
                Cliente (Orçamento Aceite)
              </div>
            </div>
            </div>

            {/* Rodapé Final - Apenas Última Página */}
            <div className="pt-16 pb-4 flex justify-start">
               <div className="border border-gray-300 rounded-lg p-4 bg-gray-50/50 text-[10px] text-gray-500 max-w-sm">
                  <div className="font-bold text-gray-800 uppercase tracking-wider mb-2 text-xs">
                    KUBIK HOME
                  </div>
                  <div className="leading-relaxed">
                    <div>{companyInfo.address}</div>
                    <div>{companyInfo.postalCode}</div>
                    <div className="mt-1">
                      <span className="font-semibold text-gray-700">NIF:</span> {companyInfo.nif}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">TELEF:</span> {companyInfo.phone}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Web:</span> {companyInfo.website}
                    </div>
                  </div>
               </div>
            </div>

                </td>
              </tr>
            </tbody>

            {/* Rodapé Invisível para garantir margem inferior em todas as páginas */}
            <tfoot className="table-footer-group">
              <tr>
                <td style={{ paddingBottom: '15mm' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
