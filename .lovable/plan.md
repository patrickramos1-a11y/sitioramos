# Refatoração visual da Timeline (Gantt) — Operação

Foco: representar a vida da demanda numa **única barra contínua** dividida em "planejado" e "excedido", preservando a cor própria de cada projeto. Sem mexer em filtros, navegação, zoom, dados ou rotas.

Arquivos afetados:
- `src/components/operacao/GanttTimeline.tsx` (visual das barras + tooltip + legenda)
- `src/lib/operacaoConfig.ts` (apenas paleta — garantir distinção de cor)

---

## Fase 1 — Continuidade visual: planejado + excedido como uma só demanda

### 1.1 Geometria unificada
Hoje a extensão de excedido é renderizada como um `<div>` separado, com bordas arredondadas próprias e fundo hachurado escuro (linhas 952–983). Isso causa o "retângulo solto".

Mudanças em `GanttTimeline.tsx` (bloco linhas ~801–1090, e a duplicata do `inlineChain` ~1092 em diante):

- Renderizar **um único container "barra da demanda"** que vai de `start` até `mainEnd` (planejado) e, quando houver, **uma sub-camada interna** posicionada à direita representando o excedido (`endPrev → today` ou `endPrev → endReal`).
- Container usa `border-radius` apenas nas pontas externas: cantos esquerdos arredondados (início real/planejado), cantos direitos arredondados na ponta final (que será o `endReal` se concluída com atraso, ou `today` se em atraso aberto).
- A divisão entre planejado e excedido é uma **linha vertical fina** (1px, cor do projeto em tom escuro `dark`) — sem borda inteira ao redor do excedido. Isso garante "continuação" e não "barra nova".
- Trecho excedido recebe **mesma cor do projeto, em tom mais escuro** (`dark`/`mid`) com leve textura diagonal sutil (gap maior, opacidade reduzida) — não o hachurado pesado atual.
- Remover as bordas `dotted destructive` do excedido. O alerta vermelho passa a ser apenas o chip `+Nd` flutuante e o ícone de alerta na barra.

### 1.2 Preenchimento interno (progresso)
Atualmente o "fill" de progresso usa `respColor` (cor do responsável) e fica dentro da barra (linhas 998–1003). Substituir por:

- Fundo da barra planejada: tom **claro** da cor do projeto (`soft`/`softer`) com **borda 1.5px sólida** na cor forte do projeto (`strong`).
- Preenchimento de progresso: faixa interna na **cor forte do projeto** (`strong`), avançando da esquerda até:
  - `today` se "em_andamento" dentro do prazo,
  - `endPrev` se atrasada (preenchimento ocupa 100% da barra planejada),
  - `endReal` se concluída no prazo,
  - 100% se concluída.
- Cor do responsável deixa de pintar o progresso. Continua aparecendo só como pequeno marcador/dot na ponta esquerda da barra (preservando identidade do responsável sem quebrar a cor da demanda).

### 1.3 Variação por status (sem perder a cor do projeto)
Reescrever o switch de `barStyle` (linhas 856–885) para sempre usar `projectColor(...)`. Status muda **só o tratamento**:

- `planejada`: fundo `soft`, borda `strong`, sem fill interno.
- `em_andamento`: fundo `soft`, borda `strong`, fill `strong` até hoje.
- `atrasada`: idem em_andamento + extensão de excedido + ícone alerta + chip `+Nd`.
- `concluida`: fundo `strong` cheio, ícone check, sem extensão.
- `concluida_com_atraso`: fundo `strong` cheio até `endPrev`, extensão até `endReal`, chip `+Nd`.
- `pausada`: textura listrada suave em tom `soft` + borda `strong` + ícone pause.
- `travada`: dessaturada (s≈15) + borda tracejada + ícone Lock.
- `cancelada`: cinza neutro com `line-through` (mantém comportamento atual).

Projetos (`level 0`) podem ter borda mais grossa (2px) e altura levemente maior; subprojetos/sub-sub usam mesma lógica com borda mais fina ou tracejada — sem trocar a cor.

---

## Fase 2 — Rótulos, tooltip, legenda e diferenciação de cor

### 2.1 Rótulos separados
Substituir `buildDurationLabel` (linhas 914–925) e o render do label (linha 1010+) por **três chips posicionais**:

- **Dentro/no fim da barra planejada** (alinhado à direita do trecho planejado): `37d planejado` (em barras estreitas, abreviar para `37d plan`).
- **Dentro do trecho excedido** (centralizado, se largura ≥ 40px): `+91d excedido` (em barras estreitas, só `+91d`).
- **Na ponta direita da demanda inteira** (chip flutuante): `128d total` (apenas quando `dTot > dPrev` e há excedido — para concluídas no prazo, mostra apenas o `dPrev d ✓`).

Tipografia: `tabular-nums`, peso 600, tamanho 9–10px. Em telas estreitas/mobile, esconder o "planejado"/"excedido"/"total" e manter só números (ex.: `37d`, `+91d`, `128d`).

### 2.2 Cálculos (revisar `computeStageMetrics`)
A lógica atual já cobre o essencial. Ajustes pontuais em `src/lib/operacaoConfig.ts`:

- Renomear/garantir nomes claros:
  - `diasPlanejados` (alias de `duracaoPrevista`).
  - `diasTotais` = `(fimReal ?? today) - start` (já existe).
  - `diasExcedidos` = `max(0, diasTotais - diasPlanejados)` (já existe; revisar para usar diasTotais para consistência).
  - Adicionar `percentualPlanejadoDecorrido` = `min(1, diasDecorridosDentroDoPrazo / diasPlanejados)`.
  - Adicionar `percentualTotal` = `diasTotais / diasPlanejados`.
- Garantir que `start` use `data_inicio_real ?? data_inicio_prevista` consistentemente (já ok).

### 2.3 Tooltip enriquecido
Substituir o tooltip atual (linhas ~978–982 e tooltip principal da barra) por um único bloco com:

- Nome da demanda (negrito) + chip de status.
- Responsável (com cor própria).
- Início (real ou planejado).
- Fim planejado.
- Fim real (se houver).
- `Dias planejados: N`
- `Dias decorridos: N` (com `%` do planejado).
- `Dias excedidos: N` (em vermelho, só se > 0).
- `Dias totais: N`.
- Linha-resumo: "No prazo" / "Atrasada há Xd" / "Concluída no prazo" / "Concluída com Xd de atraso".

O tooltip do trecho excedido deixa de existir (a barra inteira é um único hover target).

### 2.4 Legenda atualizada
Reescrever a legenda (linhas ~1215–1230) com 6 entradas refletindo a nova semântica:

- Período planejado (caixa `soft` + borda `strong`).
- Progresso realizado (faixa `strong` dentro da caixa).
- Tempo excedido (continuação em tom `dark` com textura sutil).
- Concluída (caixa cheia `strong` + check).
- Pausada/Travada (textura/dashed + ícone).
- Linha de hoje (linha vermelha vertical).

### 2.5 Cor única por demanda — reforço
Hoje `getProjectVisualColor` pode usar a hue da **categoria** (linhas 121–141), o que faz vários projetos da mesma categoria ficarem com cor idêntica. Mudança em `GanttTimeline.tsx`:

- `projectColorFor` deve **priorizar `getProjectColor(projectId)`** (hash do id → paleta) e usar a categoria apenas como fallback quando não houver projectId estável. Isso garante que cada demanda tenha cor distinta mesmo dentro da mesma categoria.
- Manter a paleta de 12 cores atual (já bem distribuída).

---

## Critérios de aceite (validação visual)

- [ ] Demanda "teste" (37d planejados, 128d totais) mostra: barra planejada terminando em `endPrev`, extensão hachurada suave até hoje, chips `37d planejado` + `+91d excedido` + `128d total`.
- [ ] Trecho excedido **parece colado** na barra planejada (sem gap, sem cantos arredondados internos, mesma cor base).
- [ ] Dois projetos diferentes nunca têm cor idêntica (testar com 3+ projetos da mesma categoria).
- [ ] Concluída no prazo: barra cheia até `endReal`, sem extensão, label `Nd ✓`.
- [ ] Concluída com atraso: barra cheia até `endPrev` + extensão até `endReal` + chips.
- [ ] Em andamento dentro do prazo: fill `strong` até hoje, sem extensão.
- [ ] Em andamento atrasada: fill 100% da barra planejada + extensão até hoje + alerta.
- [ ] Tooltip mostra todos os campos da seção 2.3.
- [ ] Legenda reflete os 6 estados.
- [ ] Mobile (≤640px): chips colapsam para versão curta, barra mantém legibilidade.

---

## Detalhes técnicos

- Mesmas mudanças aplicadas no bloco principal e no `inlineChain` (linhas ~1092+) para manter consistência visual em chains inline.
- Manter `getBarPosition`, `dayToPx`, `colWidth` intactos — apenas a renderização da barra muda.
- Sem migrações de banco. Sem mudanças em hooks ou rotas.
