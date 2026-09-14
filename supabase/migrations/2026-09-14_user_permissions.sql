-- =====================================================================
-- KUBIK Software — Permissões por Utilizador e Módulo + RLS
-- Data: 14/09/2026
-- Executar no SQL Editor do Supabase (dashboard), por blocos.
--
-- REGRAS RESPEITADAS:
--   • Nunca DROP COLUMN — apenas ADD COLUMN IF NOT EXISTS.
--   • Nenhum dado é apagado.
--   • O bloco 6 (ativação do RLS) é o único que muda comportamento;
--     tem rollback documentado no fim do ficheiro.
-- =====================================================================


-- =====================================================================
-- BLOCO 1 — Estrutura da tabela user_roles
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE
);

ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role         text    NOT NULL DEFAULT 'trabalhador';
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS email        text;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS permissions  jsonb   NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_active    boolean NOT NULL DEFAULT true;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS created_at   timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS updated_at   timestamptz NOT NULL DEFAULT now();

-- A tabela user_roles já existia em produção com uma restrição de mesmo nome
-- que só aceitava ('admin', 'user') — o vocabulário original, de dois níveis.
-- O código evoluiu para três níveis sem que a restrição fosse acompanhada.
--
-- Primeiro converte-se o valor antigo: 'user' significava "todos menos o
-- administrador", ou seja quem usava a plataforma a sério — corresponde a
-- 'gestor' e não a 'trabalhador', para não retirar acessos sem aviso.
UPDATE public.user_roles SET role = 'gestor' WHERE role = 'user';

-- Só depois se substitui a restrição. É apenas uma restrição: nenhuma coluna
-- ou dado é perdido, e é reversível.
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('admin', 'gestor', 'trabalhador'));


-- =====================================================================
-- BLOCO 2 — Criação automática do perfil para novos utilizadores
-- Quando criares um utilizador no dashboard do Supabase, a linha de
-- permissões passa a ser criada sozinha, sem módulos atribuídos.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.kubik_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, email, display_name, role, permissions)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    'trabalhador',
    '{}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kubik_on_auth_user_created ON auth.users;
CREATE TRIGGER kubik_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.kubik_handle_new_user();


-- =====================================================================
-- BLOCO 3 — Preencher os utilizadores que já existem
-- ATENÇÃO: a segunda instrução garante que não ficas fechado fora do
-- sistema. Confirma que o email é o teu antes de correr.
-- =====================================================================

INSERT INTO public.user_roles (user_id, email, display_name, role, permissions)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'display_name', split_part(u.email, '@', 1)),
  'trabalhador',
  '{}'::jsonb
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.user_roles
SET role = 'admin',
    is_active = true,
    permissions = '{
      "dashboard": "edit",
      "obras": "edit",
      "quotes": "edit",
      "visits": "edit",
      "clients": "edit",
      "materials": "edit",
      "emails": "edit",
      "settings": "edit"
    }'::jsonb,
    updated_at = now()
WHERE email = 'joaogarcia@kubikhome.com';

-- Confirma quem existe e com que perfil antes de avançares:
--   SELECT email, role, permissions, is_active FROM public.user_roles ORDER BY role;


-- =====================================================================
-- BLOCO 4 — Funções de leitura de permissões
-- SECURITY DEFINER para poderem ler user_roles sem recursão de políticas.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.kubik_is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

-- Nível do utilizador atual num módulo: 'none' | 'view' | 'edit'
CREATE OR REPLACE FUNCTION public.kubik_level(p_module text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT CASE
               WHEN ur.is_active = false THEN 'none'
               WHEN ur.role = 'admin'    THEN 'edit'
               ELSE COALESCE(ur.permissions ->> p_module, 'none')
             END
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
    ),
    'none'
  );
$$;

CREATE OR REPLACE FUNCTION public.kubik_can_view(p_module text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.kubik_level(p_module) IN ('view', 'edit');
$$;

CREATE OR REPLACE FUNCTION public.kubik_can_edit(p_module text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.kubik_level(p_module) = 'edit';
$$;


-- =====================================================================
-- BLOCO 5 — Manter updated_at correto
-- =====================================================================

CREATE OR REPLACE FUNCTION public.kubik_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kubik_user_roles_touch ON public.user_roles;
CREATE TRIGGER kubik_user_roles_touch
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.kubik_touch_updated_at();


-- =====================================================================
-- BLOCO 6 — RLS: ativar e criar políticas
-- ESTE É O BLOCO QUE FECHA A PORTA ABERTA.
-- A partir daqui a chave anónima deixa de conseguir ler seja o que for.
-- Corre só depois de confirmares o resultado do BLOCO 3.
-- =====================================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kubik_user_roles_select" ON public.user_roles;
CREATE POLICY "kubik_user_roles_select"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.kubik_is_admin());

DROP POLICY IF EXISTS "kubik_user_roles_insert" ON public.user_roles;
CREATE POLICY "kubik_user_roles_insert"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.kubik_is_admin());

DROP POLICY IF EXISTS "kubik_user_roles_update" ON public.user_roles;
CREATE POLICY "kubik_user_roles_update"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.kubik_is_admin())
  WITH CHECK (public.kubik_is_admin());

DROP POLICY IF EXISTS "kubik_user_roles_delete" ON public.user_roles;
CREATE POLICY "kubik_user_roles_delete"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.kubik_is_admin());


-- Políticas por tabela, mapeadas ao módulo correspondente.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT * FROM (VALUES
      ('quotes',        'quotes'),
      ('quote_backups', 'quotes'),
      ('clients',       'clients'),
      ('materials',     'materials'),
      ('hardware',      'materials'),
      ('workstations',  'materials'),
      ('edges',         'materials'),
      ('site_visits',   'visits'),
      ('company_info',  'settings')
    ) AS x(table_name, module_key)
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.table_name);

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
    ELSE
      RAISE NOTICE 'Tabela % nao existe - ignorada', t.table_name;
    END IF;
  END LOOP;
END $$;


-- =====================================================================
-- BLOCO 7 — Verificação
-- =====================================================================
-- Tabelas protegidas:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public' ORDER BY tablename;
--
-- Políticas criadas:
--   SELECT tablename, policyname, cmd FROM pg_policies
--   WHERE schemaname = 'public' ORDER BY tablename;


-- =====================================================================
-- ROLLBACK DE EMERGÊNCIA
-- Se alguma coisa bloquear a operação da empresa, corre isto para voltar
-- ao estado anterior. Os dados ficam intactos; só o RLS é desligado.
-- =====================================================================
--   ALTER TABLE public.quotes         DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.quote_backups  DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.clients        DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.materials      DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.hardware       DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.workstations   DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.edges          DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.site_visits    DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.company_info   DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.user_roles     DISABLE ROW LEVEL SECURITY;
