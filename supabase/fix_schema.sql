-- FIX QUOTES SCHEMA FOR JSONB CHAPTERS
-- The app saves the whole quote object at once.
-- We alter the table to support string IDs and JSONB chapters.

-- 1. Fix Quotes ID and columns
ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_pkey CASCADE;
ALTER TABLE public.quotes ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE public.quotes ADD PRIMARY KEY (id);

-- Rename quote_number to number to match quoteService.ts
ALTER TABLE public.quotes RENAME COLUMN quote_number TO number;

-- Change date to VARCHAR because frontend sends 'DD/MM/YYYY'
ALTER TABLE public.quotes ALTER COLUMN date TYPE VARCHAR(50);

-- Add the missing columns that the app uses:
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS chapters JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS last_edited_at BIGINT;

-- 2. Update other tables ID to VARCHAR(255) since the frontend generates strings like 'c-123456', 'm-123', etc.
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_pkey CASCADE;
ALTER TABLE public.clients ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE public.clients ADD PRIMARY KEY (id);

ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_pkey CASCADE;
ALTER TABLE public.materials ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE public.materials ADD PRIMARY KEY (id);

ALTER TABLE public.hardware DROP CONSTRAINT IF EXISTS hardware_pkey CASCADE;
ALTER TABLE public.hardware ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE public.hardware ADD PRIMARY KEY (id);

ALTER TABLE public.edges DROP CONSTRAINT IF EXISTS edges_pkey CASCADE;
ALTER TABLE public.edges ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE public.edges ADD PRIMARY KEY (id);

ALTER TABLE public.workstations DROP CONSTRAINT IF EXISTS workstations_pkey CASCADE;
ALTER TABLE public.workstations ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE public.workstations ADD PRIMARY KEY (id);

-- 3. Update Policy Security for safety (Just in case)
CREATE POLICY "Allow authenticated full access" ON public.quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);
