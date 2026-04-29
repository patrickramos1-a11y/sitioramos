import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Activity, AlertTriangle, Clock, CheckCircle2,
  BarChart3, ListTodo, DollarSign
} from "lucide-react";
import { useOperations, Operation, OperationInsert } from "@/hooks/useOperations";
import { useTasks, Task, TaskInsert } from "@/hooks/useTasks";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { GanttTimeline } from "@/components/operacao/GanttTimeline";
import { OperationForm } from "@/components/operacao/OperationForm";
import { OperationCard } from "@/components/operacao/OperationCard";
import { TaskForm } from "@/components/operacao/TaskForm";
import { useStages } from "@/hooks/useStages";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { OPERATION_CATEGORIES } from "@/lib/operacaoConfig";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function Operacao() {
  const { areas } = useAreas();
  const { cycles } = useCycles();
  const { stages } = useStages();
  const [formContext, setFormContext] = useState<{ areaId: string; cycleId: string; talhaoId?: string | null }>({ areaId: "", cycleId: "", talhaoId: null });

  // Filters
  const [filterArea, setFilterArea] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");

  const operationFilters = useMemo(() => ({
    areaId: filterArea !== "all" ? filterArea : undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
  }), [filterArea, filterStatus]);

  const { operations: rawOperations, createOperation, updateOperation, deleteOperation, duplicateOperation } = useOperations(operationFilters);

  // Filtro de categoria aplicado em memória
  const operations = useMemo(() => {
    if (filterCategoria === "all") return rawOperations;
    return rawOperations.filter(op => op.categoria === filterCategoria);
  }, [rawOperations, filterCategoria]);

  const { tasks, createTask, updateTask, deleteTask } = useTasks({ areaId: operationFilters.areaId || undefined });

  // Form state
  const [opFormOpen, setOpFormOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<Operation | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskDefaultStageId, setTaskDefaultStageId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "operation" | "task"; id: string } | null>(null);

  // Default area/cycle for new operations
  const defaultAreaId = filterArea !== "all" ? filterArea : areas[0]?.id || "";
  const defaultCycleId = cycles.find(c => c.area_id === defaultAreaId)?.id || cycles[0]?.id || "";

  // KPIs
  const allTasks = tasks;
  const emAndamento = operations.filter(o => o.status === "em_andamento").length;
  const atrasadas = operations.filter(o => {
    if (o.status === "concluida") return false;
    return o.data_fim_prevista && new Date(o.data_fim_prevista) < new Date();
  }).length;
  const pendentes = operations.filter(o => o.status === "nao_iniciada").length;
  const concluidas = operations.filter(o => o.status === "concluida").length;
  const tasksAtrasadas = allTasks.filter(t => {
    if (t.status === "concluida" || t.status === "cancelada") return false;
    return t.data_prazo && new Date(t.data_prazo) < new Date();
  }).length;
  const custoTotal = allTasks.reduce((sum, t) => sum + (Number(t.custo_real) || 0), 0);

  // Handlers
  const handleOpSubmit = (data: OperationInsert) => {
    if (editingOp) {
      updateOperation.mutate({ ...data, id: editingOp.id } as any);
    } else {
      createOperation.mutate(data);
    }
    setOpFormOpen(false);
    setEditingOp(null);
    setParentIdForNew(null);
  };

  const handleTaskSubmit = (data: TaskInsert) => {
    if (editingTask) {
      updateTask.mutate({ ...data, id: editingTask.id } as any);
    } else {
      createTask.mutate(data);
    }
    setTaskFormOpen(false);
    setEditingTask(null);
  };

  const handleOpStatusChange = (op: Operation, status: string) => {
    const updates: any = { id: op.id, status };
    if (status === "em_andamento" && !op.data_inicio_real) updates.data_inicio_real = new Date().toISOString().split("T")[0];
    if (status === "concluida") updates.data_fim_real = new Date().toISOString().split("T")[0];
    updateOperation.mutate(updates);
  };

  const handleTaskStatusChange = (task: Task, status: string) => {
    const updates: any = { id: task.id, status };
    if (status === "concluida") updates.data_conclusao = new Date().toISOString().split("T")[0];
    if (status === "em_andamento" && !task.data_inicio_real) updates.data_inicio_real = new Date().toISOString().split("T")[0];
    updateTask.mutate(updates);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "operation") deleteOperation.mutate(deleteTarget.id);
    else deleteTask.mutate(deleteTarget.id);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const openNewOperation = () => {
    setEditingOp(null);
    setParentIdForNew(null);
    setFormContext({ areaId: defaultAreaId, cycleId: defaultCycleId, talhaoId: null });
    setOpFormOpen(true);
  };

  const openNewSubOperation = (parentId: string) => {
    const parentOperation = operations.flatMap(o => [o, ...(o.children || [])]).find(o => o.id === parentId);
    setEditingOp(null);
    setParentIdForNew(parentId);
    if (parentOperation) {
      setFormContext({ areaId: parentOperation.area_id, cycleId: parentOperation.cycle_id, talhaoId: parentOperation.talhao_id });
    }
    setOpFormOpen(true);
  };

  const openNewTask = (stageId: string) => {
    setEditingTask(null);
    setTaskDefaultStageId(stageId);
    setTaskFormOpen(true);
  };

  const handleGanttItemClick = (id: string, type: "operation" | "sub-operation" | "task") => {
    if (type === "task") {
      const task = allTasks.find(t => t.id === id);
      if (task) { setEditingTask(task); setTaskFormOpen(true); }
    } else {
      const op = operations.flatMap(o => [o, ...(o.children || [])]).find(o => o.id === id);
      if (op) { setEditingOp(op); setOpFormOpen(true); }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="hidden sm:block">
            <h1 className="text-2xl font-bold tracking-tight">Operação</h1>
            <p className="text-muted-foreground">Projetos com etapas, dependências e linha do tempo</p>
          </div>
          <Button onClick={openNewOperation} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-1" />Novo Projeto
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-2 md:gap-3 grid-cols-2 lg:grid-cols-5">
          <Card className="cursor-pointer hover:shadow-md tap-card" onClick={() => setFilterStatus("em_andamento")}>
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-1 md:p-6 md:pb-2">
              <CardTitle className="text-[11px] md:text-xs font-medium leading-tight">Em Andamento</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0"><div className="text-xl md:text-2xl font-bold text-primary">{emAndamento}</div></CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md tap-card" onClick={() => setFilterStatus("all")}>
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-1 md:p-6 md:pb-2">
              <CardTitle className="text-[11px] md:text-xs font-medium leading-tight">Atrasadas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0"><div className="text-xl md:text-2xl font-bold text-destructive">{atrasadas + tasksAtrasadas}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-1 md:p-6 md:pb-2">
              <CardTitle className="text-[11px] md:text-xs font-medium leading-tight">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0"><div className="text-xl md:text-2xl font-bold">{pendentes}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-1 md:p-6 md:pb-2">
              <CardTitle className="text-[11px] md:text-xs font-medium leading-tight">Concluídas</CardTitle>
               <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
             <CardContent className="p-3 pt-0 md:p-6 md:pt-0"><div className="text-xl md:text-2xl font-bold text-success">{concluidas}</div></CardContent>
          </Card>
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-1 md:p-6 md:pb-2">
              <CardTitle className="text-[11px] md:text-xs font-medium leading-tight">Custo Operacional</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0"><div className="text-base md:text-lg font-bold">{formatCurrency(custoTotal)}</div></CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="flex-1 min-w-[140px] sm:flex-initial sm:w-44">
              <SelectValue placeholder="Todas as áreas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="flex-1 min-w-[140px] sm:flex-initial sm:w-44">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="planejada">Planejada</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="atrasada">Atrasada</SelectItem>
              <SelectItem value="pausada">Pausada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="flex-1 min-w-[140px] sm:flex-initial sm:w-44">
              <SelectValue placeholder="Todas categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {OPERATION_CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline" className="gap-2">
              <BarChart3 className="h-4 w-4" />Timeline
            </TabsTrigger>
            <TabsTrigger value="lista" className="gap-2">
              <ListTodo className="h-4 w-4" />Lista
            </TabsTrigger>
          </TabsList>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card>
              <CardContent className="pt-6">
                <GanttTimeline
                  operations={operations}
                  tasks={allTasks}
                  onItemClick={handleGanttItemClick}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* List Tab */}
          <TabsContent value="lista">
            <div className="space-y-3">
              {operations.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Nenhuma operação cadastrada</h3>
                    <p className="text-muted-foreground mb-4">Crie operações para gerenciar as atividades do seu ciclo produtivo.</p>
                    <Button onClick={openNewOperation} disabled={!defaultAreaId || !defaultCycleId}>
                      <Plus className="h-4 w-4 mr-1" />Nova Operação
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                operations.map(op => (
                  <OperationCard
                    key={op.id}
                    operation={op}
                    tasks={allTasks}
                    onEdit={(o) => { setEditingOp(o); setParentIdForNew(o.parent_id || null); setOpFormOpen(true); }}
                    onDelete={(o) => { setDeleteTarget({ type: "operation", id: o.id }); setDeleteDialogOpen(true); }}
                    onDuplicate={(id) => duplicateOperation.mutate(id)}
                    onAddSubOperation={openNewSubOperation}
                    onAddTask={openNewTask}
                    onEditTask={(t) => { setEditingTask(t); setTaskFormOpen(true); }}
                    onDeleteTask={(t) => { setDeleteTarget({ type: "task", id: t.id }); setDeleteDialogOpen(true); }}
                    onTaskStatusChange={handleTaskStatusChange}
                    onStatusChange={handleOpStatusChange}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Operation Form */}
      <OperationForm
        open={opFormOpen}
        onOpenChange={(v) => { setOpFormOpen(v); if (!v) { setEditingOp(null); setParentIdForNew(null); } }}
        operation={editingOp}
        parentId={parentIdForNew}
        areaId={editingOp?.area_id || formContext.areaId || defaultAreaId}
        cycleId={editingOp?.cycle_id || formContext.cycleId || defaultCycleId}
        talhaoId={editingOp?.talhao_id || formContext.talhaoId}
        areas={areas.map(a => ({ id: a.id, nome: a.nome }))}
        cycles={cycles.map(c => ({ id: c.id, cultura: (c as any).cultura, area_id: (c as any).area_id }))}
        onSubmit={handleOpSubmit}
        isSubmitting={createOperation.isPending || updateOperation.isPending}
      />

      {/* Task Form */}
      <TaskForm
        open={taskFormOpen}
        onOpenChange={(v) => { setTaskFormOpen(v); if (!v) setEditingTask(null); }}
        task={editingTask}
        stages={stages}
        defaultValues={{ stage_id: taskDefaultStageId || undefined, area_id: defaultAreaId || undefined, cycle_id: defaultCycleId || undefined }}
        onSubmit={handleTaskSubmit}
        isSubmitting={createTask.isPending || updateTask.isPending}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Suboperações e tarefas vinculadas também serão excluídas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
