import { addDays, differenceInCalendarDays, isAfter, isBefore, parseISO } from "date-fns";

export type StageStatus =
  | "nao_iniciada"
  | "em_andamento"
  | "concluida" // legado — equivalente a realizada
  | "realizada"
  | "atrasada"
  | "reprogramada"
  | "cancelada";

export interface CycleStageLike {
  id?: string;
  nome: string;
  ordem: number;
  inicio_relativo_dias: number;
  duracao_dias: number;
  status: StageStatus;
  data_inicio_real?: string | null;
  data_fim_real?: string | null;
  inicio_relativo_dias_min?: number | null;
}

export interface ComputedStage<T extends CycleStageLike = CycleStageLike> {
  stage: T;
  diaInicio: number; // limite menor (informativo)
  diaFim: number; // limite maior (prazo principal)
  dataInicio: Date;
  dataFim: Date;
  dataInicioReal: Date | null;
  dataFimReal: Date | null;
  diasRestantes: number;
  diasAtraso: number; // dias de atraso na data fim real vs prevista (positivo = atrasada)
  duracaoReal: number | null;
  isAtual: boolean;
  isRealizada: boolean;
  statusAuto: StageStatus;
  statusEfetivo: StageStatus;
}

export function computeStageDates(cycleStartIso: string, stage: CycleStageLike) {
  const start = parseISO(cycleStartIso);
  const dataInicio = addDays(start, stage.inicio_relativo_dias);
  const dataFim = addDays(start, stage.inicio_relativo_dias + Math.max(0, stage.duracao_dias - 1));
  return { dataInicio, dataFim };
}

export function computeAutoStatus(
  stage: CycleStageLike,
  dataInicio: Date,
  dataFim: Date,
  today: Date = new Date(),
): StageStatus {
  if (stage.status === "cancelada") return "cancelada";
  if (stage.data_fim_real || stage.status === "realizada" || stage.status === "concluida") {
    return "realizada";
  }
  if (isBefore(today, dataInicio)) return "nao_iniciada";
  if (isAfter(today, dataFim)) return "atrasada";
  return "em_andamento";
}

export function computeStages<T extends CycleStageLike>(
  cycleStartIso: string,
  stages: T[],
  today: Date = new Date(),
): ComputedStage<T>[] {
  if (!cycleStartIso) return [];
  const sorted = [...stages].sort(
    (a, b) => a.inicio_relativo_dias - b.inicio_relativo_dias || a.ordem - b.ordem,
  );
  return sorted.map((s) => {
    const { dataInicio, dataFim } = computeStageDates(cycleStartIso, s);
    const statusAuto = computeAutoStatus(s, dataInicio, dataFim, today);
    const statusEfetivo = statusAuto;
    const dataInicioReal = s.data_inicio_real ? parseISO(s.data_inicio_real) : null;
    const dataFimReal = s.data_fim_real ? parseISO(s.data_fim_real) : null;
    const diasAtraso = dataFimReal ? differenceInCalendarDays(dataFimReal, dataFim) : 0;
    const duracaoReal =
      dataInicioReal && dataFimReal ? differenceInCalendarDays(dataFimReal, dataInicioReal) + 1 : null;
    return {
      stage: s,
      diaInicio: s.inicio_relativo_dias_min ?? s.inicio_relativo_dias,
      diaFim: s.inicio_relativo_dias + Math.max(0, s.duracao_dias - 1),
      dataInicio,
      dataFim,
      dataInicioReal,
      dataFimReal,
      diasRestantes: differenceInCalendarDays(dataFim, today),
      diasAtraso,
      duracaoReal,
      isAtual: statusEfetivo === "em_andamento" || statusEfetivo === "atrasada",
      isRealizada: statusEfetivo === "realizada",
      statusAuto,
      statusEfetivo,
    };
  });
}

export function findCurrentStage<T extends CycleStageLike>(computed: ComputedStage<T>[]) {
  return (
    computed.find((c) => c.statusEfetivo === "atrasada") ||
    computed.find((c) => c.statusEfetivo === "em_andamento") ||
    computed.find((c) => c.statusEfetivo === "nao_iniciada") ||
    null
  );
}

export interface ProgressInfo {
  porTempo: number;
  porEtapas: number;
  porTarefas: number;
  diaAtual: number;
  diaTotal: number;
  diasRestantes: number;
  diasExcedidos: number;
}

export function computeProgress(
  cycleStartIso: string,
  durationDias: number,
  computed: ComputedStage[],
  totalTasks: number,
  doneTasks: number,
  today: Date = new Date(),
): ProgressInfo {
  const start = parseISO(cycleStartIso);
  const diaAtual = Math.max(0, differenceInCalendarDays(today, start));
  const diaTotal = Math.max(1, durationDias);
  const porTempo = Math.min(1, diaAtual / diaTotal);
  const realizadas = computed.filter((c) => c.statusEfetivo === "realizada").length;
  const validas = computed.filter((c) => c.statusEfetivo !== "cancelada").length || 1;
  const porEtapas = realizadas / validas;
  const porTarefas = totalTasks > 0 ? doneTasks / totalTasks : 0;
  return {
    porTempo,
    porEtapas,
    porTarefas,
    diaAtual,
    diaTotal,
    diasRestantes: Math.max(0, diaTotal - diaAtual),
    diasExcedidos: Math.max(0, diaAtual - diaTotal),
  };
}

export function totalDuration(stages: CycleStageLike[]): number {
  if (!stages.length) return 0;
  return Math.max(...stages.map((s) => s.inicio_relativo_dias + Math.max(0, s.duracao_dias)));
}

export function suggestNextStart(stages: CycleStageLike[]): number {
  if (!stages.length) return 0;
  const lastEnd = Math.max(
    ...stages.map((s) => s.inicio_relativo_dias + Math.max(0, s.duracao_dias - 1)),
  );
  return lastEnd + 1;
}

export interface CycleAlert {
  level: "warning" | "info";
  message: string;
}

export function getCycleAlerts(
  hasStages: boolean,
  computed: ComputedStage[],
  durationDias: number,
  today: Date = new Date(),
  cycleStartIso?: string,
): CycleAlert[] {
  const alerts: CycleAlert[] = [];
  if (!hasStages) {
    alerts.push({ level: "info", message: "Ciclo sem etapas cadastradas." });
    return alerts;
  }
  for (const c of computed) {
    if (c.statusEfetivo === "atrasada") {
      const dias = Math.abs(c.diasRestantes);
      alerts.push({
        level: "warning",
        message: `Etapa "${c.stage.nome}" está atrasada há ${dias} dia(s).`,
      });
    }
  }
  if (cycleStartIso && durationDias > 0) {
    const fim = addDays(parseISO(cycleStartIso), durationDias);
    if (isAfter(today, fim)) {
      alerts.push({ level: "warning", message: "Ciclo está fora do prazo previsto." });
    }
  }
  return alerts;
}

export const STAGE_STATUS_LABEL: Record<StageStatus, string> = {
  nao_iniciada: "Prevista",
  em_andamento: "Em andamento",
  realizada: "Realizada",
  concluida: "Realizada",
  atrasada: "Atrasada",
  reprogramada: "Reprogramada",
  cancelada: "Cancelada",
};

export const STAGE_STATUS_COLOR: Record<StageStatus, string> = {
  nao_iniciada: "bg-muted text-foreground",
  em_andamento: "bg-primary/15 text-primary border-primary/40",
  realizada: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300",
  concluida: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300",
  atrasada: "bg-destructive/15 text-destructive border-destructive/40",
  reprogramada: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300",
  cancelada: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};
