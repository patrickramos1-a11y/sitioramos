## Plano — Refatoração da aba Operação

### 1. Hierarquia: Projeto → Subprojeto → Subdemanda → Subtarefa
**Modelo de dados** (`operational_stages` já tem `parent_id` recursivo):
- Adicionar coluna `nivel_tipo` (`projeto` | `subprojeto` | `subdemanda`) em `operational_stages` para semântica visual.
- Subtarefas continuam em `operational_tasks` (já vinculam via `stage_id`).
- Migração: backfill `nivel_tipo` baseado em profundidade atual.

**UI (`Operacao.tsx` + novo `ProjectActionsMenu.tsx`):**
- Ao clicar em um item da timeline/lista, abrir menu contextual com:
  - ➕ Criar subprojeto
  - ➕ Criar subdemanda
  - ➕ Criar subtarefa
  - ✏️ Editar / 🔗 Vincular / 🗑️ Excluir
- `useOperations` passa a montar árvore recursiva (não só 2 níveis).
- `GanttTimeline` renderiza `level` dinâmico com indentação.

### 2. Formulário de cadastro com datas sincronizadas (`OperationForm.tsx`)
- **Início padrão = hoje** (`new Date().toISOString().split('T')[0]`) quando criando.
- Novo bloco **"Duração rápida"** com chips clicáveis: `+7d`, `+15d`, `+30d`, `+60d`, `+90d`, `+1 sem`, `+1 mês`. Cada clique soma ao valor atual.
- **Sincronização bidirecional:**
  - Alterar duração → recalcula `data_fim_prevista` = início + dias.
  - Alterar `data_fim_prevista` manualmente → recalcula duração = fim − início + 1.
  - Alterar início → mantém duração e recalcula fim.
- Centralizar lógica em hook `useDateDurationSync`.

### 3. Checklist dentro de subtarefas
**Banco:** nova tabela
```text
task_checklist_items
  id uuid pk
  task_id uuid -> operational_tasks
  texto text
  concluido boolean default false
  ordem int
  created_at, updated_at
```
RLS pública igual `operational_tasks`.

**UI (`TaskForm.tsx` + novo `TaskChecklist.tsx`):**
- Seção "Checklist" no form da subtarefa: input + botão "Adicionar item".
- Cada item: checkbox, texto editável, botão remover.
- Barra de progresso: `concluídos / total` em %.
- Hook `useTaskChecklist(taskId)` com mutations.

### 4. Vincular projetos entre si
- Adicionar campo `linked_project_id` em `operational_stages` (uuid, nullable).
- Em todos os formulários (OperationForm, TaskForm, QuickOperationSheet) adicionar Select **"Vincular a outro projeto"** (lista projetos raiz + subprojetos).
- Visualmente: ícone 🔗 ao lado do nome quando vinculado, com tooltip mostrando o projeto pai vinculado.
- Permite "promover" um item: trocar `parent_id` para outro projeto via menu contextual.

### 5. Botão "Hoje" — recentralizar timeline
**Bug atual:** `centerOnToday` só ajusta `anchorDate`, mas o `ScrollArea` mantém posição.

**Fix em `GanttTimeline.tsx`:**
- Após `setAnchorDate`, em `useEffect([anchorDate])`, calcular offset de `today` em pixels e usar `scrollLeft` do viewport do `ScrollArea` para centralizar.
- Garantir que ponteiro vermelho ("HOJE") sempre fique no centro visível ao clicar.

### 6 & 7. Identidade visual das barras
**`GanttTimeline.tsx` + `lib/operacaoConfig.ts`:**
- Mapa `CATEGORY_VISUAL`:
  - `agricola` → verde + 🌱
  - `documentacao` → azul + 📄
  - `manutencao` → laranja + 🔧
  - `financeiro` → dourado + 💰
  - `logistica` → roxo + 🚚
  - etc.
- Barras ganham:
  - **Outline colorido 2px** com cor da categoria.
  - **Glow suave** via `box-shadow: 0 0 8px hsl(var(...) / 0.4)`.
  - **Borda lateral 4px** (já existe) + **gradiente sutil** no fundo.
  - Ícone da categoria dentro da barra (à esquerda do nome).
- Tudo via tokens HSL no `index.css` (sem cores hardcoded em componentes).

### Arquivos a alterar/criar
- **Migrações:** add `nivel_tipo`, `linked_project_id`, criar `task_checklist_items`.
- **Criar:** `src/components/operacao/ProjectActionsMenu.tsx`, `TaskChecklist.tsx`, `src/hooks/useTaskChecklist.ts`, `src/hooks/useDateDurationSync.ts`.
- **Editar:** `OperationForm.tsx`, `TaskForm.tsx`, `QuickOperationSheet.tsx`, `GanttTimeline.tsx`, `Operacao.tsx`, `useOperations.ts`, `lib/operacaoConfig.ts`, `index.css`.

### Notas técnicas
- Preservar ordem estável já implementada (sort por `ordem`, depois `created_at`).
- Itens concluídos continuam mantendo posição (apenas mudam de cor).
- Manter mobile-first: chips de duração responsivos, menu contextual via Sheet no mobile.
