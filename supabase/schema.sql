-- ====================================================================
-- ESQUEMA DA BASE DE DADOS: KUBIK HOME & LIFE FURNITURE
-- PostgreSQL / Supabase (Multi-utilizador, Gratuito, Sem Manutenção)
-- ====================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE ORGANIZAÇÃO / EMPRESA
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'KUBIK HOME & LIFE FURNITURE',
    legal_name VARCHAR(255) DEFAULT 'KUBIK HOME Lda',
    nif VARCHAR(20) NOT NULL DEFAULT '519021916',
    address TEXT DEFAULT 'Zona Industrial do Tortosendo, Rua E, Lote 41',
    postal_code VARCHAR(50) DEFAULT '6200-823 Tortosendo - PORTUGAL',
    phone VARCHAR(50) DEFAULT '275 957 250',
    website VARCHAR(100) DEFAULT 'www.kubikhome.com',
    iban VARCHAR(50) DEFAULT 'PT50 0269 0343 0020 5777 6028 3',
    bank VARCHAR(50) DEFAULT 'Bankinter',
    court VARCHAR(100) DEFAULT 'Tribunal da comarca da Covilhã, PORTUGAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CLIENTES
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    nif VARCHAR(50) DEFAULT '',
    address TEXT DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. MATERIAIS / CHAPAS DE MADEIRA
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    length_mm NUMERIC(10, 2) NOT NULL DEFAULT 2800,
    width_mm NUMERIC(10, 2) NOT NULL DEFAULT 2070,
    thickness_mm NUMERIC(10, 2) NOT NULL DEFAULT 19,
    price_per_sheet NUMERIC(10, 2) NOT NULL DEFAULT 45.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. POSTOS DE TRABALHO & MÁQUINAS
CREATE TABLE IF NOT EXISTS workstations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 25.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. FERRAGENS E ACESSÓRIOS
CREATE TABLE IF NOT EXISTS hardware (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(20) DEFAULT 'un',
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. CABEÇALHO DO ORÇAMENTO (QUOTES)
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    quote_number VARCHAR(50) NOT NULL UNIQUE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255) NOT NULL,
    client_nif VARCHAR(50) DEFAULT '',
    client_address TEXT DEFAULT '',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    responsible VARCHAR(100) NOT NULL DEFAULT 'Departamento Comercial',
    project_name VARCHAR(255) DEFAULT '',
    status VARCHAR(50) DEFAULT 'Rascunho' CHECK (status IN ('Rascunho', 'Apresentado', 'Adjudicado', 'Recusado')),
    vat_rate NUMERIC(5, 4) DEFAULT 0.23,
    notes TEXT DEFAULT '',
    payment_terms TEXT DEFAULT '50% na adjudicação, restantes 50% com finalização dos trabalhos.',
    validity_days INT DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. CAPÍTULOS DO ORÇAMENTO
CREATE TABLE IF NOT EXISTS quote_chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL DEFAULT 'Mobiliário por Medida',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. ARTIGOS DO ORÇAMENTO (QUOTE ITEMS)
CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID REFERENCES quote_chapters(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 1,
    item_code VARCHAR(50) NOT NULL DEFAULT '1.1',
    designation TEXT NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'un',
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    cost_unit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    margin_percent NUMERIC(6, 4) NOT NULL DEFAULT 0.50,
    fixed_extra NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    calculation_mode VARCHAR(20) DEFAULT 'quick' CHECK (calculation_mode IN ('quick', 'technical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. FICHA TÉCNICA DO ARTIGO (CALCULADORA TÉCNICA)
CREATE TABLE IF NOT EXISTS technical_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_item_id UUID REFERENCES quote_items(id) ON DELETE CASCADE UNIQUE,
    height_mm NUMERIC(10, 2) DEFAULT 2450,
    width_mm NUMERIC(10, 2) DEFAULT 2790,
    depth_mm NUMERIC(10, 2) DEFAULT 600,
    doors INT DEFAULT 3,
    drawers INT DEFAULT 4,
    material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
    extra_hardware_cost NUMERIC(10, 2) DEFAULT 78.04,
    calculated_total NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. PEÇAS DA FICHA TÉCNICA (DESDOBRAMENTO DE CORTE)
CREATE TABLE IF NOT EXISTS sheet_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technical_sheet_id UUID REFERENCES technical_sheets(id) ON DELETE CASCADE,
    part_name VARCHAR(255) NOT NULL,
    length_mm NUMERIC(10, 2) NOT NULL,
    width_mm NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    yield_pieces INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. ROW LEVEL SECURITY (RLS) - Permite leitura e escrita aos utilizadores autorizados
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE workstations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheet_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total aos membros da KUBIK HOME" ON clients FOR ALL USING (true);
CREATE POLICY "Acesso total aos materiais" ON materials FOR ALL USING (true);
CREATE POLICY "Acesso total aos postos de trabalho" ON workstations FOR ALL USING (true);
CREATE POLICY "Acesso total às ferragens" ON hardware FOR ALL USING (true);
CREATE POLICY "Acesso total aos orçamentos" ON quotes FOR ALL USING (true);
CREATE POLICY "Acesso total aos capítulos" ON quote_chapters FOR ALL USING (true);
CREATE POLICY "Acesso total aos artigos" ON quote_items FOR ALL USING (true);
CREATE POLICY "Acesso total às fichas técnicas" ON technical_sheets FOR ALL USING (true);
CREATE POLICY "Acesso total às peças de corte" ON sheet_parts FOR ALL USING (true);
