# Plano — Evolução do Módulo de Operações (Sítio Ramos)

Vamos transformar o módulo atual (projetos + etapas com Gantt) em um **núcleo de gestão produtiva** com timeline avançada, criação rápida no campo, integração de custos e indicadores por área. O trabalho será feito em **6 fases independentes e entregáveis**, para você validar cada etapa antes da próxima.

---

## Fase 1 — Fundação de dados e regras ambientais

**Objetivo:** preparar o banco para suportar tempo excedido, custos vinculados, simultaneidade e o limite de 18,29 ha.

- Adicionar em `operational_stages`:
  - `dias_executados` (computado na UI a partir das datas reais)
  - `permite_simultaneidade` (boolean) — para tarefas que podem rodar em paralelo
  - `historico_alteracoes` via nova tabela `operation_change_logs` (campo, valor antigo, valor novo, data)
- Adicionar em `propriedade` (ou tabela nova `regras_ambientais`):
  - `area_max_manejo_ha` (default 18,29)
  - `manejo_escalonado_anos` (default 4)
- Adicionar em `areas`: `tipo_protecao` (`produtiva` | `app` | `reserva_legal`) — bloqueia criar operação em área protegida.
- Trigger leve para gravar log em `operation_change_logs` quando `data_fim_prevista`, `status` ou `responsavel` mudarem.

**Entregável:** estrutura pronta, sem mudança visual.

---

## Fase 2 — Criação rápida (mobile-first) + timeline com tempo excedido

**Objetivo:** o "Modo Campo" descrito no TCO + barra que cresce em verde escuro quando estoura o prazo.

- Novo botão **"⚡ Criação rápida"** no topo da página Operação, abrindo um `Sheet` mobile com:
  - Nome
  - Duração: chips `30 / 60 / 90 dias` (+ campo livre)
  - Responsável (autocomplete)
  - Área (opcional, herda do filtro ativo)
  - Data início = hoje (automático)
- Reescrever a estilização da barra no `GanttTimeline.tsx`:
  - **Planejado:** verde claro (outline)
  - **Em execução:** preenchimento progressivo da cor do responsável proporcional a `dias_executados / duracao_prevista`
  - **Concluído:** verde sólido
  - **Atrasado:** continua a barra além do fim previsto em **verde escuro hachurado**, marcando os dias excedidos
  - **Futuro:** cinza claro
- Adicionar **linha vertical "Hoje"** atravessando todas as linhas do Gantt (já existe a navegação por mês — só falta o marker visual).

**Entregável:** criar uma operação no celular em <10 segundos e ver a barra surgindo.

---

## Fase 3 — Zoom Dia/Semana/Mês/Ano com grid fixo

**Objetivo:** atender o requisito "grid fixo, intervalo muda".

- Trocar os 3 botões atuais (Semana/Mês/Geral) por **4 níveis: Dia, Semana, Mês, Ano**.
- Manter a janela **sempre com a mesma quantidade de colunas visíveis** (~14 colunas), recalculando `colWidth` para preencher a largura do container — assim o grid não cresce/encolhe, só a escala muda.
- Dia: 14 dias visíveis · Semana: 14 semanas · Mês: 14 meses · Ano: 5 anos.
- Setas ◀ ▶ avançam/recuam **uma janela inteira** em vez de 1 mês fixo.

**Entregável:** zoom fluido como Google Calendar.

---

## Fase 4 — Camadas (filtros tipo "layers") + dependências visuais

**Objetivo:** ocultar/exibir grupos como camadas de mapa.

- Painel lateral colapsável "Camadas" no Gantt com toggles:
  - Por **área** (lista de áreas com checkbox + cor)
  - Por **projeto/operação principal**
  - Por **ciclo produtivo**
  - Por **responsável**
- Cada camada com seu próprio toggle visibilidade (olho 👁) e contador.
- Conector SVG entre etapas dependentes (já planejado anteriormente — finalizar nesta fase).
- Indicador de simultaneidade: tarefas paralelas na mesma área aparecem empilhadas em "swimlanes" dentro do mesmo grupo.

**Entregável:** controle granular do que aparece na tela.

---

## Fase 5 — Página de Lançamentos + integração de custos por operação

**Objetivo:** ligar Operações ↔ Caixa, alimentando custo total por área/hectare.

- Nova página **`/lancamentos`** (entra no menu lateral, abaixo de Caixa):
  - Lista unificada de custos com filtros por operação, área, categoria, período
  - Botão "Novo lançamento" abre formulário já existente (`CostForm`) com campo extra **Operação vinculada**
  - Edição em linha + histórico
- Em `operational_stages`, exibir um **bloco "Custos vinculados"** dentro do `OperationCard`:
  - Soma `cash_transactions` onde `operation_id = X` (campo novo na tabela)
  - Lista de tarefas (`operational_tasks.custo_real`) já existentes
  - Total consolidado da operação + rateio para área-mãe
- Atualizar dashboard de Áreas (`AreaDetalhe.tsx`):
  - **Custo médio por hectare** (custo total da área / hectares produtivos)
  - **Gráfico evolutivo** (barras por mês ou por ciclo)
  - **Comparação planejado vs real** (barra com estouro em vermelho)

**Entregável:** custo de cada plantio rastreável da tarefa até o R$/ha da área.

---

## Fase 6 — Padrões de cultura + regras ambientais ativas

**Objetivo:** reaproveitar conhecimento e impedir erro de planejamento.

- Nova tabela `culture_cost_templates`:
  - cultura, custo_estimado_por_ha, lista de etapas padrão com duração e custo médio
- Ao criar um novo ciclo produtivo, oferecer **"Aplicar padrão de cultura"** (ex.: Mandioca → preenche etapas e custos esperados; reutilizável em Macaxeira).
- Validador automático ao criar/expandir área:
  - Se soma de áreas em manejo > 18,29 ha → bloqueia com aviso explicando o limite ambiental
  - Se área marcada como `app` ou `reserva_legal` → impede criar operação produtiva
  - Aviso amarelo se manejo cadastrado prevê encerrar tudo em < 4 anos (manejo escalonado).

**Entregável:** sistema "ensina" o padrão e protege contra erro de licenciamento.

---

## Detalhes técnicos (resumo)

```text
DB novo:
  operation_change_logs (id, stage_id, campo, antes, depois, em)
  culture_cost_templates (id, cultura, custo_ha, etapas jsonb)
  regras_ambientais (singleton: area_max_ha, anos_escalonamento)

cash_transactions:
  + operation_id uuid (FK lógica para operational_stages)

areas:
  + tipo_protecao text default 'produtiva'

operational_stages:
  + permite_simultaneidade boolean default false
```

Componentes novos:
- `QuickOperationSheet.tsx` (Fase 2)
- `LayersPanel.tsx` + `DependencyConnectors.tsx` (Fase 4)
- `pages/Lancamentos.tsx` + `OperationCostBlock.tsx` (Fase 5)
- `CultureTemplatePicker.tsx` + `EnvironmentalLimitGuard.tsx` (Fase 6)

Componentes refatorados: `GanttTimeline.tsx` (Fases 2, 3, 4), `OperationCard.tsx` (Fase 5), `AreaDetalhe.tsx` (Fase 5).

---

## Como vamos trabalhar

Cada fase é entregue, testada por você no preview e validada antes de começar a próxima. Se quiser pular ou reordenar fases (ex.: começar pela 5 porque custos são mais urgentes), me avise.

**Recomendação:** começar pela **Fase 2 (Criação rápida + tempo excedido)** porque é a que mais transforma a experiência no celular e valida visualmente todo o restante.
