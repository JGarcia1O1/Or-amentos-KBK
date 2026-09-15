-- =====================================================================
-- KUBIK Software — Catálogo de produção e custos atualizados
-- Data: 15/09/2026
--
-- Origem: ficheiro "Calculo de custo_Cozinha_Roupeiro.xlsx" (versão de
-- 15/09/2026), folhas "Cozinha (2)" e "Roupeiro (2)" e respetivas listas
-- de materiais. Nenhum valor foi inventado.
--
-- As tabelas workstations, hardware e edges estavam VAZIAS, o que fazia o
-- modo de cálculo automático contar tempo de máquina a 0 EUR/h e ferragens
-- a 0 EUR. Este ficheiro resolve isso.
--
-- As chapas NÃO são tocadas: já existem nas 1182 linhas de materials, com
-- stock associado, e o catálogo é mais fiável que a fotografia do Excel.
-- =====================================================================


-- =====================================================================
-- BLOCO 1 — Postos de trabalho e custos horários
-- =====================================================================

INSERT INTO public.workstations (code, name, rate) VALUES
  ('CT SERROTE H.',    'Serrote Horizontal Homag B200', 28.36),
  ('CT ORLAR.',        'Orladora Homag',                29.29),
  ('CT CNC HOMAG.',    'CNC HOMAG de 5 eixos',          28.90),
  ('CT MONTAGEM 1.',   'Montagem Interna 1',            50.43),
  ('CT LIXAGEM',       'Manual Lacagem — Lixagem',      28.15),
  ('CT CABINE PINTURA','Cabine de Pintura',             28.15)
ON CONFLICT DO NOTHING;


-- =====================================================================
-- BLOCO 2 — Orlas
-- =====================================================================

INSERT INTO public.edges (code, name, price_per_meter) VALUES
  ('522215', 'Orla ABS K519 14x1mm Cinza CZ191 Liso SM C/pel.',     0.24),
  ('522019', 'Orla ABS 23x1mm Branco 5667 Alto Brilho C/Pelicula',  0.44),
  ('522199', 'Orla Mouse Grey K519 23x1mm (CZ191 Liso SM C/Pel)',   0.22),
  ('522165', 'Orla Egger 23x0,8mm F425 (Linho)',                    0.22),
  ('521041', 'Orla PVC Cor 1020 King White 22x1mm Acab.2',          0.17),
  ('522142', 'Orla Stratoflex Soft 23x0,33mm Branco',               0.12),
  ('522221', 'Orla Cinza CNZ-402AF (Iberopan)',                     0.45)
ON CONFLICT DO NOTHING;


-- =====================================================================
-- BLOCO 3 — Ferragens e acessórios
-- Se a coluna unit tiver uma restrição que rejeite 'metro', avisa que eu
-- troco para 'un' — o valor está no nome de qualquer forma.
-- =====================================================================

INSERT INTO public.hardware (code, name, unit, price) VALUES
  ('524553', 'Dobradiça Salice C7 A6 AE9 (DBGroup)',                      'un',    1.18),
  ('524554', 'Calço H0 p/espessura 19mm (DBGroup)',                       'un',    0.54),
  ('524467', 'Perfil alumínio gola duplo curvo mate R92',                 'metro', 7.42),
  ('524483', 'Protector Alumínio Fundo Móvel 565x560 — 600mm',            'un',    4.77),
  ('524272', 'Perfil rodapé PVC rev. alumínio 120mm ref. P0J',            'metro', 2.24),
  ('528224', 'Volpato — Base fixação p/pés cozinha 7958110075',           'un',    0.08),
  ('524267', 'Volpato — Pé plástico p/cozinha regulável ref. P01 120mm',  'un',    0.14),
  ('528581', 'Perfil Gola J Alumínio — Barra 5 Mts',                      'un',    2.74),
  ('524314', 'Calha Roupeiro Superior ref. S85',                          'un',    8.26),
  ('524315', 'Calha Roupeiro Inferior ref. CBD85-10',                     'un',    6.73),
  ('524316', 'Fixador Lego Central',                                      'un',    0.54),
  ('524538', 'Amortecedor p/portas roupeiro ref. 1342',                   'un',    4.27),
  ('524313', 'Perfil Lego puxador TR19',                                  'metro', 4.89),
  ('524628', 'Perfil vedação pelúcia branco 2150x9',                      'un',    0.40),
  ('524317', 'Carro roupeiro inferior JK12',                              'un',    1.33),
  ('524318', 'Carro Lego superior S85',                                   'un',    1.53),
  ('524684', 'Pé desmontável Atilo H100mm c/afi. preto',                  'un',    0.29),
  ('524685', 'Base rectangular aparafusar preto p/pé desm. Atilo',        'un',    0.33),
  -- Consumíveis de lacagem (entram como ferragens por não haver tabela própria)
  ('527197', 'Diluente p/Verão DP8060 25L',                               'un',    5.46),
  ('527068', 'PCT23NOR Catalisador PU Tapa-Poros',                        'un',    5.59),
  ('527066', 'PFPU158 Tapa Poros PU',                                     'un',    2.85),
  ('527055', 'Cataliz PU 12,5L CT30S01 — Norticor',                       'un',    4.88),
  ('527054', 'Subcapa Pigmentada FPP225TIX — Norticor',                   'un',    3.93),
  ('527139', 'Cataliz PU 12,5L PCTH3 — Norticor',                         'un',    7.56),
  ('528176', 'Nor ESM RAL 9001 OPP053G10 — Norticor',                     'un',    5.85)
ON CONFLICT DO NOTHING;


-- =====================================================================
-- BLOCO 4 — Custos das receitas atualizados
-- Valores das folhas "Cozinha (2)" e "Roupeiro (2)", que substituem os
-- das folhas antigas carregadas em 15/09/2026.
-- =====================================================================

UPDATE public.quote_templates SET cost_per_unit = 169.25, source = 'Excel Cozinha (2) — 15/09/2026', is_confirmed = true
  WHERE name = 'Cozinha Branco brilho';
UPDATE public.quote_templates SET cost_per_unit = 197.31, source = 'Excel Cozinha (2) — 15/09/2026', is_confirmed = true
  WHERE name = 'Cozinha Antidedada';
UPDATE public.quote_templates SET cost_per_unit = 269.07, source = 'Excel Cozinha (2) — 15/09/2026', is_confirmed = true
  WHERE name = 'Cozinha Lacada Normal';
UPDATE public.quote_templates SET cost_per_unit = 312.07, source = 'Excel Cozinha (2) — 15/09/2026', is_confirmed = true
  WHERE name = 'Cozinha Lacada Almofadada';

UPDATE public.quote_templates SET cost_per_unit = 146.73, source = 'Excel Roupeiro (2) — 15/09/2026', is_confirmed = true
  WHERE name = 'Roupeiro Branco MA — portas de abrir';
UPDATE public.quote_templates SET cost_per_unit = 207.79, source = 'Excel Roupeiro (2) — 15/09/2026', is_confirmed = true
  WHERE name = 'Roupeiro Lacado RAL 9010 — portas de abrir';
UPDATE public.quote_templates SET cost_per_unit = 232.53, source = 'Excel Roupeiro (2) — 15/09/2026', is_confirmed = true
  WHERE name = 'Roupeiro Lacado RAL 9010 — portas de correr';

-- ATENÇÃO: este é o modelo com a incoerência por resolver.
-- A célula da folha diz 384,70 EUR para 3 m2 (128,23 EUR/m2), mas a lista
-- de materiais colada ao lado totaliza 523,84 EUR (174,61 EUR/m2).
-- É também o único modelo que desceu de preço quando todos os outros
-- subiram. Fica com o valor da célula, mas marcado POR CONFIRMAR, o que
-- o faz aparecer a âmbar no configurador com aviso antes de gerar.
UPDATE public.quote_templates
   SET cost_per_unit = 128.23,
       source = 'Excel Roupeiro (2) — 15/09/2026 (célula 384,70; imagem diz 523,84 — por esclarecer)',
       is_confirmed = false,
       notes = 'Discrepância entre a célula e a lista de materiais do Excel. Confirmar com a produção.'
 WHERE name = 'Roupeiro Branco MA — portas de correr';

-- Verificação:
--   SELECT name, cost_per_unit, is_confirmed FROM public.quote_templates ORDER BY sort_order;
--   SELECT code, name, rate FROM public.workstations ORDER BY code;
--   SELECT count(*) FROM public.hardware;
--   SELECT count(*) FROM public.edges;
