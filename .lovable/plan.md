# Plano: Operações Avançadas (Projetos com Etapas Dependentes)

## Visão geral

Hoje, "Operação" usa a tabela `operational_stages` em 2 níveis (operação principal + sub-operação) sem dependência entre etapas, sem categoria de projeto e sem cálculo automático de datas. Vamos transformá-la em um módulo de **Projetos Operacionais** onde:

- A **Operação Principal** funciona como o "projeto" (ex.: "Projeto da Casa de Farinha").
- Suas **Etapas** são as sub-operações, agora com **dependência sequencial** e **cálculo automático de datas**.
- A **linha do tempo (Gantt)** ganha agrupamento, filtros, zoom (semana/mês/geral), cores por responsável e indicadores visuais de atraso/bloqueio/conclusão.
- Operações não exigem mais Área/Ciclo (ficam opcionais), permitindo projetos administrativos como "Casa de Farinha", "Documentação", "Licenciamento".

## 1. Banco de Dados (migração)

Tabelas afetadas: `operational_stages` (atual base de operações e etapas).

**Novos campos em `operational_stages`:**
- `categoria` (text) — Produção agrícola, Manejo e limpeza, Infraestrutura, Casa de farinha, Financeiro, Documentação, Licenciamento, Comercial, Logística.
- `duracao_prevista_dias` (integer, nullable) — duração planejada da etapa.
- `depends_on_id` (uuid, nullable) — FK lógica para outra `operational_stages.id` (etapa antecessora).
- `cor_responsavel` (text, nullable) — cor opcional fixa por responsável (fallback: hash do nome).
- Ampliar enum `stage_status` para incluir: `planejada`, `travada`, `cancelada`, `reprogramada` (manter compatibilidade com `nao_iniciada`/`em_andamento`/`concluida`/`atrasada`/`pausada` já existentes — mapearemos `nao_iniciada` → `planejada` na UI).

**Tornar opcionais:**
- `area_id` e `cycle_id` em `operational_stages` passam a ser **nullable** (projetos podem não ter área/ciclo — ex.: Documentação).

Sem trigger de cálculo: as datas previstas serão calculadas no cliente ao salvar (mais simples, transparente, edição livre depois).

## 2. Lógica de cálculo automático

Implementada no hook `useOperations`/`useStages` ao criar ou atualizar uma etapa:

- Se `depends_on_id` definido → `data_inicio_prevista` = `data_fim_prevista` (ou `data_fim_real` se concluída) da etapa antecessora **+ 1 dia**.
- Se `data_inicio_prevista` + `duracao_prevista_dias` definidos → `data_fim_prevista` = início + duração.
- Quando uma etapa antecessora é alterada/concluída, recalcular em **cascata** as datas previstas das dependentes (somente as ainda não iniciadas).

**Status derivado** (computed na UI, não persistido):
- `concluida` se `data_fim_real` preenchida.
- `travada` se a antecessora não está concluída.
- `atrasada` se hoje > `data_fim_prevista` e não concluída.
- `em_andamento` se `data_inicio_real` preenchida e não concluída.
- `planejada` caso contrário.

**Métricas computadas por etapa:**
- % tempo previsto consumido = (dias decorridos / duração prevista) × 100.
- Dias restantes = `data_fim_prevista` − hoje.
- Dias de atraso = hoje − `data_fim_prevista` (se positivo).
- Duração real = `data_fim_real` − `data_inicio_real`.
- Diferença planejado vs executado = duração real − duração prevista.

## 3. Formulários

**`OperationForm` (Operação/Projeto):**
- Tornar Área e Ciclo **opcionais** (com opção "Sem área / projeto geral").
- Adicionar campo **Categoria** (select com as 9 categorias).
- Manter: nome, descrição, responsável principal, data de início, prioridade, status, observações.

**`StageForm` (Etapa):**
- Adicionar campo **Duração prevista (dias)**.
- Adicionar campo **Depende de** (select com outras etapas do mesmo projeto).
- Adicionar campo **Categoria** (herda do projeto, editável).
- Mostrar **data prevista de conclusão calculada** em tempo real conforme usuário preenche início + duração ou seleciona dependência.
- Manter: nome, descrição, responsável, datas (início prevista/real, fim prevista/real), status, observações.

## 4. Visualização Gantt (`GanttTimeline`)

Reescrever para suportar:

- **Agrupamento por projeto** (operação principal): linha do projeto + etapas indentadas.
- **Expandir/recolher** etapas por projeto.
- **Zoom**: botões "Semana / Mês / Geral" alterando a escala do CSS Grid.
- **Filtros** (acima do Gantt):
  - Responsável (multi-select).
  - Status (multi-select).
  - Categoria (multi-select).
  - Toggle "Apenas atrasadas".
  - Toggle "Apenas com dependência".
- **Cores por responsável**: paleta determinística (hash do nome → HSL) ou cor manual.
- **Estilo da barra** conforme status:
  - Sólida (cor do responsável) → em andamento.
  - Cinza → concluída.
  - Tracejada (border-dashed) → planejada.
  - Vermelha com ícone de alerta → atrasada.
  - Tracejada cinza com ícone de cadeado → travada por dependência.
- **Linhas finas conectoras** (SVG) entre etapa antecessora e dependente.
- **Barra de progresso interno**: faixa preenchida = % executado dentro da barra prevista; se ultrapassou, a barra **se estende** com hachura vermelha mostrando os dias de atraso.
- Tooltip ao passar o mouse: nome, responsável, datas, % consumido, dias restantes/atraso.
- **Mobile**: scroll horizontal nativo, header sticky à esquerda com nome do projeto/etapa.

## 5. Página `Operacao.tsx`

- Header com botão "Novo Projeto" (renomear "Nova Operação").
- KPIs já existentes mantidos, somando: **Projetos ativos**, **Etapas atrasadas**, **Etapas travadas**, **Concluídas no mês**.
- Filtros movidos para dentro do Gantt (acima da timeline).
- Tab "Lista" mostra cards por projeto com badges de categoria, contagem de etapas (planejadas/em andamento/concluídas/atrasadas) e barra de progresso geral.

## 6. Sementes (opcional, sob demanda do usuário)

Inserir o exemplo "Projeto da Casa de Farinha" com 3 etapas demonstrativas para o usuário testar imediatamente após a aprovação.

## Detalhes técnicos

**Arquivos a editar:**
- `supabase/migrations/<nova>.sql` — alter table + alter type enum + alter nullable.
- `src/hooks/useOperations.ts` — incluir novos campos, lógica de cálculo de datas em cascata, status derivado.
- `src/hooks/useStages.ts` — idem para etapas.
- `src/components/operacao/OperationForm.tsx` — categoria, área/ciclo opcionais.
- `src/components/operacao/StageForm.tsx` — duração, depende de, preview de data prevista.
- `src/components/operacao/GanttTimeline.tsx` — reescrita com zoom, filtros, cores por responsável, barras com estilo por status, conectores SVG.
- `src/components/operacao/OperationCard.tsx` — categoria, badges agregados.
- `src/pages/Operacao.tsx` — filtros, KPIs, terminologia "Projeto".
- `src/lib/responsavelColors.ts` (novo) — paleta determinística.

**Compatibilidade:** todas as operações existentes continuam funcionando — novos campos têm default ou nullable, status legados (`nao_iniciada`, `pausada`) continuam aceitos e renderizados.

## Fora do escopo (podem virar próximos passos)

- Anexos por etapa (precisaria de Storage bucket).
- Notificações de atraso por e-mail.
- Drag-and-drop para reordenar/redimensionar barras no Gantt.

