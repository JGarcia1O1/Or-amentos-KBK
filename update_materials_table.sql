-- Correr isto no SQL Editor da Supabase para preparar a tabela para as chapas

ALTER TABLE public.materials
ADD COLUMN IF NOT EXISTS unit text,
ADD COLUMN IF NOT EXISTS quantity numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS warehouse numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS total numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
