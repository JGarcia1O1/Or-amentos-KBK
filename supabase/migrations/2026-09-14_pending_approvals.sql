-- =====================================================================
-- KUBIK Software — Pedidos de Aprovação partilhados
-- Data: 14/09/2026
--
-- PROBLEMA QUE RESOLVE:
-- Os pedidos de aprovação viviam apenas no localStorage do browser de
-- quem os criava. A mensagem "enviado para aprovação do Administrador"
-- era falsa: nada saía daquele computador. Esta tabela torna-os reais e
-- partilhados entre todos os utilizadores.
--
-- Executar no SQL Editor do Supabase.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.pending_approvals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type              text NOT NULL,
  data              jsonb NOT NULL DEFAULT '{}'::jsonb,
  requested_by      uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  requested_by_name text,
  status            text NOT NULL DEFAULT 'pending',
  resolved_by       uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  resolved_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pending_approvals_status_check') THEN
    ALTER TABLE public.pending_approvals
      ADD CONSTRAINT pending_approvals_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS pending_approvals_status_idx
  ON public.pending_approvals (status, created_at);


-- =====================================================================
-- RLS
-- Qualquer utilizador autenticado pode criar um pedido em seu nome e ver
-- os seus próprios. Só o administrador vê todos e os pode resolver.
-- =====================================================================

ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kubik_pending_select" ON public.pending_approvals;
CREATE POLICY "kubik_pending_select"
  ON public.pending_approvals FOR SELECT TO authenticated
  USING (requested_by = auth.uid() OR public.kubik_is_admin());

DROP POLICY IF EXISTS "kubik_pending_insert" ON public.pending_approvals;
CREATE POLICY "kubik_pending_insert"
  ON public.pending_approvals FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());

DROP POLICY IF EXISTS "kubik_pending_update" ON public.pending_approvals;
CREATE POLICY "kubik_pending_update"
  ON public.pending_approvals FOR UPDATE TO authenticated
  USING (public.kubik_is_admin())
  WITH CHECK (public.kubik_is_admin());

DROP POLICY IF EXISTS "kubik_pending_delete" ON public.pending_approvals;
CREATE POLICY "kubik_pending_delete"
  ON public.pending_approvals FOR DELETE TO authenticated
  USING (public.kubik_is_admin());

-- Verificação:
--   SELECT status, count(*) FROM public.pending_approvals GROUP BY status;
