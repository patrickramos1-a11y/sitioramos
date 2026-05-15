import { addDays, differenceInCalendarDays, isAfter, isBefore, parseISO } from "date-fns";

export type StageStatus = "nao_iniciada" | "em_andamento" | "concluida" | "atrasada" | "cancelada";

export interface CycleStageLike {
  id?: string;
  nome: string;
  ordem: number;
  inicio_relativo_dias: number;
  duracao_dias: number;
  status: StageStatus;
}

export interface ComputedStage<T extends CycleStageLike = CycleStageLike> {
  stage: T;
  dataInicio: Date;
  dataFim: Date;
  diasRestantes: number;
  isAtual: boolean;
  statusAuto: StageStatus;
  statusEfetivo: StageStatus;
}

export function computeStageDates(cycleStartIso: string, stage: CycleStageLike) {
  const start = parseISO(cycleStartIso);
  const dataInicio = addDays(start, stage.inicio_relativo_dias);
  const dataFim = addDays(dataInicio, Math.max(0, stage.duracao_dias - 1));
  return { dataInicio, dataFim };
}

export function computeAutoStatus(
  dataInicio: Date,
  dataFim: Date,
  manualStatus: StageStatus,
  today: Date = new Date(),
): StageStatus {
  // Status definidos manualmente (concluida/cancelada) prevalecem
  if (manualStatus === "concluida" || manualStatus === "cancelada") return manualStatus;
  if (isBefore(today, dataInicio)) return "nao_iniciada";
  if (isAfter(today, dataFim)) return "atrasada";
  return "em_andamento";
}

export function computeStages<T extends CycleStageLike>(
  cycleStartIso: string,
  stages: T[],
  today: Date = new Date(),
): ComputedStage<T>[] {
  const sorted = [...stages].sort((a, b) =>
    a.inicio_relativo_dias - b.inicio_relativo_dias || a.ordem - b.ordem,
  );
  return sorted.map((s) => {
    const { dataInicio, dataFim } = computeStageDates(cycleStartIso, s);
    const statusAuto = computeAutoStatus(dataInicio, dataFim, s.status, today);
    const statusEfetivo: StageStatus =
      s.status === "concluida" || s.status === "cancelada" ? s.status : statusAuto;
    const isAtual = statusEfetivo === "em_andamento";
    const diasRestantes = differenceInCalendarDays(dataFim, today);
    return { stage: s, dataInicio, dataFim, diasRestantes, isAtual, statusAuto, statusEfetivo };
  });
}

export function findCurrentStage<T extends CycleStageLike>(computed: ComputedStage<T>[]) {
  return (
    computed.find((c) => c.isAtual) ||
    computed.find((c) => c.statusEfetivo === "atrasada") ||
    computed.find((c) => c.statusEfetivo === "nao_iniciada") ||
    null
  );
}

export interface ProgressInfo {
  porTempo: number; // 0..1
  porEtapas: number;
  porTarefas: number;
  diaAtual: number; // 0-based
  diaTotal: number;
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
  const concluidas = computed.filter((c) => c.statusEfetivo === "concluida").length;
  const validas = computed.filter((c) => c.statusEfetivo !== "cancelada").length || 1;
  const porEtapas = concluidas / validas;
  const porTarefas = totalTasks > 0 ? doneTasks / totalTasks : 0;
  return { porTempo, porEtapas, porTarefas, diaAtual, diaTotal };
}

export function totalDuration(stages: CycleStageLike[]): number {
  if (!stages.length) return 0;
  return Math.max(
    ...stages.map((s) => s.inicio_relativo_dias + Math.max(0, s.duracao_dias)),
  );
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
      alerts.push({ level: "warning", message: `Etapa "${c.stage.nome}" está atrasada.` });
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
  nao_iniciada: "Não iniciada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  atrasada: "Atrasada",
  cancelada: "Cancelada",
};

export const STAGE_STATUS_COLOR: Record<StageStatus, string> = {
  nao_iniciada: "bg-muted text-foreground",
  em_andamento: "bg-primary/15 text-primary",
  concluida: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  atrasada: "bg-destructive/15 text-destructive",
  cancelada: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};
