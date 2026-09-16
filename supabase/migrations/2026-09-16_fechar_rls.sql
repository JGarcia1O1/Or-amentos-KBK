-- =====================================================================
-- KUBIK — FECHAR O ACESSO PÚBLICO ÀS TABELAS (resposta ao alerta Supabase)
-- Data: 16/09/2026
--
-- ESTADO ENCONTRADO (verificado no projeto real a 16/09):
--   Sem RLS, abertas a qualquer pessoa com a chave anónima:
--     quotes (8 linhas), quote_backups (43), materials (1182),
--     hardware (25), edges (7), workstations (9)
--   Com RLS já ativo e a funcionar:
--     clients, site_visits, user_roles, pending_approvals,
--     quote_templates, audit_logs, company_info
--
-- ESTE FICHEIRO NÃO APAGA NENHUMA LINHA DE DADOS.
-- Só ativa RLS, troca políticas e ajusta permissões de funções.
-- Não toca em cálculos, no PDF nem no conteúdo dos orçamentos.
--
-- CORRE BLOCO A BLOCO E CONFIRMA CADA UM ANTES DE AVANÇAR.
-- =====================================================================


-- =====================================================================
-- BLOCO 0 — FOTOGRAFIA ANTES (guarda o resultado)
-- Se algo correr mal, isto é a prova de que nada se perdeu.
-- =====================================================================
SELECT 'quotes' AS tabela, count(*) FROM public.quotes
UNION ALL SELECT 'quote_backups', count(*) FROM public.quote_backups
UNION ALL SELECT 'materials',     count(*) FROM public.materials
UNION ALL SELECT 'hardware',      count(*) FROM public.hardware
UNION ALL SELECT 'edges',         count(*) FROM public.edges
UNION ALL SELECT 'workstations',  count(*) FROM public.workstations
UNION ALL SELECT 'clients',       count(*) FROM public.clients
ORDER BY 1;
-- Esperado hoje: clients 5, edges 7, hardware 25, materials 1182,
--                quote_backups 43, quotes 8, workstations 9


-- =====================================================================
-- BLOCO 1 — O ESSENCIAL: fechar as seis tabelas abertas
-- É este bloco que responde ao email da Supabase.
-- =====================================================================
DO $$
DECLARE
  t record;
  p record;
BEGIN
  FOR t IN
    SELECT * FROM (VALUES
      ('quotes',        'quotes'),
      ('quote_backups', 'quotes'),
      ('materials',     'materials'),
      ('hardware',      'materials'),
      ('edges',         'materials'),
      ('workstations',  'materials')
    ) AS x(table_name, module_key)
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN

      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.table_name);

      -- As políticas somam-se por OR. Uma política antiga do tipo
      -- "Allow authenticated full access" deixada em vigor anularia por
      -- completo as regras por módulo, por isso remove-se primeiro.
      FOR p IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = t.table_name
          AND policyname NOT LIKE 'kubik\_%'
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t.table_name);
        RAISE NOTICE 'Removida politica antiga "%" em %', p.policyname, t.table_name;
      END LOOP;

      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
                     'kubik_' || t.table_name || '_select', t.table_name);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.kubik_can_view(%L))',
        'kubik_' || t.table_name || '_select', t.table_name, t.module_key);

      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
                     'kubik_' || t.table_name || '_insert', t.table_name);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.kubik_can_edit(%L))',
        'kubik_' || t.table_name || '_insert', t.table_name, t.module_key);

      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
                     'kubik_' || t.table_name || '_update', t.table_name);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.kubik_can_edit(%L)) WITH CHECK (public.kubik_can_edit(%L))',
        'kubik_' || t.table_name || '_update', t.table_name, t.module_key, t.module_key);

      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
                     'kubik_' || t.table_name || '_delete', t.table_name);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.kubik_can_edit(%L))',
        'kubik_' || t.table_name || '_delete', t.table_name, t.module_key);

      RAISE NOTICE 'RLS aplicado a % (modulo %)', t.table_name, t.module_key;
    END IF;
  END LOOP;
END $$;


-- =====================================================================
-- BLOCO 2 — company_info: tirar o acesso total
-- Hoje qualquer utilizador autenticado pode alterar os dados da empresa
-- (NIF, morada, condições que saem no PDF). Passa a: todos leem — o PDF
-- precisa disso — mas só o administrador altera.
-- =====================================================================
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.company_info;

DROP POLICY IF EXISTS "kubik_company_info_select" ON public.company_info;
CREATE POLICY "kubik_company_info_select"
  ON public.company_info FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "kubik_company_info_insert" ON public.company_info;
CREATE POLICY "kubik_company_info_insert"
  ON public.company_info FOR INSERT TO authenticated
  WITH CHECK (public.kubik_is_admin());

DROP POLICY IF EXISTS "kubik_company_info_update" ON public.company_info;
CREATE POLICY "kubik_company_info_update"
  ON public.company_info FOR UPDATE TO authenticated
  USING (public.kubik_is_admin())
  WITH CHECK (public.kubik_is_admin());

DROP POLICY IF EXISTS "kubik_company_info_delete" ON public.company_info;
CREATE POLICY "kubik_company_info_delete"
  ON public.company_info FOR DELETE TO authenticated
  USING (public.kubik_is_admin());


-- =====================================================================
-- BLOCO 3 — search_path fixo nas três funções que o avisavam
-- ALTER FUNCTION não toca no corpo da função: a lógica fica intacta.
-- =====================================================================
ALTER FUNCTION public.kubik_touch_updated_at()         SET search_path = public, pg_temp;
ALTER FUNCTION public.backup_quote_trigger_function()  SET search_path = public, pg_temp;
ALTER FUNCTION public.block_adjudicado_changes()       SET search_path = public, pg_temp;


-- =====================================================================
-- BLOCO 4 — tirar ao visitante anónimo o direito de chamar as funções
-- Quem não tem sessão iniciada não tem nada que as executar.
-- Os utilizadores autenticados mantêm o acesso — a aplicação precisa.
-- =====================================================================
-- ERRO NA PRIMEIRA VERSÃO DESTE BLOCO (corrigido a 16/09):
-- revogar só de "anon" não serve de nada. No PostgreSQL as funções nascem
-- com EXECUTE concedido a PUBLIC, e o anon é membro de PUBLIC — continuava
-- a poder chamá-las. É de PUBLIC que tem de sair.
REVOKE EXECUTE ON FUNCTION public.kubik_can_view(text)    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.kubik_can_edit(text)    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.kubik_level(text)       FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.kubik_is_admin()        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.kubik_handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()       FROM PUBLIC, anon, authenticated;

-- ATENÇÃO: estas quatro TÊM de continuar disponíveis ao utilizador
-- autenticado. As políticas RLS chamam-nas e são avaliadas com os
-- privilégios de quem faz a consulta — sem isto, ninguém vê nada.
GRANT EXECUTE ON FUNCTION public.kubik_can_view(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kubik_can_edit(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kubik_level(text)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.kubik_is_admin()     TO authenticated;

-- kubik_handle_new_user é o gatilho que cria o perfil quando nasce um
-- utilizador, e rls_auto_enable é um event trigger. São chamados pelo
-- sistema, nunca pela aplicação, por isso ninguém de fora precisa deles.


-- =====================================================================
-- BLOCO 5 — VERIFICAÇÃO. Corre isto e confirma o resultado.
-- =====================================================================

-- 5a) Nenhuma linha deve dizer "false" na coluna rls_ativo:
SELECT t.tablename,
       t.rowsecurity AS rls_ativo,
       count(p.policyname) AS politicas
FROM pg_tables t
LEFT JOIN pg_policies p
  ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.rowsecurity, t.tablename;

-- 5b) As contagens têm de ser iguais às do BLOCO 0:
SELECT 'quotes' AS tabela, count(*) FROM public.quotes
UNION ALL SELECT 'quote_backups', count(*) FROM public.quote_backups
UNION ALL SELECT 'materials',     count(*) FROM public.materials
UNION ALL SELECT 'hardware',      count(*) FROM public.hardware
UNION ALL SELECT 'edges',         count(*) FROM public.edges
UNION ALL SELECT 'workstations',  count(*) FROM public.workstations
UNION ALL SELECT 'clients',       count(*) FROM public.clients
ORDER BY 1;


-- =====================================================================
-- TRAVÃO DE EMERGÊNCIA
-- Só se o software parar e precisares de voltar atrás depressa.
-- Isto reabre as tabelas — usa mesmo só em emergência e avisa-me.
-- =====================================================================
-- ALTER TABLE public.quotes        DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.quote_backups DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.materials     DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.hardware      DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.edges         DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.workstations  DISABLE ROW LEVEL SECURITY;
