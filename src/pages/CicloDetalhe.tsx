import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { format, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Plus, Sprout, AlertTriangle, Copy, MapPin } from "lucide-react";
import { useCycles } from "@/hooks/useCycles";
import { useCycleStages } from "@/hooks/useCycleStages";
import { useCycleAreaAllocations } from "@/hooks/useCycleAreaAllocations";
import { useAreas } from "@/hooks/useAreas";
import { useCashTransactions } from "@/hooks/useCashTransactions";
import { useTasks } from "@/hooks/useTasks";
import {
  computeStages,
  findCurrentStage,
  computeProgress,
  totalDuration,
  getCycleAlerts,
  STAGE_STATUS_LABEL,
} from "@/lib/cycles/stageCalc";
import { CycleStageTimeline } from "@/components/cycles/CycleStageTimeline";
import { CycleStageList } from "@/components/cycles/CycleStageList";
import { CycleStageForm } from "@/components/cycles/CycleStageForm";
import { ConfirmExecutionDialog } from "@/components/cycles/ConfirmExecutionDialog";
import { RescheduleStageDialog } from "@/components/cycles/RescheduleStageDialog";
import { DuplicateStagesDialog } from "@/components/cycles/DuplicateStagesDialog";
import { allocOccupiedHa, formatTarefas, haParaTarefas } from "@/lib/territory/tarefas";

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function CicloDetalhe() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { cycles, isLoading: loadingCycle } = useCycles();
  const cycle: any = cycles.find((c: any) => c.id === id);

  const { stages, create, update, remove, confirmExecution, reschedule, pushFuture } =
    useCycleStages(id);
  const { allocations } = useCycleAreaAllocations({ cycleId: id });
  const { areas } = useAreas();
  const { transactions } = useCashTransactions();
  const { tasks } = useTasks({ cycleId: id });

  const [stageFormOpen, setStageFormOpen] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [confirmStageId, setConfirmStageId] = useState<string | null>(null);
  const [rescheduleStageId, setRescheduleStageId] = useState<string | null>(null);

  const editingStage = stages.find((s) => s.id === editingStageId) || null;
  const reschedulingStage = stages.find((s) => s.id === rescheduleStageId) || null;

  const computed = useMemo(() => {
    if (!cycle) return [];
    return computeStages(cycle.data_inicio_plantio, stages);
  }, [stages, cycle]);

  const confirmingComputed = computed.find((c) => c.stage.id === confirmStageId) || null;

  const durationDias = useMemo(() => {
    if (!cycle) return 0;
    if (cycle.duracao_total_dias) return cycle.duracao_total_dias;
    return totalDuration(stages);
  }, [cycle, stages]);

  const current = findCurrentStage(computed);

  const cycleTx = useMemo(
    () => transactions.filter((t: any) => t.cycle_id === id),
    [transactions, id],
  );
  const custoTotal = cycleTx
    .filter((t: any) => t.tipo === "saida")
    .reduce((s, t) => s + Number(t.valor || 0), 0);
  const receitaTotal = cycleTx
    .filter((t: any) => t.tipo === "entrada")
    .reduce((s, t) => s + Number(t.valor || 0), 0);

  const costsByStage: Record<string, number> = {};
  for (const t of cycleTx) {
    if ((t as any).cycle_stage_id && t.tipo === "saida") {
      costsByStage[(t as any).cycle_stage_id] =
        (costsByStage[(t as any).cycle_stage_id] || 0) + Number(t.valor || 0);
    }
  }

  const tasksByStage: Record<string, { total: number; done: number }> = {};
  for (const t of tasks) {
    const sId = (t as any).cycle_stage_id;
    if (!sId) continue;
    const cur = tasksByStage[sId] || { total: 0, done: 0 };
    cur.total += 1;
    if (t.status === "concluida") cur.done += 1;
    tasksByStage[sId] = cur;
  }

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "concluida").length;
  const realizadas = computed.filter((c) => c.statusEfetivo === "realizada").length;
  const progress = cycle
    ? computeProgress(cycle.data_inicio_plantio, durationDias || 1, computed, totalTasks, doneTasks)
    : null;
  const alerts = cycle
    ? getCycleAlerts(stages.length > 0, computed, durationDias, new Date(), cycle.data_inicio_plantio)
    : [];

  if (loadingCycle) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </AppLayout>
    );
  }
  if (!cycle) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Ciclo não encontrado.</p>
          <Button onClick={() => navigate("/ciclos")}>Voltar</Button>
        </div>
      </AppLayout>
    );
  }

  const cor = cycle.cor || "#22c55e";
  const fimPrev =
    cycle.data_inicio_plantio && durationDias
      ? addDays(parseISO(cycle.data_inicio_plantio), durationDias)
      : null;

  const handleStageSubmit = async (payload: any) => {
    if (editingStage) {
      await update.mutateAsync({ id: editingStage.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    setStageFormOpen(false);
    setEditingStageId(null);
  };

  const handleConfirmExecution = async (payload: {
    data_inicio_real: string;
    data_fim_real: string;
    observacao: string | null;
    responsavel_id: string | null;
    pushNext: boolean;
    deltaDias: number;
  }) => {
    if (!confirmingComputed) return;
    await confirmExecution.mutateAsync({
      id: confirmingComputed.stage.id!,
      data_inicio_real: payload.data_inicio_real,
      data_fim_real: payload.data_fim_real,
      observacao: payload.observacao,
      responsavel_id: payload.responsavel_id,
    });
    if (payload.pushNext && payload.deltaDias !== 0) {
      await pushFuture.mutateAsync({
        cycle_id: id,
        fromOrdem: confirmingComputed.stage.ordem,
        deltaDias: payload.deltaDias,
      });
    }
    setConfirmStageId(null);
  };

  const handleReschedule = async (payload: {
    inicio_relativo_dias: number;
    duracao_dias: number;
    motivo: string;
    pushNext: boolean;
    deltaDias: number;
  }) => {
    if (!reschedulingStage) return;
    await reschedule.mutateAsync({
      id: reschedulingStage.id,
      inicio_relativo_dias: payload.inicio_relativo_dias,
      duracao_dias: payload.duracao_dias,
      motivo: payload.motivo,
    });
    if (payload.pushNext && payload.deltaDias !== 0) {
      await pushFuture.mutateAsync({
        cycle_id: id,
        fromOrdem: reschedulingStage.ordem,
        deltaDias: payload.deltaDias,
      });
    }
    setRescheduleStageId(null);
  };

  const allocsHidratadas = allocations.map((a: any) => {
    const ar: any = areas.find((x) => x.id === a.area_id);
    const occHa = allocOccupiedHa(a, Number(ar?.tamanho_hectares || 0));
    return { alloc: a, area: ar, occHa };
  });

  return (
    <AppLayout>
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={() => navigate("/ciclos")} className="gap-1 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        {/* Header */}
        <Card className="border-l-4" style={{ borderLeftColor: cor }}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-xl">
                  {cycle.icone ? (
                    <span className="text-2xl leading-none">{cycle.icone}</span>
                  ) : (
                    <Sprout className="h-5 w-5" style={{ color: cor }} />
                  )}
                  <span style={{ color: cor }}>{cycle.cultura}</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Plantio em {format(parseISO(cycle.data_inicio_plantio), "dd/MM/yyyy", { locale: ptBR })}
                  {fimPrev && <> · Fim previsto: {format(fimPrev, "dd/MM/yyyy", { locale: ptBR })}</>}
                  {durationDias > 0 && <> · {durationDias} dias</>}
                </p>
              </div>
              {current && (
                <div className="rounded-lg border bg-primary/5 px-3 py-2 min-w-[180px]">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Etapa atual
                  </div>
                  <div className="font-semibold text-sm">{current.stage.nome}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {STAGE_STATUS_LABEL[current.statusEfetivo]}
                    {current.statusEfetivo === "atrasada"
                      ? ` · atraso ${Math.abs(current.diasRestantes)}d`
                      : current.statusEfetivo === "em_andamento"
                        ? ` · ${Math.max(0, current.diasRestantes)}d restantes`
                        : current.statusEfetivo === "nao_iniciada"
                          ? ` · começa em ${Math.max(0, -current.diasRestantes + current.stage.duracao_dias)}d`
                          : ""}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Time indicators */}
            {progress && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <Stat label="Previstos" value={`${progress.diaTotal}d`} />
                <Stat label="Decorridos" value={`${progress.diaAtual}d`} />
                <Stat
                  label="Restantes"
                  value={progress.diasExcedidos > 0 ? "0d" : `${progress.diasRestantes}d`}
                />
                <Stat
                  label="Excedidos"
                  value={`${progress.diasExcedidos}d`}
                  highlight={progress.diasExcedidos > 0}
                />
              </div>
            )}
            {/* Progress bars */}
            {progress && (
              <div className="grid gap-2 sm:grid-cols-3">
                <ProgressItem label="Tempo" value={progress.porTempo} info={`Dia ${progress.diaAtual}/${progress.diaTotal}`} />
                <ProgressItem
                  label="Etapas"
                  value={progress.porEtapas}
                  info={`${realizadas}/${stages.length}`}
                />
                <ProgressItem label="Tarefas" value={progress.porTarefas} info={`${doneTasks}/${totalTasks}`} />
              </div>
            )}
            {/* Financeiro resumo */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">Custos</div>
                <div className="font-semibold tabular-nums text-destructive">{formatBRL(custoTotal)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-muted-foreground">Receitas</div>
                <div className="font-semibold tabular-nums text-emerald-600">{formatBRL(receitaTotal)}</div>
              </div>
            </div>
            {/* Alertas */}
            {alerts.length > 0 && (
              <div className="space-y-1">
                {alerts.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md border border-amber-300/40 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 text-xs"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    {a.message}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="etapas">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="etapas">Etapas</TabsTrigger>
            <TabsTrigger value="areas">Áreas</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <CycleStageTimeline
                  computed={computed}
                  cycleStartIso={cycle.data_inicio_plantio}
                  durationDias={durationDias || 1}
                  cor={cor}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="etapas" className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setEditingStageId(null);
                  setStageFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Nova etapa
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDuplicateOpen(true)}>
                <Copy className="h-4 w-4 mr-1" /> Duplicar de outro ciclo
              </Button>
            </div>
            <CycleStageList
              computed={computed}
              onEdit={(sid) => {
                setEditingStageId(sid);
                setStageFormOpen(true);
              }}
              onDelete={(sid) => {
                if (confirm("Remover esta etapa?")) remove.mutate(sid);
              }}
              onConfirm={(sid) => setConfirmStageId(sid)}
              onReschedule={(sid) => setRescheduleStageId(sid)}
              costsByStage={costsByStage}
              tasksByStage={tasksByStage}
            />
          </TabsContent>

          <TabsContent value="areas" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {allocsHidratadas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma área vinculada.</p>
                ) : (
                  <ul className="space-y-2">
                    {allocsHidratadas.map(({ alloc, area, occHa }) => (
                      <li
                        key={alloc.id}
                        className="flex items-center justify-between border-l-2 border-primary/40 pl-3 py-1"
                      >
                        <Link
                          to={`/areas/${area?.id}`}
                          className="inline-flex items-center gap-1 hover:underline text-sm"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          {area?.nome}
                        </Link>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {occHa.toFixed(2)} ha · {formatTarefas(haParaTarefas(occHa))} tarefas
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CycleStageForm
        open={stageFormOpen}
        onOpenChange={(o) => {
          setStageFormOpen(o);
          if (!o) setEditingStageId(null);
        }}
        cycleId={id}
        cycleStartIso={cycle.data_inicio_plantio}
        stage={editingStage}
        defaultOrdem={stages.length + 1}
        allStages={stages}
        onSubmit={handleStageSubmit}
        isSubmitting={create.isPending || update.isPending}
      />

      <ConfirmExecutionDialog
        open={!!confirmStageId}
        onOpenChange={(o) => !o && setConfirmStageId(null)}
        computed={confirmingComputed}
        onConfirm={handleConfirmExecution}
        isSubmitting={confirmExecution.isPending || pushFuture.isPending}
      />

      <RescheduleStageDialog
        open={!!rescheduleStageId}
        onOpenChange={(o) => !o && setRescheduleStageId(null)}
        stage={reschedulingStage}
        onConfirm={handleReschedule}
        isSubmitting={reschedule.isPending || pushFuture.isPending}
      />

      <DuplicateStagesDialog open={duplicateOpen} onOpenChange={setDuplicateOpen} targetCycleId={id} />
    </AppLayout>
  );
}

function ProgressItem({ label, value, info }: { label: string; value: number; info: string }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="uppercase text-muted-foreground">{label}</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <Progress value={pct} className="h-2" />
      <div className="text-[10px] text-muted-foreground mt-0.5">{info}</div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-md border p-2 ${highlight ? "border-destructive/40 bg-destructive/5" : "bg-muted/30"}`}
    >
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${highlight ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}
