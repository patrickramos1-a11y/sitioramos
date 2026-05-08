# Plano — Diário de Campo (Captura Rápida)

Objetivo: transformar o Diário de Campo num caderno digital minimalista que prioriza captura rápida no mobile (texto/áudio/foto/vídeo), deixando organização e classificação para depois.

Princípio: **registre agora, organize depois.** Salvar em <20s, sem campos obrigatórios além de 1 conteúdo.

---

## Fase 1 — Fundação de dados e armazenamento

Preparar schema e storage para suportar mídias e classificação posterior.

**Schema (`journal_entries`)**
- Tornar `title` opcional (NULL).
- Adicionar `status` (informativo/atencao/pendente/resolvido/importante; default `informativo`).
- Adicionar `reviewed` (boolean, default false) — controla "Não revisado / Revisado".
- Adicionar `tags` (text[]).
- Adicionar `weather` (text), `is_important` (bool).
- Manter `area_id`, `cycle_id`, `responsavel_id`, `entry_type`, `description`, `notes`.

**Nova tabela `journal_attachments`**
- `id`, `entry_id` (FK), `kind` (audio/photo/video), `storage_path`, `mime_type`, `duration_seconds` (audio/vídeo), `size_bytes`, `width`/`height` (foto), `created_at`.

**Storage bucket `journal-media`** (público para leitura, qualquer um pode upload — coerente com o padrão atual do projeto).

**Regra de "Não revisado"**: derivada — qualquer registro sem `area_id` E sem `cycle_id` E sem `entry_type` (ou usando default `observacao`) é tratado como não revisado na UI; flag `reviewed` permite marcar manualmente.

---

## Fase 2 — Tela de captura rápida (mobile)

Substituir o `JournalEntryForm` (modal) por uma página dedicada `/diario` (e atalho a partir do botão "Diário de Campo" na home).

**Estrutura**
```text
[Header compacto]  Diário de Campo · "Registre o dia a dia do sítio."

[Card de captura]
  "O que aconteceu no campo hoje?"
  ┌───────────────────────────────────┐
  │ Escreva uma observação rápida...  │  (textarea auto-grow)
  └───────────────────────────────────┘
  [🎤 Áudio]  [📷 Foto]  [🎬 Vídeo]

  ⌄ Adicionar detalhes      [Salvar Registro]

[Últimos registros]   (timeline compacta, 5 mais recentes)
```

**Comportamento**
- Botão "Salvar" só habilita se houver pelo menos 1 conteúdo (texto OU áudio OU foto OU vídeo).
- Data/hora automática; usuário automático (quando autenticado).
- "Adicionar detalhes" é um `Collapsible` com Tipo, Área, Projeto/Ciclo, Status.
- Dentro dos detalhes, link "Mais opções" abre Responsável, Observações, Clima, Tags, "Marcar como importante", Vincular tarefa/despesa (placeholders prontos para evoluir).
- Após salvar: limpar formulário, manter foco no textarea, exibir toast e atualizar timeline sem reload.

---

## Fase 3 — Captura de mídia

Implementar os três fluxos de mídia, todos opcionais e independentes.

**Áudio** (`MediaRecorder` API)
- Toque em 🎤 → abre painel inline com cronômetro, Pausar/Parar, preview (`<audio>`), Excluir, Confirmar.
- Salva como `webm/opus`; upload no `journal-media/audios/<entryId>/...`.
- Permite salvar registro só com áudio.

**Foto**
- `<input type="file" accept="image/*" capture="environment" multiple>`.
- Mostra grid de miniaturas com botão remover.
- Upload em `journal-media/photos/<entryId>/...`.

**Vídeo**
- `<input type="file" accept="video/*" capture="environment">`.
- Mostra miniatura (frame inicial via `<video preload=metadata>`).
- Limite sugerido de duração 60s (validação client-side); compressão fica como evolução futura.

**Fluxo de salvamento**
1. Insere `journal_entries` (rascunho com texto e metadados).
2. Faz upload de cada anexo no Storage.
3. Insere linhas em `journal_attachments`.
4. Em caso de falha de upload, marca o entry com `notes` indicando "anexo pendente" para retry posterior.

---

## Fase 4 — Timeline e ganchos para gestão posterior

**Timeline (mobile, abaixo do card)**
- Card por registro: data/hora relativa, tipo (chip), trecho do texto, ícones de anexos (🎤 com duração, 📷 com contagem, 🎬), badge "Não revisado" quando aplicável.
- Tap no card abre detalhe simples (visualizar texto + mídias; ações: revisar, editar tipo/área/projeto, excluir).

**Hooks de gestão (estrutura, sem tela completa de gestão desktop)**
- `useJournalEntries` ganha filtros opcionais (data, tipo, área, projeto, reviewed).
- Ações utilitárias: `markReviewed`, `convertToTask` (cria `operational_tasks` ligada ao entry), `convertToExpense` (abre fluxo de Lançamentos pré-preenchido).
- Desktop herda a mesma página com layout em duas colunas (captura à esquerda, lista filtrável à direita) — implementação mínima nesta fase, evolução futura para tela de gestão dedicada.

---

## Detalhes técnicos

- **Migrações**: 1 migração para alterar `journal_entries` + criar `journal_attachments` + criar bucket `journal-media` + policies públicas (alinhado ao padrão do projeto).
- **Hooks novos**: `useJournalAttachments`, `useAudioRecorder` (encapsula `MediaRecorder`).
- **Componentes novos**:
  - `src/pages/Diario.tsx` (rota `/diario`).
  - `src/components/diario/QuickCapture.tsx` (card principal).
  - `src/components/diario/AudioRecorder.tsx`.
  - `src/components/diario/PhotoPicker.tsx`.
  - `src/components/diario/VideoPicker.tsx`.
  - `src/components/diario/DetailsCollapsible.tsx`.
  - `src/components/diario/EntryTimeline.tsx` + `EntryCard.tsx`.
- **Remoção**: `JournalEntryForm` (modal) deixa de ser usado na home — botão "Diário de Campo" passa a navegar para `/diario`.
- **Storage upload**: usar `supabase.storage.from('journal-media').upload(...)` direto do cliente; URLs públicas via `getPublicUrl`.
- **Permissões do navegador**: pedir permissão de microfone só ao tocar em 🎤; mostrar fallback amigável se negada.
- **Tema**: paleta verde floresta/folha + amarelo sol + bege; cards arredondados (`rounded-2xl`); microinterações suaves (`active:scale-[0.98]`); aparência de caderno (papel off-white, leve textura via gradient).

---

## Entregas por fase (para execução incremental)

1. **Fase 1**: migração de schema + bucket + atualização do hook `useJournalEntries`.
2. **Fase 2**: nova página `/diario` com captura de texto + Adicionar detalhes + Salvar (sem mídias ainda) + timeline básica.
3. **Fase 3**: Áudio → Foto → Vídeo (nessa ordem), cada um habilitado e testado isoladamente.
4. **Fase 4**: ações de revisão, conversão para tarefa/despesa, layout desktop em duas colunas.

Critério de aceite final: usuário abre o app no mobile, toca em "Diário de Campo", grava um áudio de 10s e salva — sem digitar nada — em menos de 20 segundos.