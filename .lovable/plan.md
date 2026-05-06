## Padronizar tamanho das barras na timeline

Hoje as barras encolhem conforme o nível e o swimlane (linha de empilhamento), o que dificulta a leitura do texto dentro delas — exatamente o que aparece na imagem (a barra "Projeto da Casa de Farinha" no topo está alta, e os subprojetos abaixo vão ficando cada vez mais finos).

A causa é uma fórmula em `GanttTimeline.tsx` que reduz a altura de cada subprojeto com base no nível e no swimlane:

```
baseTop  = isProject ? 5 : 9 + swimlane * 4
baseHeight = isProject ? ROW_HEIGHT - 10
                       : max(12, ROW_HEIGHT - 18 - swimlane * 6)
```

### Mudança

Usar **a mesma altura de barra para todos os itens** (projeto, subprojeto, qualquer nível, qualquer swimlane), mantendo a aparência visual atual de cores/borda e o sistema de cadeia inline:

- `baseTop = 5`
- `baseHeight = ROW_HEIGHT - 10`

Com isso, todas as barras ficam do mesmo tamanho do "Projeto da Casa de Farinha".

### Trade-off (e como mitigamos)

Quando dois subprojetos do mesmo pai se sobrepõem no tempo, hoje eles ficam lado a lado verticalmente dentro da mesma linha (swimlane reduzindo a altura). Com altura fixa, a sobreposição deixaria de ter o "degrau" visual.

Solução: continuar **calculando o swimlane** (já existe), mas em vez de diminuir a altura, manter a altura padrão. Como cada item ocupa sua própria linha na lista (uma `row` por subprojeto), na prática só há sobreposição visual quando há cadeia inline (subprojetos vinculados encadeados na mesma linha do pai recolhido) — e nesse caso o conector pontilhado entre as barras já indica a sequência. Não há perda de informação relevante.

### Arquivos

- `src/components/operacao/GanttTimeline.tsx` — substituir o bloco de cálculo de `baseTop`/`baseHeight` (linhas ~765–769) pela versão fixa.

### Resultado esperado

Todas as barras (projeto raiz, subprojetos de qualquer nível, cadeias inline) ficam com o mesmo tamanho confortável, com texto sempre legível.
