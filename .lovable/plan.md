## Refatoração — Timeline como centro da experiência do Ciclo

### Objetivo
Transformar a Timeline na interface principal do ciclo: visual, clicável, com legibilidade garantida para etapas curtas, cadastro mínimo (nome + responsável + dias) e ações inline (concluir, +Antes, +Depois).

---

### 1. Nova Timeline interativa (`CycleStageTimeline.tsx`)

**Visão Resumida (padrão):**
- Barra horizontal segmentada por etapa, em ordem cronológica.
- **Largura híbrida:** cada bloco usa `flex-grow` proporcional aos dias, mas com `min-width` (ex. 90px desktop / 70px mobile) — garante nome + duração visíveis em etapas curtas. Etapas longas absorvem a compressão.
- Cada bloco mostra: **nome** (em destaque), **Xd**, e ícone de status (✓ concluída, ● atual, ! atrasada, ○ prevista).
- Cores: concluída sólida, atual com ring + brilho, atrasada com tom destrutivo, prevista mais clara. Tudo via tokens do design system (HSL).
- Marcador "Hoje" (linha vertical) sobre a barra.
- **Clique no bloco:** expande aquele bloco (mostra detalhes inline abaixo: datas previstas/reais, responsável, status, botões Concluir / Editar / + Antes / + Depois / Excluir).
- Entre blocos, "slot" hover com botão **+** discreto que abre o modal já com posição = "depois desta".
- Botão flutuante/ancorado no fim da barra: **"+ Etapa"** = adiciona no final.

**Visão Expandida (toggle):**
- Botão "Expandir tudo" / "Recolher tudo" no topo da timeline.
- Quando expandida, todos os blocos mostram seu painel de detalhes empilhado, mantendo a barra visual no topo.

**Acima da barra:** range de datas (início → fim previsto) e total de dias.

### 2. Modal de Nova Etapa simplificado (`CycleStageForm.tsx`)

Reduzir o modal principal a **3 campos**:
1. Nome *
2. Responsável (select, opcional)
3. Duração em dias *

Recolhidos em "Mais opções":
- Atividade curta
- Observação

**Posição é implícita** (vem do contexto do botão clicado: + final / + Antes(refId) / + Depois(refId)) — remove o select de "Posição" + "Etapa de referência" do modal principal. O preview de datas previstas continua exibido no rodapé do modal (auto-calculado).

Botão "Criar etapa" ativo só com nome + duração ≥ 1.

### 3. Página `CicloDetalhe.tsx`

- A aba **Timeline** vira a aba principal (já é default) e absorve as ações inline (concluir, editar, adicionar antes/depois, excluir) — não exige mais ir à aba Etapas para operar.
- A aba **Etapas** mantém-se como visão tabular detalhada (apoio), sem mudanças funcionais.
- Header do ciclo, indicadores e alertas permanecem como estão.

### 4. Detalhes técnicos

- `CycleStageTimeline` passa a receber callbacks: `onConcluir(id)`, `onEdit(id)`, `onAddBefore(id)`, `onAddAfter(id)`, `onAddAtEnd()`, `onDelete(id)`.
- Estado local `expandedId: string | null` + flag `expandAll: boolean`.
- Largura híbrida via `flex` com `flex: <dias> 1 <minWidth>px` (ou cálculo manual normalizando proporção e aplicando min-width depois).
- Tooltip (shadcn) no nome quando truncado, exibindo nome completo + duração + datas.
- Sem mudanças no schema/DB nem em `useCycleStages` — toda a lógica de recálculo, conclusão e posição já existe.
- Sem mudanças em `stageCalc.ts`.

### 5. Arquivos afetados

- `src/components/cycles/CycleStageTimeline.tsx` — reescrita (visual + interatividade + expand)
- `src/components/cycles/CycleStageForm.tsx` — simplificação (3 campos visíveis, resto colapsado, remove select de posição)
- `src/pages/CicloDetalhe.tsx` — passa callbacks à Timeline; Timeline absorve ações inline

### Critérios de aceite cobertos
✓ Timeline central e clicável · ✓ visão resumida + expandida · ✓ legibilidade garantida (min-width) · ✓ modal com apenas 3 campos · ✓ posição implícita (final / antes / depois via botões) · ✓ datas auto-calculadas · ✓ conclusão em 1 clique · ✓ aba Etapas como apoio.
