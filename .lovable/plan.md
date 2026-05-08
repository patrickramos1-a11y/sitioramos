## Objetivo

Evoluir o Diário de Campo para capturar **múltiplos pontos GPS** por registro, com nome, observação, mídia opcional e exportação **KML** (com arquitetura preparada para KMZ/linhas/polígonos no futuro).

---

## 1. Banco de dados (migration)

Criar tabela `journal_points` ligada a `journal_entries`:

- `entry_id` (uuid, ref. journal_entries)
- `nome` (text)
- `observacao` (text, nullable)
- `latitude` (numeric)
- `longitude` (numeric)
- `accuracy` (numeric, nullable)
- `captured_at` (timestamptz, default now)
- `ordem` (int, default 0)
- `manual` (boolean, default false) — true se digitado à mão
- `geometry_type` (text, default `'point'`) — preparado para `'line'` / `'polygon'` no futuro
- `coordinates` (jsonb, nullable) — para futuras geometrias multi-coordenada
- `attachment_id` (uuid, nullable, ref. journal_attachments) — mídia vinculada opcional
- timestamps padrão

RLS pública (mesmo padrão das tabelas do diário). Índice em `entry_id`.

Bucket de storage: reutiliza `journal-media` existente, prefixo `kml/` para os arquivos exportados.

## 2. Hook `useJournalPoints`

`src/hooks/useJournalPoints.ts`:

- `list(entryId)` — lista pontos do registro
- `add(point)` — insere
- `update(id, patch)` — edita nome/observação
- `remove(id)` — deleta
- React Query com invalidação por `entryId`

## 3. Componente `JournalPointsManager`

`src/components/diario/JournalPointsManager.tsx`:

- **Botão grande "Adicionar ponto atual"** (h-14, full-width, mobile-first), usa Geolocation API com `enableHighAccuracy`
- Estado de loading enquanto captura, toast de erro se permissão negada / timeout
- **Fallback manual**: botão "Lançar manualmente" abre dialog com inputs lat/lng/nome/observação
- Auto-naming: "Ponto 1", "Ponto 2"... com possibilidade de editar inline
- Lista de pontos capturados com:
  - Nome (editável inline)
  - Coordenadas formatadas (ex: `-23.5505, -46.6333`)
  - Precisão estimada (`±12m`)
  - Hora da captura (relativa)
  - Botão expandir → observação (textarea) + vincular mídia (select das mídias já anexadas ao registro)
  - Botão excluir (trash)
- Contador "N pontos capturados"

Funciona em dois modos:
- **Modo rascunho** (registro ainda não salvo): mantém pontos em estado local; ao salvar registro, faz batch insert
- **Modo persistido** (registro existente): CRUD direto no banco

## 4. Integração no `Diario.tsx`

- No card de captura, **substituir** o atual botão único "Capturar localização" por `<JournalPointsManager>` em modo rascunho
- Os pontos do rascunho vão junto no `handleSave` (batch insert após criar entry)
- Manter compatibilidade com `latitude`/`longitude`/`location_accuracy` do entry (preencher com o **primeiro ponto** se houver, para não quebrar a coluna existente)
- Na lista de registros já salvos, adicionar seção colapsável "Pontos GPS (N)" mostrando o gestor em modo persistido

## 5. Exportação KML

`src/lib/kmlExport.ts`:

- `buildKml(entry, points)` → string KML com:
  - `<Document>` com `<name>` = título/data do registro
  - Cada ponto como `<Placemark>` contendo `<name>`, `<description>` (observação + hora), `<Point><coordinates>lng,lat,0</coordinates></Point>`
- Arquitetura extensível: função aceita `geometry_type` e prepara branches para `LineString` / `Polygon` (não usados nesta fase)
- Função `exportEntryKml(entryId)`:
  1. Busca pontos
  2. Gera KML
  3. Upload para `journal-media/kml/{entry_id}-{timestamp}.kml`
  4. Retorna URL pública e dispara download no navegador (`<a download>`)

Botão **"Exportar KML"** no header do registro (visível quando há ≥1 ponto), ícone `Download`.

## 6. Detalhes técnicos

- Geolocation: `{ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }` (já usado na página)
- Validação manual: lat ∈ [-90,90], lng ∈ [-180,180]
- KML namespace: `http://www.opengis.net/kml/2.2`
- Coordenadas no KML em ordem `lng,lat,alt` (alt=0)
- Mobile: botão principal `h-14 text-base`, lista em cards verticais
- Sem novas permissões/auth — RLS pública como o resto do diário

## 7. Fora do escopo (preparado para depois)

- KMZ com fotos embutidas (.kmz = zip do KML + assets)
- Captura de linhas/trilhas (watchPosition)
- Polígonos (área desenhada)
- Visualização em mapa

A tabela e o builder KML já são extensíveis para esses casos.
