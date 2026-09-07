-- Adicionar colunas em falta na tabela quotes que a aplicação tenta guardar
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS client_email VARCHAR(255);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS client_phone VARCHAR(50);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS payment_conditions TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS delivery_terms TEXT;
