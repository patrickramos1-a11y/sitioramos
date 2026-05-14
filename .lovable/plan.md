# Plano — Dashboard Financeiro Mobile-First

Refatoração completa do Dashboard e suas 6 sub-abas para resolver: filtros muito grandes, dropdown minimalista, KPIs longos demais, gráficos pouco legíveis no celular e tabelas inadequadas.

## 1. Barra de filtros retrátil (`FinanceiroFilters`)

- **Modo colapsado por padrão no mobile**: mostra apenas 1 chip resumo ("Mês atual · Todos os tipos · 3 filtros") + botão `Filtros`.
- Ao tocar, abre `Sheet` (drawer lateral) no mobile com todos os filtros organizados em seções (Período, Classificação, Dimensões).
- **Chips de período rápido** viram pílulas coloridas selecionáveis (Hoje, 7d, Mês, Trim., Ano, Tudo) ao invés de 4 botões enfileirados.
- Desktop: mantém comportamento atual mas com `Mais filtros` retrátil.
- Badge no botão `Filtros` mostrando quantos filtros ativos.

## 2. Sub-navegação (Visão Geral, Por Área, etc.)

- Substituir o `Select` minimalista por **chips horizontais com scroll** (`overflow-x-auto snap-x`) — mais visual, mostra ícone + label, com indicador da aba ativa.
- Cada chip ganha cor própria (azul para Visão Geral, verde para Área, âmbar para Ciclo, roxo para Categoria, dourado para Investimentos, vermelho para Empréstimos).

## 3. KPIs compactos e roláveis

- Hoje: 12 `KpiCard`s grandes empilhados — muito longo no mobile.
- Novo layout mobile: **carrosséis horizontais agrupados por tema** (`snap-x`):
  - Linha 1 — Resultado: Saldo, Resultado Op., Margem %, Resultado Caixa
  - Linha 2 — Fluxo: Entradas, Saídas, Burn, Runway
  - Linha 3 — Operação: Custos Plant., Investimentos, Empréstimos, % Class.
- KpiCard mobile: altura ~80px, número grande, hint colapsado num ícone `i` (popover) — elimina os "balões cansativos".
- Desktop: grid 4 colunas mantida, mas com altura reduzida e cor de borda lateral por categoria.

## 4. Gráficos — versão mobile

Problemas atuais: legendas estouram, labels de pizza se sobrepõem, alturas fixas pequenas demais.

- **Pizza → Donut com legenda lateral/abaixo** com top 5 + "Outros", percentuais grandes no centro.
- **Bar/Line**: altura adaptativa (`h-[220px]` mobile, `h-[280px]` desktop), eixo Y oculto no mobile (mostrar valores no tooltip), `interval="preserveStartEnd"` no eixo X.
- Adicionar **toggle "ver tabela"** em cada gráfico — abre lista compacta dos mesmos dados (acessibilidade + alternativa ao gráfico no celular).
- Tooltip customizado com cores dos grupos.
- Cores: aplicar paleta determinística do `entityColors.ts` em séries de Ciclos/Áreas/Projetos para consistência cross-aba.

## 5. Tabelas → Cards no mobile

Tabelas presentes em Por Área, Por Ciclo, Por Categoria, Investimentos, Empréstimos.

- **Mobile (<768px)**: substituir cada linha por `Card` vertical com:
  - Cabeçalho colorido (cor da entidade)
  - 2-3 KPIs principais em grid 2 colunas
  - Mini barra de progresso (% do total) no rodapé
  - Tap → `Sheet` com detalhe completo
- **Desktop**: tabelas mantidas mas com cabeçalho sticky, zebra-stripe e cor da entidade na primeira célula.

## 6. Sub-abas específicas

### Visão Geral
- Hero card no topo: Saldo atual em destaque + delta vs mês anterior.
- Banner de não-classificados vira mais sutil (apenas ícone + número clicável que filtra).

### Por Área
- Cards por área com mini-sparkline mensal embutido.
- Ordenação rápida (Maior custo / Maior receita / Maior margem).

### Por Ciclo
- Seletor de ciclos compacto: chips com cor + checkbox (max 4).
- Comparativo lado-a-lado vira **stacked horizontal** no mobile (1 ciclo por linha).

### Por Categoria
- Heatmap atual quebra no mobile → substituir por **lista ordenada com barra horizontal proporcional** e filtro por ciclo.

### Investimentos
- Cards de projeto: cor própria + barra de execução % + valores compactos.

### Empréstimos
- Card por credor com saldo devedor em destaque + mini cronograma 6 meses.

## 7. Design tokens / estética

- Aumentar uso de cores semânticas (entradas = verde, saídas = vermelho, investimento = âmbar, empréstimo = vinho, neutro = azul).
- Bordas laterais coloridas (`border-l-4`) em cards para identidade visual rápida.
- Tipografia: números tabulares (`tabular-nums`), labels em `text-[10px]` uppercase, valores em `text-lg font-semibold`.
- Espaçamento: gap-2 mobile, gap-3 desktop (mais denso).

## Detalhes técnicos

Arquivos a modificar:
- `src/components/financeiro/FinanceiroFilters.tsx` — drawer mobile + chips de período
- `src/components/financeiro/DashboardTab.tsx` — chips de sub-aba colorida
- `src/components/financeiro/dashboard/KpiCard.tsx` — variante compacta com popover de hint
- `src/components/financeiro/dashboard/VisaoGeralSubTab.tsx` — hero + carrosséis de KPIs + donut
- `src/components/financeiro/dashboard/PorAreaSubTab.tsx` — cards mobile + sparklines
- `src/components/financeiro/dashboard/PorCicloSubTab.tsx` — seletor compacto + comparativo stacked
- `src/components/financeiro/dashboard/PorCategoriaSubTab.tsx` — substituir heatmap
- `src/components/financeiro/dashboard/InvestimentosSubTab.tsx` — cards de projeto coloridos
- `src/components/financeiro/dashboard/EmprestimosSubTab.tsx` — cards por credor
- Novo `src/components/financeiro/dashboard/ChartCard.tsx` — wrapper com toggle gráfico/tabela e altura responsiva
- Novo `src/components/financeiro/dashboard/MobileKpiRow.tsx` — carrossel snap-x de KPIs

Sem mudanças em hooks/lógica de negócio — apenas camada de apresentação.

## Fora deste plano

- Lançamentos e Configurações (já refatorados anteriormente).
- Mudanças no schema do banco ou nos cálculos analíticos.
