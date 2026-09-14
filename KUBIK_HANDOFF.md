# KUBIK Software - Project Handoff & Architecture Document

Este documento contém toda a arquitetura, regras de negócio, estrutura de base de dados e lógicas matemáticas do KUBIK Software. **Destina-se a qualquer IA (como o Claude)** para que compreenda imediatamente o projeto sem quebrar código, design ou lógicas existentes.

## 1. Stack Tecnológica e Conexões
- **Frontend/Framework:** Next.js 14 (App Router / Pages misto, tipicamente App based), React, TypeScript.
- **Estilização:** TailwindCSS. Design minimalista, tons `gray-50` a `gray-900`, `blue-600` para destaques. Ícones via `lucide-react`.
- **Backend & Database:** Supabase (PostgreSQL).
- **Hosting / Deploy:** Vercel. O deploy é feito automaticamente a partir do branch `main` no GitHub.
- **Repositório Git:** `https://github.com/JGarcia1O1/Or-amentos-KBK.git`

### 1.1 Credenciais e Variáveis de Ambiente
O projeto conecta-se ao Supabase utilizando as variáveis de ambiente presentes no `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Base de Dados (Supabase) - Regras de Ouro
1. **Row Level Security (RLS) DESATIVADO:** O RLS está **desativado** nas tabelas principais (`clients`, `quotes`, `materials`, `hardware`, `workstations`, `edges`, `quote_backups`). Isto foi feito propositadamente para garantir que todos os utilizadores (ex: "gestor" ou outros) tenham acesso partilhado a todo o inventário e orçamentos sem conflitos de permissões.
2. **NUNCA Eliminar Dados/Colunas:** Em caso de migrações, **nunca** fazer `DROP COLUMN`. Usar sempre `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Preservar retrocompatibilidade é crítico.
3. **Mapeamento CamelCase vs snake_case:** No frontend usa-se camelCase (ex: `postalCode`, `clientName`). No Supabase usa-se snake_case (ex: `postal_code`, `client_name`). O mapeamento é feito manualmente no `AppContext.tsx` e no `QuoteService.ts`.

### 2.1 Tabelas Principais
- `quotes`: Guarda todos os orçamentos (JSONB para `chapters` e items).
- `quote_backups`: Tabela "Caixa Negra". Um Triger no Postgres guarda automaticamente um snapshot (JSON) do orçamento quando o estado muda para 'Apresentado', 'Adjudicado' ou 'Concluído'.
- `clients`: Dados de faturação. Recentemente os campos `postal_code` e `city` foram separados da morada global por razões de formatação no PDF.
- Tabelas de Inventário: `materials` (Chapas), `hardware` (Ferragens), `workstations` (Módulos/Fábrica), `edges` (Orlas).

## 3. Lógica Core e Funcionalidades Críticas

### 3.1 Geração de Orçamentos e "Sub-tópicos" (Hierarquia)
- Um Orçamento (`Quote`) tem Capítulos (`QuoteChapter`), que contêm Artigos (`QuoteItem`).
- Os Artigos têm uma flag booleana `isSubItem`. 
- **Lógica de Numeração Dinâmica:** No `QuoteEditor.tsx` e no `OfficialQuotePdfModal.tsx`, não se grava o número fixo (como "1.1.1") na base de dados. O número é gerado "on-the-fly" com base na flag `isSubItem`.
  - Se `isSubItem = false`, o contador principal avança (ex: 1.1, 1.2).
  - Se `isSubItem = true`, avança o sub-contador (ex: 1.2.1, 1.2.2).
  - Visualmente, sub-itens ganham um recuo (`pl-6` ou `pl-8`) e um traço de formatação estética no PDF.

### 3.2 PDF Generation
- O PDF não usa bibliotecas pesadas de conversão. Baseia-se no componente `OfficialQuotePdfModal.tsx` que renderiza um layout HTML otimizado para impressão (A4).
- Ao clicar em "Imprimir/PDF", a app esconde o UI e dispara `window.print()`.

### 3.3 Dedução Automática de Stock
- No `QuoteEditor.tsx`, dentro da função `handleStatusChange`: Quando o estado do orçamento passa para **'Adjudicado'**, o sistema percorre todos os artigos de *Cálculo Automático*, lê o `materialCode` e a quantidade gasta (`quantity * sheetUsage`), e **abate automaticamente** essa quantidade ao stock na tabela `materials`.

### 3.4 Modo de Cálculo de Preços (Fórmulas em `src/lib/calculator.ts`)
Existem dois modos principais num Artigo (`QuoteItem`):
1. **Manual/Rápido (`calculationMode: 'quick'`):** O utilizador introduz o `costUnit` diretamente. A Venda é calculada somando o `fixedExtra` e aplicando a margem: 
   `sellUnit = (costUnit + fixedExtra) / (1 - marginPercent)`
2. **Automático (`calculationMode: 'automatic'`):** Baseado na sub-estrutura `automaticConfig`. O `costUnit` é calculado dinamicamente somando:
   - **Materiais:** `sheetUsage * pricePerSheet`
   - **Orlas:** `edgeBandingMeters * edgeBandingRate`
   - **Operações Fabris (Workstations):** `((opMin + setupMin) / 60) * hourRate`
   - **Ferragens (Hardware):** Somatório de `quantity * cost` de todas as ferragens adicionadas àquele móvel.
   *(Nota: O valor final `sellUnit` usa a mesma fórmula de divisão pela margem, protegendo o lucro real do projeto).*

## 4. Conexões e Workflow de Deploy (Vercel + GitHub + Supabase)
Para que a IA consiga testar e colocar alterações em produção de forma segura, eis o workflow:
1. **GitHub e Vercel:** O projeto está ligado à Vercel através do repositório GitHub (`JGarcia1O1/Or-amentos-KBK`).
   - Sempre que um commit é feito na branch `main` (`git push origin main`), a Vercel inicia automaticamente o processo de *Build* e *Deploy* para produção.
   - **Regra de Ouro do Vercel:** A Vercel cancela o deploy se houver o mínimo erro de TypeScript. Por isso, a IA deve sempre verificar os tipos no `src/types/index.ts` antes de fazer push. Para testar localmente, a IA deve executar `npm run build`.
2. **Supabase Client:** A comunicação com o Supabase é instanciada no ficheiro `src/lib/supabase.ts` via `@supabase/supabase-js`.
   - Utiliza exclusivamente as credenciais públicas presentes no `.env.local` (`NEXT_PUBLIC_...`). Não há backend Node.js separado, o Next.js interage diretamente com o PostgREST API da Supabase a partir do cliente ou de Server Components.

## 5. Instruções Diretas para a IA / LLM (Claude, etc.)
1. **ESTADO DA ARTE:** Todo o código atual funciona perfeitamente e está em produção (estável). Não reescrevas ficheiros inteiros a menos que explicitamente solicitado.
2. **ROOT DIRECTORY:** O projeto encontra-se localmente em `C:\Users\user\Desktop\KUBIK Software`.
3. **DESIGN:** Mantém o design visual rigorosamente intacto. Qualquer novo botão deve usar os padrões Tailwind já existentes (ex: `px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 text-xs font-semibold`). Não inventar paletas de cores novas.
4. **CONTEXTO DE FICHEIROS CHAVE:** 
   - `src/types/index.ts`: Source of truth para TypeScript interfaces. Começa sempre por atualizar isto.
   - `src/context/AppContext.tsx`: Gestor de Estado Global e lógica de Fetch/Sincronização com o Supabase.
   - `src/services/quoteService.ts`: Funções de leitura e gravação (Upsert) da Supabase para Orçamentos.
   - `src/components/quotes/QuoteEditor.tsx`: O coração do software (lógica complexa de edição, stock e sub-tópicos).
5. **ERROS COMUNS A EVITAR:**
   - **Mapeamento SQL:** Se adicionares um novo campo a uma interface (ex: `postalCode`), garante que o mesmo é mapeado de e para `snake_case` (`postal_code`) nos métodos do `AppContext.tsx` e `QuoteService.ts`. O Supabase rejeita saves silenciosamente se a chave não existir.
   - **Paginação 1000 items:** O Supabase PostgREST tem um limite `max_rows` padrão de 1000. A tabela `materials` (inventário) tem mais de 1000 itens. Utiliza-se um ciclo `while` com paginação nativa (`.range(from, to)`) no `fetchCatalog` do `AppContext.tsx`. Nunca apagues essa lógica.
   - **RLS em novas tabelas:** Se criares uma tabela nova no Supabase, lembra-te sempre de executar `ALTER TABLE public.nome_da_tabela DISABLE ROW LEVEL SECURITY;` para não bloquear os inserts/updates.
