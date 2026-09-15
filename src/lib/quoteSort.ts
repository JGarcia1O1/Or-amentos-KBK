import { Quote } from '@/types';

/**
 * Ordenação oficial das listas de orçamentos: do número mais alto para o
 * mais baixo.
 *
 * O número tem o formato ANO-MÊS + sequência de dois dígitos — o 2026-908
 * é o oitavo orçamento de setembro de 2026. Comparar como texto puro daria
 * ordens erradas assim que a sequência passasse de dois dígitos
 * ("2026-91000" vinha antes de "2026-909"), por isso usamos localeCompare
 * com `numeric`, que compara cada bloco de dígitos como número.
 *
 * Resultado em casos de fronteira:
 *   2027-101  >  2026-1001  >  2026-910  >  2026-909
 *   (ano novo)   (outubro)     (setembro, 10.º e 9.º)
 *
 * Orçamentos sem número ficam no fim, em vez de rebentar a comparação.
 */
export function compararNumeroDesc(a: Quote, b: Quote): number {
  return (b.number || '').localeCompare(a.number || '', 'pt', {
    numeric: true,
  });
}

/** Devolve uma cópia ordenada. Não altera o array recebido. */
export function ordenarPorNumeroDesc(lista: Quote[]): Quote[] {
  return [...lista].sort(compararNumeroDesc);
}
