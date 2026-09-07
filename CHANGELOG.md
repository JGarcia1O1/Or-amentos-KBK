# Changelog KUBIK HOME

## [Atualização Atual] - 2026-09-03

### Adicionado
- **Sistema de Ficheiros Local**: Migração do armazenamento de orçamentos (localStorage) para gravação física em .json organizados em \Orcamentos_Data/Ano/Mes/\.
- **Leitor de PDFs (Auto-Recovery)**: Implementado \pdf-parse\ na API Next.js para ler e importar automaticamente PDFs órfãos colocados na pasta de dados.
- **Numeração Dinâmica**: Orçamentos assumem automaticamente formato \YYYY-MDD\ (ex: 2026-903) com prevenção de colisões.
- **Campo de Observações**: Nova área no Editor para documentação de obra e dados de faturação, refletida na zona inferior do PDF.
- **Smart Download PDF**: O navegador sugere agora de forma automática o nome do ficheiro PDF como \KUBIK Orçamento 2026-903 (PrimeiroNome UltimoNome).pdf\.

### Alterado
- **Design do PDF Oficial**: Adotado um grid minimalista (remoção de bordas laterais das tabelas).
- **Paginação do PDF**: Corrigido o erro das margens de topo quebrando o cabeçalho nas páginas seguintes, com injeção de \padding\ em \	head\/\	foot\ repetidos.
- **Condições Gerais**: Renderizadas obrigatoriamente numa quebra de página dedicada (page-break-before) no fim do documento.
- **Edição Livre**: O Número do Orçamento deixou de ser estático e passou a ser um campo de input de texto no editor.

### Corrigido
- Tratamento de importação da biblioteca \pdf-parse\ para compatibilidade total com o compilador do Next.js.
- Prevenção de bloqueio da IU quando dados de Email do cliente estavam incompletos (remoção de restrições HTML5 strítas).
