-- =====================================================================
-- KUBIK Software — Receitas do Configurador de Orçamentos
-- Data: 15/09/2026
--
-- Cada receita representa um tipo de mobiliário com um custo conhecido
-- por unidade (metro linear de cozinha, m² de roupeiro). O configurador
-- pergunta a quantidade e gera os artigos do orçamento.
--
-- Os custos foram extraídos do ficheiro "Calculo de custo_Cozinha_Roupeiro.xlsx"
-- fornecido pela KUBIK. Nenhum valor foi inventado.
--
-- ATENÇÃO sobre a percentagem: o campo margin_percent é MARKUP SOBRE O
-- CUSTO, coerente com o resto do sistema (ver capítulo 3.4 do handoff).
-- 0.60 significa custo x 1,60, e não margem de 60% sobre a venda.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.quote_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  category        text NOT NULL DEFAULT 'Cozinhas',
  unit            text NOT NULL DEFAULT 'm',
  unit_label      text,
  designation     text NOT NULL,
  cost_per_unit   numeric NOT NULL DEFAULT 0,
  margin_percent  numeric NOT NULL DEFAULT 0.6,
  fixed_extra     numeric NOT NULL DEFAULT 0,
  automatic_config jsonb,
  source          text,
  is_confirmed    boolean NOT NULL DEFAULT false,
  is_active       boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_templates_active_idx
  ON public.quote_templates (is_active, category, sort_order);

DROP TRIGGER IF EXISTS kubik_quote_templates_touch ON public.quote_templates;
CREATE TRIGGER kubik_quote_templates_touch
  BEFORE UPDATE ON public.quote_templates
  FOR EACH ROW EXECUTE FUNCTION public.kubik_touch_updated_at();


-- =====================================================================
-- RLS
-- Ler: quem tem acesso a orçamentos. Alterar: quem pode editar o catálogo.
-- =====================================================================

ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kubik_quote_templates_select" ON public.quote_templates;
CREATE POLICY "kubik_quote_templates_select"
  ON public.quote_templates FOR SELECT TO authenticated
  USING (public.kubik_can_view('quotes') OR public.kubik_can_view('materials'));

DROP POLICY IF EXISTS "kubik_quote_templates_insert" ON public.quote_templates;
CREATE POLICY "kubik_quote_templates_insert"
  ON public.quote_templates FOR INSERT TO authenticated
  WITH CHECK (public.kubik_can_edit('materials'));

DROP POLICY IF EXISTS "kubik_quote_templates_update" ON public.quote_templates;
CREATE POLICY "kubik_quote_templates_update"
  ON public.quote_templates FOR UPDATE TO authenticated
  USING (public.kubik_can_edit('materials'))
  WITH CHECK (public.kubik_can_edit('materials'));

DROP POLICY IF EXISTS "kubik_quote_templates_delete" ON public.quote_templates;
CREATE POLICY "kubik_quote_templates_delete"
  ON public.quote_templates FOR DELETE TO authenticated
  USING (public.kubik_can_edit('materials'));


-- =====================================================================
-- RECEITAS INICIAIS — custos reais do Excel da KUBIK
-- Cozinhas: custo por METRO LINEAR
-- Roupeiros: custo por METRO QUADRADO
-- O markup de 0,60 e o extra de 350 € vêm do que a KUBIK já pratica nos
-- orçamentos existentes. Ajustáveis no ecrã de configuração.
-- =====================================================================

INSERT INTO public.quote_templates
  (name, category, unit, unit_label, designation, cost_per_unit, margin_percent, fixed_extra, source, is_confirmed, sort_order)
VALUES
  ('Cozinha Branco brilho',        'Cozinhas',  'm',  'metro linear',  'Cozinha em branco brilho, por medida',              101.37, 0.60, 350, 'Excel Calculo de custo (2026)', true, 10),
  ('Cozinha Antidedada',           'Cozinhas',  'm',  'metro linear',  'Cozinha em acabamento antidedada, por medida',      130.59, 0.60, 350, 'Excel Calculo de custo (2026)', true, 20),
  ('Cozinha Lacada Normal',        'Cozinhas',  'm',  'metro linear',  'Cozinha lacada, por medida',                        174.02, 0.60, 350, 'Excel Calculo de custo (2026)', true, 30),
  ('Cozinha Lacada Almofadada',    'Cozinhas',  'm',  'metro linear',  'Cozinha lacada com portas almofadadas, por medida', 202.34, 0.60, 350, 'Excel Calculo de custo (2026)', true, 40),
  ('Roupeiro Branco MA — portas de abrir',        'Roupeiros', 'm2', 'metro quadrado', 'Roupeiro em branco MA com portas de abrir',          102.54, 0.60, 350, 'Excel Calculo de custo (2026)', true, 50),
  ('Roupeiro Lacado RAL 9010 — portas de abrir',  'Roupeiros', 'm2', 'metro quadrado', 'Roupeiro lacado RAL 9010 com portas de abrir',       150.54, 0.60, 350, 'Excel Calculo de custo (2026)', true, 60),
  ('Roupeiro Lacado RAL 9010 — portas de correr', 'Roupeiros', 'm2', 'metro quadrado', 'Roupeiro lacado RAL 9010 com portas de correr',      174.43, 0.60, 350, 'Excel Calculo de custo (2026)', true, 70),
  ('Roupeiro Branco MA — portas de correr',       'Roupeiros', 'm2', 'metro quadrado', 'Roupeiro em branco MA com portas de correr',         174.61, 0.60, 350, 'Excel Calculo de custo (2026)', true, 80)
ON CONFLICT DO NOTHING;

-- Verificação:
--   SELECT name, unit, cost_per_unit, margin_percent FROM public.quote_templates ORDER BY sort_order;
