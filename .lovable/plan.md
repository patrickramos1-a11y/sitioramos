## Refatoração da Operação: Projeto › Subprojeto › Subtarefa (checklist)

Hoje a página mistura "subprojetos" e "tarefas" como se fossem coisas equivalentes (ambas viram barras grandes na timeline). Vou separar claramente em **3 níveis** com regras visuais e operacionais distintas.

### Conceito final

```
▶ Projeto Principal           (barra forte na timeline)
   ▶ Subprojeto               (barra na timeline, hue do projeto, traço sólido)
      ☐ Subtarefa             (checklist, NUNCA aparece como barra)
      ☑ Subtarefa
```

- **Projeto** e **Subprojeto** = `operational_stages` (já existe, usa `nivel_tipo`).
- **Subtarefa** = `operational_tasks` (já existe), tratada apenas como checklist.

### Mudanças principais

**1. Botões da página Operação**
- `Novo Projeto` (cria stage nível projeto)
- `Novo Subprojeto` (habilita-se ao haver projeto selecionado / também acessível pelo menu de cada projeto)
- `Nova Subtarefa` (habilita-se a partir de um projeto/subprojeto)
- "Criação rápida" mantida.

**2. Timeline (`GanttTimeline.tsx`)**
- Renderizar **apenas** projetos e subprojetos como barras.
- Remover qualquer renderização de `tasks` como barras.
- Em cada barra, mostrar um indicador de checklist: `☑ 5/10 (50%)` quando houver subtarefas.
- Manter paleta hierárquica já implementada (sólido / borda sólida / tracejado).

**3. Listagem (`OperationCard.tsx`)**
- Estrutura recolhível em 3 níveis:
  - Projeto → Subprojetos → Checklist de subtarefas (com checkbox inline).
- Subtarefas exibidas como lista simples, com:
  - checkbox de concluído
  - texto/título
  - data (opcional), responsável (opcional)
  - menu para observações/anexos (anexos ficam como TODO visual; armazenamento de arquivo não está em escopo aqui — campo de URL/observação por enquanto)
- Botão "+ Subtarefa" dentro de cada subprojeto e também dentro do projeto (se a tarefa for direto no projeto).

**4. Progresso automático**
- `progresso_percentual` do **subprojeto** = % subtarefas concluídas (calculado em runtime, exibido na barra/lista).
- `progresso_percentual` do **projeto** = média ponderada dos subprojetos (ou % de subtarefas totais — usar % subtarefas totais por simplicidade).
- Cálculo só no front (não altera schema). O campo persistido continua disponível para override manual futuro.

**5. Formulário de subtarefa (`SimpleTaskForm.tsx`)**
- Já é simples; ampliar levemente com: data (opcional), responsável (opcional), observações (textarea opcional).
- Sem `data_inicio_prevista`/`data_prazo` obrigatórios — tudo opcional. Sem custo no formulário básico (custo continua editável se necessário, mas escondido por padrão).

**6. Vínculos preservados**
- Projetos e subprojetos continuam vinculáveis a área, talhão, ciclo, responsável, custos, receitas, empréstimos (já suportado pelo schema `operational_stages` + `cash_transactions`). Nada muda no banco.

### Detalhes técnicos

- **Sem migração de banco.** Schema atual (`operational_stages.nivel_tipo` + `operational_tasks` + `task_checklist_items`) já suporta tudo.
- Arquivos editados:
  - `src/pages/Operacao.tsx` — reorganizar botões; remover tasks da timeline.
  - `src/components/operacao/GanttTimeline.tsx` — não desenhar tasks; adicionar chip de progresso de checklist nas barras de subprojeto/projeto.
  - `src/components/operacao/OperationCard.tsx` — renderizar checklist de subtarefas dentro de cada subprojeto, com checkbox inline e botão "+ Subtarefa".
  - `src/components/operacao/SimpleTaskForm.tsx` — adicionar data, responsável e observações opcionais.
- Cálculo de progresso utilitário inline em `OperationCard` e `GanttTimeline` (sem novo hook).

### O que **não** será feito agora
- Upload real de anexos (storage). Fica como observação/URL livre.
- Dependências entre subprojetos (já existe `depends_on_id` no schema, mas UI fica para outra rodada).
- Mudanças em DRE / Caixa.

Confirma que posso seguir nessa linha?
