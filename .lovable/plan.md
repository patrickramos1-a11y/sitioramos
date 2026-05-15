
# Refatoração profunda da página interna de Ciclos

## 1. Migration (banco)

Adicionar à tabela `cycle_stages`:

- `inicio_relativo_dias_min` int (limite menor da janela; opcional, informativo)
- `data_inicio_real` date
- `data_fim_real` date
- `motivo_reprogramacao` text
- `atividade` text (descrição curta da atividade da etapa — separado de `descricao` para uso na aba Etapas)
- Atualizar status text para aceitar também `realizada` e `reprogramada` (mantendo `nao_iniciada`, `em_andamento`, `concluida`, `atrasada`, `cancelada` por compatibilidade — `concluida` será sinônimo legado de `realizada`).

Criar tabela `cycle_stage_history`:
- `id`, `stage_id`, `cycle_id`, `acao` text, `dados` jsonb, `created_at`.

Atualizar ciclo Abóbora existente:
- `data_inicio_plantio = 2026-04-21`
- `duracao_total_dias = 100`
- `data_prevista_colheita = 2026-07-30`

Inserir/atualizar (UPSERT por nome+cycle_id) as 8 etapas:

| # | Nome        | min | max (limite) | duração janela |
|---|-------------|-----|--------------|----------------|
| 1 | Emergência  | 5   | 8            | 4              |
| 2 | 1ª Capina   | 7   | 10           | 4              |
| 3 | Desbaste    | 10  | 12           | 3              |
| 4 | Adubação 1  | 15  | 20           | 6              |
| 5 | 2ª Capina   | 20  | 25           | 6              |
| 6 | Adubação 2  | 35  | 40           | 6              |
| 7 | Frutificação| 60  | 70           | 11             |
| 8 | Colheita    | 80  | 100          | 21             |

Regra: `inicio_relativo_dias` = min, `duracao_dias` = (max - min + 1), `inicio_relativo_dias_min` = min. Limite maior é `inicio_relativo_dias + duracao_dias - 1`. Não duplica se já houver etapa "Emergencia"/"Emergência" — atualiza.

## 2. Lógica (`src/lib/cycles/stageCalc.ts`)

- Adicionar status `realizada` e `reprogramada` aos types/labels/cores.
- `computeAutoStatus` passa a:
  - `realizada` (manual) prevalece;
  - se tem `data_inicio_real`/`data_fim_real`: status efetivo = `realizada`;
  - se hoje > limite máximo e não realizada: `atrasada`;
  - se hoje dentro da janela: `em_andamento`;
  - se antes: `nao_iniciada`/`prevista`.
- Novos helpers:
  - `diasAtraso(stage)` — comparando real vs previsto
  - `pushFutureStages(stages, fromOrdem, deltaDias)` — devolve patch list com novos `inicio_relativo_dias`
  - `suggestNextStart(stages)` — retorna dia logo após o limite máximo da última etapa
  - `findCurrentStage` revisado (atrasada > em_andamento > próxima futura).

## 3. Hook (`useCycleStages.ts`)

- Estender `CycleStage` com novos campos.
- Mutations novas:
  - `confirmExecution({id, dataInicioReal, dataFimReal, observacao, responsavelId})`
  - `reschedule({id, novosDiasInicio, novaDuracao, motivo, pushNext})`
  - `pushFuture({fromOrdem, deltaDias})` — atualiza em lote
- Cada mutation registra histórico em `cycle_stage_history`.

## 4. UI

### `CycleStageForm.tsx` (refatorado)
- Campo "Posição da etapa": Depois da última | Antes de... | Depois de... | Manual.
- Campos numéricos: `Início (dia)` e `Fim (dia)` (limite maior). Duração calculada.
- `Descrição` e `Observações` recolhidos por padrão (`+ Adicionar descrição`, `+ Adicionar observação`).
- Sugere próxima posição quando criando nova etapa (último limite + 1).

### `ConfirmExecutionDialog.tsx` (novo)
- Inputs: data inicial real (default = previsto), data final real (default = previsto), observação, responsável.
- Mostra atraso/adiantamento em tempo real.
- Se houve atraso: pergunta "Empurrar próximas etapas?" (Sim / Não / Manual).

### `RescheduleStageDialog.tsx` (novo)
- Edita início, duração, motivo, e checkbox "Empurrar próximas etapas".

### `CycleStageList.tsx`
- Mostra: número, nome, status badge, período previsto (dia X–Y, datas), período real (se houver), duração prev/real, atraso/adiantamento, responsável, atividade.
- Ações: `Confirmar execução` | `Reprogramar` | `Editar` | `Excluir`.

### `CycleStageTimeline.tsx`
- Marcar etapas realizadas em verde sólido, atrasadas com hachura/borda destrutiva, atual com ring.
- Mostrar barra de execução real sobreposta à prevista quando confirmada.

### `CicloDetalhe.tsx`
- Painel superior: dias previstos, decorridos, restantes, excedidos.
- Card "Etapa atual": nome + status + dias restantes ou atraso.
- Indicadores: etapas realizadas/total, tarefas concluídas/total.

## 5. Critérios atendidos
Todos os 22 critérios listados no pedido.

## 6. Arquivos

Criar: `ConfirmExecutionDialog.tsx`, `RescheduleStageDialog.tsx`, migration SQL, data-update SQL para Abóbora.

Editar: `stageCalc.ts`, `useCycleStages.ts`, `CycleStageForm.tsx`, `CycleStageList.tsx`, `CycleStageTimeline.tsx`, `CicloDetalhe.tsx`, `integrations/supabase/types.ts` (regenerado pós-migration).
