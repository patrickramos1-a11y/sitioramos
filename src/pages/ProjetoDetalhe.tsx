import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, MoreVertical, Pencil, Trash2, Copy, Plus, Layers, ListTodo,
  CheckCircle2, AlertTriangle, Clock, DollarSign, Calendar, FileText, BarChart3, BookOpen, ChevronRight,
  History, CircleDot,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useOperations, Operation } from "@/hooks/useOperations";
import { useTasks, Task } from "@/hooks/useTasks";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { useCashTransactions } from "@/hooks/useCashTransactions";
import { useJournalEntries } from "@/hooks/useJournalEntries";

import { OperationForm } from "@/components/operacao/OperationForm";
import { SimpleTaskForm } from "@/components/operacao/SimpleTaskForm";
import { GanttTimeline } from "@/components/operacao/GanttTimeline";
import { TasksBoard } from "@/components/operacao/TasksBoard";
import { ResponsavelBadge } from "@/components/responsaveis/ResponsavelBadge";
import { ResponsavelFilter, matchesResponsavel, type ResponsavelFilterValue } from "@/components/responsaveis/ResponsavelFilter";

import {
  computeStageMetrics, getCategoryEmoji, getCategoryLabel, deriveStageStatus,
} from "@/lib/operacaoConfig";
import { useStages } from "@/hooks/useStages";
import { useProjectHistory } from "@/hooks/useProjectHistory";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  planejada: { label: "Planejada", variant: "outline" },
  nao_iniciada: { label: "Planejada", variant: "outline" },
  em_andamento: { label: "Em andamento", variant: "secondary" },
  atrasada: { label: "Atrasada", variant: "destructive" },
  concluida: { label: "Concluída", variant: "default" },
  concluida_com_atraso: { label: "Concluída c/ atraso", variant: "destructive" },
  pausada: { label: "Pausada", variant: "outline" },
  travada: { label: "Travada", variant: "outline" },
  cancelada: { label: "Cancelada", variant: "outline" },
};

export default function ProjetoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { areas } = useAreas();
  const { cycles } = useCycles();
  const { stages } = useStages();
  const { operations: rawOperations, allStages, updateOperation, deleteOperation, duplicateOperation, createOperation } = useOperations();
  const { tasks: allTasks, createTask, updateTask, deleteTask } = useTasks();

  // Localiza a operação atual (pode ser projeto raiz ou subprojeto)
  const currentOp = useMemo(() => allStages.find(s => s.id === id) || null, [allStages, id]);
  const parentOp = useMemo(
    () => (currentOp?.parent_id ? allStages.find(s => s.id === currentOp.parent_id) : null),
    [allStages, currentOp]
  );

  // Encontra o projeto raiz para a navegação/contexto
  const rootProject = useMemo(() => {
    if (!currentOp) return null;
    let cursor: Operation | null = currentOp;
    while (cursor?.parent_id) {
      cursor = allStages.find(s => s.id === cursor!.parent_id) || null;
    }
    return cursor;
  }, [allStages, currentOp]);

  // Descendentes diretos e recursivos do nó atual
  const directChildren = useMemo(
    () => allStages.filter(s => s.parent_id === id),
    [allStages, id]
  );

  const allDescendantIds = useMemo(() => {
    const out = new Set<string>();
    const walk = (parent: string) => {
      for (const s of allStages) {
        if (s.parent_id === parent) {
          if (out.has(s.id)) continue;
          out.add(s.id);
          walk(s.id);
        }
      }
    };
    if (id) walk(id);
    return out;
  }, [allStages, id]);

  // Tarefas vinculadas a este nó OU a qualquer descendente
  const relatedTasks = useMemo(
    () => allTasks.filter(t => t.stage_id === id || (t.stage_id && allDescendantIds.has(t.stage_id))),
    [allTasks, id, allDescendantIds]
  );

  // Cash transactions do projeto e descendentes
  const stageIdsForLookup = useMemo(
    () => (id ? [id, ...Array.from(allDescendantIds)] : []),
    [id, allDescendantIds]
  );

  const { transactions: txCurrent = [] } = useCashTransactions({ operationId: id });
  // Para descendentes, simples agregação: busca por todos via filtro por área (já existente)
  // e refina manualmente (acima já temos transações do próprio nó). Para descendentes, usamos
  // hook adicional sem filtro e filtramos em memória (mantém simples).
  const { transactions: allTx = [] } = useCashTransactions();
  const projectTransactions = useMemo(
    () => allTx.filter(t => t.operation_id && stageIdsForLookup.includes(t.operation_id)),
    [allTx, stageIdsForLookup]
  );

  // Diário: filtra por área + ciclo do projeto (entradas vinculadas)
  const { data: journalEntries = [] } = useJournalEntries(50, {
    areaId: currentOp?.area_id || undefined,
    cycleId: currentOp?.cycle_id || undefined,
  }) as any;

  // Métricas
  const metrics = useMemo(
    () => currentOp
      ? computeStageMetrics({
          data_inicio_prevista: currentOp.data_inicio_prevista,
          data_inicio_real: currentOp.data_inicio_real,
          data_fim_prevista: currentOp.data_fim_prevista,
          data_fim_real: currentOp.data_fim_real,
          duracao_prevista_dias: currentOp.duracao_prevista_dias,
        })
      : null,
    [currentOp]
  );

  const derivedStatus = useMemo(() => {
    if (!currentOp) return "planejada";
    return deriveStageStatus({
      status: currentOp.status,
      data_inicio_real: currentOp.data_inicio_real,
      data_fim_real: currentOp.data_fim_real,
      data_fim_prevista: currentOp.data_fim_prevista,
    });
  }, [currentOp]);

  const totalCusto = useMemo(
    () => projectTransactions.filter(t => t.tipo === "saida").reduce((sum, t) => sum + Number(t.valor || 0), 0),
    [projectTransactions]
  );

  const tasksConcluidas = relatedTasks.filter(t => t.status === "concluida").length;
  const tasksPendentes = relatedTasks.filter(t => t.status === "pendente" || t.status === "em_andamento").length;
  const tasksAtrasadas = relatedTasks.filter(t => {
    if (t.status === "concluida" || t.status === "cancelada") return false;
    return t.data_prazo && new Date(t.data_prazo) < new Date();
  }).length;
  const progressoGeral = relatedTasks.length > 0
    ? Math.round((tasksConcluidas / relatedTasks.length) * 100)
    : (currentOp?.progresso_percentual ?? 0);

  const areaInfo = areas.find(a => a.id === currentOp?.area_id);
  const cycleInfo = cycles.find(c => c.id === currentOp?.cycle_id);

  // Forms / dialogs state
  const [opFormOpen, setOpFormOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<Operation | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [defaultNivelTipo, setDefaultNivelTipo] = useState<string>("subprojeto");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskDefaultStageId, setTaskDefaultStageId] = useState<string>("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Responsável filter (interno ao projeto)
  const [respFilter, setRespFilter] = useState<ResponsavelFilterValue>("all");

  // Timeline contextual: precisa estar antes de qualquer early-return para preservar ordem dos hooks
  const timelineOps: Operation[] = useMemo(() => {
    if (!currentOp) return [];
    const matchingRoot = rawOperations.find(o => o.id === currentOp.id);
    if (matchingRoot) return [matchingRoot];
    const descendants = Array.from(allDescendantIds)
      .map(d => allStages.find(s => s.id === d))
      .filter(Boolean) as Operation[];
    return [{ ...currentOp, children: descendants }];
  }, [currentOp, rawOperations, allDescendantIds, allStages]);

  // Filtrados por responsável
  const filteredSubChildren = useMemo(
    () => directChildren.filter(s => matchesResponsavel(respFilter, (s as any).responsavel_id)),
    [directChildren, respFilter]
  );
  const filteredTasks = useMemo(
    () => relatedTasks.filter(t => matchesResponsavel(respFilter, (t as any).responsavel_id)),
    [relatedTasks, respFilter]
  );
  const filteredTransactions = useMemo(
    () => projectTransactions.filter(t => matchesResponsavel(respFilter, (t as any).responsavel_id)),
    [projectTransactions, respFilter]
  );
  const filteredJournal = useMemo(
    () => (journalEntries as any[]).filter(j => matchesResponsavel(respFilter, j.responsavel_id)),
    [journalEntries, respFilter]
  );

  // Histórico do projeto (eventos consolidados)
  const historyTaskIds = useMemo(() => relatedTasks.map(t => t.id), [relatedTasks]);
  const { data: historyEvents = [] } = useProjectHistory({
    stageIds: stageIdsForLookup,
    taskIds: historyTaskIds,
    enabled: true,
  });

  if (!currentOp) {
    return (
      <AppLayout>
        <div className="p-6 text-center space-y-3">
          <p className="text-muted-foreground">Projeto não encontrado.</p>
          <Button variant="outline" onClick={() => navigate("/operacao")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para Operação
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isSubproject = !!currentOp.parent_id;
  const sb = statusBadge[derivedStatus] || statusBadge.planejada;

  // Subprojetos como cards (filhos diretos do nó atual, já filtrados por responsável)
  const subCards = filteredSubChildren.map(sub => {
    const subTasks = allTasks.filter(t => t.stage_id === sub.id);
    const subDone = subTasks.filter(t => t.status === "concluida").length;
    const subPct = subTasks.length > 0 ? Math.round((subDone / subTasks.length) * 100) : 0;
    const subSt = deriveStageStatus({
      status: sub.status,
      data_inicio_real: sub.data_inicio_real,
      data_fim_real: sub.data_fim_real,
      data_fim_prevista: sub.data_fim_prevista,
    });
    const subM = computeStageMetrics({
      data_inicio_prevista: sub.data_inicio_prevista,
      data_inicio_real: sub.data_inicio_real,
      data_fim_prevista: sub.data_fim_prevista,
      data_fim_real: sub.data_fim_real,
      duracao_prevista_dias: sub.duracao_prevista_dias,
    });
    const subSb = statusBadge[subSt] || statusBadge.planejada;
    return { sub, subTasks, subDone, subPct, subSt, subM, subSb };
  });

  // Recalcular métricas/contagens com base no filtro
  const tasksConcluidasF = filteredTasks.filter(t => t.status === "concluida").length;
  const tasksPendentesF = filteredTasks.filter(t => t.status === "pendente" || t.status === "em_andamento").length;
  const tasksAtrasadasF = filteredTasks.filter(t => {
    if (t.status === "concluida" || t.status === "cancelada") return false;
    return t.data_prazo && new Date(t.data_prazo) < new Date();
  }).length;
  const totalCustoF = filteredTransactions.filter(t => t.tipo === "saida").reduce((sum, t) => sum + Number(t.valor || 0), 0);
  const progressoGeralF = filteredTasks.length > 0
    ? Math.round((tasksConcluidasF / filteredTasks.length) * 100)
    : (currentOp?.progresso_percentual ?? 0);

  const timelineTasks = filteredTasks;

  // Handlers
  const handleNewSubproject = () => {
    setEditingOp(null);
    setParentIdForNew(currentOp.id);
    setDefaultNivelTipo("subprojeto");
    setOpFormOpen(true);
  };
  const handleNewTask = () => {
    setEditingTask(null);
    setTaskDefaultStageId(currentOp.id);
    setTaskFormOpen(true);
  };

  const handleOpSubmit = (data: any) => {
    if (editingOp) {
      updateOperation.mutate({ id: editingOp.id, ...data }, { onSuccess: () => setOpFormOpen(false) });
    } else {
      createOperation.mutate(
        { ...data, parent_id: parentIdForNew },
        { onSuccess: () => setOpFormOpen(false) }
      );
    }
  };

  const handleTaskSubmit = (data: any) => {
    // Garante vínculo com este projeto se não houver stage_id explícito
    const payload = { ...data, stage_id: data.stage_id || currentOp.id };
    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, ...payload }, { onSuccess: () => setTaskFormOpen(false) });
    } else {
      createTask.mutate(payload, { onSuccess: () => setTaskFormOpen(false) });
    }
  };

  const handleDelete = () => {
    deleteOperation.mutate(currentOp.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        navigate(parentOp ? `/operacao/projetos/${rootProject?.id || parentOp.id}` : "/operacao");
      },
    });
  };

  const handleDuplicate = () => {
    duplicateOperation.mutate(currentOp.id, {
      onSuccess: (newOp: any) => {
        if (newOp?.id) navigate(`/operacao/projetos/${newOp.id}`);
      },
    });
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Breadcrumb + voltar */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => navigate("/operacao")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Operação
          </Button>
          {parentOp && rootProject && rootProject.id !== parentOp.id && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to={`/operacao/projetos/${rootProject.id}`} className="hover:underline truncate max-w-[200px]">
                {rootProject.nome}
              </Link>
            </>
          )}
          {parentOp && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to={`/operacao/projetos/${parentOp.id}`} className="hover:underline truncate max-w-[200px]">
                {parentOp.nome}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium truncate">{currentOp.nome}</span>
        </div>

        {/* Header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {currentOp.categoria && (
                    <span className="text-xl">{getCategoryEmoji(currentOp.categoria)}</span>
                  )}
                  <CardTitle className="text-xl md:text-2xl">{currentOp.nome}</CardTitle>
                  <Badge variant={sb.variant}>{sb.label}</Badge>
                  {isSubproject && <Badge variant="outline">Subprojeto</Badge>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {currentOp.categoria && <span>📂 {getCategoryLabel(currentOp.categoria)}</span>}
                  {currentOp.responsavel_id ? (
                    <ResponsavelBadge responsavelId={currentOp.responsavel_id} size="xs" />
                  ) : currentOp.responsavel ? (
                    <span>👤 {currentOp.responsavel}</span>
                  ) : null}
                  {areaInfo && <span>🌱 {areaInfo.nome}</span>}
                  {cycleInfo && <span>♻ {(cycleInfo as any).cultura}</span>}
                  {currentOp.data_inicio_prevista && (
                    <span>
                      <Calendar className="inline h-3 w-3 mr-0.5" />
                      {format(new Date(currentOp.data_inicio_prevista), "dd/MM/yy", { locale: ptBR })}
                      {currentOp.data_fim_prevista && (
                        <> → {format(new Date(currentOp.data_fim_prevista), "dd/MM/yy", { locale: ptBR })}</>
                      )}
                    </span>
                  )}
                </div>
                {relatedTasks.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={progressoGeral} className="h-1.5 flex-1 max-w-xs" />
                    <span className="text-xs text-muted-foreground tabular-nums">{progressoGeral}%</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditingOp(currentOp); setParentIdForNew(currentOp.parent_id || null); setOpFormOpen(true); }}
                >
                  <Pencil className="h-4 w-4 mr-1" /> Editar
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditingOp(currentOp); setOpFormOpen(true); }}>
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDuplicate}>
                      <Copy className="mr-2 h-3.5 w-3.5" /> Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive">
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Filtro por responsável */}
        <Card>
          <CardContent className="p-3">
            <ResponsavelFilter value={respFilter} onChange={setRespFilter} showLabel />
            {respFilter !== "all" && (
              <p className="text-[11px] text-muted-foreground mt-2">
                Mostrando apenas itens deste projeto vinculados ao responsável selecionado.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard icon={<Layers className="h-4 w-4" />} label="Subprojetos" value={filteredSubChildren.length} />
          <KpiCard icon={<ListTodo className="h-4 w-4" />} label="Tarefas" value={filteredTasks.length} sub={`${tasksConcluidasF} concluídas`} />
          <KpiCard
            icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
            label="Atrasadas"
            value={tasksAtrasadasF}
            tone={tasksAtrasadasF > 0 ? "destructive" : undefined}
          />
          <KpiCard icon={<Clock className="h-4 w-4" />} label="Pendentes" value={tasksPendentesF} />
          <KpiCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Custo total"
            value={formatCurrency(totalCustoF)}
          />
          {metrics?.duracaoPrevista !== null && metrics?.duracaoPrevista !== undefined && (
            <KpiCard icon={<Calendar className="h-4 w-4" />} label="Dias planejados" value={`${metrics.duracaoPrevista}d`} />
          )}
          {metrics?.diasDecorridos !== null && metrics?.diasDecorridos !== undefined && (
            <KpiCard icon={<Clock className="h-4 w-4" />} label="Decorridos" value={`${metrics.diasDecorridos}d`} />
          )}
          {metrics?.diasExcedidos !== undefined && metrics.diasExcedidos > 0 && (
            <KpiCard
              icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
              label="Excedidos"
              value={`+${metrics.diasExcedidos}d`}
              tone="destructive"
            />
          )}
          <KpiCard icon={<BarChart3 className="h-4 w-4" />} label="Progresso" value={`${progressoGeralF}%`} />
        </div>

        {/* Ações rápidas */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleNewSubproject}>
            <Layers className="h-4 w-4 mr-1" /> Novo Subprojeto
          </Button>
          <Button variant="outline" onClick={handleNewTask}>
            <Plus className="h-4 w-4 mr-1" /> Nova Tarefa
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/diario?areaId=${currentOp.area_id || ""}&cycleId=${currentOp.cycle_id || ""}&new=1`)}
          >
            <BookOpen className="h-4 w-4 mr-1" /> Novo Registro de Diário
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/caixa?operationId=${currentOp.id}&new=saida`)}
          >
            <DollarSign className="h-4 w-4 mr-1" /> Vincular Custo
          </Button>
        </div>

        {/* Abas */}
        <Tabs defaultValue="resumo" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="subprojetos">Subprojetos ({filteredSubChildren.length})</TabsTrigger>
            <TabsTrigger value="tarefas">Tarefas ({filteredTasks.length})</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="custos">Custos</TabsTrigger>
            <TabsTrigger value="diario">Diário</TabsTrigger>
            <TabsTrigger value="historico" className="gap-1">
              <History className="h-3.5 w-3.5" /> Histórico
            </TabsTrigger>
          </TabsList>

          {/* Resumo */}
          <TabsContent value="resumo" className="space-y-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Detalhes</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                {currentOp.descricao && <p className="text-muted-foreground">{currentOp.descricao}</p>}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <Detail label="Status" value={sb.label} />
                  <Detail label="Início previsto" value={currentOp.data_inicio_prevista ? format(new Date(currentOp.data_inicio_prevista), "dd/MM/yy", { locale: ptBR }) : "—"} />
                  <Detail label="Fim previsto" value={currentOp.data_fim_prevista ? format(new Date(currentOp.data_fim_prevista), "dd/MM/yy", { locale: ptBR }) : "—"} />
                  <Detail label="Início real" value={currentOp.data_inicio_real ? format(new Date(currentOp.data_inicio_real), "dd/MM/yy", { locale: ptBR }) : "—"} />
                  <Detail label="Fim real" value={currentOp.data_fim_real ? format(new Date(currentOp.data_fim_real), "dd/MM/yy", { locale: ptBR }) : "—"} />
                  <Detail label="Área" value={areaInfo?.nome || "—"} />
                  <Detail label="Ciclo" value={(cycleInfo as any)?.cultura || "—"} />
                  <Detail label="Responsável" value={
                    currentOp.responsavel_id
                      ? <ResponsavelBadge responsavelId={currentOp.responsavel_id} />
                      : (currentOp.responsavel || "—")
                  } />
                  <Detail label="Categoria" value={currentOp.categoria ? getCategoryLabel(currentOp.categoria) : "—"} />
                </div>
                {currentOp.observacoes && (
                  <div className="pt-2 border-t text-xs">
                    <div className="text-muted-foreground mb-1">Observações</div>
                    <p>{currentOp.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subprojetos */}
          <TabsContent value="subprojetos" className="space-y-3">
            {subCards.length === 0 ? (
              <EmptyState
                icon={<Layers className="h-8 w-8" />}
                title="Nenhum subprojeto"
                action={<Button onClick={handleNewSubproject}><Plus className="h-4 w-4 mr-1" /> Novo Subprojeto</Button>}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subCards.map(({ sub, subTasks, subDone, subPct, subM, subSb }) => (
                  <Card
                    key={sub.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => navigate(`/operacao/subprojetos/${sub.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{sub.nome}</CardTitle>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge variant={subSb.variant} className="text-[10px]">{subSb.label}</Badge>
                            {(sub as any).responsavel_id ? (
                              <ResponsavelBadge responsavelId={(sub as any).responsavel_id} size="xs" />
                            ) : sub.responsavel ? (
                              <span className="text-[11px] text-muted-foreground">👤 {sub.responsavel}</span>
                            ) : (
                              <Badge variant="outline" className="text-[9px] py-0 h-4">Sem responsável</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2 text-xs">
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
                        {sub.data_inicio_prevista && (
                          <span>Início: {format(new Date(sub.data_inicio_prevista), "dd/MM/yy", { locale: ptBR })}</span>
                        )}
                        {sub.data_fim_prevista && (
                          <span>Fim: {format(new Date(sub.data_fim_prevista), "dd/MM/yy", { locale: ptBR })}</span>
                        )}
                        {subM.duracaoPrevista !== null && <span>{subM.duracaoPrevista}d planejados</span>}
                        {subM.diasExcedidos > 0 && (
                          <span className="text-destructive font-medium">+{subM.diasExcedidos}d excedido</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={subPct} className="h-1.5 flex-1" />
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          ☑ {subDone}/{subTasks.length} • {subPct}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tarefas */}
          <TabsContent value="tarefas">
            <Card>
              <CardContent className="pt-6">
                <TasksBoard
                  tasks={filteredTasks}
                  operations={timelineOps}
                  onCreate={handleNewTask}
                  onEdit={(t) => { setEditingTask(t); setTaskFormOpen(true); }}
                  onDelete={(t) => deleteTask.mutate(t.id)}
                  onToggleComplete={(t) => updateTask.mutate({
                    id: t.id,
                    status: t.status === "concluida" ? "pendente" : "concluida",
                    data_conclusao: t.status === "concluida" ? null : new Date().toISOString().split("T")[0],
                  } as any)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline">
            <Card>
              <CardContent className="pt-6">
                <GanttTimeline
                  operations={timelineOps}
                  tasks={timelineTasks}
                  areas={areas.map(a => ({ id: a.id, nome: a.nome }))}
                  cycles={cycles.map(c => ({ id: c.id, cultura: (c as any).cultura, area_id: (c as any).area_id }))}
                  onItemClick={(itemId, type) => {
                    if (type === "task") {
                      const t = allTasks.find(x => x.id === itemId);
                      if (t) { setEditingTask(t); setTaskFormOpen(true); }
                    } else {
                      navigate(`/operacao/subprojetos/${itemId}`);
                    }
                  }}
                  onAddSubproject={handleNewSubproject}
                  onAddSubtask={(stageId) => { setEditingTask(null); setTaskDefaultStageId(stageId); setTaskFormOpen(true); }}
                  onDeleteOperation={(opId) => opId === currentOp.id ? setDeleteOpen(true) : deleteOperation.mutate(opId)}
                  onDuplicateOperation={(opId) => duplicateOperation.mutate(opId)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custos */}
          <TabsContent value="custos">
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-base">Lançamentos vinculados</CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate(`/caixa?operationId=${currentOp.id}&new=saida`)}>
                  <Plus className="h-3 w-3 mr-1" /> Novo Lançamento
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Nenhum custo vinculado.</p>
                ) : (() => {
                  // Agrupa por subprojeto (ou "Projeto principal" para os do nó atual)
                  const groups = new Map<string, { label: string; items: typeof filteredTransactions; total: number }>();
                  filteredTransactions.forEach(tr => {
                    const opId = (tr as any).operation_id as string | null;
                    const groupId = opId === currentOp.id || !opId ? currentOp.id : opId;
                    const sub = allStages.find(s => s.id === groupId);
                    const label = groupId === currentOp.id ? "Projeto principal" : (sub?.nome || "Outro");
                    const g = groups.get(groupId) || { label, items: [], total: 0 };
                    g.items.push(tr);
                    if (tr.tipo === "saida") g.total += Number(tr.valor || 0);
                    groups.set(groupId, g);
                  });
                  return (
                    <div className="space-y-4">
                      {Array.from(groups.entries()).map(([gid, g]) => (
                        <div key={gid} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {g.label} <span className="text-[10px]">({g.items.length})</span>
                            </h4>
                            <span className="text-xs font-medium text-destructive tabular-nums">
                              −{formatCurrency(g.total)}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {g.items.map(t => (
                              <div key={t.id} className="flex items-center justify-between border rounded-lg p-2.5 text-sm">
                                <div className="min-w-0">
                                  <div className="font-medium truncate">{t.descricao || (t as any).categoria}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                                    <span>{format(new Date(t.data), "dd/MM/yy", { locale: ptBR })}</span>
                                    {(t as any).contatos?.nome && <span>• {(t as any).contatos.nome}</span>}
                                    {(t as any).responsavel_id && (
                                      <ResponsavelBadge responsavelId={(t as any).responsavel_id} size="xs" />
                                    )}
                                  </div>
                                </div>
                                <div className={`tabular-nums font-semibold ${t.tipo === "saida" ? "text-destructive" : "text-success"}`}>
                                  {t.tipo === "saida" ? "-" : "+"} {formatCurrency(Number(t.valor))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end pt-2 border-t">
                        <span className="text-sm font-semibold">
                          Total saídas: <span className="text-destructive">{formatCurrency(totalCustoF)}</span>
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Diário */}
          <TabsContent value="diario">
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-base">Registros do Diário</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/diario?areaId=${currentOp.area_id || ""}&cycleId=${currentOp.cycle_id || ""}&new=1`)}
                >
                  <Plus className="h-3 w-3 mr-1" /> Novo Registro
                </Button>
              </CardHeader>
              <CardContent>
                {(!currentOp.area_id && !currentOp.cycle_id) ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    Vincule uma área ou ciclo ao projeto para listar registros.
                  </p>
                ) : filteredJournal.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Nenhum registro encontrado.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredJournal.slice(0, 20).map((e: any) => (
                      <div key={e.id} className="border rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{e.title || e.entry_type}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-2">
                            {e.responsavel_id && <ResponsavelBadge responsavelId={e.responsavel_id} size="xs" />}
                            {format(new Date(e.entry_date), "dd/MM/yy", { locale: ptBR })}
                          </span>
                        </div>
                        {e.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="historico">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" /> Histórico do projeto
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    Nenhum evento registrado ainda.
                  </p>
                ) : (
                  <ol className="relative border-l-2 border-muted pl-4 space-y-3">
                    {historyEvents.map((e) => {
                      const dotColor =
                        e.kind === "stage_change" ? "bg-primary" :
                        e.kind === "task_log" ? "bg-success" :
                        e.kind === "stage_created" ? "bg-warning" :
                        e.kind === "task_created" ? "bg-muted-foreground" :
                        "bg-muted-foreground";
                      return (
                        <li key={e.id} className="relative">
                          <span
                            className={`absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-background ${dotColor}`}
                          />
                          <div className="text-xs text-muted-foreground tabular-nums">
                            {format(new Date(e.at), "dd/MM/yy HH:mm", { locale: ptBR })}
                          </div>
                          <div className="text-sm font-medium">{e.title}</div>
                          {e.refLabel && (
                            <div className="text-xs text-muted-foreground truncate">↳ {e.refLabel}</div>
                          )}
                          {e.detail && (
                            <div className="text-xs text-foreground/80 mt-0.5 truncate">{e.detail}</div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Operation Form */}
      <OperationForm
        open={opFormOpen}
        onOpenChange={(v) => { setOpFormOpen(v); if (!v) { setEditingOp(null); setParentIdForNew(null); } }}
        operation={editingOp}
        parentId={parentIdForNew}
        defaultNivelTipo={defaultNivelTipo}
        areaId={currentOp.area_id || ""}
        cycleId={currentOp.cycle_id || ""}
        talhaoId={currentOp.talhao_id}
        areas={areas.map(a => ({ id: a.id, nome: a.nome }))}
        cycles={cycles.map(c => ({ id: c.id, cultura: (c as any).cultura, area_id: (c as any).area_id }))}
        allProjects={allStages.map(s => ({ id: s.id, nome: s.nome, responsavel_id: (s as any).responsavel_id || null }))}
        onSubmit={handleOpSubmit}
        isSubmitting={createOperation.isPending || updateOperation.isPending}
      />

      {/* Task Form */}
      <SimpleTaskForm
        open={taskFormOpen}
        onOpenChange={(v) => { setTaskFormOpen(v); if (!v) setEditingTask(null); }}
        task={editingTask}
        defaultStageId={taskDefaultStageId || currentOp.id}
        parentOptions={[
          {
            id: currentOp.id,
            nome: currentOp.nome,
            children: directChildren.map(c => ({ id: c.id, nome: c.nome })),
          },
        ]}
        onSubmit={handleTaskSubmit}
        isSubmitting={createTask.isPending || updateTask.isPending}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {isSubproject ? "subprojeto" : "projeto"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá também todos os subprojetos e tarefas vinculados. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function KpiCard({ icon, label, value, sub, tone }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string;
  tone?: "destructive";
}) {
  return (
    <Card className={tone === "destructive" ? "border-destructive/40" : ""}>
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}<span>{label}</span>
        </div>
        <div className={`text-lg font-semibold tabular-nums ${tone === "destructive" ? "text-destructive" : ""}`}>
          {value}
        </div>
        {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-muted-foreground text-[11px] uppercase tracking-wide">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function EmptyState({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-3">
        <div className="rounded-full bg-muted p-3 text-muted-foreground">{icon}</div>
        <p className="text-sm font-medium">{title}</p>
        {action}
      </CardContent>
    </Card>
  );
}
