## Objetivo

Criar a nova página **Financeiro** no menu lateral, totalmente isolada da página atual **Fluxo de Caixa** (que permanece intacta). A nova página oferece estrutura modular de classificação financeira (naturezas, centros de custo, categorias, projetos de investimento, ciclos), reutilizando as estruturas territoriais já existentes no sistema (`propriedade`, `areas`, `talhoes`, `cycles`).

## Reaproveitamento de dados existentes (confirmado no schema)

O sistema **já possui** estrutura territorial e produtiva consolidada:
- `propriedade` — propriedade geral
- `areas` — áreas produtivas (com `tamanho_hectares`, `tipo`, `status`, `cultura_principal`)
- `talhoes` — talhões vinculados a áreas
- `cycles` — ciclos produtivos (cultura, datas, status, vínculo área/talhão)
- `cash_transactions` — lançamentos financeiros (fonte única)

**Decisão**: NÃO criar tabelas duplicadas de áreas/talhões/ciclos. A página Financeiro consome essas tabelas em modo leitura para vínculo. Apenas o ciclo ganha um novo cadastro se necessário (tabela `cycles` já existe e será reutilizada).

## Etapa 1 — Migração de banco (estrutura nova, sem tocar dados antigos)

Novas tabelas (todas com RLS pública igual ao padrão atual):

1. **`fin_naturezas`** — naturezas financeiras
   - `codigo` (unique), `nome`, `tipo` (entrada/saida/ajuste), `descricao`, `ativo`, `ordem`
   - Seed: Receita, Custo de Plantação, Investimento/Benfeitoria, Despesa Geral, Transferência/Ajuste

2. **`fin_centros_custo`** — centros de custo
   - `codigo` (unique), `nome`, `descricao`, `ativo`, `ordem`
   - Seed: Produção Agrícola, Beneficiamento, Infraestrutura, Equipamentos, Regularização/Ambiental, Administração, Comercialização, Propriedade Geral

3. **`fin_categorias`** — categorias financeiras configuráveis
   - `codigo` (unique), `nome`, `natureza_id` (FK lógica → fin_naturezas), `centro_custo_id` (FK lógica, opcional), `ativo`, `ordem`
   - Seed completo: 12 categorias de plantação, 7 de entrada, 10 de investimento, 7 administrativas

4. **`fin_projetos_investimento`** — projetos de investimento/benfeitoria
   - `nome`, `tipo` (infraestrutura/equipamento/ferramentas/regularizacao/energia/agua/transporte/benfeitoria/outros), `descricao`, `status` (planejado/em_andamento/concluido/pausado/cancelado), `data_inicio`, `data_conclusao`, `valor_previsto`, `ativo`
   - Seed sugerido: Legalização da Terra, Galpão, Carretinha, Energia, Caixa d'água e Bomba, Ferramentas e Equipamentos Manuais

5. **`fin_classificacoes`** — **camada complementar de classificação** (1:1 opcional com `cash_transactions`)
   - `cash_transaction_id` (unique), `natureza_id`, `categoria_id`, `centro_custo_id`, `propriedade_id`, `area_id`, `talhao_id`, `cycle_id`, `projeto_investimento_id`, `origem` (manual/automatica/sugerida), `confianca` (alta/media/baixa), `revisado` (bool), `observacao`
   - **Não altera** `cash_transactions`. Cada lançamento sem registro aqui aparece como "Não classificado".

Todas as tabelas têm RLS público (padrão do projeto), `created_at`, `updated_at` com trigger.

## Etapa 2 — Frontend (página e navegação)

### Arquivos novos
```text
src/pages/Financeiro.tsx                      # página principal com tabs
src/components/financeiro/
  ├── DashboardTab.tsx                        # placeholder com KPIs básicos a partir de cash_transactions + fin_classificacoes
  ├── LancamentosTab.tsx                      # lista cash_transactions + status de classificação (read-only nesta etapa)
  ├── ReclassificacaoTab.tsx                  # placeholder "Em construção" (próxima etapa)
  ├── CategoriasTab.tsx                       # CRUD de fin_categorias
  ├── CentrosCustoTab.tsx                     # CRUD de fin_centros_custo
  ├── NaturezasTab.tsx                        # listar/ativar fin_naturezas
  ├── AreasTalhoesCiclosTab.tsx               # consome areas/talhoes/cycles existentes + CRUD ciclo
  ├── InvestimentosTab.tsx                    # CRUD de fin_projetos_investimento
  └── RelatoriosTab.tsx                       # placeholder

src/hooks/financeiro/
  ├── useFinNaturezas.ts
  ├── useFinCategorias.ts
  ├── useFinCentrosCusto.ts
  ├── useFinProjetos.ts
  └── useFinClassificacoes.ts
```

### Arquivos editados (mínimo)
- `src/App.tsx` — adicionar rota `/financeiro`
- `src/components/layout/AppSidebar.tsx` — adicionar item "Financeiro" (ícone Wallet/PieChart)
- `src/components/layout/MobileBottomNav.tsx` — avaliar inclusão (já tem 4 pilares; adicionar como item secundário se houver espaço, senão deixar acessível só via sidebar/menu desktop)

### Página Fluxo de Caixa
**Não tocada**. `/caixa`, hooks e componentes permanecem como estão.

## Etapa 3 — Comportamento desta entrega

- Todas as abas de configuração (Categorias, Centros de Custo, Naturezas, Investimentos) já operacionais (CRUD básico).
- Aba **Áreas/Talhões/Ciclos**: lista as áreas/talhões/propriedade existentes (read-only) + CRUD na tabela `cycles` existente.
- Aba **Lançamentos**: lista `cash_transactions` com badge "Classificado" / "Não classificado" via join com `fin_classificacoes` — sem permitir editar nesta etapa.
- Aba **Reclassificação** e **Relatórios**: placeholders preparados para a próxima etapa.
- Aba **Dashboard**: KPIs simples (total classificado vs não classificado, totais por natureza).

## Garantias de segurança

- ❌ Nenhum `UPDATE`/`DELETE` em `cash_transactions`, `costs`, `investments`, `revenues`, `loans`, `areas`, `talhoes`, `propriedade`.
- ❌ Nenhuma alteração em `/caixa` ou hooks atuais (`useCashTransactions`, `useCashAnalytics`, etc.).
- ✅ Todas as novas tabelas começam vazias (exceto seeds de configuração).
- ✅ Reclassificação automática **não acontece** nesta etapa.
- ✅ Vínculos via `fin_classificacoes` são reversíveis (basta deletar o registro complementar).

## Próximos passos (fora desta etapa)

- Tela de reclassificação em massa.
- Sugestões automáticas baseadas em descrição/categoria_legada.
- Relatórios DRE, fluxo previsto vs realizado.
- Avaliar migração progressiva de `/caixa` → `/financeiro`.
