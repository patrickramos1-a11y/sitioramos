import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  MapPin, Plus, Calendar, Sprout, Wallet, ArrowLeft,
  RefreshCw, DollarSign, TrendingUp, FileText, MoreVertical,
  Pencil, Trash2, TreePine, Droplets, Clock, ClipboardList, ListTodo, Wand2, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAreas } from "@/hooks/useAreas";
import { useCycles, Cycle, CycleInsert } from "@/hooks/useCycles";
import { useCosts } from "@/hooks/useCosts";
import { useRevenues } from "@/hooks/useRevenues";
import { useInvestments } from "@/hooks/useInvestments";
import { useStages, Stage, StageInsert } from "@/hooks/useStages";
import { useTasks, Task, TaskInsert } from "@/hooks/useTasks";
import { useOperations, Operation, OperationInsert } from "@/hooks/useOperations";
import { useCycleAreaAllocations } from "@/hooks/useCycleAreaAllocations";
import { haParaM2, haParaTarefas, formatTarefas, formatM2, TAREFAS_POR_HECTARE } from "@/lib/territory/tarefas";
import { Progress } from "@/components/ui/progress";
import { CycleForm } from "@/components/cycles/CycleForm";
import { StageForm } from "@/components/operacao/StageForm";
import { TaskForm } from "@/components/operacao/TaskForm";
import { OperationForm } from "@/components/operacao/OperationForm";
import { OperationCard } from "@/components/operacao/OperationCard";
import { GanttTimeline } from "@/components/operacao/GanttTimeline";
import { CycleTimeline } from "@/components/operacao/CycleTimeline";
import { TaskList } from "@/components/operacao/TaskList";
import { CultureTemplatePicker } from "@/components/operacao/CultureTemplatePicker";
import { Sprout as SproutIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  planejamento: { label: "Planejamento", variant: "secondary" },
  preparo: { label: "Em preparo", variant: "outline" },
  plantada: { label: "Plantada", variant: "default" },
  producao: { label: "Em produção", variant: "default" },
  colhida: { label: "Colhida", variant: "secondary" },
};

const cycleStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  planejamento: { label: "📋 Planejamento", variant: "secondary" },
  ativo: { label: "🚜 Ativo", variant: "default" },
  finalizado: { label: "✅ Finalizado", variant: "outline" },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function AreaDetalhe() {
  const { id } = useParams();
  const { areas, isLoading: areasLoading } = useAreas();
  const { cycles, isLoading: cyclesLoading, createCycle, updateCycle, deleteCycle } = useCycles();
  const { costs } = useCosts();
  const { revenues } = useRevenues();
  const { investments } = useInvestments();

  const [cycleFormOpen, setCycleFormOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; item: any } | null>(null);

  // Operation state
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [stageFormOpen, setStageFormOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [opFormOpen, setOpFormOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<Operation | null>(null);
  const [parentIdForNewOp, setParentIdForNewOp] = useState<string | null>(null);
  const [taskDefaultStageId, setTaskDefaultStageId] = useState<string>("");
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  const area = areas.find(a => a.id === id);
  const areaCycles = cycles.filter((c: any) => c.area_id === id);
  const activeCycleId = selectedCycleId || areaCycles.find((c: any) => c.status === "ativo")?.id || areaCycles[0]?.id;

  const { stages, createStage, updateStage, deleteStage, createFromTemplate } = useStages(activeCycleId, id);
  const { tasks, createTask, updateTask, deleteTask } = useTasks({ cycleId: activeCycleId, areaId: id });
  const { operations, createOperation, updateOperation, deleteOperation, duplicateOperation } = useOperations({ areaId: id, cycleId: activeCycleId });

  const areaCosts = costs.filter((c: any) => c.area_id === id);
  const areaRevenues = revenues.filter((r: any) => r.area_id === id);
  const areaInvestments = investments.filter((i: any) => i.area_id === id);

  const totalCustos = areaCosts.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
  const totalReceitas = areaRevenues.reduce((sum: number, r: any) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);
  const totalInvestimentos = areaInvestments.reduce((sum: number, i: any) => sum + Number(i.valor), 0);
  const resultado = totalReceitas - totalCustos;

  const areaApp = Number((area as any)?.area_app_hectares || 0);
  const areaRio = Number((area as any)?.metros_rio || 0);
  const talhaoId = (area as any)?.talhao_id;

  const handleDeleteConfirm = () => {
    if (deleteTarget?.type === "cycle") deleteCycle.mutate(deleteTarget.item.id);
    if (deleteTarget?.type === "stage") deleteStage.mutate(deleteTarget.item.id);
    if (deleteTarget?.type === "task") deleteTask.mutate(deleteTarget.item.id);
    if (deleteTarget?.type === "operation") deleteOperation.mutate(deleteTarget.item.id);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const handleOpSubmit = (data: OperationInsert) => {
    if (editingOp) {
      updateOperation.mutate({ ...data, id: editingOp.id } as any);
    } else {
      createOperation.mutate(data);
    }
    setOpFormOpen(false);
    setEditingOp(null);
    setParentIdForNewOp(null);
  };

  const handleOpStatusChange = (op: Operation, status: string) => {
    const updates: any = { id: op.id, status };
    if (status === "em_andamento" && !op.data_inicio_real) updates.data_inicio_real = new Date().toISOString().split("T")[0];
    if (status === "concluida") updates.data_fim_real = new Date().toISOString().split("T")[0];
    updateOperation.mutate(updates);
  };

  const handleCycleSubmit = (data: CycleInsert) => {
    if (editingCycle) {
      updateCycle.mutate({ ...data, id: editingCycle.id });
    } else {
      createCycle.mutate({ ...data, area_id: id! });
    }
    setCycleFormOpen(false);
    setEditingCycle(null);
  };

  const handleStageSubmit = (data: StageInsert) => {
    if (editingStage) {
      updateStage.mutate({ ...data, id: editingStage.id } as any);
    } else {
      createStage.mutate(data);
    }
    setStageFormOpen(false);
    setEditingStage(null);
  };

  const handleTaskSubmit = (data: TaskInsert) => {
    if (editingTask) {
      updateTask.mutate({ ...data, id: editingTask.id } as any);
    } else {
      createTask.mutate({ ...data, area_id: id, cycle_id: activeCycleId, talhao_id: talhaoId || null });
    }
    setTaskFormOpen(false);
    setEditingTask(null);
  };

  const handleTaskStatusChange = (task: Task, status: string) => {
    const updates: any = { id: task.id, status };
    if (status === "concluida") updates.data_conclusao = new Date().toISOString().split("T")[0];
    if (status === "em_andamento" && !task.data_inicio_real) updates.data_inicio_real = new Date().toISOString().split("T")[0];
    updateTask.mutate(updates);
  };

  const handleGenerateTemplateStages = () => {
    const cycle = areaCycles.find((c: any) => c.id === activeCycleId);
    if (cycle) {
      createFromTemplate.mutate({
        cultura: cycle.cultura,
        cycleId: activeCycleId!,
        areaId: id!,
        talhaoId: talhaoId || undefined,
      });
    }
  };

  const isLoading = areasLoading || cyclesLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!area) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Área não encontrada</h2>
          <Button asChild><Link to="/propriedade"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link></Button>
        </div>
      </AppLayout>
    );
  }

  const status = statusConfig[area.status] || statusConfig.planejamento;
  const tipoLabel = (area as any).tipo === "ambiental" ? "Ambiental" : (area as any).tipo === "administrativa" ? "Administrativa" : "Produtiva";
  const activeCycle = areaCycles.find((c: any) => c.id === activeCycleId);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to={talhaoId ? `/talhoes/${talhaoId}` : "/propriedade"}>
                  <ArrowLeft className="h-4 w-4 mr-1" />Voltar
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{area.nome}</h1>
                <p className="text-muted-foreground">
                  {Number(area.tamanho_hectares).toFixed(2)} ha • 
                  <Badge variant={status.variant} className="ml-1">{status.label}</Badge>
                  <Badge variant="outline" className="ml-1">{tipoLabel}</Badge>
                </p>
              </div>
            </div>
          </div>
          <Button asChild>
            <Link to={`/caixa?area=${area.id}`}>
              <Wallet className="h-4 w-4 mr-2" />Ver Fluxo de Caixa
            </Link>
          </Button>
        </div>

        {/* Area Info */}
        {(area.cultura_principal || area.data_inicio || areaApp > 0 || areaRio > 0) && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-6">
                {area.cultura_principal && (
                  <div className="flex items-center gap-2 text-sm">
                    <Sprout className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Cultura:</span>
                    <span className="font-medium">{area.cultura_principal}</span>
                  </div>
                )}
                {area.data_inicio && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Início:</span>
                    <span className="font-medium">{format(new Date(area.data_inicio), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                )}
                {areaApp > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <TreePine className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">APP:</span>
                    <span className="font-medium">{areaApp.toFixed(2)} ha</span>
                  </div>
                )}
                {areaRio > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">Rio:</span>
                    <span className="font-medium">{areaRio.toLocaleString("pt-BR")} m</span>
                  </div>
                )}
              </div>
              {area.observacoes && <p className="text-sm text-muted-foreground mt-3">{area.observacoes}</p>}
            </CardContent>
          </Card>
        )}

        {/* Financial Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Custos</CardTitle>
              <DollarSign className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-destructive">{formatCurrency(totalCustos)}</div>
              <p className="text-xs text-muted-foreground">{areaCosts.length} lançamento(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Implantação</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatCurrency(totalInvestimentos)}</div>
              <p className="text-xs text-muted-foreground">{areaInvestments.length} lançamento(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-success">{formatCurrency(totalReceitas)}</div>
              <p className="text-xs text-muted-foreground">{areaRevenues.length} venda(s)</p>
            </CardContent>
          </Card>
          <Card className={resultado >= 0 ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5"}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resultado</CardTitle>
              {resultado >= 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <DollarSign className="h-4 w-4 text-destructive" />}
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${resultado >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(resultado)}
              </div>
              <p className="text-xs text-muted-foreground">Receitas - Custos</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="ciclos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ciclos" className="gap-2">
              <RefreshCw className="h-4 w-4" />Ciclos
            </TabsTrigger>
            <TabsTrigger value="operacao" className="gap-2">
              <ClipboardList className="h-4 w-4" />Operação
            </TabsTrigger>
            <TabsTrigger value="tarefas" className="gap-2">
              <ListTodo className="h-4 w-4" />Tarefas
            </TabsTrigger>
          </TabsList>

          {/* Cycles Tab */}
          <TabsContent value="ciclos">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Ciclos Produtivos
                    </CardTitle>
                    <CardDescription>{areaCycles.length} ciclo(s) nesta área</CardDescription>
                  </div>
                  <Button onClick={() => { setEditingCycle(null); setCycleFormOpen(true); }} size="sm">
                    <Plus className="h-4 w-4 mr-1" />Novo Ciclo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {areaCycles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <RefreshCw className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Nenhum ciclo cadastrado</h3>
                    <p className="text-muted-foreground mb-4">Cadastre ciclos produtivos para controlar plantio e colheita.</p>
                    <Button onClick={() => { setEditingCycle(null); setCycleFormOpen(true); }}>
                      <Plus className="h-4 w-4 mr-1" />Novo Ciclo
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {areaCycles.map((cycle: any) => {
                      const cs = cycleStatusConfig[cycle.status] || cycleStatusConfig.planejamento;
                      const cycleCosts = costs.filter((c: any) => c.cycle_id === cycle.id);
                      const cycleRevenues = revenues.filter((r: any) => r.cycle_id === cycle.id);
                      const cycleTotalCost = cycleCosts.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
                      const cycleTotalRev = cycleRevenues.reduce((sum: number, r: any) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);
                      const dataInicio = new Date(cycle.data_inicio_plantio);
                      const now = new Date();
                      const diasDecorridos = Math.max(0, Math.floor((now.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)));
                      const mesesDecorridos = Math.floor(diasDecorridos / 30);

                      return (
                        <Card key={cycle.id} className={`transition-all hover:shadow-md cursor-pointer ${activeCycleId === cycle.id ? "ring-2 ring-primary" : ""}`}
                          onClick={() => setSelectedCycleId(cycle.id)}>
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Sprout className="h-4 w-4 text-primary" />
                                  {cycle.cultura}
                                </CardTitle>
                                <Badge variant={cs.variant} className="mt-1">{cs.label}</Badge>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditingCycle(cycle); setCycleFormOpen(true); }}>
                                    <Pencil className="mr-2 h-4 w-4" />Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setDeleteTarget({ type: "cycle", item: cycle }); setDeleteDialogOpen(true); }} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Plantio: {format(new Date(cycle.data_inicio_plantio), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-primary">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium">
                                {diasDecorridos} dias ({mesesDecorridos} {mesesDecorridos === 1 ? "mês" : "meses"})
                              </span>
                            </div>
                            <div className="pt-2 border-t space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Custos:</span>
                                <span className="text-destructive font-medium">{formatCurrency(cycleTotalCost)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Receitas:</span>
                                <span className="text-success font-medium">{formatCurrency(cycleTotalRev)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operation Tab - Hierarchical */}
          <TabsContent value="operacao">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Operações {activeCycle ? `— ${(activeCycle as any).cultura}` : ""}
                      </CardTitle>
                      <CardDescription>{operations.length} operação(ões) • {tasks.length} tarefa(s)</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {activeCycleId && stages.length === 0 && (
                        <Button variant="outline" size="sm" onClick={() => setTemplatePickerOpen(true)}>
                          <SproutIcon className="h-4 w-4 mr-1" />Aplicar Padrão de Cultura
                        </Button>
                      )}
                      {activeCycleId && (
                        <Button size="sm" onClick={() => { setEditingOp(null); setParentIdForNewOp(null); setOpFormOpen(true); }}>
                          <Plus className="h-4 w-4 mr-1" />Nova Operação
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!activeCycleId ? (
                    <p className="text-center text-muted-foreground py-8">Selecione ou crie um ciclo primeiro.</p>
                  ) : (
                    <GanttTimeline operations={operations} tasks={tasks} onItemClick={(itemId, type) => {
                      if (type === "task") {
                        const task = tasks.find(t => t.id === itemId);
                        if (task) { setEditingTask(task); setTaskFormOpen(true); }
                      } else {
                        const op = operations.flatMap(o => [o, ...(o.children || [])]).find(o => o.id === itemId);
                        if (op) { setEditingOp(op); setOpFormOpen(true); }
                      }
                    }} />
                  )}
                </CardContent>
              </Card>

              {/* Operation Cards */}
              {operations.map(op => (
                <OperationCard
                  key={op.id}
                  operation={op}
                  tasks={tasks}
                  onEdit={(o) => { setEditingOp(o); setParentIdForNewOp(o.parent_id || null); setOpFormOpen(true); }}
                  onDelete={(o) => { setDeleteTarget({ type: "operation", item: o }); setDeleteDialogOpen(true); }}
                  onDuplicate={(opId) => duplicateOperation.mutate(opId)}
                  onAddSubOperation={(parentId) => { setEditingOp(null); setParentIdForNewOp(parentId); setOpFormOpen(true); }}
                  onAddTask={(stageId) => { setEditingTask(null); setTaskDefaultStageId(stageId); setTaskFormOpen(true); }}
                  onEditTask={(t) => { setEditingTask(t); setTaskFormOpen(true); }}
                  onDeleteTask={(t) => { setDeleteTarget({ type: "task", item: t }); setDeleteDialogOpen(true); }}
                  onTaskStatusChange={handleTaskStatusChange}
                  onStatusChange={handleOpStatusChange}
                />
              ))}
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tarefas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ListTodo className="h-5 w-5" />
                      Tarefas {activeCycle ? `— ${(activeCycle as any).cultura}` : ""}
                    </CardTitle>
                    <CardDescription>
                      {tasks.filter(t => t.status === "em_andamento").length} em andamento • 
                      {tasks.filter(t => t.data_prazo && new Date(t.data_prazo) < new Date() && t.status !== "concluida" && t.status !== "cancelada").length} atrasada(s)
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => { setEditingTask(null); setTaskFormOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" />Nova Tarefa
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TaskList
                  tasks={tasks}
                  onEdit={(t) => { setEditingTask(t); setTaskFormOpen(true); }}
                  onDelete={(t) => { setDeleteTarget({ type: "task", item: t }); setDeleteDialogOpen(true); }}
                  onStatusChange={handleTaskStatusChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CycleForm open={cycleFormOpen} onOpenChange={setCycleFormOpen} cycle={editingCycle} areas={areas.filter(a => a.id === id)} onSubmit={handleCycleSubmit} isSubmitting={createCycle.isPending || updateCycle.isPending} />

      {activeCycleId && activeCycle && (
        <CultureTemplatePicker
          open={templatePickerOpen}
          onOpenChange={setTemplatePickerOpen}
          cycleId={activeCycleId}
          areaId={id!}
          talhaoId={talhaoId}
          dataInicio={(activeCycle as any).data_inicio_plantio || new Date().toISOString().slice(0, 10)}
          culturaSugerida={(activeCycle as any).cultura}
        />
      )}
      {activeCycleId && (
        <StageForm
          open={stageFormOpen}
          onOpenChange={setStageFormOpen}
          stage={editingStage}
          cycleId={activeCycleId}
          areaId={id!}
          talhaoId={talhaoId}
          onSubmit={handleStageSubmit}
          isSubmitting={createStage.isPending || updateStage.isPending}
        />
      )}

      <TaskForm
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        task={editingTask}
        stages={stages}
        defaultValues={{ area_id: id, cycle_id: activeCycleId || undefined, talhao_id: talhaoId || undefined, stage_id: taskDefaultStageId || undefined }}
        onSubmit={handleTaskSubmit}
        isSubmitting={createTask.isPending || updateTask.isPending}
      />

      {activeCycleId && (
        <OperationForm
          open={opFormOpen}
          onOpenChange={(v) => { setOpFormOpen(v); if (!v) { setEditingOp(null); setParentIdForNewOp(null); } }}
          operation={editingOp}
          parentId={parentIdForNewOp}
          areaId={id!}
          cycleId={activeCycleId}
          talhaoId={talhaoId}
          allProjects={operations.flatMap(o => [o, ...((o.children || []) as any[])]).map((s: any) => ({ id: s.id, nome: s.nome, responsavel_id: s.responsavel_id || null }))}
          onSubmit={handleOpSubmit}
          isSubmitting={createOperation.isPending || updateOperation.isPending}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
