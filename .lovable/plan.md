## Objetivo

Adicionar uma nova **aba "Tarefas"** dentro da página `/operacao` (junto com Timeline e Lista) para visualizar e gerenciar **todas** as tarefas em um só lugar, sem precisar abrir cada projeto.

---

## Estrutura

### Nova aba `Tarefas` em `Operacao.tsx`
Junto a `Timeline` e `Lista`, adiciona-se uma terceira: `Tarefas` (ícone `CheckSquare`).

### Conteúdo da aba

**1. Barra de filtros rápidos (topo)**
- Busca por texto (título/descrição).
- Status: Todas / Pendentes / Em andamento / Concluídas / Atrasadas.
- Prioridade: Todas / Baixa / Média / Alta / Crítica.
- Responsável: select de responsáveis cadastrados.
- Projeto/Subprojeto: select hierárquico (reaproveita o padrão da janela de Tarefa).
- Prazo: Hoje / Esta semana / Este mês / Sem prazo / Atrasadas.
- Botão "+ Tarefa" abre o `SimpleTaskForm`.

**2. KPIs compactos (chips horizontais)**
- Total · Pendentes · Em andamento · Atrasadas · Concluídas hoje.

**3. Visualização — agrupamento configurável**
Toggle no topo: `Por projeto` (padrão) | `Por prazo` | `Por responsável` | `Lista plana`.

Cada item da tarefa mostra (linha compacta, mobile-first):
- Checkbox de concluído (toggle direto).
- Título + (se houver) descrição truncada.
- Chip do projeto › subprojeto (clicável → leva ao card na aba Lista).
- Chip do responsável (cor).
- Chip de prazo (vermelho se atrasada, âmbar se hoje/amanhã).
- Bandeira de prioridade.
- Menu `⋮`: Editar / Duplicar / Excluir.

**4. Estado vazio**
Mensagem amigável + botão "Criar primeira tarefa".

---

## Detalhes técnicos

- Arquivo novo: `src/components/operacao/TasksBoard.tsx` — componente que recebe `tasks`, `operations`, `responsaveis` e callbacks (`onEdit`, `onDelete`, `onToggleComplete`, `onCreate`).
- Edição em `src/pages/Operacao.tsx`:
  - Adiciona `TabsTrigger` "Tarefas" e `TabsContent` que renderiza `TasksBoard`.
  - Reutiliza `allTasks`, `operations`, `handleTaskStatusChange`, `setEditingTask/setTaskFormOpen`, `setDeleteTarget`.
- Reaproveita o `SimpleTaskForm` já existente (com seletor de pai). Não precisa de nova janela.
- Sem migração de banco. Sem alteração no hook `useTasks`.
- Filtros e agrupamento ficam em estado local do `TasksBoard` (sem URL params nesta rodada).

---

## Fora de escopo (próximas rodadas)
- Drag & drop entre projetos.
- Edição em massa.
- Exportação CSV.
- Visão calendário/Kanban.
