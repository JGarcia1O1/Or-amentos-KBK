-- 1. DESATIVAR RLS (ROW LEVEL SECURITY) PARA PARTILHAR ACESSO COM TODOS OS UTILIZADORES
-- Isto garante que todos os utilizadores autenticados conseguem ver e editar todos os orçamentos, materiais e definições.
ALTER TABLE public.quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workstations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.edges DISABLE ROW LEVEL SECURITY;

-- 2. CRIAR TABELA DE BACKUPS DE SEGURANÇA INTOCÁVEIS
CREATE TABLE IF NOT EXISTS public.quote_backups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id text,
    quote_number text,
    status text,
    snapshot jsonb,
    backed_up_at timestamp with time zone DEFAULT now()
);

-- 3. FUNÇÃO PARA TIRAR FOTOGRAFIA AUTOMÁTICA AO ORÇAMENTO
CREATE OR REPLACE FUNCTION backup_quote_trigger_function()
RETURNS trigger AS $$
BEGIN
    -- Só faz backup se o estado for 'Apresentado' ou 'Adjudicado' ou 'Concluído'
    IF NEW.status IN ('Apresentado', 'Adjudicado', 'Concluído') THEN
        INSERT INTO public.quote_backups (quote_id, quote_number, status, snapshot)
        VALUES (NEW.id, NEW.number, NEW.status, row_to_json(NEW));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. ATIVAR O GATILHO (TRIGGER) NA TABELA DOS ORÇAMENTOS
DROP TRIGGER IF EXISTS backup_quote_trigger ON public.quotes;
CREATE TRIGGER backup_quote_trigger
AFTER INSERT OR UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION backup_quote_trigger_function();
