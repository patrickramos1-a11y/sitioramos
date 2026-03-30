import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ClipboardList, CheckCircle2, AlertTriangle, Clock, Activity, ListTodo } from "lucide-react";
import { useTasks, Task, TaskInsert } from "@/hooks/useTasks";
import { useStages } from "@/hooks/useStages";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { TaskForm } from "@/components/operacao/TaskForm";
import { TaskList } from "@/components/operacao/TaskList";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Operacao() {
  const { tasks, isLoading: tasksLoading, createTask, updateTask, deleteTask } = useTasks();
  const { stages } = useStages();
  const { areas } = useAreas();
  const { cycles } = useCycles();

  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const emAndamento = tasks.filter(t => t.status === "em_andamento");
  const atrasadas = tasks.filter(t => {
    if (t.status === "concluida" || t.status === "cancelada") return false;
    return t.data_prazo && new Date(t.data_prazo) < new Date();
  });
  const pendentes = tasks.filter(t => t.status === "pendente");
  const concluidas = tasks.filter(t => t.status === "concluida");

  const filteredTasks = filterStatus === "all" ? tasks :
    filterStatus === "atrasadas" ? atrasadas :
    tasks.filter(t => t.status === filterStatus);

  const handleTaskSubmit = (data: TaskInsert) => {
    if (editingTask) {
      updateTask.mutate({ ...data, id: editingTask.id } as any);
    } else {
      createTask.mutate(data);
    }
    setTaskFormOpen(false);
    setEditingTask(null);
  };

  const handleStatusChange = (task: Task, status: string) => {
    const updates: any = { id: task.id, status };
    if (status === "concluida") updates.data_conclusao = new Date().toISOString().split("T")[0];
    if (status === "em_andamento" && !task.data_inicio_real) updates.data_inicio_real = new Date().toISOString().split("T")[0];
    updateTask.mutate(updates);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Operação</h1>
            <p className="text-muted-foreground">Gestão operacional de etapas e tarefas</p>
          </div>
          <Button onClick={() => { setEditingTask(null); setTaskFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />Nova Tarefa
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilterStatus("em_andamento")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{emAndamento.length}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilterStatus("atrasadas")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{atrasadas.length}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilterStatus("pendente")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{pendentes.length}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilterStatus("concluida")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{concluidas.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Task List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Tarefas
              </CardTitle>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="atrasadas">Atrasadas</SelectItem>
                  <SelectItem value="concluida">Concluídas</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <TaskList
              tasks={filteredTasks}
              onEdit={(t) => { setEditingTask(t); setTaskFormOpen(true); }}
              onDelete={(t) => { setDeletingTask(t); setDeleteDialogOpen(true); }}
              onStatusChange={handleStatusChange}
            />
          </CardContent>
        </Card>
      </div>

      <TaskForm
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        task={editingTask}
        stages={stages}
        onSubmit={handleTaskSubmit}
        isSubmitting={createTask.isPending || updateTask.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deletingTask) deleteTask.mutate(deletingTask.id); setDeleteDialogOpen(false); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
