import { useState } from "react";
import { Operation } from "@/hooks/useOperations";
import { Task } from "@/hooks/useTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronDown, ChevronRight, MoreVertical, Plus, Pencil, Trash2, Copy,
  PlayCircle, PauseCircle, CheckCircle2, Clock, AlertTriangle, Circle,
  Layers, ListTodo, DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getCategoryEmoji, getCategoryLabel, getResponsavelColor } from "@/lib/operacaoConfig";
import { OperationCostBlock } from "./OperationCostBlock";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; badgeVariant: "default" | "secondary" | "outline" | "destructive" }> = {
  planejada: { label: "Planejada", icon: Circle, color: "text-muted-foreground", badgeVariant: "outline" },
  nao_iniciada: { label: "Planejada", icon: Circle, color: "text-muted-foreground", badgeVariant: "outline" },
  em_andamento: { label: "Em Andamento", icon: Clock, color: "text-primary", badgeVariant: "secondary" },
  concluida: { label: "Concluída", icon: CheckCircle2, color: "text-success", badgeVariant: "default" },
  atrasada: { label: "Atrasada", icon: AlertTriangle, color: "text-destructive", badgeVariant: "destructive" },
  pausada: { label: "Pausada", icon: PauseCircle, color: "text-warning", badgeVariant: "outline" },
  travada: { label: "Travada", icon: AlertTriangle, color: "text-muted-foreground", badgeVariant: "outline" },
  cancelada: { label: "Cancelada", icon: Circle, color: "text-muted-foreground", badgeVariant: "outline" },
  reprogramada: { label: "Reprogramada", icon: Clock, color: "text-muted-foreground", badgeVariant: "outline" },
};

const typeLabels: Record<string, string> = {
  preparo: "🔧 Preparo", plantio: "🌱 Plantio", leiras: "⛏ Leiras", herbicida: "🧪 Herbicida",
  capina: "🌿 Capina", adubacao: "💊 Adubação", colheita: "🌾 Colheita", beneficiamento: "🏭 Beneficiamento",
  documentacao: "📄 Documentação", manutencao: "🔩 Manutenção", outro: "📋 Outro",
};

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface OperationCardProps {
  operation: Operation;
  tasks: Task[];
  onEdit: (op: Operation) => void;
  onDelete: (op: Operation) => void;
  onDuplicate: (id: string) => void;
  onAddSubOperation: (parentId: string) => void;
  onAddTask: (stageId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onTaskStatusChange: (task: Task, status: string) => void;
  onStatusChange: (op: Operation, status: string) => void;
}

export function OperationCard({
  operation, tasks, onEdit, onDelete, onDuplicate,
  onAddSubOperation, onAddTask, onEditTask, onDeleteTask,
  onTaskStatusChange, onStatusChange,
}: OperationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const sc = statusConfig[operation.status] || statusConfig.nao_iniciada;
  const Icon = sc.icon;

  const isOverdue = operation.data_fim_prevista && new Date(operation.data_fim_prevista) < new Date() && operation.status !== "concluida";

  // Get tasks for this operation and its sub-operations
  const subIds = (operation.children || []).map(c => c.id);
  const allRelatedTasks = tasks.filter(t =>
    t.stage_id === operation.id ||
    subIds.includes(t.stage_id || "")
  );

  const totalCusto = allRelatedTasks.reduce((sum, t) => sum + (Number(t.custo_real) || 0), 0);
  const tasksEmAndamento = allRelatedTasks.filter(t => t.status === "em_andamento").length;
  const tasksConcluidas = allRelatedTasks.filter(t => t.status === "concluida").length;
  const tasksTotal = allRelatedTasks.length;
  const progressPercent = tasksTotal > 0 ? Math.round((tasksConcluidas / tasksTotal) * 100) : (operation.progresso_percentual || 0);

  return (
    <Card className={`transition-all ${isOverdue ? "border-destructive/50" : ""}`}>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CollapsibleTrigger asChild>
              <button className="flex items-start gap-2 text-left flex-1 min-w-0">
                {expanded ? <ChevronDown className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icon className={`h-4 w-4 ${sc.color}`} />
                    <CardTitle className="text-base">{operation.nome}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant={sc.badgeVariant} className="text-xs">{sc.label}</Badge>
                    {operation.categoria && (
                      <Badge variant="outline" className="text-xs">
                        {getCategoryEmoji(operation.categoria)} {getCategoryLabel(operation.categoria)}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{typeLabels[operation.tipo] || operation.tipo}</span>
                    {operation.prioridade === "alta" && <Badge variant="destructive" className="text-xs">Alta</Badge>}
                    {operation.prioridade === "critica" && <Badge variant="destructive" className="text-xs">Crítica</Badge>}
                  </div>
                </div>
              </button>
            </CollapsibleTrigger>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(operation)}><Pencil className="mr-2 h-3 w-3" />Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(operation.id)}><Copy className="mr-2 h-3 w-3" />Duplicar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddSubOperation(operation.id)}><Layers className="mr-2 h-3 w-3" />Suboperação</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddTask(operation.id)}><ListTodo className="mr-2 h-3 w-3" />Nova Tarefa</DropdownMenuItem>
                <DropdownMenuSeparator />
                {operation.status !== "em_andamento" && (
                  <DropdownMenuItem onClick={() => onStatusChange(operation, "em_andamento")}>
                    <PlayCircle className="mr-2 h-3 w-3" />Iniciar
                  </DropdownMenuItem>
                )}
                {operation.status === "em_andamento" && (
                  <>
                    <DropdownMenuItem onClick={() => onStatusChange(operation, "pausada")}><PauseCircle className="mr-2 h-3 w-3" />Pausar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(operation, "concluida")}><CheckCircle2 className="mr-2 h-3 w-3" />Concluir</DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(operation)} className="text-destructive"><Trash2 className="mr-2 h-3 w-3" />Excluir</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Summary row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 flex-wrap">
            {operation.data_inicio_real && (
              <span>Início: {format(new Date(operation.data_inicio_real), "dd/MM/yy", { locale: ptBR })}</span>
            )}
            {operation.data_fim_prevista && (
              <span>Prev: {format(new Date(operation.data_fim_prevista), "dd/MM/yy", { locale: ptBR })}</span>
            )}
            {operation.responsavel && <span>👤 {operation.responsavel}</span>}
            {totalCusto > 0 && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatCurrency(totalCusto)}</span>}
            {tasksTotal > 0 && <span>{tasksConcluidas}/{tasksTotal} tarefas</span>}
          </div>

          {/* Progress bar */}
          {tasksTotal > 0 && (
            <div className="mt-2">
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {/* Sub-operations */}
            {(operation.children || []).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3 w-3" />Suboperações
                </h4>
                {(operation.children || []).map(sub => {
                  const subSc = statusConfig[sub.status] || statusConfig.nao_iniciada;
                  const SubIcon = subSc.icon;
                  const subTasks = tasks.filter(t => t.stage_id === sub.id);
                  return (
                    <div key={sub.id} className="bg-muted/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <SubIcon className={`h-3.5 w-3.5 ${subSc.color}`} />
                          <span className="text-sm font-medium truncate">{sub.nome}</span>
                          <Badge variant={subSc.badgeVariant} className="text-[10px]">{subSc.label}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAddTask(sub.id)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(sub)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {subTasks.length > 0 && (
                        <div className="pl-4 space-y-1">
                          {subTasks.map(task => (
                            <TaskMiniCard
                              key={task.id}
                              task={task}
                              onEdit={() => onEditTask(task)}
                              onStatusChange={onTaskStatusChange}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Direct tasks */}
            {(() => {
              const directTasks = tasks.filter(t =>
                t.stage_id === operation.id
              );
              if (directTasks.length === 0) return null;
              return (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <ListTodo className="h-3 w-3" />Tarefas
                  </h4>
                  {directTasks.map(task => (
                    <TaskMiniCard
                      key={task.id}
                      task={task}
                      onEdit={() => onEditTask(task)}
                      onStatusChange={onTaskStatusChange}
                    />
                  ))}
                </div>
              );
            })()}

            {/* Custos vinculados */}
            <OperationCostBlock
              operationId={operation.id}
              subOperationIds={subIds}
              relatedTasks={allRelatedTasks}
            />

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => onAddSubOperation(operation.id)}>
                <Layers className="h-3 w-3 mr-1" />Suboperação
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => onAddTask(operation.id)}>
                <Plus className="h-3 w-3 mr-1" />Tarefa
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function TaskMiniCard({ task, onEdit, onStatusChange }: { task: Task; onEdit: () => void; onStatusChange: (task: Task, status: string) => void }) {
  const isOverdue = task.data_prazo && new Date(task.data_prazo) < new Date() && task.status !== "concluida" && task.status !== "cancelada";

  return (
    <div className={`flex items-center justify-between gap-2 p-2 rounded bg-background border text-xs ${isOverdue ? "border-destructive/50" : ""}`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className={`truncate ${task.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>
          {task.titulo}
        </span>
        {isOverdue && <Badge variant="destructive" className="text-[10px] px-1">Atrasada</Badge>}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {task.status === "pendente" && (
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onStatusChange(task, "em_andamento")}>
            <PlayCircle className="h-3 w-3 text-primary" />
          </Button>
        )}
        {task.status === "em_andamento" && (
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onStatusChange(task, "concluida")}>
            <CheckCircle2 className="h-3 w-3 text-success" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
