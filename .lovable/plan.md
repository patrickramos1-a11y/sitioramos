# Dashboard + Relatórios da página Financeiro

Objetivo: transformar a camada de classificação (`fin_classificacoes`) em indicadores gerenciais reais, **sem tocar em** Fluxo de Caixa, lançamentos antigos, módulo de Empréstimos ou nas categorias legadas.

## 1. Ajuste conceitual — "grupo gerencial"

Hoje só temos `fin_naturezas` (receita / custo_plantacao / investimento / despesa_geral / ajuste). Isso não distingue **receita operacional × aporte × empréstimo × outras entradas** nem **despesa operacional × pagamento de empréstimo × juros/tarifas**.

Solução **sem alterar banco**: criar um derivador puro em `src/lib/financeiro/managementGroup.ts` que, para cada lançamento, devolve um **grupo gerencial** a partir da classificação existente (categoria + natureza + `tipo_evento_emprestimo` + `loan_id`):

- `receita_operacional` — categoria `rc_venda_produto`, `rc_aluguel_equip` (sem `loan_id`)
- `aporte_socios` — categoria `rc_aporte_socios`
- `entrada_emprestimo` — `loan_id` presente E `tipo_evento_emprestimo = 'recebimento'` (ou categoria `rc_emprestimo`)
- `outras_entradas` — `rc_reembolso`, `rc_venda_ativo`, `rc_outras`
- `custo_plantacao` — natureza `custo_plantacao`
- `investimento` — natureza `investimento`
- `pagamento_emprestimo` — `tipo_evento_emprestimo ∈ {pagamento_parcela, amortizacao}` ou categoria `de_pagamento_emprestimo` / `de_amortizacao_emprestimo`
- `juros_tarifas` — `tipo_evento_emprestimo ∈ {juros, tarifa}` ou categorias `adm_juros` / `adm_tarifas`
- `despesa_geral` — natureza `despesa_geral` (que sobrar)
- `nao_classificado` — sem registro em `fin_classificacoes`

Esse derivador é a fonte única de verdade para Dashboard e Relatórios.

## 2. Ajustes finos no `suggestionEngine`

- "aporte", "patrick", "william", "aporte sócio" → categoria `rc_aporte_socios`, **centro de custo `propriedade_geral`** (hoje sugere `comercializacao`, corrigir).
- Reordenar para "aporte" ter prioridade antes de "venda".

Sem mexer no banco — só ajustes em `src/lib/financeiro/suggestionEngine.ts`.

## 3. Novo hook agregador

`src/hooks/financeiro/useFinanceiroAnalytics.ts` — recebe filtros globais e devolve:

- listas indexadas por grupo gerencial
- totais por mês, categoria, centro de custo, área/talhão, ciclo, projeto
- métricas de empréstimos consultando `useLoans()` (contratado, recebido, pago, juros, saldo devedor, parcelas pendentes futuras a partir de `installments`)
- KPIs de qualidade (classificados, não classificados, revisados, confiança alta/média/baixa)

Usa apenas SELECT — nenhum write.

## 4. Filtros globais

Componente `FinanceiroFilters` (em `src/components/financeiro/FinanceiroFilters.tsx`) reutilizável por Dashboard e Relatórios:

período (preset + custom), mês, ano, tipo, natureza, categoria, centro de custo, área/talhão, ciclo, projeto, empréstimo, classificado/não, revisado/não, "incluir não revisados".

Estado mantido via `useState` no `Financeiro.tsx` e passado como contexto leve.

## 5. Reescrita do `DashboardTab`

Layout:

```text
[ Filtros globais ]
[ Cards KPI — linha 1 ]  Saldo atual | Entradas mês | Saídas mês | Resultado operacional mês
[ Cards KPI — linha 2 ]  Resultado de caixa | Custos plantação mês | Investimentos andamento | Não classificados
[ Cards KPI — linha 3 ]  Contas a pagar | Contas a receber | Empréstimos ativos | % classificação
[ Gráficos ]             Entradas×Saídas mensal · Composição entradas · Composição saídas
                         Despesas por categoria · Custos por centro · Custos por área · Custos por ciclo
                         Investimentos por projeto · Classificados×Não · Empréstimos
```

Fórmulas conforme especificação:
- **Resultado operacional** = receita_operacional − custo_plantacao − despesa_geral *operacional* (exclui aportes, empréstimos, investimentos, juros).
- **Resultado de caixa** = todas entradas pagas − todas saídas pagas.
- Cards com aviso quando `nao_classificado > 0`: "Este indicador considera apenas lançamentos classificados...".

Gráficos com `recharts` (já no projeto).

## 6. Reescrita do `RelatoriosTab`

Sub-abas verticais (lista lateral em desktop, accordion em mobile):

1. Mensal — colunas conforme spec (entradas detalhadas, saídas detalhadas, resultado operacional, resultado de caixa, não classificados).
2. Por área/talhão — hectares + custo total plantação + custo/ha (omite cálculo se `tamanho_hectares` nulo) + ciclos vinculados.
3. Por ciclo — cultura, área, datas, status, custos, receitas, resultado.
4. Por projeto de investimento — previsto × realizado × diferença.
5. Por categoria — totais.
6. Por centro de custo — totais.
7. Empréstimos — consulta `loans` + `installments`: contratado, recebido, total pago, juros pagos, tarifas pagas, parcelas pagas/futuras, saldo devedor, lançamentos vinculados, lançamentos sugeridos sem vínculo (loan_id na cash_transaction mas sem classificação).
8. Não classificados — tabela com sugestão e atalho que abre a aba **Reclassificação** com o id selecionado.
9. Qualidade da classificação — totais por estado e confiança.

Cada relatório respeita os filtros globais e o toggle "incluir não revisados".

## 7. Garantias de não regressão

- Página **Fluxo de Caixa** (`src/pages/Caixa.tsx`) **não é tocada**.
- `cash_transactions` lida apenas em SELECT.
- Módulo Empréstimos lido apenas em SELECT.
- Sem migrations, sem seeds, sem updates de dados.
- Lançamentos sem `fin_classificacoes` ficam isolados em `nao_classificado` e **nunca** entram em relatórios de custo/investimento/resultado operacional.

## 8. Arquivos previstos

Novos:
- `src/lib/financeiro/managementGroup.ts`
- `src/lib/financeiro/finCalc.ts` (helpers de soma/agrupamento)
- `src/hooks/financeiro/useFinanceiroAnalytics.ts`
- `src/components/financeiro/FinanceiroFilters.tsx`
- `src/components/financeiro/dashboard/KpiCards.tsx`
- `src/components/financeiro/dashboard/CompositionCharts.tsx`
- `src/components/financeiro/dashboard/CostBreakdownCharts.tsx`
- `src/components/financeiro/dashboard/LoanWidget.tsx`
- `src/components/financeiro/relatorios/Report{Mensal,Area,Ciclo,Projeto,Categoria,CentroCusto,Emprestimo,NaoClassificado,Qualidade}.tsx`

Editados:
- `src/components/financeiro/DashboardTab.tsx`
- `src/components/financeiro/RelatoriosTab.tsx`
- `src/lib/financeiro/suggestionEngine.ts` (apenas regra de aporte)
- `src/pages/Financeiro.tsx` (estado de filtros globais)

## 9. Fora de escopo (próxima etapa)

- Persistir grupo gerencial no banco como nova coluna em `fin_categorias` (atualmente derivado).
- Fluxo previsto × realizado por orçamento.
- Exportação PDF/CSV dos relatórios.

Confirma para eu implementar?
