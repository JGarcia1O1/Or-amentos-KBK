-- =====================================================================
-- KUBIK Software — Âmbito da proposta nos orçamentos
-- Data: 15/09/2026
--
-- Duas listas de texto por orçamento: o que está incluído e o que fica
-- explicitamente de fora. Conceito adotado da análise ao worker.pt.
--
-- Executar no SQL Editor do Supabase. Não apaga nem altera nada existente.
-- =====================================================================

ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS scope_included jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS scope_excluded jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Verificação:
--   SELECT number, scope_included, scope_excluded FROM public.quotes LIMIT 5;
