// Helpers de métricas R$/hectare para áreas, ciclos e propriedade.

import type { ResolvedTx } from "./managementGroup";

type AreaLite = { id: string; nome: string; tamanho_hectares: number };
type CycleLite = { id: string; cultura: string; area_id: string; data_inicio_plantio: string; data_real_colheita?: string | null; areas?: { nome: string } | null };

function txArea(r: ResolvedTx): string | null {
  return r.classif?.area_id ?? r.tx.area_id ?? null;
}
function txCycle(r: ResolvedTx): string | null {
  return r.classif?.cycle_id ?? r.tx.cycle_id ?? null;
}

export function custoTotalArea(areaId: string, txs: ResolvedTx[]): number {
  return txs
    .filter((r) => r.grupo === "custo_plantacao" && txArea(r) === areaId)
    .reduce((s, r) => s + Number(r.tx.valor || 0), 0);
}

export function receitaTotalArea(areaId: string, txs: ResolvedTx[]): number {
  return txs
    .filter((r) => r.grupo === "receita_operacional" && txArea(r) === areaId)
    .reduce((s, r) => s + Number(r.tx.valor || 0), 0);
}

export function custoTotalCiclo(cycleId: string, txs: ResolvedTx[]): number {
  return txs
    .filter((r) => r.grupo === "custo_plantacao" && txCycle(r) === cycleId)
    .reduce((s, r) => s + Number(r.tx.valor || 0), 0);
}

export function receitaTotalCiclo(cycleId: string, txs: ResolvedTx[]): number {
  return txs
    .filter((r) => r.grupo === "receita_operacional" && txCycle(r) === cycleId)
    .reduce((s, r) => s + Number(r.tx.valor || 0), 0);
}

export function hectaresArea(area: AreaLite | undefined): number {
  return Number(area?.tamanho_hectares || 0);
}

export function hectaresCiclo(cycle: CycleLite | undefined, areas: AreaLite[]): number {
  if (!cycle) return 0;
  const a = areas.find((x) => x.id === cycle.area_id);
  return hectaresArea(a);
}

export function diasDecorridos(cycle: CycleLite): number {
  const start = new Date(cycle.data_inicio_plantio + "T00:00:00").getTime();
  const end = cycle.data_real_colheita
    ? new Date(cycle.data_real_colheita + "T00:00:00").getTime()
    : Date.now();
  return Math.max(0, Math.floor((end - start) / 86400000));
}

export function safeDiv(n: number, d: number): number {
  return d > 0 ? n / d : 0;
}
