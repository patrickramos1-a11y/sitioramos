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

export const formatHa = (ha: number) =>
  (Number(ha) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " ha";
