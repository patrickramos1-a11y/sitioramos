
## Plano: Sistema de Responsáveis

Camada de gestão de pessoas responsáveis por registros (sem login/auth). Vínculos transversais com herança automática em hierarquia de projetos.

### 1. Banco de dados (migration)

**Nova tabela `responsaveis`:**
- `id` uuid PK
- `nome` text NOT NULL
- `apelido` text
- `cor` text NOT NULL (hex, ex: `#22c55e`)
- `icone` text (nome de ícone lucide ou inicial)
- `status` text default `'ativo'` (ativo/inativo)
- `observacoes` text
- `created_at`, `updated_at`
- RLS pública (consistente com restante)
- Seed: Patrick (verde), William (laranja)

**Coluna `responsavel_id uuid` (nullable) adicionada a:**
- `operational_stages` (cobre projeto/subprojeto/demanda/etapa)
- `operational_tasks`
- `areas`
- `talhoes`
- `cycles`
- `cash_transactions`
- `costs`
- `revenues`
- `investments`
- `loans`
- `installments`

Mantemos a coluna textual `responsavel` existente em `operational_stages`/`operational_tasks` por compatibilidade, mas a UI passa a usar `responsavel_id`.

### 2. Hook e componentes base

**`src/hooks/useResponsaveis.ts`** — CRUD + lista cacheada via React Query.

**`src/components/responsaveis/ResponsavelSelect.tsx`** — Select reutilizável (bolinha colorida + nome). Aceita `value`, `onChange`, opção "Nenhum".

**`src/components/responsaveis/ResponsavelBadge.tsx`** — Bolinha colorida + apelido para uso em cards e barras de Gantt.

**`src/components/responsaveis/ResponsavelForm.tsx`** — Formulário (nome, apelido, color picker, ícone, status, obs).

### 3. Nova aba "Responsáveis"

- Rota `/responsaveis` → `src/pages/Responsaveis.tsx`
- Item no `AppSidebar` (desktop) e `MobileBottomNav` (mobile, se houver espaço — caso contrário apenas no menu lateral)
- Layout: lista de cards de responsáveis + botão "Novo"
- Cada card mostra **indicadores consolidados** (queries agregadas):
  - Projetos vinculados (operational_stages onde nivel_tipo='projeto')
  - Tarefas em andamento / atrasadas / concluídas
  - Total custos, total receitas, total transações
  - Áreas e ciclos vinculados
- Clicar no card abre drawer com edição + lista detalhada

### 4. Integração nos formulários

Adicionar `<ResponsavelSelect>` em:
- `OperationForm.tsx` (já tinha `responsavel` texto → migrar para `responsavel_id`)
- `TaskForm.tsx`
- Forms de Áreas, Talhões, Ciclos
- Forms de transações (caixa), Custos, Receitas, Investimentos
- `LoanForm` e form de pagamento de parcela

### 5. Herança automática

Em `useOperations.ts` (criação de subprojeto/subdemanda/subtarefa):
- Ao criar filho via `ProjectActionsMenu`, pré-preencher `responsavel_id` com o do `parent_id`
- Usuário pode alterar manualmente no formulário

Mesma lógica em criação de tarefa dentro de stage (herda do stage).

### 6. Exibição visual

- **Gantt timeline** (`GanttTimeline.tsx`): adicionar `<ResponsavelBadge>` no canto da barra; borda lateral pode usar `cor` do responsável como segunda camada visual (sem conflitar com cor de categoria já existente — usar pequeno chip à esquerda do label).
- **Cards de operação/tarefa**: bolinha colorida + apelido.
- **Linhas do fluxo de caixa**: coluna/badge com bolinha + apelido.

### 7. Filtros

Adicionar dropdown "Responsável" (multi-select) em:
- Visão Geral / Dashboard
- Operação (filtra timeline e lista)
- Fluxo de Caixa (Caixa)
- Áreas, Talhões (lista), Ciclos
- Empréstimos
- Relatórios existentes

Implementar como prop opcional `responsavelIds?: string[]` nos hooks de listagem (`useOperations`, `useCashTransactions`, etc.) e filtro local quando query já está cacheada.

### 8. Detalhes técnicos

- Cor armazenada como hex; renderizada via `style={{ backgroundColor: cor }}` em bolinha de 8–10px
- `ResponsavelSelect` busca lista via React Query (`['responsaveis']`)
- Indicadores na aba Responsáveis: usar `useMemo` sobre dados já carregados quando viável; senão `supabase.rpc`-free com queries `count`/`sum` simples por responsável
- Sem alteração em auth; sem RLS por usuário

### 9. Arquivos a criar/editar

**Criar:**
- `supabase/migrations/<timestamp>_responsaveis.sql`
- `src/pages/Responsaveis.tsx`
- `src/hooks/useResponsaveis.ts`
- `src/components/responsaveis/ResponsavelSelect.tsx`
- `src/components/responsaveis/ResponsavelBadge.tsx`
- `src/components/responsaveis/ResponsavelForm.tsx`
- `src/components/responsaveis/ResponsavelCard.tsx` (com indicadores)

**Editar:**
- `src/App.tsx` (rota)
- `src/components/layout/AppSidebar.tsx` + `MobileBottomNav.tsx`
- `src/components/operacao/OperationForm.tsx`, `TaskForm.tsx`, `GanttTimeline.tsx`
- `src/hooks/useOperations.ts` (herança + filtro)
- Forms e hooks de: areas, talhoes, cycles, costs, revenues, investments, loans, installments, cash_transactions
- Páginas com filtros: `Dashboard.tsx`, `Operacao.tsx`, `Caixa.tsx`, `Areas.tsx`, `Emprestimos.tsx`

### 10. Memória

Adicionar `mem://features/responsaveis` documentando: camada não-auth, herança parent→filho, padrão de cor/badge.
