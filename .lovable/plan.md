

# Plano: Refatoracao Completa do Modulo de Operacoes

## Resumo

Transformar o modulo Operacao de uma lista simples de tarefas em um sistema hierarquico com visualizacao Gantt (timeline), estruturado em 3 niveis: **Operacao Principal** (projeto) > **Suboperacoes/Etapas** > **Tarefas**, com integracao financeira e controle cronologico completo.

## Situacao Atual

- 1 tarefa cadastrada, 0 etapas
- Tabelas `operational_stages` e `operational_tasks` ja existem no banco
- Visualizacao atual: lista plana de tarefas com filtros por status
- Sem hierarquia, sem timeline, sem integracao financeira real

## Arquitetura da Solucao

```text
Operacao Principal (operational_stages com parent_id = null)
  └── Suboperacao / Etapa (operational_stages com parent_id)
        └── Tarefa (operational_tasks com stage_id)
```

Reutilizamos a tabela `operational_stages` para os niveis 1 e 2 (operacao principal e suboperacoes), adicionando um campo `parent_id` para criar a hierarquia. Tarefas continuam em `operational_tasks`.

---

## Fase 1 — Banco de Dados (Migracao)

**Alterar `operational_stages`:**
- Adicionar `parent_id uuid` (referencia a si mesma, nullable) — permite hierarquia
- Adicionar `custo_total numeric default 0` — consolidacao de custos

**Alterar `operational_tasks`:**
- Adicionar `parent_task_id uuid` (nullable) — para sub-tarefas opcionais

Nenhuma tabela nova. A tarefa existente sera preservada.

---

## Fase 2 — Hooks Refatorados

### `useOperations.ts` (novo hook principal)
- Busca `operational_stages` onde `parent_id IS NULL` como "Operacoes Principais"
- Busca sub-stages onde `parent_id IS NOT NULL` como "Suboperacoes"
- CRUD completo para operacoes e suboperacoes
- Funcao para duplicar operacao com suas suboperacoes e tarefas
- Consolidacao de custos: soma `custo_real` das tarefas filhas

### `useTasks.ts` (refatorado)
- Heranca automatica: ao criar tarefa dentro de uma operacao, herda `area_id`, `talhao_id`, `cycle_id`
- Suporte a filtros por operacao principal

---

## Fase 3 — Componente Gantt Timeline

### `GanttTimeline.tsx` (novo componente principal)

Visualizacao horizontal tipo Gantt:
- **Eixo X**: tempo (dias/semanas/meses/trimestre com controle de zoom)
- **Eixo Y**: linhas com operacoes principais, suboperacoes indentadas, tarefas indentadas 2x
- **Barras**: representam duracao (inicio a fim), coloridas por status
- **Interacao**: expandir/recolher subniveis, scroll horizontal, click para editar
- **Indicadores visuais**: barra de progresso, alerta de atraso (borda vermelha), diferenca planejado vs real

Modos de visualizacao:
- **Condensado**: so operacoes principais
- **Detalhado**: com suboperacoes e tarefas

Implementacao com HTML/CSS puro (divs posicionadas) + scroll container, sem dependencia externa.

---

## Fase 4 — Pagina Operacao Refatorada

### Layout da pagina `/operacao`:

**Topo — Dashboard KPIs:**
- Operacoes em andamento / Atrasadas / Pendentes / Concluidas
- Custo total em aberto
- Proximas atividades

**Centro — Visualizacao principal:**
- Tabs: "Timeline" (Gantt) | "Lista" (cards hierarquicos)
- Filtros: area, talhao, ciclo, status, prioridade, tipo, periodo
- Controle de zoom (dia/semana/mes/trimestre)

**Acoes:**
- Nova Operacao Principal (abre formulario)
- Dentro de cada operacao: adicionar suboperacao, adicionar tarefa
- Menu de contexto: editar, duplicar, excluir, arquivar, pausar, reagendar, concluir

### `OperationForm.tsx` (novo)
Formulario para criar/editar operacao principal ou suboperacao:
- Nome, tipo, descricao
- Vinculo: propriedade, talhao, area, ciclo
- Datas: inicio/fim planejado e real
- Status, prioridade, responsavel
- Custo estimado

### `OperationCard.tsx` (novo)
Card expansivel mostrando operacao principal com:
- Barra de progresso
- Status, tipo, datas
- Custo consolidado
- Lista de suboperacoes (colapsavel)
- Lista de tarefas (colapsavel)
- Acoes rapidas

---

## Fase 5 — Integracao Financeira

- Cada tarefa pode ter `custo_estimado` e `custo_real` (ja existe)
- Cada tarefa pode vincular `cash_transaction_id` (ja existe)
- Botao "Vincular Custo" busca transacoes existentes em `cash_transactions`
- Botao "Criar Custo" gera nova transacao no fluxo de caixa e vincula
- Operacao principal exibe custo total = soma dos custos das sub-tarefas

---

## Fase 6 — Integracao com Area, Talhao, Ciclo

- Dentro de `AreaDetalhe.tsx`: aba "Operacoes" mostra operacoes filtradas por `area_id`
- Dentro de `TalhaoDetalhe.tsx`: aba "Operacoes" mostra operacoes do talhao
- Operacoes aparecem no Dashboard com indicadores operacionais

---

## Fase 7 — Tipos de Operacao e UX

**Tipos de operacao** (enum no formulario):
- Operacional agricola, Logistica, Compra, Contratacao, Manutencao, Documentacao, Regularizacao, Beneficiamento

**UX Mobile-ready:**
- Cards verticais no mobile, Gantt com scroll horizontal
- Icones por tipo, cores por status
- Botoes de acao rapida grandes
- Filtros em drawer no mobile

---

## Detalhes Tecnicos

| Item | Decisao |
|---|---|
| Gantt | Implementacao custom com CSS Grid + scroll container, sem lib externa |
| Hierarquia | `parent_id` em `operational_stages` |
| Heranca | Subtarefas herdam area/talhao/ciclo da operacao pai via logica no hook |
| Duplicacao | Copia operacao + suboperacoes + tarefas com novos UUIDs |
| Dados existentes | A tarefa existente permanece como tarefa solta (sem operacao pai) ate ser reorganizada manualmente |
| Status "atrasada" | Calculado automaticamente: `data_fim_prevista < hoje && status != concluida` |

## Arquivos Afetados

**Novos:**
- `src/hooks/useOperations.ts`
- `src/components/operacao/GanttTimeline.tsx`
- `src/components/operacao/OperationForm.tsx`
- `src/components/operacao/OperationCard.tsx`

**Refatorados:**
- `src/pages/Operacao.tsx` (reescrita completa)
- `src/hooks/useTasks.ts` (heranca, filtros)
- `src/hooks/useStages.ts` (suporte a parent_id)
- `src/pages/AreaDetalhe.tsx` (aba operacoes)
- `src/pages/TalhaoDetalhe.tsx` (aba operacoes)

**Migracao SQL:**
- `ALTER TABLE operational_stages ADD COLUMN parent_id uuid REFERENCES operational_stages(id)`
- `ALTER TABLE operational_stages ADD COLUMN custo_total numeric DEFAULT 0`
- `ALTER TABLE operational_tasks ADD COLUMN parent_task_id uuid`

