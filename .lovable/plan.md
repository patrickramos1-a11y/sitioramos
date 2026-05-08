
# Mobile da Operação — Visualização e filtros

Objetivo: no mobile (<768px), substituir a Gantt densa atual por um modo híbrido com 3 visões alternáveis, filtros em bottom sheet com chips e cartões muito reconhecíveis (cor do projeto + emoji da categoria + avatar do responsável). Desktop continua como está.

---

## 1. Estrutura nova da página (mobile)

```text
┌─────────────────────────────┐
│ KPIs (2 col, já existem)    │
├─────────────────────────────┤
│ [Filtros ▾]  3 ativos · ✕   │  ← botão único + chips de filtros ativos
├─────────────────────────────┤
│ [ Cards | Agenda | Gantt ]  │  ← segmented control (3 visões)
├─────────────────────────────┤
│                             │
│        Conteúdo da          │
│        visão escolhida      │
│                             │
└─────────────────────────────┘
```

A aba "Tarefas" atual continua existindo, mas no mobile vira um item dentro do menu de filtros / ou uma 4ª opção do segmented (manter "Tarefas" como tab separada de nível superior também funciona — proponho manter as Tabs existentes "Timeline / Lista / Tarefas" só no desktop, e no mobile usar o segmented novo).

---

## 2. Visão A — Cards de Projeto (default mobile)

Lista vertical de cartões grandes, um por projeto raiz. Cada cartão:

- Faixa lateral colorida (4px) com a cor do projeto (paleta já existe em `GanttTimeline.tsx`).
- Linha 1: emoji da categoria (grande, ~24px) + nome do projeto + menu `⋯`.
- Linha 2: avatar circular do responsável (com `ResponsavelBadge`) + nome curto.
- Linha 3: barra de progresso fina (% calculado a partir de tarefas concluídas / total) + status pill colorida.
- Linha 4: período "12 mai – 30 jun" + chip de área (📍 Talhão 3) + custo total compacto.
- Toque: expande inline mostrando subprojetos como mini-chips horizontais roláveis (cada chip = nome + status dot). Toque longo no cartão = abrir form de edição.

---

## 3. Visão B — Agenda (timeline vertical)

Feed cronológico agrupado por mês, depois por semana. Cada item:

- Coluna esquerda fina: dia + mês (estilo "12 MAI").
- Cartão à direita com cor do projeto na borda esquerda, emoji categoria, nome da etapa, responsável (avatar pequeno) e status.
- Marcadores especiais: "Hoje" (linha destacada), "Atrasado" (badge vermelho).
- Ordenação: por `data_inicio_prevista` (ou `data_fim_prevista` quando concluída).
- Inclui projetos, subprojetos e tarefas com data definida.

---

## 4. Visão C — Gantt mini (1 linha por projeto)

Versão compactada da Gantt atual:

- Apenas raízes (projetos), nunca expande no mobile.
- 1 barra por projeto, altura 40px, cor do projeto, emoji da categoria à esquerda + nome truncado.
- Zoom limitado a `month / quarter / year` (sem dia/semana — não fazem sentido em 380px).
- Header de meses sticky no topo. Scroll horizontal preservado.
- Toque na barra → abre bottom sheet com lista de subprojetos/tarefas (reaproveita `OperationCard`).
- Reaproveita boa parte da lógica de `GanttTimeline.tsx`, com flag `compact` que: força nivel raiz, esconde swimlanes, esconde checklist progress inline, usa altura menor.

---

## 5. Filtros em bottom sheet único

Substitui no mobile os 3 selects atuais (Área/Status/Categoria) e o `LayersPanel` da Gantt:

- Trigger: botão "Filtros" no topo (com badge de contagem) + chips ativos abaixo (clicáveis pra remover).
- Sheet inferior (shadcn `Sheet side="bottom"`) com seções colapsáveis:
  1. **Status** — segmented (Todos / Em andamento / Atrasadas / Pendentes / Concluídas).
  2. **Responsável** — grid de avatares clicáveis (multi-select).
  3. **Área** — lista com checkbox.
  4. **Categoria** — chips com emoji.
  5. **Camadas** (só na visão Gantt mini) — toggles para ocultar áreas/projetos/responsáveis.
- Botões fixos no rodapé do sheet: "Limpar tudo" + "Aplicar".
- Estado de filtros vive na página `Operacao.tsx` e é compartilhado entre as 3 visões.

---

## 6. Identidade visual (aplicada nas 3 visões)

- **Cor do projeto**: usa `getProjectHsl/projectColor` que já existe em `GanttTimeline.tsx` — extrair pra `src/lib/operacaoConfig.ts` para reuso.
- **Emoji da categoria**: `getCategoryEmoji` já existe.
- **Avatar do responsável**: `ResponsavelBadge` em modo `size="sm"` com inicial ou ícone, usando `cor` do `responsaveis`.
- Garantir contraste WCAG no texto sobre as cores do projeto (texto branco em fundos escuros, escuro em claros).

---

## Detalhes técnicos

**Arquivos novos:**
- `src/components/operacao/mobile/MobileOperacaoView.tsx` — orquestra segmented + filtros + visões.
- `src/components/operacao/mobile/ProjectCard.tsx` — visão Cards.
- `src/components/operacao/mobile/AgendaTimeline.tsx` — visão Agenda.
- `src/components/operacao/mobile/MiniGantt.tsx` — Gantt simplificada (pode importar helpers de `GanttTimeline.tsx`).
- `src/components/operacao/mobile/OperationFiltersSheet.tsx` — bottom sheet com filtros + camadas.
- `src/components/operacao/mobile/ActiveFilterChips.tsx` — barra de chips removíveis.

**Arquivos modificados:**
- `src/pages/Operacao.tsx` — usar `useIsMobile()` para renderizar `MobileOperacaoView` no mobile e manter o layout atual no desktop. Levantar estado de filtros para uso compartilhado.
- `src/lib/operacaoConfig.ts` — exportar `getProjectColor` (mover de GanttTimeline).
- `src/components/operacao/GanttTimeline.tsx` — extrair os helpers de cor; nenhuma mudança de comportamento.

**Sem mudanças no banco de dados.** Tudo é UI sobre dados já existentes.

**Breakpoint:** `useIsMobile()` (já existe, breakpoint 768px).

---

## Critério de aceite

1. Em 402px de largura, ao abrir Operação:
   - Vejo KPIs, botão Filtros + chips ativos, segmented Cards/Agenda/Gantt.
   - Default = Cards. Cada cartão mostra cor + emoji + avatar com clareza, sem precisar dar zoom.
2. Toco em "Filtros" → bottom sheet sobe com seções organizadas; filtros aplicados aparecem como chips removíveis.
3. Troco para Agenda → vejo timeline vertical agrupada por mês.
4. Troco para Gantt → vejo 1 barra por projeto, scroll horizontal suave, sem barras minúsculas ilegíveis.
5. Desktop (≥768px) permanece idêntico ao atual.

---

## Fora de escopo (pode entrar depois)

- Drag & drop de tarefas entre dias na Agenda.
- Modo landscape específico para Gantt completa no mobile.
- Sincronia de zoom entre Agenda e Gantt mini.
