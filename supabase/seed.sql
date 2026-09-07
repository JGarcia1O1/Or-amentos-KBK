-- ====================================================================
-- SEED DATA: KUBIK HOME & LIFE FURNITURE
-- Popula materiais, postos de trabalho, clientes e orçamentos reais
-- ====================================================================

-- 1. Organização Principal
INSERT INTO organizations (id, name, legal_name, nif, address, postal_code, phone, website, iban, bank, court)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'KUBIK HOME & LIFE FURNITURE',
    'KUBIK HOME Lda',
    '519021916',
    'Zona Industrial do Tortosendo, Rua E, Lote 41',
    '6200-823 Tortosendo - PORTUGAL',
    '275 957 250',
    'www.kubikhome.com',
    'PT50 0269 0343 0020 5777 6028 3',
    'Bankinter',
    'Tribunal da comarca da Covilhã, PORTUGAL'
) ON CONFLICT (id) DO NOTHING;

-- 2. Clientes Reais
INSERT INTO clients (organization_id, name, nif, address, email, phone, notes) VALUES
('a0000000-0000-0000-0000-000000000001', 'Ricardo Estrela', '', 'Tortosendo', 'ricardo.estrela@email.pt', '960 000 001', 'Moradia Familiar - Roupeiros e Closet'),
('a0000000-0000-0000-0000-000000000001', 'Atelier Vasco Pinho', '', 'Moradia Ruben', 'atelier.vascopinho@email.pt', '960 000 002', 'Portas de correr em CPL'),
('a0000000-0000-0000-0000-000000000001', 'Luisa Pimentel', '', 'Covilhã', 'luisa.pimentel@email.pt', '960 000 003', 'Lambrim MDF e Portas CPL'),
('a0000000-0000-0000-0000-000000000001', 'Now Xxi - Engenharia & Construções, S.A', '514288256', 'Rua Poeta Bocage, 13 C 1600-581 Lisboa', 'geral@nowxxi.pt', '210 000 004', 'Residência da Boavista - Balcão copa e bancada mármore');

-- 3. Catálogo de Chapas e Materiais
INSERT INTO materials (organization_id, code, name, length_mm, width_mm, thickness_mm, price_per_sheet) VALUES
('a0000000-0000-0000-0000-000000000001', '502114', 'Linho 19mm', 2500, 1830, 19, 45.00),
('a0000000-0000-0000-0000-000000000001', '502295', 'Linho 8mm', 2800, 2070, 8, 38.00),
('a0000000-0000-0000-0000-000000000001', '502294', 'Linho 16mm', 2800, 2070, 16, 42.00),
('a0000000-0000-0000-0000-000000000001', '502999', 'Branco MA 19mm', 2800, 2070, 19, 53.90),
('a0000000-0000-0000-0000-000000000001', '503001', 'MDF Cru 16mm', 2800, 2070, 16, 35.00);

-- 4. Postos de Trabalho e Máquinas
INSERT INTO workstations (organization_id, code, name, hourly_rate) VALUES
('a0000000-0000-0000-0000-000000000001', 'SH', 'Seccionadora (Corte)', 35.00),
('a0000000-0000-0000-0000-000000000001', 'CNC', 'Centro Maquinação CNC', 18.09),
('a0000000-0000-0000-0000-000000000001', 'ORLADORA', 'Orladora (Colagem)', 25.00),
('a0000000-0000-0000-0000-000000000001', 'MANUAL', 'Montagem Bancada', 25.00);
