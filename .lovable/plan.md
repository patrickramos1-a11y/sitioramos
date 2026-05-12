## Módulo Geográfico no Diário de Campo

Transformar a captura GPS em um módulo completo: pontos sequenciais (P1, P2…), linhas e polígonos, com mapa Leaflet, edição, cálculo de área e exportação KML por elemento ou em lote.

---

### 1. Banco de dados

Nova tabela `diary_geometries` (uma geometria = um ponto solto, uma linha ou um polígono):

- `id`, `entry_id` (ref. `journal_entries`)
- `geometry_type`: `point` | `line` | `polygon`
- `name`, `description`
- `geojson` (jsonb com a geometria GeoJSON completa)
- `area_m2` (numeric, calculada para polígonos)
- `length_m` (numeric, calculada para linhas)
- `responsavel_id`, `ordem`, `created_at`, `updated_at`
- RLS pública (mesmo padrão das demais tabelas do diário)

Estender `journal_points` com:

- `geometry_id` (ref. `diary_geometries`, nullable — vincula vértice à sua geometria)
- `point_number` (int — numeração sequencial P1, P2…)
- `point_label` (text — complemento editável)
- `order_index` (int — ordem dentro da geometria)

Pontos soltos continuam funcionando: ficam sem `geometry_id` ou criam `diary_geometries` tipo `point` automaticamente. Migração preserva dados existentes.

---

### 2. Captura GPS (reuso)

Reutiliza `useGpsCapture` já existente (estabilização, watchPosition, classificação de qualidade). Cada vértice salva: lat, lng, altitude, accuracy, captured_at, capture_duration_seconds, readings_count, precision_quality.

---

### 3. Lógica de modos

Hook novo `useDiaryGeometry(entryId)` gerencia:

- modo ativo: `point` | `line` | `polygon`
- geometria em construção (rascunho local) com lista de vértices
- numeração automática P1, P2… (reset por geometria)
- ações: `addCurrentPoint()`, `closePolygon()`, `cancelDraft()`, `commitDraft()`
- validação: polígono exige ≥3 pontos antes de fechar
- ao fechar/commit: persiste `diary_geometries` + `journal_points` vinculados, calcula área (fórmula esférica de Shoelace) e comprimento (Haversine)

Modo `point`: cada captura cria imediatamente uma `diary_geometries` tipo `point` com 1 vértice (P1, P2, P3 sequenciais por entry).

---

### 4. Mapa (Leaflet + OSM)

Novo componente `DiaryMapView`:

- biblioteca: `leaflet` + `react-leaflet`
- camada base: OpenStreetMap (tiles padrão)
- seletor "Mapa | Satélite" preparado (Esri World Imagery como satélite gratuito, sem API key)
- renderiza:
  - markers para pontos com label (P1 / Entrada…)
  - polylines para linhas e polígono em construção
  - polygons fechados com fill semi-transparente
  - vértices visíveis nos polígonos
- popup ao clicar mostra: nome, descrição, precisão, data/hora, responsável
- auto-fit bounds nos elementos da entry

---

### 5. UI — Aba "Mapa / GPS" no registro do diário

Substitui/expande o `JournalPointsManager` atual. Layout:

```
[ Ponto | Linha | Polígono ]  <- seletor de modo
[ + Adicionar ponto atual ]
[ Fechar polígono ]   (só no modo polígono, ≥3 pontos)
[ Exportar KML do diário ]

<mapa Leaflet>

Lista:
  Pontos
    • P1 / Entrada da área   [editar] [exportar] [excluir]
    • P2 / Local do trator
  Linhas
    • Trilha 1 / Caminho do gado   [...]
  Polígonos
    • Polígono 1 / Área vistoriada — 3.250 m² (0,325 ha)   [...]
```

Edição inline do label (após "/"). Excluir vértice de polígono atualiza geojson e recalcula área; alerta se ficar com <3 vértices.

Mobile: botões grandes empilhados, mapa em altura fixa (~50vh), lista abaixo.

---

### 6. Exportação KML

Estender `kmlExport.ts`:

- `Point` → Placemark com `<Point>`
- `line` → Placemark com `<LineString>`
- `polygon` → Placemark com `<Polygon><outerBoundaryIs><LinearRing>`
- ordem correta: `lng,lat,alt`
- description inclui: nome do diário, data, responsável, descrição, precisão, área (se polígono)
- exportação por elemento individual ou todos do registro
- arquivo salvo no bucket `journal-media` (já existe) e baixado no navegador

---

### 7. Componentes/arquivos novos

- `supabase/migrations/<ts>_diary_geometries.sql`
- `src/hooks/useDiaryGeometries.ts`
- `src/hooks/useDiaryGeometryDraft.ts` (estado de rascunho do modo)
- `src/components/diario/DiaryMapView.tsx`
- `src/components/diario/DiaryGeometryManager.tsx` (novo container — substitui o uso atual de `JournalPointsManager` no fluxo de edição)
- `src/lib/geoMath.ts` (área shoelace esférica, comprimento haversine)
- estende `src/lib/kmlExport.ts` (suporte a Line/Polygon e export em lote)

Editados:

- `src/components/diario/JournalPointsManager.tsx` — passa a delegar para `DiaryGeometryManager` quando há geometria, mantendo retrocompat dos pontos soltos antigos
- `src/components/diario/desktop/DiarioCockpit.tsx` — abre o novo manager no detalhe
- `src/components/diario/desktop/diarioExport.ts` — inclui geometrias no ZIP

---

### 8. Dependências

- `leaflet`, `react-leaflet`, `@types/leaflet`

---

### 9. Fora de escopo (para depois)

- Edição de vértice arrastando no mapa
- Camada satélite com Mapbox/Google (deixaremos Esri gratuito como opção inicial; estrutura pronta para trocar)
- Snap entre pontos / edição topológica avançada
- Importação de KML/GPX
