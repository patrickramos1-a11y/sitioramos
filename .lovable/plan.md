## Reestruturação da hierarquia e visualização da Operação

### Modelo conceitual

Reduzir os níveis para apenas 3, eliminando "subdemanda":

```
Projeto
└── Subprojeto (pode ter outros subprojetos vinculados em sequência)
    └── Subtarefa
```

Um subprojeto pode ser vinculado a outro subprojeto. Visualmente:
- **Recolhido**: os subprojetos vinculados aparecem na MESMA linha, em sequência horizontal (encadeados na timeline, um após o outro).
- **Expandido**: cada subprojeto vinculado quebra para sua própria linha, mostrando as dependências verticalmente.

Cada subprojeto que tenha filhos vinculados ganha um ícone de expansão (▶) para alternar entre os modos.

### Exemplo (caso atual)

O subprojeto "Levantamento" tem "Projeto da Casa de Farinha" e "teste" vinculados.

```
Recolhido:
[Levantamento]──[Projeto Casa de Farinha]──[teste]    ← tudo em uma linha

Expandido:
[Levantamento] ▼
   └─[Projeto Casa de Farinha]
   └─[teste]
```

### Mudanças no menu de ações

Renomear/reorganizar o `ProjectActionsMenu`:
- "Adicionar dentro" → opções: **Subprojeto** e **Subtarefa** (remove "Subdemanda").
- Manter: Marcar como concluído, Editar, Duplicar, Vincular a outro projeto/subprojeto, Excluir.

### Mudanças na timeline (GanttTimeline)

1. **Agrupamento por cadeia**: criar conceito de "chain" — quando um subprojeto B tem `parent_id` igual a outro subprojeto A (cadeia entre subprojetos), B é renderizado na mesma swimlane de A enquanto a cadeia estiver recolhida.
2. **Estado de expansão por subprojeto**: hoje o expand/collapse só existe no projeto raiz. Estender para subprojetos que possuem filhos.
3. **Renderização sequencial**: quando recolhido, ajustar o `swimlane` dos filhos diretos para coincidir com o pai e empilhá-los após o `endPrev/endReal` do antecessor (preservando ordem cronológica).
4. **Botão expansão (▶)** ao lado do nome do subprojeto na coluna esquerda quando ele tiver filhos.
5. **Indicador visual**: um pequeno conector horizontal (linha pontilhada) entre as barras encadeadas para reforçar que são parte da mesma cadeia.

### Mudanças no banco

Nenhuma alteração de schema. O campo `parent_id` já suporta encadeamento N níveis (corrigido anteriormente). A diferença é apenas semântica/visual.

### Migração leve dos dados existentes

Atualizar `nivel_tipo` dos registros existentes que estavam como `subdemanda` para `subprojeto`, para uniformizar a nomenclatura.

### Arquivos a alterar

- `src/components/operacao/ProjectActionsMenu.tsx` — remover "Subdemanda".
- `src/components/operacao/OperationForm.tsx` — remover opção "subdemanda" do seletor de nível.
- `src/components/operacao/GanttTimeline.tsx` — lógica de cadeia, swimlane compartilhada, expansão por subprojeto, conector visual.
- `src/pages/Operacao.tsx` — remover handler `onAddSubdemand`, ajustar criação para sempre usar `subprojeto` ou `subtarefa`.
- `src/lib/operacaoConfig.ts` — atualizar labels/nomenclatura se houver "subdemanda".
- Migration SQL: `UPDATE operational_stages SET nivel_tipo = 'subprojeto' WHERE nivel_tipo = 'subdemanda';`

### Resultado esperado

- Apenas 3 níveis claros: Projeto → Subprojeto → Subtarefa.
- Subprojetos encadeados aparecem inline (mesma linha) quando recolhidos, e quebram em linhas próprias quando expandidos.
- Cada subprojeto com filhos exibe seu próprio botão de expandir/recolher.
- Timeline visualmente mais limpa, com leitura cronológica natural da cadeia.
