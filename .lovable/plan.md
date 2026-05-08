## Objetivo

Simplificar e dar coerência aos formulários da página **Operação**, eliminando campos redundantes em função do nível, abrindo sempre **um modal único** (sem dropdowns no header) e movendo a escolha do pai para **dentro** do próprio formulário, com filtro por tipo.

---

## Mudanças

### 1. Botões do header (`Operacao.tsx`)
- **Remover** o botão "Criação rápida" (e o sheet `QuickOperationSheet`).
- Manter 3 botões simples, sem dropdown:
  - `Novo Projeto` → abre `OperationForm` em modo **projeto**.
  - `Novo Subprojeto` → abre `OperationForm` em modo **subprojeto**.
  - `Nova Subtarefa` → abre `SimpleTaskForm` direto (modal).
- Cada modal traz internamente o seletor de "pai" quando aplicável.

### 2. `OperationForm` — campos condicionais por nível
O formulário deve adaptar-se ao `nivel_tipo` recebido (sem permitir trocá-lo dentro do form):

**Novo Projeto** (nivel = projeto):
- Esconder: campo "Nível", "Categoria", "Vincular a outro projeto", "Depende de".
- Manter: Nome, Área, Ciclo, Responsável, Cronograma (início/duração/fim + chips), Descrição, Observações.

**Novo Subprojeto** (nivel = subprojeto):
- Esconder: campo "Nível", "Categoria".
- **Adicionar no topo**: seletor obrigatório **"Projeto pai"** mostrando **somente projetos** (nivel = projeto, sem `parent_id`). Substitui o atual "Vincular a outro projeto" e o dropdown do header.
- Esconder Área/Ciclo (herdados do projeto pai automaticamente — código já faz isso via `formContext`).
- Manter: Nome, Responsável, "Depende de" (irmãos), Cronograma, Descrição, Observações.

**Editar**: respeita o nível existente; mesma lógica de visibilidade.

> O dropdown da timeline `onAddSubproject(parentId)` continua funcionando — ele já passa o pai e o seletor virá pré-selecionado e bloqueado.

### 3. `SimpleTaskForm` — abrir como modal com seletor de pai
- Já é um modal. **Adicionar** no topo um seletor **"Adicionar em…"** com lista hierárquica:
  - Projeto (negrito) → Subprojetos indentados.
- Quando aberto via "Nova Subtarefa" no header: seletor vazio, usuário escolhe.
- Quando aberto via "+ Subtarefa" dentro de um card/timeline: seletor pré-preenchido com o `stage_id` do contexto.
- Resto do form permanece (título, data, responsável, observações).

### 4. Limpeza no header
- Remover os dois `DropdownMenu` (Subprojeto e Subtarefa) do `Operacao.tsx`.
- Remover import e estado de `QuickOperationSheet` / `quickOpen` / `Zap`.

---

## Detalhes técnicos

- Arquivos editados:
  - `src/pages/Operacao.tsx` — remover dropdowns + botão criação rápida; abrir modais direto.
  - `src/components/operacao/OperationForm.tsx` — esconder/condicionar campos por `nivel_tipo`; trocar "Vincular a outro projeto" por "Projeto pai" obrigatório quando `nivel_tipo === "subprojeto"` (filtra `allProjects` para só projetos top-level).
  - `src/components/operacao/SimpleTaskForm.tsx` — adicionar seletor hierárquico de pai (`stage_id`), aceitar lista de operações via prop.
- Sem migração de banco. Categoria continua existindo no schema (apenas oculta no UI dos projetos/subprojetos novos por enquanto).
- O envio de `linked_project_id` em `Operacao.handleOpSubmit` já move para `parent_id` — basta usar o mesmo mecanismo para subprojeto.

## O que **não** muda
- Timeline, KPIs, filtros, lista, checklist inline.
- Schema/RLS.
- Lógica de progresso automático.
