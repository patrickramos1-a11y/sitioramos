## Timeline e Etapas dos Ciclos Produtivos

Vou criar uma gestão completa de etapas dentro de cada ciclo, com timeline visual reaproveitando a lógica de `CycleTimeline.tsx` (já existente em Operação).

---

### 1. Banco de dados (migration)

Nova tabela **`cycle_stages`** (etapas específicas do ciclo agronômico, separadas das `operational_stages` que são da página Operação):

- `cycle_id` (uuid, obrigatório)
- `nome` (text)
- `descricao` (text)
- `ordem` (int)
- `inicio_relativo_dias` (int) — dia 0 = início do ciclo
- `duracao_dias` (int)
- `status` (text: nao_iniciada | em_andamento | concluida | atrasada | cancelada)
- `responsavel_id` (uuid)
- `observacoes` (text)
- `created_at`, `updated_at`

Alterar **`cycles`**:
- `duracao_total_dias` (int, opcional) — calculado da última etapa se vazio

Alterar **`operational_tasks`** e **`cash_transactions`**:
- adicionar `cycle_stage_id` (uuid) — vínculo opcional de tarefas/custos a uma etapa específica

Alterar **`journal_entries`**:
- adicionar `cycle_stage_id` (uuid) para vincular registros do diário a etapas

RLS público (mesmo padrão das demais tabelas).

---

### 2. Lógica (lib + hook)

**`src/lib/cycles/stageCalc.ts`** — funções puras:
- `computeStageDates(cycleStart, stage)` → `{ dataInicio, dataFim }`
- `computeAutoStatus(stage, today)` → status sugerido pelas datas
- `computeCurrentStage(stages, today, cycleStart)` → etapa atual
- `computeProgress(stages, tasks, today, cycleStart)` → `{ porTempo, porEtapas, porTarefas }`
- `getAlerts(cycle, stages)` → lista de alertas (atraso, sem resp, sem tarefas, etc.)

**`src/hooks/useCycleStages.ts`** — CRUD via React Query (lista por `cycle_id`, create/update/delete).

---

### 3. UI

**Nova página `src/pages/CicloDetalhe.tsx`** (rota `/ciclos/:id`):
- Header: cultura, ícone/cor, datas, progresso (3 barras: tempo/etapas/tarefas), etapa atual em destaque
- Alertas no topo (banner discreto)
- Tabs: **Timeline** | **Etapas** | **Tarefas** | **Custos** | **Diário** | **Áreas vinculadas**
- Botão "Nova Etapa" e "Duplicar de outro ciclo"

**`src/components/cycles/CycleStageTimeline.tsx`** — timeline visual:
- **Desktop**: timeline horizontal (CSS grid baseado em dias do ciclo, com barras coloridas por status, marker do dia atual) — reusa padrão visual de `GanttTimeline`
- **Mobile**: lista vertical reaproveitando estética de `CycleTimeline.tsx`, com destaque para etapa atual

**`src/components/cycles/CycleStageForm.tsx`** — dialog de criar/editar etapa:
- nome, descrição, início_relativo_dias, duracao_dias, responsável, observação
- preview das datas calculadas em tempo real

**`src/components/cycles/DuplicateStagesDialog.tsx`** — escolher ciclo origem e copiar suas etapas (preparação para futuros "modelos por cultura").

**Em `src/pages/Ciclos.tsx`** (lista):
- card do ciclo passa a mostrar etapa atual e barra de progresso
- clique abre `/ciclos/:id`

**Em `src/components/cycles/CycleForm.tsx`**:
- adicionar campo `duracao_total_dias` (opcional)

---

### 4. Integrações

- **Tarefas**: `TaskForm` ganha select opcional "Etapa do ciclo" quando há `cycle_id`
- **Custos** (`cash_transactions`): no diálogo de lançamento financeiro, quando há `cycle_id`, permite escolher etapa
- **Diário**: `JournalEntries` ganha select de etapa quando há `cycle_id`
- **Indicadores por etapa**: somatório de custos (cash_transactions filtradas por `cycle_stage_id`) e contagem de tarefas

---

### 5. Critérios de aceite cobertos

Todos os 11 critérios da seção 18 do pedido — duração total, etapas com início relativo, datas calculadas, etapa atual, timeline, tarefas/custos por etapa, progresso, vínculo com diário, responsivo desktop/mobile.

---

### Arquivos

**Migration**: `cycle_stages` + alterações em `cycles`, `operational_tasks`, `cash_transactions`, `journal_entries`

**Criar**:
- `src/lib/cycles/stageCalc.ts`
- `src/hooks/useCycleStages.ts`
- `src/pages/CicloDetalhe.tsx`
- `src/components/cycles/CycleStageTimeline.tsx`
- `src/components/cycles/CycleStageForm.tsx`
- `src/components/cycles/CycleStageList.tsx`
- `src/components/cycles/DuplicateStagesDialog.tsx`

**Editar**:
- `src/App.tsx` (rota `/ciclos/:id`)
- `src/pages/Ciclos.tsx` (link + etapa atual no card)
- `src/components/cycles/CycleForm.tsx` (`duracao_total_dias`)
- `src/components/operacao/TaskForm.tsx` (select etapa)
- `src/components/financeiro/NovoLancamentoDialog.tsx` (select etapa)
- formulário do diário (select etapa)

Confirma que posso seguir?