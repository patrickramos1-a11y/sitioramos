## Visão geral

Hoje a página **Diário de Campo** é otimizada para captura no celular: card grande de "o que aconteceu hoje", botões de mídia, lista cronológica simples. Ótima para o app, ruim para gestão no desktop, onde o trabalho é **consultar, filtrar, revisar, editar, vincular, exportar e arquivar** muitos registros.

A proposta é manter o app móvel exatamente como está e criar uma **experiência desktop paralela** ("Cockpit do Diário"), que entra em ação a partir de `md:` (≥768px). Mesma rota `/diario`, mesmos dados, layout e fluxo diferentes.

---

## Layout desktop — 3 zonas

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Header: título + KPIs (Total / Pendentes / Importantes / Sem vínculo)    │
│         + botões: Novo registro · Exportar · Atualizar                   │
├────────────────────┬────────────────────────────┬────────────────────────┤
│ Sidebar Filtros    │ Lista (tabela ou timeline) │ Painel de detalhe      │
│ (280px, sticky)    │ (flex-1, scroll próprio)   │ (420px, sticky)        │
│                    │                            │                        │
│ Período            │ ┌──────────────────────┐   │ Galeria de mídias      │
│ Tipo               │ │ ☐ 12/05 · Plantio    │   │ Texto / observações    │
│ Status             │ │   Casa de Farinha    │   │ Vínculos (Área/Ciclo/  │
│ Área               │ │   Patrick · 📷3 🎤   │   │ Responsável/Tarefa)    │
│ Ciclo              │ ├──────────────────────┤   │ Pontos GPS + mapa      │
│ Responsável        │ │ ☐ 12/05 · Ocorrência │   │                        │
│ Tags (multi)       │ │   ⚠ Pendente         │   │ Ações:                 │
│ Revisado: todos/   │ └──────────────────────┘   │ ✎ Editar  ⤓ Baixar     │
│  pendente/feito    │                            │ ✓ Revisar  ↪ Tarefa    │
│ ★ Importantes      │ Paginação / "Carregar +"   │ 💰 Custo  🗑 Excluir   │
│ Tem mídia          │                            │                        │
│ Sem vínculo        │                            │                        │
│ Busca (texto)      │                            │                        │
└────────────────────┴────────────────────────────┴────────────────────────┘
```

No mobile (`<md`) nada muda — segue o card de captura atual.

---

## Funcionalidades por zona

### 1. Header + KPIs
- 4 cartões pequenos: **Total no período**, **Pendentes de revisão**, **Importantes**, **Sem vínculo (sem área/ciclo/responsável)**. Cada cartão é clicável e aplica o filtro correspondente.
- Botões: **Novo registro** (abre dialog de captura — mesmo formulário do mobile), **Exportar** (CSV/ZIP), **Atualizar**.

### 2. Sidebar de filtros (esquerda, sticky)
- **Período**: presets (hoje, 7d, 30d, este mês, últimos 90d) + range customizado.
- **Tipo de registro** (multi): observação, plantio, limpeza, colheita, manutenção, ocorrência, clima, ambiental.
- **Status** (multi): informativo, atenção, pendente, resolvido, importante.
- **Área**, **Ciclo**, **Responsável** — selects com busca.
- **Tags** — multi, sugeridas a partir das tags já usadas.
- **Revisado**: todos / pendentes / revisados.
- Toggles: **★ Importantes**, **Com mídia**, **Sem vínculo**, **Com GPS**.
- **Busca textual** no topo (título + descrição + notas).
- "Limpar filtros" e contador de filtros ativos.
- Filtros sincronizados com a URL (`?periodo=30d&tipo=plantio&area=…`) para compartilhar links.

### 3. Visualização central — duas abas
- **Tabela** (default desktop): colunas selecionáveis — `☐ | Data | Tipo | Título | Área | Ciclo | Responsável | Status | Mídias | Tags | Ações`. Ordenação por coluna, seleção múltipla com checkbox.
- **Timeline**: agrupamento por dia, igual à versão atual mas em lista densa.
- (Futuro: aba **Mapa** plotando pontos GPS — fora do escopo desta entrega.)
- **Carregar mais** ou paginação 50/100/200 (hoje há `limit: 50` fixo — passamos a paginar).

#### Ações em massa (quando 1+ selecionado)
Aparece uma barra fixa no rodapé da lista:
- Marcar como revisado / não revisado
- Marcar como importante
- Atribuir responsável
- Vincular a área / ciclo
- Adicionar tags
- Exportar selecionados (CSV ou ZIP de mídias)
- Excluir (com confirmação)

### 4. Painel de detalhe (direita, sticky)
Ao clicar uma linha, abre o painel (sem sair da página):
- **Cabeçalho**: data, tipo, status, badge de responsável, ★ importante.
- **Mídias**: galeria com lightbox para fotos, player para vídeo e áudio, download individual.
- **Texto**: descrição e observações em modo leitura, com botão ✎ que vira edição inline.
- **Vínculos editáveis**: área, ciclo, responsável, tags, tipo, status — alterar e salvar sem abrir modal.
- **Pontos GPS**: lista + miniatura de mapa (ou link "abrir no Maps") usando o `JournalPointsManager` em modo leitura.
- **Ações**:
  - ✓ Marcar revisado / Reabrir
  - ↪ Converter em **tarefa** (já existe `convertToTask`)
  - 💰 Lançar **custo** (já existe `handleConvertToExpense`)
  - ⤓ Baixar tudo (ZIP com mídias + um `registro.json` com os metadados)
  - 🗑 Excluir
- **Histórico**: created_at, updated_at, quem revisou (quando houver).

### 5. Exportação e download
- **Linha única**: botão ⤓ baixa um ZIP `diario-<data>-<id>.zip` com mídias originais + `registro.json`.
- **CSV** (1 ou N registros): planilha com colunas data, tipo, título, descrição, área, ciclo, responsável, status, tags, lat, lng, qtd_fotos, qtd_videos, qtd_audio, links públicos das mídias.
- **ZIP em massa**: pasta por registro, mais um `index.csv` no raiz.
- Tudo gerado no cliente com `JSZip` + `file-saver` (pequenos) — sem backend novo.

### 6. Edição
- Edição inline no painel de detalhe para campos simples (título, descrição, status, vínculos, tags, importante).
- Botão "Editar completo" abre o mesmo formulário de captura em dialog para mexer também em mídias e pontos.
- Adicionar/remover **mídias** depois de criado: upload novo no bucket `journal-media`, novo registro em `journal_attachments`; remoção apaga arquivo + linha.

### 7. Exclusão
- Soft delete não está no escopo (o schema não suporta hoje); mantém DELETE direto com confirmação ("Isso vai apagar X mídias e Y pontos. Continuar?").
- Em massa: dialog único com contagem total.

---

## Detalhes técnicos

- **Sem mudança de schema.** Tudo já está em `journal_entries`, `journal_attachments`, `journal_points`.
- `useJournalEntries` ganha:
  - filtros novos: `dateFrom/dateTo`, `responsavelId`, `tags`, `hasMedia`, `hasNoLink`, `search`;
  - paginação cursor/offset;
  - mutation `bulkUpdate` (revisar/atribuir/tags em N ids) e `bulkDelete`;
  - mutation `addAttachment`/`removeAttachment` para edição pós-criação.
- Novos componentes em `src/components/diario/desktop/`:
  - `DiarioCockpit.tsx` (orquestra layout 3 colunas)
  - `DiarioFilters.tsx` (sidebar)
  - `DiarioTable.tsx` (tabela + seleção)
  - `DiarioTimeline.tsx` (modo alternativo)
  - `DiarioDetailPanel.tsx` (painel direito)
  - `DiarioBulkBar.tsx` (ações em massa)
  - `DiarioExport.ts` (helpers CSV/ZIP)
- `Diario.tsx` decide via `useIsMobile()`/`md:` qual versão renderizar; o formulário de captura vira `DiarioCaptureForm` reaproveitado pelos dois modos (mobile inline; desktop em dialog).
- Sincronização URL ↔ filtros via `useSearchParams`.
- ZIP/CSV: adicionar `jszip` e `file-saver` (pequenas).
- Acessibilidade: tabela com `aria-sort`, painel direito como `aside` com foco gerenciado, atalhos: `J/K` próximo/anterior, `R` revisar, `E` editar, `Del` excluir.
- Tokens de design: reaproveita `brand-leaf`, `brand-forest`, `brand-sun` já em uso, sem cores cruas.

---

## Entregáveis

1. Layout desktop em 3 colunas em `/diario` (mobile intacto).
2. Filtros completos sincronizados com URL + busca textual.
3. Tabela com seleção, ordenação, ações em massa.
4. Painel de detalhe com edição inline, vínculos, mídias, pontos, ações (revisar, tarefa, custo, baixar, excluir).
5. Exportação CSV individual/em massa e ZIP com mídias.
6. Sem mudanças de banco; sem afetar o fluxo do app móvel.

## Fora do escopo (sugerir depois)

- Aba **Mapa** com clusters dos pontos GPS.
- Soft delete + lixeira.
- Comentários/threads por registro.
- Relatório PDF formatado por período.
