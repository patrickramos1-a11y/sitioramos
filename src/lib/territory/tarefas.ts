// Conversões entre hectares, m² e "tarefas" físicas.
// Regra: 1 tarefa = 2.500 m² → 1 hectare = 4 tarefas.

export const M2_POR_TAREFA = 2500;
export const M2_POR_HECTARE = 10000;
export const TAREFAS_POR_HECTARE = M2_POR_HECTARE / M2_POR_TAREFA; // 4

export const haParaM2 = (ha: number) => (Number(ha) || 0) * M2_POR_HECTARE;

export const haParaTarefas = (ha: number) =>
  (Number(ha) || 0) * TAREFAS_POR_HECTARE;

export const tarefasParaHa = (tarefas: number) =>
  (Number(tarefas) || 0) / TAREFAS_POR_HECTARE;

export const tarefasParaM2 = (tarefas: number) =>
  (Number(tarefas) || 0) * M2_POR_TAREFA;

export const formatTarefas = (tarefas: number) => {
  const v = Number(tarefas) || 0;
  return v.toLocaleString("pt-BR", {
    minimumFractionDigits: v % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  });
};

export const formatM2 = (m2: number) =>
  Math.round(Number(m2) || 0).toLocaleString("pt-BR") + " m²";

export type AllocationType = "full_area" | "tasks" | "percentage" | "manual_area";

export interface AllocationLike {
  allocation_type?: AllocationType | string | null;
  ocupa_area_inteira?: boolean | null;
  tarefas_ocupadas?: number | null;
  percentual?: number | null;
  hectares_ocupados?: number | null;
}

/** Resolve hectares ocupados em uma área a partir de uma alocação */
export function allocOccupiedHa(alloc: AllocationLike, areaHa: number): number {
  const type = (alloc.allocation_type as AllocationType) ||
    (alloc.ocupa_area_inteira ? "full_area" : "tasks");
  switch (type) {
    case "full_area":
      return Number(areaHa) || 0;
    case "tasks":
      return tarefasParaHa(Number(alloc.tarefas_ocupadas || 0));
    case "percentage":
      return ((Number(alloc.percentual || 0)) / 100) * (Number(areaHa) || 0);
    case "manual_area":
      return Number(alloc.hectares_ocupados || 0);
    default:
      return 0;
  }
}

export function allocOccupiedTarefas(alloc: AllocationLike, areaHa: number): number {
  return haParaTarefas(allocOccupiedHa(alloc, areaHa));
}

export const formatHa = (ha: number) =>
  (Number(ha) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " ha";
