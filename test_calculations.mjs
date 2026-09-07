// Teste automatizado de validação das fórmulas da KUBIK HOME

function calculatePartYield(part, material) {
  const x = material.length;
  const y = material.width;
  const c = part.length;
  const l = part.width;

  if (c <= 0 || l <= 0 || x <= 0 || y <= 0) return 1;

  const option1 = Math.floor(x / c) * Math.floor(y / l);
  const option2 = Math.floor(x / l) * Math.floor(y / c);

  return Math.max(1, Math.max(option1, option2));
}

function calculateItemSellUnit(item) {
  return (item.costUnit * (1 + (item.marginPercent || 0))) + (item.fixedExtra || 0);
}

function calculateItemSellTotal(item) {
  return item.quantity * calculateItemSellUnit(item);
}

console.log("=== TESTE 1: RENDIMENTO DE CORTE DE CHAPA (ROUNDDOWN) ===");
const matLinho19 = { length: 2500, width: 1830, price: 45.0 };
const partCosta = { length: 1125, width: 1538, qty: 2 };
const yieldVal = calculatePartYield(partCosta, matLinho19);
const usage = partCosta.qty / yieldVal;
const materialCost = usage * matLinho19.price;

console.log(`Rendimento de Peças: ${yieldVal} pçs/chapa (esperado: 2)`);
console.log(`Utilização de Chapas: ${usage.toFixed(2)} chapa (esperado: 1.00)`);
console.log(`Custo do Material: ${materialCost.toFixed(2)} € (esperado: 45.00 €)`);
if (yieldVal === 2 && materialCost === 45.0) {
  console.log("-> TESTE 1 PASSOU COM SUCESSO!\n");
} else {
  console.error("-> TESTE 1 FALHOU!");
  process.exit(1);
}

console.log("=== TESTE 2: ORÇAMENTO 2026-009 (RICARDO ESTRELA - ROUPEIROS) ===");
const item1_1 = { costUnit: 1257.50, marginPercent: 0.60, fixedExtra: 200.0, quantity: 1 };
const item1_2 = { costUnit: 1056.00, marginPercent: 0.60, fixedExtra: 0.0, quantity: 1 };

const sell1_1 = calculateItemSellTotal(item1_1);
const sell1_2 = calculateItemSellTotal(item1_2);
const subtotal009 = sell1_1 + sell1_2;
const totalVat009 = subtotal009 * 1.23;

console.log(`Item 1.1 Closet: ${sell1_1.toFixed(2)} € (esperado: 2212.00 €)`);
console.log(`Item 1.2 Roupeiro: ${sell1_2.toFixed(2)} € (esperado: 1689.60 €)`);
console.log(`Subtotal Proposta: ${subtotal009.toFixed(2)} € (esperado: 3901.60 €)`);
console.log(`Total c/ IVA 23%: ${totalVat009.toFixed(2)} € (esperado: 4798.97 €)`);
if (Math.abs(subtotal009 - 3901.60) < 0.01 && Math.abs(totalVat009 - 4798.97) < 0.01) {
  console.log("-> TESTE 2 PASSOU COM SUCESSO!\n");
} else {
  console.error("-> TESTE 2 FALHOU!");
  process.exit(1);
}

console.log("=== TESTE 3: ORÇAMENTO 2026-171 (NOW XXI - RESIDÊNCIA DA BOAVISTA) ===");
const items171 = [
  { costUnit: 2870.00, marginPercent: 0.70, fixedExtra: 500.0, quantity: 1 }, // Balcão
  { costUnit: 1800.00, marginPercent: 0.70, fixedExtra: 0.0, quantity: 1 },   // Bancada mármore
  { costUnit: 125.00, marginPercent: 0.40, fixedExtra: 0.0, quantity: 1 },    // Lava-louça
  { costUnit: 150.00, marginPercent: 0.40, fixedExtra: 0.0, quantity: 1 }     // Misturadora
];

let subtotal171 = 0;
for (const it of items171) {
  subtotal171 += calculateItemSellTotal(it);
}
const totalVat171 = subtotal171 * 1.23;

console.log(`Subtotal Proposta: ${subtotal171.toFixed(2)} € (esperado: 8824.00 €)`);
console.log(`Total c/ IVA 23%: ${totalVat171.toFixed(2)} € (esperado: 10853.52 €)`);
if (Math.abs(subtotal171 - 8824.00) < 0.01 && Math.abs(totalVat171 - 10853.52) < 0.01) {
  console.log("-> TESTE 3 PASSOU COM SUCESSO!\n");
} else {
  console.error("-> TESTE 3 FALHOU!");
  process.exit(1);
}

console.log("TODAS AS VALIDAÇÕES MATEMÁTICAS CORRESPONDEM A 100% DAS FOLHAS EXCEL DA KUBIK HOME!");
