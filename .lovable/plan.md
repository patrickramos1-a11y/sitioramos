## Refatoração da página de Lançamentos

Hoje o formulário sobe de baixo (Sheet bottom) e mistura todos os vínculos no mesmo nível, sem hierarquia. Vamos reorganizar.

### 1. Trocar o Sheet por um Dialog centrado
- Substituir `Sheet side="bottom"` por `Dialog` (modal centralizado, com largura ~`max-w-lg`).
- Título: **"Lançamento"** (sem o "Novo").
- Botão da página continua "Novo lançamento" no header — só o título da janela muda.

### 2. Vínculos hierárquicos (cascata)

Reorganizar os campos do formulário nesta ordem:

```text
Data * | Valor *
Categoria *
Tipo de custo (se categoria = custo_operacional)
─────────────────────────────────────────────
Responsável                                ← NOVO
─────────────────────────────────────────────
Área
  └─ Ciclo (aparece só quando Área selecionada)
─────────────────────────────────────────────
Projeto                                    ← só projetos raiz
  └─ Subprojeto (aparece só quando Projeto selecionado)
─────────────────────────────────────────────
Descrição
Observações
```

**Regras de vínculo:**
- **Área → Ciclo**: ao escolher uma Área, mostrar select de Ciclos filtrados por `cycles.area_id = areaSelecionada`. Se a Área não tiver ciclos, esconder o campo.
- **Projeto → Subprojeto**: o select "Operação vinculada" passa a chamar **"Projeto"** e lista somente operações raiz (`parent_id = null` / nível projeto). Após escolher, aparece **"Subprojeto"** com filhos do projeto escolhido (vindos de `op.children`). Ambos opcionais.
- **Responsável**: novo select usando `useResponsaveis()`, salvando em `responsavel_id` do `cash_transactions`.

**Dedução automática de área**:
- Se o usuário escolher um **Ciclo**, o `area_id` é preenchido a partir do ciclo (regra: ciclo já valida a área).
- Se escolher um **Subprojeto** com `area_id` próprio, sugerir/preencher Área se ainda vazia.

### 3. Campos persistidos em `cash_transactions`
Já existem na tabela — sem migração:
- `area_id`, `cycle_id`, `operation_id` (= projeto OU subprojeto), `responsavel_id`.

Quando o usuário escolher Subprojeto, gravamos `operation_id = subprojetoId` (o subprojeto já carrega referência ao pai pela árvore). Quando só Projeto, `operation_id = projetoId`.

### 4. Pequenos ajustes de UX
- Remover a palavra "Novo" do título do modal (fica "Lançamento").
- Manter validação: Data, Valor e Categoria obrigatórios.
- Resetar campos dependentes quando o pai muda (ex.: trocar Área limpa Ciclo; trocar Projeto limpa Subprojeto).
- Manter o reset do `form` ao abrir.

### Arquivos afetados
- `src/pages/Lancamentos.tsx` — única alteração estrutural.
- Hooks já existentes reutilizados: `useAreas`, `useOperations`, `useResponsaveis`, `useCashTransactions`, e um novo uso de `useCycles` (já existe no projeto).

### Fora de escopo
- Edição inline de lançamento existente (continua só criar/excluir).
- Mudanças na listagem/filtros e KPIs.
- Migrações de banco.
