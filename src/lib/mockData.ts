import { Client, Material, Workstation, Quote, Hardware } from '@/types';

export const COMPANY_INFO = {
  name: 'KUBIK HOME & LIFE FURNITURE',
  legalName: 'KUBIK HOME Lda',
  nif: '519021916',
  address: 'Zona Industrial do Tortosendo, Rua E, Lote 41',
  postalCode: '6200-823 Tortosendo - PORTUGAL',
  phone: '275 957 250',
  website: 'www.kubikhome.com',
  iban: 'PT50 0269 0343 0020 5777 6028 3',
  bank: 'Bankinter',
  court: 'Tribunal da comarca da Covilhã, PORTUGAL',
  paymentTerms: '50% na adjudicação, restantes 50% com finalização dos trabalhos.',
  validityDays: 30,
  deliveryTerms: 'A ser acordado após adjudicação formal.',
  transportTerms: 'O transporte é por nossa conta e risco quando assim acordado com o cliente. As montagens serão efetuadas de acordo com as boas práticas e diretrizes dos fabricantes.',
  claimsTerms: 'As reclamações deverão ser apresentadas num período de 5 dias após a data de entrega. A venda com pagamento diferido é realizada sob reserva de propriedade até ao pagamento integral do valor faturado.',
  priceRevisionClause: 'Os valores indicados poderão sofrer alterações como consequência da conjuntura mundial, pelo que poderá haver revisão de preços antes da execução da obra.',
  jurisdictionTerms: 'Para eventual situação de litígio decorrente do presente contrato de fornecimento, é exclusivamente competente o Tribunal da comarca da Covilhã, PORTUGAL.',
};

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'client-1',
    name: 'Ricardo Estrela',
    nif: '',
    address: 'Tortosendo',
    email: 'ricardo.estrela@email.pt',
    phone: '960 000 001',
    notes: 'Moradia Familiar - Roupeiros e Closet',
  },
  {
    id: 'client-2',
    name: 'Atelier Vasco Pinho',
    nif: '',
    address: 'Moradia Ruben',
    email: 'atelier.vascopinho@email.pt',
    phone: '960 000 002',
    notes: 'Portas de correr em CPL',
  },
  {
    id: 'client-3',
    name: 'Luisa Pimentel',
    nif: '',
    address: 'Covilhã',
    email: 'luisa.pimentel@email.pt',
    phone: '960 000 003',
    notes: 'Lambrim MDF e Portas CPL',
  },
  {
    id: 'client-4',
    name: 'Now Xxi - Engenharia & Construções, S.A',
    nif: '514288256',
    address: 'Rua Poeta Bocage, 13 C 1600-581 Lisboa',
    email: 'geral@nowxxi.pt',
    phone: '210 000 004',
    notes: 'Residência da Boavista - Balcão copa e bancada mármore',
  },
];

export const INITIAL_MATERIALS: Material[] = [];

export const INITIAL_HARDWARE: Hardware[] = [
  { code: '524314', name: 'Guia Lego Superior Roupeiro', unit: 'metro', price: 8.29 },
  { code: '524315', name: 'Guia Lego Inferior Roupeiro', unit: 'metro', price: 6.74 },
  { code: '524317', name: 'Carro Inferior Metálico Roupeiro', unit: 'un', price: 1.59 },
  { code: '524318', name: 'Carro Lego Superior Roupeiro', unit: 'un', price: 1.60 },
  { code: '524316', name: 'Fixador Lego Central', unit: 'un', price: 0.57 },
  { code: '524313', name: 'Perfil Puxador Lego TR19', unit: 'metro', price: 4.87 },
  { code: '524966', name: 'Puxador de Móvel', unit: 'un', price: 2.30 },
  { code: '524970', name: 'Pés Niveladores de Bancada', unit: 'un', price: 0.30 },
  { code: '524971', name: 'Dobradiça com Amortecedor Suave', unit: 'un', price: 1.50 },
  { code: '524972', name: 'Corrediça Oculta com Fecho Suave', unit: 'par', price: 15.00 },
  { code: '524973', name: 'Varão de Roupeiro Oval com Suportes', unit: 'metro', price: 1.50 },
  { code: '524974', name: 'Fita LED com Perfil e Transformador', unit: 'conjunto', price: 150.00 },
  { code: '524975', name: 'Orla PVC 1mm (Todas as cores)', unit: 'metro', price: 0.70 },
];

export const INITIAL_EDGES: import('@/types').EdgeMaterial[] = [
  { code: 'ORL-001', name: 'Orla PVC 1mm Branca', pricePerMeter: 0.70 },
  { code: 'ORL-002', name: 'Orla PVC 1mm Carvalho', pricePerMeter: 0.85 },
  { code: 'ORL-003', name: 'Orla Madeira Natural', pricePerMeter: 1.50 },
];

export const INITIAL_WORKSTATIONS: Workstation[] = [
  { code: 'SH', name: 'Seccionadora (Corte)', rate: 35.0 },
  { code: 'CNC', name: 'Centro Maquinação CNC', rate: 18.09 },
  { code: 'ORLADORA', name: 'Orladora (Colagem)', rate: 25.0 },
  { code: 'MANUAL', name: 'Montagem Bancada', rate: 25.0 },
];

export const INITIAL_QUOTES: Quote[] = [
  {
    id: 'q-009',
    number: '2026-009',
    clientName: 'Ricardo Estrela',
    clientNif: '',
    clientAddress: 'Tortosendo',
    date: '07/01/2026',
    responsible: 'Departamento Comercial',
    projectName: 'Moradia Familiar',
    status: 'Apresentado',
    chapters: [
      {
        id: 1,
        title: 'Roupeiros',
        items: [
          {
            id: '1.1',
            code: '1.1',
            designation:
              'Closet (2359+1733)x2725mm l Interior em Linho Cancun l 5 Gavetas l Varões l Porta Joias com tampo em vidro',
            unit: 'un',
            quantity: 1,
            costUnit: 1257.5,
            marginPercent: 0.6,
            fixedExtra: 200.0,
          },
          {
            id: '1.2',
            code: '2.2',
            designation:
              'Roupeiro assutado 5512x1200mm em melamina Branca e portas lacadas a Branco',
            unit: 'un',
            quantity: 1,
            costUnit: 1056.0,
            marginPercent: 0.6,
            fixedExtra: 0.0,
          },
        ],
      },
    ],
  },
  {
    id: 'q-056',
    number: '2026-056',
    clientName: 'Atelier Vasco Pinho',
    clientNif: '',
    clientAddress: 'Moradia Ruben',
    date: '02/03/2026',
    responsible: 'Departamento Comercial',
    projectName: 'Moradia Ruben',
    status: 'Adjudicado',
    chapters: [
      {
        id: 1,
        title: 'Portas',
        items: [
          {
            id: '1.1',
            code: '1.1',
            designation: 'Porta de correr CPL Branca 2000x900mm',
            unit: 'un',
            quantity: 4,
            costUnit: 180.0,
            marginPercent: 0.4,
            fixedExtra: 50.0,
          },
          {
            id: '1.2',
            code: '1.2',
            designation: 'Porta em CPL Branca 2000x800mm',
            unit: 'un',
            quantity: 4,
            costUnit: 180.0,
            marginPercent: 0.4,
            fixedExtra: 50.0,
          },
        ],
      },
    ],
  },
  {
    id: 'q-158',
    number: '2026-158',
    clientName: 'Luisa Pimentel',
    clientNif: '',
    clientAddress: 'Covilhã',
    date: '15/06/2026',
    responsible: 'Departamento Comercial',
    projectName: '',
    status: 'Apresentado',
    chapters: [
      {
        id: 1,
        title: 'Mob Diverso',
        items: [
          {
            id: '1.1',
            code: '1.1',
            designation: 'Lambrim em MDF e Moldura 5370x980mm',
            unit: 'un',
            quantity: 1,
            costUnit: 473.63,
            marginPercent: 0.6,
            fixedExtra: 250.0,
          },
        ],
      },
      {
        id: 2,
        title: 'Portas',
        items: [
          {
            id: '2.1',
            code: '2.1',
            designation: 'Porta de correr 2000x820x17mm CPL Branco',
            unit: 'un',
            quantity: 1,
            costUnit: 220.0,
            marginPercent: 0.6,
            fixedExtra: 50.0,
          },
          {
            id: '2.2',
            code: '2.2',
            designation: 'Porta de correr 2000x700x150mm CPL Branco',
            unit: 'un',
            quantity: 1,
            costUnit: 220.0,
            marginPercent: 0.6,
            fixedExtra: 50.0,
          },
        ],
      },
    ],
  },
  {
    id: 'q-171',
    number: '2026-171',
    clientName: 'Now Xxi - Engenharia & Construções, S.A',
    clientNif: '514288256',
    clientAddress: 'Rua Poeta Bocage, 13 C 1600-581 Lisboa',
    date: '24/06/2026',
    responsible: 'Departamento Comercial',
    projectName: 'Residência da Boavista',
    status: 'Adjudicado',
    chapters: [
      {
        id: 1,
        title: 'Mob. Diverso',
        items: [
          {
            id: '1.1',
            code: '1.1',
            designation:
              'Balcão copa em Termolaminado Branco Brilho e Melamina Preta l Interior em aglomerado revestido a melamina cinza l 2 gavetas l 1 gavetão',
            unit: 'un',
            quantity: 1,
            costUnit: 2870.0,
            marginPercent: 0.7,
            fixedExtra: 500.0,
          },
          {
            id: '1.2',
            code: '1.2',
            designation: 'Bancada em Merino Marquina Marble',
            unit: 'un',
            quantity: 1,
            costUnit: 1800.0,
            marginPercent: 0.7,
            fixedExtra: 0.0,
          },
          {
            id: '1.3',
            code: '1.3',
            designation: 'Lava-louça Rodi Inox',
            unit: 'un',
            quantity: 1,
            costUnit: 125.0,
            marginPercent: 0.4,
            fixedExtra: 0.0,
          },
          {
            id: '1.4',
            code: '1.4',
            designation: 'Misturadora Rodi Line MN807',
            unit: 'un',
            quantity: 1,
            costUnit: 150.0,
            marginPercent: 0.4,
            fixedExtra: 0.0,
          },
        ],
      },
    ],
  },
];
