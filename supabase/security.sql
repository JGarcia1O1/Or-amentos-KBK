-- ===============================================================================
-- KUBIK PLATFORM - SECURITY ENFORCEMENT SCRIPT
-- ===============================================================================
-- Ativa a segurança (RLS - Row Level Security) em todas as tabelas
-- e garante que apenas utilizadores com LOGIN feito podem ler/escrever.
-- ===============================================================================

-- 1. Ativar RLS em todas as tabelas
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workstations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas se existirem
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.materials;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.hardware;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.edges;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.workstations;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.company_info;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.quotes;

-- 3. Criar Política Global: Acesso Total Apenas para Utilizadores Autenticados
CREATE POLICY "Allow authenticated full access" ON public.materials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access" ON public.hardware
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access" ON public.edges
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access" ON public.workstations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access" ON public.company_info
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access" ON public.clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access" ON public.quotes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- NOTA EXTRA: Qualquer utilizador anónimo (unauthenticated) que tente
-- aceder via API, receberá agora um erro automático (401 Unauthorized).
