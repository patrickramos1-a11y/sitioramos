import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Operation } from "@/hooks/useOperations";
import { Task } from "@/hooks/useTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  ChevronDown, ChevronRight, MoreVertical, Plus, Pencil, Trash2, Copy,
  PlayCircle, PauseCircle, CheckCircle2, Clock, AlertTriangle, Circle,
  Layers, ListTodo, DollarSign, CalendarClock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getCategoryEmoji, getCategoryLabel, getResponsavelColor,
  getEffectiveStatus, getEffectiveStatusUI, getDeadlineLabel, type EffectiveStatus,
} from "@/lib/operacaoConfig";
import { OperationCostBlock } from "./OperationCostBlock";
import { ResponsavelBadge } from "@/components/responsaveis/ResponsavelBadge";

const STATUS_ICON: Record<EffectiveStatus, React.ElementType> = {
  planejado: Circle,
  em_execucao: Clock,
  atrasado: AlertTriangle,
  concluido: CheckCircle2,
  concluido_com_atraso: CheckCircle2,
  pausado: PauseCircle,
  travado: AlertTriangle,
  cancelado: Circle,
};

const TONE_CLASS: Record<string, string> = {
  neutral: "text-muted-foreground",
  ok: "text-primary",
  warn: "text-warning",
  bad: "text-destructive",
  done: "text-success",
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
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);

  const eff = getEffectiveStatus(operation as any);
  const ui = getEffectiveStatusUI(eff);
  const Icon = STATUS_ICON[eff];
  const deadline = getDeadlineLabel(operation as any);
  const isOverdue = eff === "atrasado";
  const isDone = eff === "concluido" || eff === "concluido_com_atraso";

  // Get tasks for this operation and its sub-operations
  const subIds = (operation.children || []).map(c => c.id);
  const allRelatedTasks = tasks.filter(t =>
    t.stage_id === operation.id ||
    subIds.includes(t.stage_id || "")
  );

  const totalCusto = allRelatedTasks.reduce((sum, t) => sum + (Number(t.custo_real) || 0), 0);
  const tasksConcluidas = allRelatedTasks.filter(t => t.status === "concluida").length;
  const tasksTotal = allRelatedTasks.length;
  const tasksPendentes = tasksTotal - tasksConcluidas;
  const progressPercent = tasksTotal > 0 ? Math.round((tasksConcluidas / tasksTotal) * 100) : (operation.progresso_percentual || 0);
  const progressByTime = tasksTotal === 0;

  const requestComplete = () => {
    if (tasksPendentes > 0) setConfirmComplete(true);
    else onStatusChange(operation, "concluida");
  };

  const periodoLabel = operation.data_inicio_prevista || operation.data_fim_prevista
    ? `${operation.data_inicio_prevista ? format(new Date(operation.data_inicio_prevista), "dd MMM", { locale: ptBR }) : "?"} — ${operation.data_fim_prevista ? format(new Date(operation.data_fim_prevista), "dd MMM", { locale: ptBR }) : "?"}`
    : null;

  return (
    <Card className={`transition-all ${isOverdue ? "border-destructive/50" : ""} ${isDone ? "opacity-90" : ""}`}>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CollapsibleTrigger asChild>
              <button className="flex items-start gap-2 text-left flex-1 min-w-0">
                {expanded ? <ChevronDown className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icon className={`h-4 w-4 ${ui.iconClass}`} />
                    <CardTitle
                      className="text-base hover:underline cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); navigate(`/operacao/projetos/${operation.id}`); }}
                    >
                      {operation.nome}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${ui.badgeClass}`}>{ui.label}</Badge>
                    {!isDone && (
                      <Badge variant="outline" className={`text-[10px] gap-1 ${TONE_CLASS[deadline.tone]}`}>
                        <CalendarClock className="h-3 w-3" />{deadline.text}
                      </Badge>
                    )}
                    {operation.categoria && (
                      <Badge variant="outline" className="text-[10px]">
                        {getCategoryEmoji(operation.categoria)} {getCategoryLabel(operation.categoria)}
                      </Badge>
                    )}
                    {operation.prioridade === "alta" && <Badge variant="destructive" className="text-[10px]">Alta</Badge>}
                    {operation.prioridade === "critica" && <Badge variant="destructive" className="text-[10px]">Crítica</Badge>}
                  </div>
                </div>
              </button>
            </CollapsibleTrigger>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/operacao/projetos/${operation.id}`)}>
                  <ListTodo className="mr-2 h-3 w-3" />Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(operation)}><Pencil className="mr-2 h-3 w-3" />Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(operation.id)}><Copy className="mr-2 h-3 w-3" />Duplicar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddSubOperation(operation.id)}><Layers className="mr-2 h-3 w-3" />Novo Subprojeto</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddTask(operation.id)}><ListTodo className="mr-2 h-3 w-3" />Nova Subtarefa</DropdownMenuItem>
                <DropdownMenuSeparator />
                {!isDone && operation.status !== "em_andamento" && (
                  <DropdownMenuItem onClick={() => onStatusChange(operation, "em_andamento")}>
                    <PlayCircle className="mr-2 h-3 w-3" />Iniciar
                  </DropdownMenuItem>
                )}
                {operation.status === "em_andamento" && (
                  <DropdownMenuItem onClick={() => onStatusChange(operation, "pausada")}><PauseCircle className="mr-2 h-3 w-3" />Pausar</DropdownMenuItem>
                )}
                {operation.status === "pausada" && (
                  <DropdownMenuItem onClick={() => onStatusChange(operation, "em_andamento")}><PlayCircle className="mr-2 h-3 w-3" />Retomar</DropdownMenuItem>
                )}
                {!isDone && (
                  <DropdownMenuItem onClick={requestComplete} className="text-success focus:text-success">
                    <CheckCircle2 className="mr-2 h-3 w-3" />Concluir projeto
                  </DropdownMenuItem>
                )}
                {isDone && (
                  <DropdownMenuItem onClick={() => onStatusChange(operation, "em_andamento")}>
                    <PlayCircle className="mr-2 h-3 w-3" />Reabrir projeto
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(operation)} className="text-destructive"><Trash2 className="mr-2 h-3 w-3" />Excluir</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Summary row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
            {(operation as any).responsavel_id ? (
              <ResponsavelBadge responsavelId={(operation as any).responsavel_id} size="xs" />
            ) : operation.responsavel ? (
              <span>👤 {operation.responsavel}</span>
            ) : (
              <span className="italic">Sem responsável</span>
            )}
            {periodoLabel && <span>📅 {periodoLabel}</span>}
            {totalCusto > 0 && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatCurrency(totalCusto)}</span>}
            {tasksTotal > 0 && <span>☑ {tasksConcluidas}/{tasksTotal} tarefas</span>}
          </div>

          {/* Progress bar */}
          {(tasksTotal > 0 || isDone) && (
            <div className="mt-2 space-y-1">
              <Progress value={isDone ? 100 : progressPercent} className="h-1.5" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{progressByTime ? "Progresso temporal" : "Progresso por tarefas"}</span>
                <span className="tabular-nums">{isDone ? 100 : progressPercent}%</span>
              </div>
            </div>
          )}
        </CardHeader>

        <AlertDialog open={confirmComplete} onOpenChange={setConfirmComplete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Concluir com tarefas pendentes?</AlertDialogTitle>
              <AlertDialogDescription>
                Este projeto ainda possui {tasksPendentes} {tasksPendentes === 1 ? "tarefa pendente" : "tarefas pendentes"}. Deseja concluir mesmo assim?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => { setConfirmComplete(false); onStatusChange(operation, "concluida"); }}>
                Concluir mesmo assim
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {/* Subprojetos */}
            {(operation.children || []).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3 w-3" />Subprojetos
                </h4>
                {(operation.children || []).map(sub => {
                  const subEff = getEffectiveStatus(sub as any);
                  const subUi = getEffectiveStatusUI(subEff);
                  const subDeadline = getDeadlineLabel(sub as any);
                  const SubIcon = STATUS_ICON[subEff];
                  const subTasks = tasks.filter(t => t.stage_id === sub.id);
                  const subDone = subTasks.filter(t => t.status === "concluida").length;
                  const subPct = subTasks.length > 0 ? Math.round((subDone / subTasks.length) * 100) : 0;
                  const subDoneState = subEff === "concluido" || subEff === "concluido_com_atraso";
                  return (
                    <div key={sub.id} className="bg-muted/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <SubIcon className={`h-3.5 w-3.5 ${subUi.iconClass}`} />
                          <span className="text-sm font-medium truncate">{sub.nome}</span>
                          <Badge variant="outline" className={`text-[10px] ${subUi.badgeClass}`}>{subUi.label}</Badge>
                          {!subDoneState && (
                            <Badge variant="outline" className={`text-[10px] gap-1 ${TONE_CLASS[subDeadline.tone]}`}>
                              <CalendarClock className="h-3 w-3" />{subDeadline.text}
                            </Badge>
                          )}
                          {(sub as any).responsavel_id && (
                            <ResponsavelBadge responsavelId={(sub as any).responsavel_id} size="xs" />
                          )}
                          {subTasks.length > 0 && (
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                              ☑ {subDone}/{subTasks.length} ({subPct}%)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2" onClick={() => onAddTask(sub.id)}>
                            <Plus className="h-3 w-3 mr-1" />Subtarefa
                          </Button>
                          {subDoneState ? (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" title="Reabrir subprojeto" onClick={() => onStatusChange(sub as any, "em_andamento")}>
                              <PlayCircle className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-success" title="Concluir subprojeto" onClick={() => onStatusChange(sub as any, "concluida")}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(sub)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {subTasks.length > 0 && (
                        <div className="pl-4 space-y-1">
                          {subTasks.map(task => (
                            <ChecklistRow
                              key={task.id}
                              task={task}
                              onEdit={() => onEditTask(task)}
                              onDelete={() => onDeleteTask(task)}
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

            {/* Subtarefas diretas no projeto */}
            {(() => {
              const directTasks = tasks.filter(t =>
                t.stage_id === operation.id
              );
              if (directTasks.length === 0) return null;
              return (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <ListTodo className="h-3 w-3" />Subtarefas
                  </h4>
                  {directTasks.map(task => (
                    <ChecklistRow
                      key={task.id}
                      task={task}
                      onEdit={() => onEditTask(task)}
                      onDelete={() => onDeleteTask(task)}
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
                <Layers className="h-3 w-3 mr-1" />Novo Subprojeto
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => onAddTask(operation.id)}>
                <Plus className="h-3 w-3 mr-1" />Nova Subtarefa
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function ChecklistRow({
  task, onEdit, onDelete, onStatusChange,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (task: Task, status: string) => void;
}) {
  const isDone = task.status === "concluida";
  const isOverdue = task.data_prazo && new Date(task.data_prazo) < new Date() && !isDone && task.status !== "cancelada";
  return (
    <div className={`flex items-center gap-2 p-1.5 rounded bg-background border text-xs ${isOverdue ? "border-destructive/50" : ""}`}>
      <button
        type="button"
        className="p-0.5 rounded hover:bg-muted shrink-0"
        onClick={() => onStatusChange(task, isDone ? "pendente" : "concluida")}
        aria-label={isDone ? "Reabrir subtarefa" : "Concluir subtarefa"}
        title={isDone ? "Reabrir" : "Concluir"}
      >
        {isDone
          ? <CheckCircle2 className="h-4 w-4 text-success" />
          : <Circle className="h-4 w-4 text-muted-foreground" />}
      </button>
      <button
        type="button"
        className={`flex-1 min-w-0 text-left truncate ${isDone ? "line-through text-muted-foreground" : ""}`}
        onClick={onEdit}
      >
        {task.titulo}
      </button>
      {(task as any).responsavel_id ? (
        <ResponsavelBadge responsavelId={(task as any).responsavel_id} size="xs" showName={false} />
      ) : task.responsavel ? (
        <span
          className="inline-block h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: getResponsavelColor(task.responsavel) }}
          title={task.responsavel}
        />
      ) : null}
      {task.data_prazo && (
        <span className={`text-[10px] tabular-nums shrink-0 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
          {format(new Date(task.data_prazo), "dd/MM", { locale: ptBR })}
        </span>
      )}
      {isOverdue && <Badge variant="destructive" className="text-[9px] px-1 shrink-0">Atrasada</Badge>}
      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={onEdit} title="Editar">
        <Pencil className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive" onClick={onDelete} title="Excluir">
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
