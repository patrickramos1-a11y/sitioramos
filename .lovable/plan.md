
# Refatoração Completa do Fluxo de Caixa — Estrutura + Indicadores

## Diagnóstico da divergência atual

Hoje o sistema mistura **3 conceitos diferentes** chamando todos de "categoria", o que gera confusão e travamentos de totais:

| Conceito | Onde vive | Exemplos |
|---|---|---|
| **Natureza** (entrada/saída) | `cash_transactions.tipo` | entrada, saida |
| **Categoria macro** | `cash_transactions.categoria` | custo_operacional, investimento, receita_venda, aporte, parcela_emprestimo... |
| **Subtipo (tipo de gasto)** | `costs.tipo` / `investments.tipo` | trator, mão de obra, adubação / legalização, infraestrutura |

Problemas concretos:
- Quando um custo é criado em `costs`, ele gera uma `cash_transaction` com `categoria='custo_operacional'`, mas o **subtipo se perde no campo `descricao`** (string livre). Por isso "Custo Operacional" trava em R$ 94.000 sem permitir abrir a composição (trator, mudas, etc.).
- Lançamentos diretos em `cash_transactions` (sem passar por `costs`) **não têm subtipo nenhum**, criando uma classe de "saídas órfãs".
- Investimentos e Receitas têm a mesma doença: o tipo (legalização, venda, aporte, etc.) só aparece em tabelas paralelas, não na transação.
- A página tem 4 abas (Todos, Custos, Implantação, Receitas) que escondem essa duplicidade — o usuário não sabe se edita em "Custos" ou em "Lançamentos".

## Decisão de arquitetura

Adotar um modelo **único e plano** para classificação financeira, mantendo a regra de ouro do projeto (`cash_transactions` é a fonte única). Toda transação passa a ter:

```text
tipo          → entrada | saida          (natureza contábil)
categoria     → custo | investimento | receita | financeiro
                                          (4 grandes blocos — substitui os 12 atuais)
subcategoria  → trator, mao_obra, legalizacao, venda, aporte_socio,
                parcela_emprestimo, juros, ...   (NOVO campo na transação)
```

### Mapeamento das 12 categorias atuais → novo modelo

| Categoria atual | Nova categoria | Nova subcategoria |
|---|---|---|
| custo_operacional | custo | (vem de `costs.tipo`: trator, mao_obra, adubacao...) |
| investimento | investimento | (vem de `investments.tipo`: legalizacao, infraestrutura...) |
| receita_venda | receita | venda |
| receita_aporte_socio | receita | aporte_socio |
| receita_emprestimo_bancario | receita | emprestimo_bancario |
| receita_outra | receita | outra |
| aporte | receita | aporte_socio |
| emprestimo_entrada | financeiro | recebimento_emprestimo |
| parcela_emprestimo | financeiro | parcela_emprestimo |
| quitacao_emprestimo | financeiro | quitacao_emprestimo |
| despesa_financeira | financeiro | juros / tarifa |
| transferencia | financeiro | transferencia |

Resultado: **4 categorias macro + ~25 subcategorias bem definidas**, compartilhando o mesmo dicionário visual (`costTypeConfig`, `investmentTypeConfig`, novo `revenueSubtypeConfig`, novo `financeiroSubtypeConfig`).

## Backend (migração)

1. **Adicionar coluna** `subcategoria text` em `cash_transactions` (nullable inicialmente).
2. **Backfill** automático:
   - Para transações ligadas a `cost_id`: copia `costs.tipo`.
   - Para transações ligadas a `investment_id`: copia `investments.tipo`.
   - Para transações ligadas a `revenue_id`: copia `revenues.tipo_receita`.
   - Para `parcela_emprestimo` / `quitacao_emprestimo`: subcategoria = própria categoria.
   - Para receitas no modelo antigo (`receita_aporte_socio` etc.): extrai do nome.
3. **Renomear** as 12 categorias para as 4 novas via UPDATE em massa (sem perder dados — cria coluna `categoria_legada` para auditoria).
4. **Atualizar `cash_transactions_categoria_check`** para o novo enum (custo, investimento, receita, financeiro).
5. **Triggers de sincronização**: ao inserir/editar em `costs`, `investments`, `revenues`, propagar `tipo` para `cash_transactions.subcategoria` automaticamente.
6. **Views agregadas** (com `security_invoker = on`) — opcional, para acelerar dashboards:
   - `vw_cash_by_subcategoria`
   - `vw_cash_by_cycle`
   - `vw_cash_by_area`

## Frontend — estrutura da página

Plano anterior preservado, **agora alimentado pelo novo modelo**:

```text
┌─────────────────────────────────────────────────────────┐
│ KPIs: Saldo · Entradas · Saídas · Custo/ha · % órfãos  │
├─────────────────────────────────────────────────────────┤
│ Filtros globais: Período · Área · Ciclo · Categoria ·   │
│                  Subcategoria · "Apenas sem ciclo/área" │
├─────────────────────────────────────────────────────────┤
│ Abas:                                                   │
│  ▸ Visão Geral   — donut por categoria + drill por sub │
│  ▸ Por Área      — drill com composição por subcategoria│
│  ▸ Por Ciclo     — comparativo entre 2-4 ciclos         │
│  ▸ Lançamentos   — lista única, badge de órfãos,        │
│                    atribuição rápida de ciclo/área      │
│  ▸ Cadastros     — entrada estruturada (custos /        │
│                    investimentos / receitas)            │
└─────────────────────────────────────────────────────────┘
```

Mudanças sobre o plano anterior:

- **Donut "Composição de Saídas por Tipo"** agora opera sobre `subcategoria` (resolve o problema do "custo travado em 94k").
- **Comparativo de Ciclos** mostra barras agrupadas por subcategoria — exatamente o pedido "trator vs mão de obra vs manutenção".
- **Formulário único de lançamento** passa a exigir subcategoria sempre que `categoria` for `custo` ou `investimento` (substitui o campo livre `descricao` como classificador).
- **Atribuição rápida** na lista permite trocar não só ciclo/área, mas também **subcategoria** (ex.: "esse lançamento foi mão de obra, não outros").

## Detalhes técnicos

### Migrações
- `supabase/migrations/...add_subcategoria_to_cash_transactions.sql` — coluna + backfill + atualização do CHECK constraint.
- `..._sync_subcategoria_triggers.sql` — triggers em `costs`, `investments`, `revenues`.
- `..._cash_summary_views.sql` — views opcionais com `security_invoker = on`.

### Frontend
- **`src/lib/categoryConfig.ts`**: refatorar para novo modelo de 4 categorias + dicionário unificado de subcategorias.
- **Novos**:
  - `src/components/caixa/analytics/OverviewTab.tsx`, `ByAreaTab.tsx`, `ByCycleTab.tsx`, `CycleComparator.tsx`
  - `src/components/caixa/analytics/CompositionDonut.tsx` (categoria → subcategoria)
  - `src/components/caixa/analytics/MonthlyEvolutionChart.tsx`
  - `src/components/caixa/GlobalFiltersBar.tsx`
  - `src/components/caixa/QuickReassignPopover.tsx` (área/ciclo/subcategoria)
  - `src/hooks/useCashAnalytics.ts`
- **Modificados**:
  - `src/pages/Caixa.tsx` — nova estrutura de abas + filtros globais.
  - `src/components/caixa/CashTransactionsTable.tsx` — coluna de subcategoria + badge "sem ciclo/área/subcategoria".
  - `src/components/caixa/EditTransactionDialog.tsx` + `BulkEditDialog.tsx` — campo subcategoria.
  - `src/hooks/useCashTransactions.ts` — filtros `subcategoria`, `withoutCycle`, `withoutArea`.
  - `src/components/costs/CostForm.tsx`, `investments/InvestmentForm.tsx`, `revenues/RevenueForm.tsx` — alinham com novo dicionário.
- **Memória** (`mem://features/cash-flow/transaction-structure`): atualizar para refletir 4 categorias + subcategoria obrigatória.

## Entregáveis em ordem

1. **Migração de schema** + backfill + triggers (sem quebrar UI atual — abas continuam funcionando).
2. **Refatoração do `categoryConfig`** + filtros globais por subcategoria.
3. **Aba Visão Geral** com donut de composição (resolve o "custo travado").
4. **Aba Por Ciclo** com comparativo entre culturas.
5. **Aba Por Área** com drill-down.
6. **Atribuição rápida** + indicadores de órfãos na lista.

Cada etapa é entregável independentemente. Posso aprovar e seguir.
