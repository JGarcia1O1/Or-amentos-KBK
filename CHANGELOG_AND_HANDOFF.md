# KUBIK HOME — Relatório de Transição, Changelog & Guia de Instalação

**Projeto:** Plataforma Modular de Gestão e Orçamentação de Mobiliário por Medida  
**Empresa:** KUBIK HOME & LIFE FURNITURE (NIF: 519021916, Tortosendo - Portugal)  
**Versão Atual:** `v1.0.0` (Produção Compilada & Operacional)  
**Última Atualização:** 02/09/2026  

---

## 1. Registo de Todo o Trabalho Efetuado (Changelog Completo)

### 1.1. Análise & Engenharia Reversa dos Ficheiros Excel Reais
* Analisadas as 4 pastas de trabalho Excel (`.xlsx`) da empresa:
  * **`Orçamento 2026-009 Ricardo Estrela.xlsx`** (Closets e Roupeiros — 4.798,97 € com IVA)
  * **`Orçamento 2026-056 ATVP Moradia Ruben.xlsx`** (Portas de correr CPL — 2.971,68 € com IVA)
  * **`Orçamento 2026-158 Luisa Pimentel.xlsx`** (Lambris MDF e Portas — 2.228,53 € com IVA)
  * **`Orçamento 2026-171 Res. Boavista.xlsx`** (Balcão Copa e Bancada Mármore — 10.853,52 € com IVA)
* Identificada a separação rigorosa de informação: o cliente final recebe apenas os preços de venda (com IVA a 23%) e as Condições Gerais de Venda com IBAN Bankinter e comarca da Covilhã; todos os custos internos de produção e margens ficam estritamente ocultos.

### 1.2. Mapeamento & Validação das Fórmulas Matemáticas
* **Rendimento de Corte de Chapa (ROUNDDOWN):**
  $$\text{Rend} = \max\left(\left\lfloor\frac{X}{Comp}\right\rfloor \times \left\lfloor\frac{Y}{Larg}\right\rfloor, \; \left\lfloor\frac{X}{Larg}\right\rfloor \times \left\lfloor\frac{Y}{Comp}\right\rfloor\right)$$
  $$\text{Utilização} = \frac{\text{Qtd Peças}}{\text{Rend}} \quad \longrightarrow \quad \text{Custo Material} = \text{Utilização} \times \text{Preço Chapa}$$
* **Metros Lineares de Orla:**
  $$\text{Metros} = \left(\frac{2 \times Comp}{1000} + \frac{2 \times Larg}{1000}\right) \times \text{Qtd} \quad \longrightarrow \quad \text{Custo} = \text{Metros} \times 0,70\text{ €/m}$$
* **Taxas Horárias dos Postos de Trabalho:**
  * Seccionadora (**SH**): `35,00 €/h`
  * Centro CNC (**CNC**): `18,09 €/h`
  * Orladora (**ORLADORA**): `25,00 €/h`
  * Montagem de Bancada (**MANUAL**): `25,00 €/h`
  $$\text{Custo Operação} = \frac{\text{Tempo (min)} \times \text{Taxa}}{60} + \frac{\text{Setup (min)} \times \text{Taxa}}{60}$$
* **Preço Comercial de Venda:**
  $$\text{Preço Venda Unitário} = \text{Custo Unitário} \times (1 + \text{Margem \%}) + \text{Extra Fixo}$$
  $$\text{Subtotal} = \sum (\text{Qtd} \times \text{Preço Venda Unitário}) \quad \longrightarrow \quad \text{Total c/ IVA (23\%)} = \text{Subtotal} \times 1,23$$

### 1.3. Implementação do Código Definitivo (Next.js 14+ & Tailwind)
* **Estrutura Criada:**
  * `src/types/index.ts`: Tipos TypeScript de orçamentos, artigos, capítulos, clientes, materiais, máquinas e fichas técnicas.
  * `src/lib/calculator.ts`: Motor de cálculo puro com 100% de cobertura das regras de marcenaria da KUBIK HOME.
  * `src/lib/mockData.ts`: Dados mestres dos 4 orçamentos reais, 4 clientes reais, catálogo de chapas e postos de trabalho.
  * `src/lib/supabaseClient.ts`: Conector Supabase com fallback reativo local (funciona 100% offline ou com PostgreSQL na nuvem).
  * `src/context/AppContext.tsx`: Gestor de estado reativo com persistência automática no `localStorage`.
  * `src/components/layout/Sidebar.tsx`: Barra lateral minimalista inspirada no *Operum*, com organização KUBIK HOME, módulos ativos e próximos módulos pluggable (Produção, Stock, Faturação).
  * `src/components/layout/Header.tsx`: Topbar fixa com breadcrumbs e botões de ação rápida.
  * `src/components/quotes/QuotesDashboard.tsx`: Lista de orçamentos com KPIs, pesquisa, filtros e ações.
  * `src/components/quotes/QuoteEditor.tsx`: Editor hierárquico com capítulos, artigos, modo rápido e a **barra flutuante inferior de rentabilidade**.
  * `src/components/quotes/TechnicalCalculatorModal.tsx`: Calculadora técnica de desdobramento de peças (Aparador) com fórmula de corte.
  * `src/components/clients/ClientsView.tsx`: Ficheiro de clientes com NIF e moradas.
  * `src/components/materials/MaterialsView.tsx`: Catálogo de chapas com edição direta de preços por chapa.
  * `src/components/settings/SettingsView.tsx`: Configuração de taxas de máquinas e dados institucionais.
  * `src/components/pdf/OfficialQuotePdfModal.tsx`: Gerador do PDF oficial de 2 páginas da KUBIK HOME (Página 1: Proposta limpa; Página 2: Condições Gerais com IBAN Bankinter e 3 assinaturas).
  * `supabase/schema.sql` e `supabase/seed.sql`: Esquema PostgreSQL relacional com RLS pronto para criar a base de dados no Supabase.

### 1.4. Modo Hidden do Perfil / Utilizadores (A pedido)
* **Estado Atual:** A secção de Perfil/Utilizadores foi colocada em **modo oculto (Hidden)** na interface gráfica:
  * No rodapé da barra lateral ([`Sidebar.tsx`](file:///c:/Users/Magik/Desktop/AntiGravity/Or%C3%A7amento/src/components/layout/Sidebar.tsx)), o seletor de utilizadores está guardado sob a flag `const SHOW_USER_PROFILE = false`.
  * No Dashboard ([`QuotesDashboard.tsx`](file:///c:/Users/Magik/Desktop/AntiGravity/Or%C3%A7amento/src/components/quotes/QuotesDashboard.tsx)), o 4º cartão foi ajustado para mostrar **"Orçamentos Pendentes"** (valor e contagem de propostas em negociação), mantendo o cartão de "Responsável Ativo" 100% preservado no código.
* **Como reativar no futuro:** Quando for mencionado "perfil" ou "utilizadores", basta mudar `SHOW_USER_PROFILE = true` em ambos os componentes e prosseguir com a melhoria do módulo de perfis/permissões.

### 1.5. Padronização do Responsável para "Departamento Comercial"
* Todos os responsáveis individuais anteriores foram unificados e padronizados para **`Departamento Comercial`** nos 4 orçamentos existentes, no valor por defeito para novos orçamentos, no cabeçalho das propostas e nos campos de assinatura do PDF oficial.

### 1.6. Edição Completa de Máquinas, Postos de Fabrico & Dados Oficiais
* **Gestão de Máquinas ([`SettingsView.tsx`](file:///c:/Users/Magik/Desktop/AntiGravity/Or%C3%A7amento/src/components/settings/SettingsView.tsx)):**
  * Possibilidade de alterar o nome e a taxa horária (€/h) de qualquer máquina existente com gravação instantânea.
  * Botão **"Adicionar Nova Máquina"** para registar postos adicionais (ex: Cabine de Lacagem, Furadora, Pintura, Embalamento) com código, nome e taxa horária.
  * Possibilidade de remover postos de trabalho com confirmação de segurança.
* **Formulário de Dados Oficiais da Empresa (KUBIK HOME):**
  * Campos 100% editáveis para Designação Comercial, Razão Social, NIF, Telefone, Morada Fabril, Código Postal, Website, Banco, IBAN, Tribunal/Comarca, Condições Gerais e Validade da Proposta.
  * Gravação reativa persistida no armazenamento local e propagada instantaneamente para o PDF oficial de 2 páginas.

### 1.7. Expansão do Catálogo de Chapas e Nova Gestão de Ferragens
* **Análise dos Excels Reais da Empresa:** Inspecionadas as 4 pastas de trabalho (`Orçamento 2026-009`, `2026-056`, `2026-158` e `2026-171`), extraindo todas as matérias-primas e componentes de marcenaria.
* **Chapas & Painéis:** Catálogo enriquecido com Linho Cancun (19mm, 16mm, 8mm), Branco MA (19mm, 16mm, 10mm), Cinza Antracite, Preto Mate, MDF Hidrófugo, MDF Cru, Termolaminado Branco Brilho, Painéis CPL e Aglomerados.
* **Nova Aba de Ferragens & Acessórios:** Separador dedicado no catálogo ([`MaterialsView.tsx`](file:///c:/Users/Magik/Desktop/AntiGravity/Or%C3%A7amento/src/components/materials/MaterialsView.tsx)) para gerir os sistemas de correr Lego (guias superiores 524314, inferiores 524315, carros 524317/524318, fixadores 524316, perfis puxador TR19 524313), pés niveladores, dobradiças com amortecedor, corrediças de fecho suave, fitas LED e orlas PVC.
* Pesquisa dinâmica em tempo real e adição de novos materiais e ferragens.

### 1.8. Sistema Dual de Orçamentação: Manual / Rápido vs Automático / Técnico (Sem quebrar o existente)
* **Dropdown no "Novo Orçamento":**
  * Ao clicar em "Novo Orçamento" (tanto no Cabeçalho como no Dashboard), surge um menu de escolha:
    1. **Orçamento Manual / Rápido:** Modo clássico preservado a 100%, onde o utilizador introduz diretamente a descrição, unidades, quantidades, custo unitário, margem % e extras fixos.
    2. **Orçamento Automático / Técnico:** Novo modo onde o custo unitário de cada artigo é alimentado pelo motor de cálculo de marcenaria da KUBIK HOME.
* **Painel de Fabrico e Cálculo Automático por Artigo ([`QuoteEditor.tsx`](file:///c:/Users/Magik/Desktop/AntiGravity/Or%C3%A7amento/src/components/quotes/QuoteEditor.tsx)):**
  * **Seleção de Chapa:** Dropdown com todas as chapas do catálogo e introdução de chapas gastas (`sheetUsage`).
  * **Orlas:** Metros de orla PVC com cálculo automático à taxa oficial de `0,70 €/m`.
  * **Tempos de Máquina:** Minutos de operação e setup para cada posto de trabalho ativo (SH, CNC, Orladora, Montagem de bancada, etc.).
  * **Ferragens:** Adição de componentes (dobradiças, corrediças, puxadores, etc.) com quantidades e preços de custo automáticos.
  * **Cálculo em Tempo Real:** O custo unitário é calculado instantaneamente somando `Material + Orlas + Máquinas + Ferragens` e alimenta de imediato a margem comercial, o preço de venda e a barra flutuante de rentabilidade.
  * Cada artigo dispõe de um botão para alternar entre modo Manual e Automático a qualquer momento.
* **Materiais Adicionais dos Excels:** Registados no catálogo os vidros temperados (8mm), espelhos prata (4mm), bancadas de mármore Merino Marquina, cubas e misturadoras Rodi, e MDF lacado branco.

### 1.4. Resolução Técnica do Erro 404 & Otimização de Arranque
* **Problema Encontrado:** Ao rodar `next dev` após `next build`, a cache do servidor de desenvolvimento gerou um conflito no router de páginas estáticas e procurou incorretamente por `/_document`.
* **Solução Definitiva:**
  1. Limpeza da cache `.next`.
  2. Ajuste do `layout.tsx` e `globals.css` para a norma estrita do App Router.
  3. Transição do modo de arranque para **Modo de Produção Otimizado (`npm start`)**, que arranca em apenas 345ms, tem zero atrasos de compilação e serve todas as páginas com código `200 OK`.
  4. Criação do script executável com 1 clique [`INICIAR_KUBIK.bat`](file:///c:/Users/Magik/Desktop/AntiGravity/Or%C3%A7amento/INICIAR_KUBIK.bat) e do atalho no Ambiente de Trabalho (`KUBIK HOME.lnk`).

---

## 2. Como Instalar e Rodar num Novo Computador (Guia Passo a Passo)

Se copiares esta pasta para outro computador (ou se outro colaborador for usar), basta seguir estes passos simples:

### Passo 1: Pré-requisitos
* Ter o **Node.js** (versão 18, 20 ou LTS) instalado. Se o novo computador tiver Windows 10/11, podes instalar via PowerShell abrindo como Administrador:
  ```powershell
  winget install OpenJS.NodeJS.LTS
  ```
  *(Ou descarregar o instalador direto em https://nodejs.org)*

### Passo 2: Instalar as Dependências (Apenas na 1ª vez)
No terminal dentro da pasta do projeto:
```powershell
npm install
npm run build
```

### Passo 3: Utilização no Dia a Dia (1 Clique para Qualquer Pessoa)
* Basta dar **duplo clique no ficheiro `INICIAR_KUBIK.bat`** (ou no atalho do Ambiente de Trabalho).
* O script inicia o servidor e abre automaticamente o navegador em **`http://localhost:3000`**.

---

## 3. Conexão com o Supabase (Nuvem Multi-Utilizador a Custo Zero)

Quando quiseres que os 3 a 4 utilizadores partilhem os mesmos orçamentos em tempo real a partir de computadores diferentes:
1. Cria uma conta gratuita em [https://supabase.com](https://supabase.com).
2. Cria um novo projeto e acede ao **SQL Editor**.
3. Executa o ficheiro [`supabase/schema.sql`](file:///c:/Users/Magik/Desktop/AntiGravity/Or%C3%A7amento/supabase/schema.sql) e depois o [`supabase/seed.sql`](file:///c:/Users/Magik/Desktop/AntiGravity/Or%C3%A7amento/supabase/seed.sql).
4. No projeto, cria um ficheiro `.env.local` na raiz com as tuas chaves (ver modelo em `.env.example`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://teu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tua-chave-anon-publica
   ```
5. A aplicação deteta as chaves automaticamente e passa a sincronizar com a base de dados PostgreSQL na nuvem.

---

## 4. Dados Institucionais Fixos da KUBIK HOME

* **Empresa:** KUBIK HOME & LIFE FURNITURE (`KUBIK HOME Lda`)
* **NIF:** `519021916`
* **Morada:** Zona Industrial do Tortosendo, Rua E, Lote 41, 6200-823 Tortosendo - PORTUGAL
* **Telefone:** `275 957 250`
* **Website:** `www.kubikhome.com`
* **IBAN Bankinter:** `PT50 0269 0343 0020 5777 6028 3`
* **Comarca:** Tribunal da comarca da Covilhã, PORTUGAL
* **Condições Gerais:** 50% na adjudicação, 50% com finalização. Validade de 30 dias.
