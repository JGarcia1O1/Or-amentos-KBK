import React from 'react';
import { CompanyInfo } from '@/types';

export default function ConditionsLivePreview({ companyInfo }: { companyInfo: CompanyInfo }) {
  return (
    <div className="sticky top-6 flex flex-col items-center">
      <div className="mb-3 w-full flex items-center justify-between">
        <h3 className="font-bold text-sm text-gray-900">Live Preview (A4)</h3>
        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
          WYSIWYG
        </span>
      </div>

      {/* Papel A4 Escalonado */}
      <div 
        className="bg-white shadow-xl border border-gray-200 rounded-sm overflow-hidden"
        style={{
          width: '100%',
          aspectRatio: '1 / 1.414', // Proporção A4 exata
          containerType: 'inline-size',
        }}
      >
        {/* Usamos container queries (@cq) para escalar a tipografia se necessário, 
            mas o ideal é usar scale puro ou font-size base em cqw.
            Para manter fidelidade total, aplicamos a font real e um scale no parent
        */}
        <div 
          className="w-full h-full p-[8cqw] overflow-y-auto custom-scrollbar"
        >
          {/* CÓDIGO HTML EXATO DO PDF */}
          <div className="space-y-[2cqw] text-[2cqw] text-gray-700 leading-relaxed font-sans break-words min-w-0">
            <div className="text-center font-bold text-[2.5cqw] uppercase text-gray-900 border-b border-gray-300 pb-[1cqw]">
              CONDIÇÕES GERAIS DE VENDA
            </div>

            <div className="space-y-[1.5cqw] mt-[2cqw]">
              <div>
                <span className="font-bold text-gray-900">
                  Condições de pagamento:
                </span>{' '}
                {companyInfo.paymentTerms || '...'}
                <br />
                <span className="font-mono font-semibold text-gray-900 mt-[0.5cqw] block">
                  IBAN {companyInfo.bank || 'Banco'}: {companyInfo.iban || 'PT50 ...'}
                </span>
                <span className="block mt-[0.5cqw]">
                  {companyInfo.priceRevisionClause || 'Os valores indicados poderão sofrer alterações como consequência da conjuntura mundial...'}
                </span>
              </div>

              <div>
                <span className="font-bold text-gray-900">Prazos de entrega:</span>{' '}
                {companyInfo.deliveryTerms || '...'}
              </div>

              <div>
                <span className="font-bold text-gray-900">
                  Validade do Orçamento:
                </span>{' '}
                Este orçamento tem uma validade de {companyInfo.validityDays || 30}{' '}
                dias a partir da data da sua apresentação. Findo este prazo, o
                orçamento deverá ser revisto pelo nosso Departamento Comercial.
              </div>

              <div>
                <span className="font-bold text-gray-900">
                  Transporte e Montagem:
                </span>{' '}
                {companyInfo.transportTerms || '...'}
              </div>

              <div>
                <span className="font-bold text-gray-900">
                  Reclamações & Reserva de Propriedade:
                </span>{' '}
                {companyInfo.claimsTerms || '...'}
              </div>

              <div>
                <span className="font-bold text-gray-900">Jurisdição:</span>{' '}
                Para eventual situação de litígio decorrente do presente
                contrato de fornecimento, é exclusivamente competente o{' '}
                {companyInfo.court || 'Tribunal...'}.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
