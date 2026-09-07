# KUBIK Platform - Contexto Global para o Agent KUBIK (Antigravity)

Este documento contem o estado absoluto e atualizado do projeto **KUBIK Home & Life Furniture**. 
Sempre que iniciares uma sessao neste projeto no teu novo PC, usa este ficheiro como a tua Biblia para garantires que nao quebras a arquitetura existente.

## 1. Visao Geral do Projeto
Trata-se de um ERP/CRM interno feito a medida para uma carpintaria/empresa de moveis. O objetivo principal e fazer a gestao de clientes, criacao de orcamentos complexos (com calculo de materiais, ferragens e mao de obra), levantamentos de obra, geracao de PDFs oficiais e exportacao de backups.

## 2. Stack Tecnologica
- **Frontend/Framework:** Next.js 14 (App Router), React, TypeScript.
- **Styling:** Tailwind CSS + Lucide React (icones).
- **Backend/Database:** Supabase (PostgreSQL + Auth + Row Level Security).
- **Alojamento/Deploy:** Vercel (CI/CD automatico via GitHub).
- **Repositorio:** GitHub (`https://github.com/JGarcia1O1/Or-amentos-KBK.git`).

## 3. Arquitetura e Decisoes Criticas (NAO ALTERAR)

### A. Ficheiros Locais vs Cloud (Vercel)
**Atencao Maxima:** No inicio, o projeto escrevia PDFs e ficheiros JSON diretamente para o disco `C:\`. Como a plataforma agora esta na **Vercel (Serverless)**, nao existe sistema de ficheiros persistente.
- **Backups:** Foram movidos para o modulo "Configuracoes" via Exportar/Importar `.json` pelo Browser (Blob API).
- **PDFs:** Sao gerados exclusivamente pelo lado do cliente. Usamos modais (`OfficialQuotePdfModal`, `SiteVisitPdfPreview`) com Tailwind `@media print` (`print:block`, `print:hidden`). O comercial clica em "Imprimir" e abre o dialogo nativo do browser. Nunca tentes gerar PDFs via Node.js/Server API.

### B. Base de Dados (Supabase) & RBAC
A app usa Row Level Security (RLS). Os dados nao podem vazar entre vendedores.
- **Tabelas Principais:** `quotes`, `clients`, `site_visits`, `user_roles`.
- **RBAC:** Existe a tabela `user_roles` (admin, gestor, trabalhador). Um `admin` pode ler/escrever tudo. Um `vendedor` so acede aos `quotes` e `site_visits` onde `user_id = auth.uid()`.
- **Cuidado com RLS Recursivo:** Nunca facas politicas RLS na tabela `user_roles` que facam `SELECT` na propria `user_roles`. Isso causa *Infinite Recursion*. Usa sempre `user_id = auth.uid()` para verificacoes primarias.
- **Criacao de IDs:** Deixa o Supabase criar os UUIDs (`DEFAULT gen_random_uuid()`). O frontend usa IDs temporarios (`temp-1234`), mas garante que esses IDs sao apagados antes do Upsert para o PostgreSQL nao dar erro de "Invalid input syntax for type uuid".

### C. Compilacao e Vercel Quirks
- **Erro SWC Unicode Escape:** O compilador da Vercel "engasga-se" com interpolacoes literais dentro dos blocos `throw new Error`. Usa sempre concatenacao de strings pura (`'Erro: ' + error.message`) nos ficheiros de servico (`VisitService`, `QuoteService`).
- **Scripts de Correcao:** Sempre que precisares de corrigir codigo no Windows, usa scripts em **Node.js** (`fs.writeFileSync`). Nunca uses `echo ""` no PowerShell, pois ele injeta caracteres nulos `UTF-16 LE BOM` invisiveis que corrompem o compilador TypeScript (`tsc`).

## 4. Modulos Atuais
1. **Orcamentos:** (Completo). Calculo de custos, aplicacao de margens e IVA, e geracao do A4 oficial com logotipo KUBIK.
2. **Clientes:** (Completo). Gestao da carteira de clientes.
3. **Catalogos (Chapas, Maquinas, Ferragens):** (Completo). Gestao de tabelas de precos globais.
4. **Fichas de Obra (Levantamentos):** (Recente). Onde os tecnicos registam medidas. Gera uma Ficha Tecnica PDF limpa (com checklist e fundo pontilhado) no mesmo estilo oficial dos Orcamentos.
5. **Configuracoes Globais:** (Completo). Inclui gestao de Backups JSON bidirecionais.
6. **Emails Automaticos:** (Completo). Modelos de follow-up pos-orcamento.

## 5. Proximos Passos (Roadmap)
Os modulos que estao "Em Breve" na barra lateral e que representam o futuro da aplicacao sao:
- **Producao & Obras**
- **Stock & Encomendas**
- **Faturacao**

## 6. Rotina de Trabalho Padrao do Agente
1. Receber o pedido do utilizador.
2. Usar comandos `grep` ou scripts em Node para verificar como estao estruturados os ficheiros antes de os alterar.
3. Fazer as alteracoes.
4. Fazer **sempre** `npx tsc --noEmit --jsx react` para garantir que nada partiu.
5. Fazer push para o Git (`git add src; git commit -m "..."; git push`). A Vercel cuida do resto automaticamente.
