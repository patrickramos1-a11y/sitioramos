# Revisão da Timeline / Gantt — Plano em 2 Fases

Objetivo: corrigir a lógica de cálculo de dias (planejado vs. excedido vs. total) e melhorar a diferenciação visual das barras, **sem reconstruir a timeline**. Manter estrutura, navegação, filtros, lista lateral e linha do "Hoje".

Arquivos principais:
- `src/lib/operacaoConfig.ts` — paleta de projetos, `computeStageMetrics`, `deriveStageStatus`.
- `src/components/operacao/GanttTimeline.tsx` — render das barras, chips, tooltip, legenda, cadeia inline.

---

## FASE 1 — Lógica do tempo, semântica dos dias e estados temporais

Foco em **correção de cálculo e leitura semântica**. Sem grande mexida visual ainda — só o suficiente para representar planejado x excedido corretamente.

### 1.1 Estender `computeStageMetrics` (operacaoConfig.ts)

Adicionar campos derivados:
- `diasExcedidos` — dias além de `data_fim_prevista` (>0 só quando ultrapassou; conta até hoje se em execução, ou até `data_fim_real` se concluído com atraso).
- `diasTotais` — dias corridos desde o início (real ou previsto) até hoje (se em execução) ou até `data_fim_real` (se concluído).
- `diasDecorridos` — dias entre início e hoje, sem cap em `duracaoPrevista`.
- `concluidaComAtraso` — boolean (`data_fim_real > data_fim_prevista`).
- Manter `duracaoPrevista`, `duracaoReal`, `percentConsumido`, `diasRestantes`.

### 1.2 Refinar `deriveStageStatus`

Distinguir explicitamente os 6 cenários do prompt:
- `planejada` (não iniciou)
- `em_andamento` (iniciou, dentro do prazo)
- `atrasada` (iniciou, passou do `data_fim_prevista`, sem `data_fim_real`)
- `concluida` (no prazo) — quando `data_fim_real <= data_fim_prevista`
- `concluida_com_atraso` — novo derivado, quando `data_fim_real > data_fim_prevista`
- `travada` / `pausada` — mantidos

Trata `concluida_com_atraso` como variante visual de `concluida`, não como novo status no select de formulário.

### 1.3 Corrigir geometria das barras (GanttTimeline.tsx)

Hoje a barra "principal" cresce até `today` quando atrasada, escondendo o conceito de prazo. Mudança:

- **Barra principal** = sempre `start → data_fim_prevista` (corpo planejado). Largura fixa do planejado.
- **Extensão de excedido** = trecho separado de `data_fim_prevista → today` (em execução atrasada) ou `→ data_fim_real` (concluída com atraso). Visual claramente distinto (ver Fase 2).
- Para concluída no prazo: barra principal vai de `start → data_fim_real` (sem extensão).
- Para sem `data_fim_prevista`: fallback atual.

### 1.4 Refazer chip de duração na barra

Substituir o atual `37/37d` confuso por rótulo semântico compacto. Lógica:
- Concluída no prazo → `37d ✓`
- Concluída com atraso → `37d +5d` (planejado + excedido)
- Em execução no prazo → `12/37d` (decorrido/planejado)
- Em execução atrasada → `37d +18d` (planejado + dias excedidos), com chip do excedido em cor de alerta
- Planejada → `37d` (somente planejado)

Em barras estreitas (largura <80px), exibir só o excedido se >0; caso contrário, omitir.

### 1.5 Tooltip enriquecido

Reorganizar conteúdo do tooltip já existente para mostrar exatamente:
- Nome, status (label humano), responsável, categoria
- Início (real ou previsto), Fim previsto, Fim real (se houver)
- Duração planejada (Xd)
- Dias decorridos desde o início
- Dias excedidos (quando >0, em destaque)
- Dias totais de existência da demanda
- % concluído (checklist quando houver)
- "Em atraso há Xd" / "Concluída no prazo" / "Concluída com Xd de atraso"

### 1.6 Atualizar a legenda inferior

Adicionar entradas para:
- "Tempo excedido" (faixa hachurada/outline)
- "Concluída com atraso"
Mantendo as demais (planejada, em execução, concluída, travada, hoje).

### Critério de aceite Fase 1
- Item "teste" com 37d planejado e prazo vencido passa a mostrar `37d` (barra) + extensão visível de `+18d` (ou Nd reais).
- Tooltip lista planejado, decorrido, excedido, total — todos coerentes.
- Concluídas com atraso aparecem distintas de concluídas no prazo.

---

## FASE 2 — Identidade visual e diferenciação das barras

Só entra após Fase 1 estar validada. Foco em **personalidade da cor** e **separação cor-do-projeto vs. tratamento-de-status**.

### 2.1 Nova paleta de projetos

Em `operacaoConfig.ts` (`PROJECT_PALETTE`), substituir a paleta atual (8 tons muito próximos verde/terra) por uma paleta de **10–12 cores** com matizes bem distintas e saturação maior, mantendo aderência agro:
- verde floresta, verde folha, azul, amarelo/dourado, laranja, marrom, verde-azulado (teal), oliva, terracota/tijolo, ameixa/violeta, ocre, cinza-azulado.

Saturação base ~55–70%, lightness base ~35–45% (legível em fundo claro). Continuar derivando hash do `projectId`, mas garantir distribuição (ex.: lista maior reduz colisão visual).

Heurística opcional: se a operação tem `categoria` definida, derivar a cor da `hue` da categoria (já existe em `OPERATION_CATEGORIES`) em vez do hash do id — assim "Casa de Farinha", "Plantio de Abóbora" etc. ficam previsivelmente coloridos. Hash do id continua como fallback quando sem categoria.

### 2.2 Separar "cor do projeto" de "status visual"

Regra: **cor base = identidade do projeto, sempre presente**. Status muda apenas o tratamento.

Mapeamento:
- **Planejada**: fundo claro (`l: 92`) + borda sólida da cor forte + texto em cor escura. Aparência "leve".
- **Em execução (no prazo)**: fundo médio da cor do projeto (`l: 45–50`) com preenchimento de progresso interno mais escuro/opaco proporcional ao % consumido.
- **Em execução atrasada**: mesma base que "em execução", mas com **borda destacada** (ex.: ring + ícone de alerta) + extensão de excedido tratada como faixa hachurada/outline na cor do projeto em tom escuro.
- **Concluída no prazo**: fundo sólido na cor forte + check + sombra leve (estado atual já está bom).
- **Concluída com atraso**: sólido na cor forte + faixa de excedido visível ao final (hachurada na própria cor do projeto, não verde fixo) + ícone diferenciado (ex.: check com badge `+Nd`).
- **Travada**: cor do projeto dessaturada com borda tracejada + ícone de cadeado (manter).
- **Pausada**: opacidade reduzida + listras diagonais sutis.
- **Cancelada**: cinza com strikethrough (manter).

### 2.3 Tratamento da extensão de excedido

Hoje a extensão usa cor verde fixa (`hsl(142 70% 22%)`), o que quebra a identidade do projeto. Mudar para:
- Hachura (`repeating-linear-gradient`) **na cor do projeto em tom escuro** (`l: 22`) com listras na cor do projeto em tom médio (`l: 38`).
- Borda superior/inferior pontilhada para reforçar "fora do plano".
- Pequeno chip flutuante ao final: `+Nd` em cor de alerta (vermelho/destrutivo) sobreposto.

### 2.4 Hierarquia visual por nível

Manter a regra atual mas reforçar:
- Projeto raiz (level 0): preenchido sólido, fonte 11px semibold.
- Subprojeto (level 1): fundo claro + borda 2px sólida.
- Sub-sub (level ≥2): fundo bem claro + borda tracejada + barra ligeiramente menor (ex.: `baseHeight - 4`).

A borda lateral de 3px continua exibindo a cor forte do projeto raiz em todos os níveis (já existe).

### 2.5 Chips de informação sobre a barra

Padronizar os 2 chips (duração + checklist) para herdarem a cor do projeto em vez de branco translúcido fixo, garantindo contraste mínimo (texto branco quando bg escuro, texto escuro quando bg claro). Chip de excedido sempre em cor de alerta para chamar atenção.

### 2.6 Acessibilidade e mobile

- Garantir contraste WCAG AA do texto sobre cada cor da nova paleta (ajustar `l` se necessário).
- Em mobile (já usa o mesmo componente), validar que as cores se mantêm distinguíveis em barras curtas. Reduzir min-width das barras para 6px e priorizar cor + ícone quando não couber texto.
- Cadeia inline (subprojetos recolhidos) usa as mesmas regras de cor/status — atualizar o bloco `inlineChain` em paralelo.

### Critério de aceite Fase 2
- Cada projeto tem cor visivelmente distinta no Gantt; não há mais aparência monocromática.
- Status muda o tratamento (preenchimento, borda, hachura) **sem apagar** a cor do projeto.
- Barras atrasadas se distinguem instantaneamente de barras normais.
- Funciona bem em desktop (>1024px) e mobile (≤414px).
- Legenda inferior reflete a nova semântica visual.

---

## Detalhes técnicos (referência)

```text
Geometria das barras (Fase 1.3)
─────────────────────────────────────────────────────────────────
                start            fimPrev                 today
                  │                 │                      │
  Planejada       ░░░░░░░░░░░░░░░░░░░  (não iniciou ainda)
  Em andamento    ████████░░░░░░░░░░░  (progresso interno)
  Atrasada        ███████████████████░░░░│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│
                                          ↑ extensão excedida (hachura)
  Concl. atraso   ███████████████████│▒▒▒▒▒▒▒│✓
                                       fimReal
  Concl. no prazo ██████████✓
                            fimReal ≤ fimPrev
```

Sem mudanças em: estrutura de árvore, `items` build, swimlanes, filtros, navegação temporal, zoom, sticky labels, conector pontilhado da cadeia inline (apenas reaproveita nova cor).
