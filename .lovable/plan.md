
# Refatorar a página de Tarefas (mobile)

## Problemas atuais

Olhando os prints e o código de `TasksBoard.tsx` (usado dentro de `MobileOperacaoView` quando o usuário clica em "Tarefas"), o layout atual foi desenhado para desktop e está ocupando muito espaço vertical no celular:

1. O segmented control no topo corta a aba **"Tarefas"** ("Tar..."), porque agora são 4 botões competindo por espaço.
2. A barra de busca é enorme e ocupa uma linha inteira ao lado de um botão "+ Tarefa" igualmente grande.
3. Logo abaixo, **5 selects gigantes** (Status, Prioridade, Responsável, Projeto, Prazo) quebram em 3 linhas.
4. Os KPIs (Total, Pendentes, Em andamento, Atrasadas, Concluídas hoje) também quebram em 2 linhas.
5. A linha "Agrupar por" tem 4 botões grandes que extrapolam a largura.
6. Não existe diferenciação entre o `TasksBoard` mostrado no desktop e o renderizado dentro do `MobileOperacaoView`.

## Princípios do refator

- Aplicar o **shell mobile** já documentado (`mem://style/mobile-app-shell`): controles pequenos (h-8), filtros em **bottom sheet** ao invés de selects soltos, listas verticais limpas.
- Reaproveitar o padrão visual já usado no topo de `MobileOperacaoView` (botão "Filtros" + chips ativos + sheet de filtros).
- Manter 100% do desktop intacto — `TasksBoard` continua como está para `>= md`.

## Mudanças

### 1. Novo componente `MobileTasksView`

Arquivo: `src/components/operacao/mobile/MobileTasksView.tsx`.

Recebe os mesmos props de `TasksBoard` (tasks, operations, onCreate/Edit/Delete/ToggleComplete) e implementa um layout próprio para celular.

Layout (de cima para baixo):

```text
┌─────────────────────────────────────────────────┐
│ 🔍 Buscar tarefas...        [Filtros 2]   [ + ] │ ← linha única, h-9
├─────────────────────────────────────────────────┤
│ • Ativas  • Patrick  • Hoje                   × │ ← chips ativos (scroll-x)
├─────────────────────────────────────────────────┤
│ 24 Total · 4 Pend. · 0 Andam. · 1 Atras. · 0 ✓ │ ← KPIs em uma linha (scroll-x)
├─────────────────────────────────────────────────┤
│ Agrupar:  [Projeto] Prazo  Resp.  Lista         │ ← pílulas h-7 (scroll-x)
├─────────────────────────────────────────────────┤
│ Lista de grupos / cards (igual hoje)            │
└─────────────────────────────────────────────────┘
```

Detalhes:
- **Toolbar (linha 1)**: Input de busca `h-9` ocupando `flex-1`; botão "Filtros" outline `h-9 px-2.5` com ícone `SlidersHorizontal` + badge contando filtros ativos; botão "+" primário `h-9 w-9 icon` (sem texto).
- **Filtros**: abre `Sheet side="bottom"` (mesmo padrão do filtro de projetos no `MobileOperacaoView`) contendo seções para Status, Prioridade, Responsável, Projeto/Subprojeto e Prazo — com pílulas/checkboxes ao invés de selects. Roda em `ScrollArea` e botão "Aplicar (N tarefas)" no rodapé.
- **Chips de filtros ativos**: linha `overflow-x-auto no-scrollbar`, cada chip remove o filtro ao tocar (mesmo `FilterChip` reaproveitado de `MobileOperacaoView`, ou um similar local).
- **KPIs**: substituir badges grandes por uma fileira compacta `text-[11px]` em `flex gap-3 overflow-x-auto no-scrollbar` (sem quebrar linha). Atrasadas em `text-destructive`, andamento em `text-primary`, concluídas em `text-success`.
- **Agrupar por**: pílulas `h-7 text-[11px]` com label "Agrupar:" prefixo, em uma linha rolável horizontalmente.
- **Lista**: manter exatamente a renderização atual (`groups.map(...)` com checkbox + título + badges de projeto/responsável/prazo/prioridade + dropdown de ações), só com `tap-card` e padding ajustados.

### 2. Ajuste no `MobileOperacaoView.tsx`

- No segmented control (linha ~277-282), quando há 4 botões cabe pouco texto. Tornar `SegBtn` **icon-only** (sem `<span>label</span>`) e adicionar `aria-label` apenas, garantindo que os 4 botões caibam confortavelmente em 391px de largura. Manter texto só em `>= sm`.
- Substituir o uso atual de `<TasksBoard ... />` (linha ~310-318) por `<MobileTasksView ... />` quando `view === "tarefas"`.

### 3. `TasksBoard.tsx` (desktop) inalterado

Continua sendo usado em `Operacao.tsx` no caminho desktop. Nenhuma mudança de lógica/dados — só quem renderiza no celular muda.

## Detalhes técnicos

- Reaproveitar `useResponsaveis`, `stageMap`, `respMap`, `filtered`, `groups` exatamente como em `TasksBoard`. Para evitar duplicação, extrair essas funções puras (`buildStageMap`, `applyTaskFilters`, `buildGroups`, `formatPrazo`) para `src/lib/tasksUtils.ts` e importá-las em ambos os componentes.
- Tipos `Grouping`, `PRIORIDADES` e helpers de data também vão para `tasksUtils.ts`.
- Estados de filtros no mobile passam a ser objetos `Set` (`responsavelIds`, `parentIds`, `prazo`, `prioridade`, `status` único) consistentes com o padrão do filtro de projetos.
- Sem mudanças de schema, hooks ou lógica de negócio.

## Arquivos afetados

- novo: `src/components/operacao/mobile/MobileTasksView.tsx`
- novo: `src/lib/tasksUtils.ts` (extração de helpers compartilhados)
- editado: `src/components/operacao/mobile/MobileOperacaoView.tsx` (segmented icon-only + troca para `MobileTasksView`)
- editado: `src/components/operacao/TasksBoard.tsx` (passa a importar helpers de `tasksUtils.ts`; visual desktop intacto)

## Fora de escopo

- Lógica de criação/edição/exclusão de tarefas (formulários e mutations continuam idênticos).
- Página desktop de Operação.
- Backend / hooks de dados.
