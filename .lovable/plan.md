# Refatoração: Estrutura Física × Estrutura Produtiva

## Visão geral

Separar **estrutura física da terra** (Propriedade → Talhão → Área → Tarefa) da **estrutura produtiva** (Ciclos). Áreas deixam de ser item principal do menu; passam a ser acessadas via Talhão. Ciclos ganham aba própria e podem se vincular a áreas inteiras ou frações (tarefas físicas de 2.500 m²).

---

## 1. Navegação

**Remover do menu lateral:** item "Áreas".
**Adicionar ao menu lateral:** item "Ciclos" (`/ciclos`).
**Manter:** Propriedade (já existente).

Nova hierarquia de navegação:
```text
Propriedade (/propriedade)
  └── Talhão (/talhoes/:id)
        └── Área (/areas/:id)        ← rota preservada
              └── Tarefas (seção interna)
Ciclos (/ciclos)                     ← nova aba
  └── Ciclo (/ciclos/:id)
```

Rotas existentes de áreas continuam válidas; apenas saem do menu principal. Mobile bottom-nav recebe o mesmo tratamento (Áreas sai, Ciclos entra).

---

## 2. Conceito: Tarefa física

**Regra fixa:** 1 tarefa = 2.500 m² → 1 ha = 4 tarefas.

Exposto via helper `src/lib/territory/tarefas.ts`:
```ts
export const M2_POR_TAREFA = 2500;
export const haParaM2 = (ha:number) => ha * 10000;
export const haParaTarefas = (ha:number) => (ha * 10000) / 2500; // = ha * 4
```

Cálculo é **derivado** (não armazenado) — sempre a partir de `tamanho_hectares`.

---

## 3. Banco de dados

**Nova tabela `cycle_area_allocations`** — vínculo N:N entre ciclos e áreas com fração:

| coluna | tipo | descrição |
|---|---|---|
| `id` | uuid | PK |
| `cycle_id` | uuid | ciclo |
| `area_id` | uuid | área |
| `ocupa_area_inteira` | bool | se true, ignora `tarefas_ocupadas` |
| `tarefas_ocupadas` | numeric | fração (ex: 1, 2,5) |
| `percentual` | numeric | gerado/derivado para exibição |
| `observacao` | text | opcional |
| `created_at`/`updated_at` | timestamptz | padrão |

RLS pública (consistente com tabelas existentes), sem FK rígida (padrão do projeto).

**Migração de dados:** para todo `cycles` existente, criar 1 allocation com `area_id = cycles.area_id`, `ocupa_area_inteira = true`. Coluna `cycles.area_id` é mantida como "área principal" para compatibilidade.

---

## 4. Página da Área (`AreaDetalhe`)

Reorganizar em blocos:

**Cabeçalho** — nome, talhão vinculado (link), badge "Unidade física".

**KPIs físicos** (cards):
- Tamanho em hectares
- Tamanho em m²
- Total de tarefas (calculado)
- Tarefas ocupadas / livres

**Seção "Tarefas da área"** (nova):
- Barra horizontal segmentada mostrando ocupação por ciclo (cores de cultura)
- Lista: cada ciclo com nº de tarefas e %
- Indicador "Livre" para o restante

**Seção "Ciclos vinculados"**:
- Cards de ciclos (lê `cycle_area_allocations` + `cycles`)
- Mostra cultura, status, datas, tarefas ocupadas, % da área
- Botão "Gerenciar vínculos" abre dialog para ajustar/criar allocations

**Seção "Custos & Receitas proporcionais"**:
- Para cada ciclo vinculado, exibir custo total do ciclo × % de participação da área
- Exemplo: Abóbora R$ 10.000 × 35% = R$ 3.500 atribuído a esta área
- Receitas idem
- Resultado da área = receitas proporcionais − custos proporcionais

**Seção existente** de cultura principal/observações mantida.

Texto explícito no topo: "Esta área é uma unidade física. Os ciclos produtivos são geridos na aba Ciclos."

---

## 5. Página de Ciclos (`/ciclos`) — nova

Lista geral de ciclos com:
- Cultura, status, datas
- Áreas vinculadas (chips multi-área)
- Total de tarefas ocupadas no sistema
- Custo acumulado e receita

Detalhe do ciclo (`/ciclos/:id`):
- Dados do ciclo
- Seção "Alocação territorial": tabela de allocations editável (área + tarefas/inteira + %)
- Custos, receitas, tarefas operacionais (reaproveita componentes existentes)

---

## 6. Página do Talhão

Adicionar/garantir lista de áreas filhas com mini-cards mostrando: hectares, tarefas totais, tarefas ocupadas, ciclos ativos. Cada card é link para `/areas/:id`.

---

## 7. Detalhes técnicos

**Arquivos novos:**
- `src/lib/territory/tarefas.ts` — helpers de conversão
- `src/hooks/useCycleAreaAllocations.ts` — CRUD da nova tabela
- `src/components/areas/TarefasSection.tsx` — barra + lista de ocupação
- `src/components/areas/CiclosVinculadosSection.tsx`
- `src/components/areas/CustosProporcionaisSection.tsx`
- `src/components/areas/AlocacaoCicloDialog.tsx` — criar/editar vínculo
- `src/pages/Ciclos.tsx` + `src/pages/CicloDetalhe.tsx`
- `src/components/cycles/AlocacaoTerritorialSection.tsx`

**Arquivos editados:**
- `src/components/layout/AppSidebar.tsx` — remover Áreas, adicionar Ciclos
- `src/components/layout/MobileBottomNav.tsx` — mesmo ajuste
- `src/App.tsx` — registrar rotas `/ciclos` e `/ciclos/:id`
- `src/pages/AreaDetalhe.tsx` — reordenar blocos, adicionar seções
- `src/pages/TalhaoDetalhe.tsx` (se existir) — listar áreas com KPIs novos
- `src/components/layout/AppLayout.tsx` — `routeTitles` para `/ciclos`

**Cálculo proporcional de custos** (fase 1, simples):
```ts
custoAreaProporcional = custoTotalCiclo * (tarefasOcupadasNaArea / totalTarefasDoCiclo)
```
Onde `totalTarefasDoCiclo` = soma de `tarefas_ocupadas` (ou tarefas totais da área quando `ocupa_area_inteira`) em todas as allocations do ciclo.

**Compatibilidade:** nada é apagado. `cycles.area_id` continua válido como "área principal" e é refletido como uma allocation `ocupa_area_inteira=true` na migração.

---

## 8. Fora de escopo desta entrega

- Editor visual de tarefas no mapa (apenas barra segmentada/lista)
- Rateio automático retroativo de `costs`/`revenues` históricos (apenas exibição calculada)
- Validação de soma de tarefas > total (warning visual, sem bloquear)

---

## 9. Critérios de aceite (do pedido)

- [x] "Áreas" sai do menu principal, acessível via Propriedade → Talhão
- [x] Cálculo automático de tarefas (1 tarefa = 2.500 m²)
- [x] Página da área mostra ha, m² e tarefas
- [x] Vínculo ciclo↔área com área inteira ou fração de tarefas
- [x] Visualização de ciclos vinculados e ocupação na área
- [x] Custos/receitas proporcionais por área
- [x] Nova aba "Ciclos" como home da gestão produtiva
- [x] Dados existentes preservados via migração inicial de allocations
