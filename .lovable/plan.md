
# Dashboard Financeiro 2.0 — Sub-abas, Comparações e Custo/ha

Hoje o `DashboardTab` é uma única tela densa (KPIs + grade de gráficos), tudo na mesma paleta verde. Vamos transformar em uma central analítica com sub-abas focadas, comparações lado a lado, métricas por hectare e cores únicas por entidade.

## 1. Estrutura de sub-abas

Nova navegação dentro de **Financeiro → Dashboard** (Tabs aninhadas, mantendo os filtros globais no topo):

```text
Financeiro › Dashboard
├── Visão Geral      (KPIs macro + entradas×saídas + composições)
├── Por Área         (custo, receita, resultado, R$/ha por área/talhão)
├── Por Ciclo        (custos, receitas, R$/ha, duração, comparador)
├── Por Categoria    (heatmap categoria × ciclo, top gastos)
├── Investimentos    (R$/ha investido, projetos, evolução)
└── Empréstimos      (saldo devedor, juros pagos, fluxo)
```

Filtros globais (período, área, ciclo, natureza, etc.) ficam acima das sub-abas e se aplicam a todas.

## 2. O que cada sub-aba mostra

### 2.1 Visão Geral
- KPIs atuais reorganizados em 3 linhas mais limpas, com ícones coloridos.
- Novos KPIs: **Margem operacional %**, **Custo médio R$/ha (período)**, **Receita média R$/ha**, **Burn mensal médio**.
- Gráficos: Entradas×Saídas mensal, composição entradas, composição saídas, evolução de saldo acumulado (linha).

### 2.2 Por Área
- Tabela/cards por área e por talhão com: hectares, custo total, receita total, resultado, **R$/ha custo**, **R$/ha receita**, **resultado/ha**.
- Gráfico de barras horizontais: custo por área (cor única por área).
- Gráfico empilhado: composição de custos (categorias) dentro de cada área.
- Toggle "agrupar por talhão".

### 2.3 Por Ciclo (o ponto principal)
- Lista de ciclos com: cultura, área, hectares, dias decorridos, **custo total**, **R$/ha**, receita, resultado.
- **Comparador de ciclos**: multi-select (até 4 ciclos) → renderiza:
  - Cards lado a lado com KPIs (custo, R$/ha, receita, dias, status).
  - Gráfico de barras agrupadas por **categoria** (mostra quanto cada ciclo gastou em Adubo, Mudas, Mão de obra, etc.).
  - Gráfico radar opcional comparando perfil de gasto (% por categoria).
  - Linha temporal acumulada de custo por dia decorrido (normaliza ciclos com durações diferentes).
- Cada ciclo recebe sua cor única (ver §4) usada em todos os gráficos.

### 2.4 Por Categoria
- Heatmap **Categoria × Ciclo** (intensidade = R$).
- Top 15 categorias do período com barra horizontal e share %.
- Drill: clicar em uma categoria filtra a tabela de lançamentos abaixo.

### 2.5 Investimentos
- KPIs: total investido período, investido acumulado, projetos ativos, **R$/ha investido na propriedade**.
- Barras por projeto (cor única por projeto), linha de evolução mensal.
- Tabela: projeto, valor previsto, realizado, % execução, R$/ha (quando o projeto tiver área vinculada).

### 2.6 Empréstimos
- KPIs: saldo devedor total, juros pagos no período, parcelas próximas 30/60/90 dias.
- Barras por banco/credor (cor única), linha de cronograma de parcelas futuras.

## 3. Métricas R$/hectare (cálculo)

Adicionar helpers em `src/lib/financeiro/finCalc.ts`:

- `custoPorHectareArea(areaId, txs, areas)` → soma custos da área / `tamanho_hectares`.
- `custoPorHectareCiclo(cycleId, txs, cycles, areas)` → soma custos do ciclo / hectares da área do ciclo.
- `investimentoPorHectarePropriedade(txs, propriedade)` → total investimento / `area_total_hectares`.
- Considera `classif.area_id`/`classif.cycle_id` quando presente, senão `tx.area_id`/`tx.cycle_id` (mesma regra dos gráficos atuais).

## 4. Sistema de cores único por entidade

Hoje quase tudo é verde. Vamos gerar **uma cor estável por ID** para ciclos, áreas, talhões, projetos e centros de custo.

- Novo arquivo `src/lib/financeiro/entityColors.ts`:
  - `colorForId(id: string, palette: Palette)` → hash do UUID → índice na paleta.
  - Paletas separadas por tipo de entidade (todas em HSL via tokens), para que um ciclo nunca colida visualmente com um talhão na mesma tela:
    - **Ciclos**: paleta vibrante (ciano, violeta, âmbar, rosa, lima, coral, índigo, teal…).
    - **Áreas/Talhões**: paleta terrosa (terracota, oliva, ocre, mostarda, sépia…).
    - **Centros de Custo**: paleta fria (azul, roxo, turquesa, slate…).
    - **Projetos**: paleta quente (laranja, magenta, dourado…).
  - Cores armazenadas como tokens HSL em `index.css` (`--chart-cycle-1`…`--chart-cycle-12`, etc.) e expostas no `tailwind.config.ts` para reuso.
- Hook `useEntityColor(kind, id)` para componentes consumirem direto.
- Legendas e badges (`ResponsavelBadge`-style) passam a usar a cor da entidade.

## 5. KPIs sugeridos (consolidado)

| Categoria | KPI | Fórmula resumida |
|---|---|---|
| Resultado | Margem operacional % | (Receita Op − Custo Plant − Despesa) / Receita Op |
| Eficiência | Custo R$/ha (período) | Σ custos plantação / Σ ha das áreas com custo |
| Eficiência | Receita R$/ha | Σ receitas / Σ ha produtivos |
| Eficiência | Resultado R$/ha | (Receita − Custo) / ha |
| Ciclo | Custo R$/ha do ciclo | Σ custos ciclo / ha da área |
| Ciclo | Custo/dia decorrido | Σ custos ciclo / dias desde plantio |
| Ciclo | Top 3 categorias | Categorias com maior share dentro do ciclo |
| Investimento | R$/ha investido | Σ investimentos / área total propriedade |
| Investimento | % execução projeto | Realizado / Previsto |
| Caixa | Burn mensal médio | Σ saídas / nº meses no período |
| Caixa | Runway (meses) | Saldo atual / burn mensal |
| Empréstimos | Saldo devedor / Receita ano | indicador de alavancagem |
| Qualidade | % classificação | Classificados / total (já existe) |

## 6. Detalhes técnicos

- **Arquivos novos**:
  - `src/components/financeiro/dashboard/VisaoGeralSubTab.tsx`
  - `src/components/financeiro/dashboard/PorAreaSubTab.tsx`
  - `src/components/financeiro/dashboard/PorCicloSubTab.tsx`
  - `src/components/financeiro/dashboard/CompararCiclos.tsx`
  - `src/components/financeiro/dashboard/PorCategoriaSubTab.tsx`
  - `src/components/financeiro/dashboard/InvestimentosSubTab.tsx`
  - `src/components/financeiro/dashboard/EmprestimosSubTab.tsx`
  - `src/components/financeiro/dashboard/KpiCard.tsx` (versão colorida com accent)
  - `src/lib/financeiro/entityColors.ts`
  - `src/lib/financeiro/perHectare.ts`
- **Arquivos editados**:
  - `src/components/financeiro/DashboardTab.tsx` → vira shell de sub-abas + filtros.
  - `src/index.css` e `tailwind.config.ts` → tokens de paleta multi-cor.
- **Bibliotecas**: continuamos com Recharts (já no projeto). Heatmap implementado como grid CSS para não adicionar dependência.
- **Performance**: memoizar agregados pesados em `useFinanceiroAnalytics` ou em hooks dedicados (`useCustosPorArea`, `useCustosPorCiclo`).
- **Mobile-first**: sub-abas viram um `Select` em telas <640px; cards empilhados; comparador de ciclos limita a 2 colunas no mobile.

## 7. Entrega em fases

1. **Fase 1 — Fundamentos**: paleta de cores por entidade + helpers R$/ha + shell de sub-abas (Visão Geral migrada).
2. **Fase 2 — Por Área e Por Ciclo** (incluindo comparador de ciclos).
3. **Fase 3 — Por Categoria (heatmap) + Investimentos + Empréstimos** com KPIs avançados.

Cada fase é entregável independente e mantém o dashboard atual funcionando durante a transição.
