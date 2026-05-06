## Objetivo

Reformular o visual dos balões do Gantt em `Operação` para que cada projeto tenha sua própria cor (derivada da paleta da marca Sítio Ramos), os subprojetos herdem essa cor com tratamento visual diferenciado, e cada barra mostre o tempo de duração e o quanto já se passou.

## Diagnóstico (por que está tudo "vermelho")

Hoje o `GanttTimeline.tsx` colore as barras pela **categoria** da operação (`getCategoryColor`). Como a maioria dos projetos cai em categorias com hue próximo (`casa_farinha` 20, `infraestrutura` 25, `manejo_limpeza` 95) — e o fallback é verde — visualmente quase todos viram tons de terracota/laranja. Não há diferenciação por **projeto raiz** nem hierarquia visual entre projeto e subprojeto além de uma fina borda lateral.

## Mudanças propostas

### 1. Cor por projeto (raiz) — paleta Sítio Ramos

- Substituir a paleta `PROJECT_PALETTE` atual (8 cores genéricas) por uma paleta alinhada à marca:
  - Verde Floresta `145 60% 18%`
  - Verde Folha `138 60% 30%`
  - Amarelo Sol `43 90% 42%`
  - Terra `20 55% 38%`
  - Oliva `95 45% 32%`
  - Tijolo `15 65% 42%`
  - Azul sereno `200 50% 32%`
  - Ameixa `280 35% 38%`
- Função `getProjectColor(rootProjectId)` continua determinística (hash → índice), garantindo cor estável por projeto.
- Toda a árvore de um projeto (raiz + subprojetos + cadeia inline) usa a **mesma matiz**, variando só luminosidade/preenchimento conforme o nível.

### 2. Hierarquia visual: projeto vs subprojeto

Tratamento por nível, sempre na cor do projeto raiz:

| Nível | Estilo da barra |
|---|---|
| Projeto (level 0) | Preenchido sólido, cor forte, texto claro, sombra |
| Subprojeto (level 1) | Preenchimento claro (mesma matiz, light alta) + borda sólida 2px na cor forte |
| Sub-subprojeto (level ≥ 2) | Fundo translúcido + **borda tracejada** 2px na cor forte |
| Concluído | Sólido na cor forte + ícone ✓ |
| Em andamento | Borda sólida + barra interna de progresso na cor do responsável (mantido) |
| Atrasada | Hachurado já existente (mantido) |
| Travada | Cinza tracejado (mantido) |

Isso substitui o uso de `getCategoryColor` na coloração da barra. A categoria continua aparecendo via emoji + label no tooltip e ao lado do nome, preservando a leitura semântica.

### 3. Métrica de tempo na ponta da barra

Renderizar um pequeno chip à direita dentro da barra (quando `pos.width > ~80px`) com:

- **Projeto/subprojeto com datas previstas**: `Xd · Y/Zd` onde `Z = duracaoPrevista`, `Y = dias decorridos desde startPrev até hoje (limitado a Z)`.
- **Concluído**: `Z d ✓` (duração real ou prevista).
- **Sem datas**: chip omitido.

Usa `item.metrics` que já existe (`duracaoPrevista`, `duracaoReal`, `percentConsumido`). A lógica de "dias decorridos" é derivada de `startPrev`/`startReal` vs hoje.

Em telas estreitas (barra < 80px), o chip é suprimido e a info aparece apenas no tooltip (que já mostra duração e dias restantes).

### 4. Cadeia inline (subprojetos recolhidos)

Mantém o mesmo critério de cor (matiz do projeto raiz, tratamento por nível) — assim, quando um subprojeto está recolhido com filhos inline, todas as bolhas inline ficam visualmente irmãs e claramente pertencentes ao mesmo projeto.

### 5. Coluna esquerda (lista PROJETOS)

A borda lateral colorida de cada linha continua usando `getProjectColor`, agora com a nova paleta — reforça o vínculo visual coluna ↔ barra.

## Arquivos afetados

- `src/components/operacao/GanttTimeline.tsx`
  - Atualizar `PROJECT_PALETTE`.
  - Substituir o bloco de `barStyle` (atual baseado em `getCategoryColor`) por uma função `getBarStyle(item, status)` que recebe a cor do projeto raiz e o nível.
  - Aplicar o mesmo na cadeia inline.
  - Adicionar o chip de duração/decorrido dentro da barra.

Sem mudanças em banco, hooks, ou outros componentes.

## Fora do escopo

- Editor de cor por projeto (cor é derivada do id, automática).
- Mudar a semântica de categorias (continuam como label/emoji/filtro).
- Alterar zoom, navegação ou estrutura da timeline.
