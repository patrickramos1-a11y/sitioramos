## Fase 1 — Backup de Dados (Export/Import JSON)

### Objetivo
Permitir duplicar todos os dados estruturados entre cópias do projeto via um arquivo `.json`. Sem ZIP, sem anexos, sem fotos/áudios, sem credenciais.

---

### 1. Nova página `/backup`

- Rota nova `src/pages/Backup.tsx`, registrada em `src/App.tsx`.
- Adicionar item "Backup" no menu (sidebar desktop + bottom nav, se couber, ou apenas como sub-item nas configurações).
- Layout simples, mobile-first, seguindo design system (sem cores custom):
  - **Bloco 1 — Exportar:** descrição + botão "Exportar dados em JSON".
  - **Bloco 2 — Importar:** upload `.json` → botão "Validar arquivo" → card de resumo → botão "Confirmar importação" → card de relatório.

---

### 2. Tabelas incluídas no backup

Lista única e centralizada (`src/lib/backup/schema.ts`) com a ordem correta de export/import (pais antes de filhos):

```
propriedade
responsaveis
contatos
talhoes
areas
cycles
cycle_stages
cycle_stage_history
cycle_area_allocations
culture_cost_templates
stage_templates
fin_naturezas
fin_centros_custo
fin_categorias
fin_projetos_investimento
loans
installments
costs
revenues
investments
cash_transactions
fin_classificacoes
operational_stages
operational_tasks
task_checklist_items
task_logs
operation_change_logs
journal_entries
journal_points
diary_geometries
territorial_events
```

Excluídos: `journal_attachments` (anexos = Fase 2), tabelas de auth, secrets, qualquer dado de infra.

---

### 3. Camada de exportação — `src/lib/backup/exporter.ts`

- Função `exportAllData(): Promise<BackupFile>`.
- Para cada tabela da lista, faz `supabase.from(t).select('*')` com paginação (range de 1000 em 1000) para passar do limite default.
- Monta:

```json
{
  "manifest": {
    "app": "Sítio Ramos",
    "backup_version": "1.0",
    "schema_version": "1",
    "generated_at": "<ISO>",
    "backup_id": "<uuid>",
    "counts": { "areas": 8, "cycles": 4, ... }
  },
  "data": { "<tabela>": [ ...rows ] }
}
```

- Download via `Blob` + `URL.createObjectURL`, nome `sitio-ramos-backup-YYYY-MM-DD-HHmm.json`.
- Guardar `last_export_at` + `last_backup_id` em `localStorage` para exibir "Último backup".

---

### 4. Camada de importação — `src/lib/backup/importer.ts`

**4.1 Parse + validação**
- Lê o arquivo, faz `JSON.parse`, valida com Zod:
  - manifest obrigatório com `backup_version`, `schema_version`, `generated_at`.
  - `data` é objeto, chaves devem estar no whitelist da lista de tabelas (chaves desconhecidas → ignoradas com warning).
  - `backup_version` compatível (`major` igual ao atual).
- Erros claros: "Arquivo de backup inválido", "Versão de backup incompatível", etc.

**4.2 Resumo (pré-import)**
- Conta registros por tabela e total → renderizado no card.
- Detecta duplicidade: se `manifest.backup_id` está em `localStorage.imported_backups[]` → aviso "Este backup parece já ter sido importado".
- Detecta ambiente não-vazio: faz `select count` em algumas tabelas-chave (`areas`, `cycles`, `cash_transactions`); se >0 → aviso "Este ambiente já possui dados. A importação pode gerar duplicidades."

**4.3 Execução**
- Estratégia: **preservar IDs**. Como todos os PKs são UUIDs, basta `upsert(rows, { onConflict: 'id', ignoreDuplicates: true })` por tabela na ordem do schema.
- Lotes de 500 registros por chamada.
- Filtrar colunas para apenas as conhecidas (defensivo contra schema drift): para cada linha, manter só as keys presentes no primeiro row buscado do destino OU simplesmente enviar tudo e deixar Postgres reclamar (preferimos primeira opção via probe `select * limit 0`).
- Acumular relatório: por tabela → `{ inserted, skipped, errors: [{id, message}] }`.

**4.4 Vínculos**
- Como preservamos IDs e a ordem respeita dependências, FKs entre tabelas continuam válidas automaticamente.
- Nenhum mapeamento `old_id → new_id` é necessário nesta fase.

**4.5 Pós-import**
- Salvar `backup_id` em `localStorage.imported_backups`.
- Mostrar card de relatório com totais, opção "Baixar relatório" (JSON) e "Copiar".

---

### 5. UI — componentes em `src/components/backup/`

- `ExportCard.tsx` — botão, loading state, último export.
- `ImportCard.tsx` — input file, estados: `idle | parsing | validated | importing | done | error`.
- `BackupSummary.tsx` — tabela compacta de contagens.
- `ImportReport.tsx` — totais + lista de erros + ações de download/cópia.

Usa `useToast` para feedback rápido; nenhum diálogo nativo bloqueante.

---

### 6. Segurança

- O exporter **só toca nas tabelas da whitelist** — secrets, auth.*, storage.*, edge functions, env vars nunca são acessados.
- Nada de `service_role`; usa o client anon já configurado. Como o projeto tem RLS aberto (public), o anon consegue ler tudo. (Documentar em comentário no exporter que numa futura versão multi-tenant isso precisa ser revisto.)
- Validação de tamanho: arquivo até ~50MB no upload; acima disso, aviso.

---

### 7. Arquivos novos

- `src/pages/Backup.tsx`
- `src/lib/backup/schema.ts` (lista ordenada + tipos)
- `src/lib/backup/exporter.ts`
- `src/lib/backup/importer.ts`
- `src/components/backup/ExportCard.tsx`
- `src/components/backup/ImportCard.tsx`
- `src/components/backup/BackupSummary.tsx`
- `src/components/backup/ImportReport.tsx`

### Arquivos alterados

- `src/App.tsx` — rota `/backup`.
- `src/components/layout/AppSidebar.tsx` (+ mobile nav se fizer sentido) — link "Backup".

### Fora do escopo (Fase 2)

- ZIP com anexos (`journal-media`, fotos, áudios, KML/KMZ).
- Backup automático/agendado.
- Mesclagem inteligente (conflict resolution além de "skip duplicate").
- Migração entre `schema_version` diferentes.
