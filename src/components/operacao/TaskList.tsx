import { Task } from "@/hooks/useTasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, CheckCircle2, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  em_andamento: { label: "Em Andamento", variant: "secondary" },
  concluida: { label: "Concluída", variant: "default" },
  atrasada: { label: "Atrasada", variant: "destructive" },
  cancelada: { label: "Cancelada", variant: "outline" },
  pausada: { label: "Pausada", variant: "outline" },
};

const typeLabels: Record<string, string> = {
  operacional: "Operacional",
  compra: "Compra",
  contratacao: "Contratação",
  documentacao: "Documentação",
  financeiro: "Financeiro",
  manutencao: "Manutenção",
  logistica: "Logística",
  outro: "Outro",
};

const priorityColors: Record<string, string> = {
  baixa: "text-muted-foreground",
  media: "text-foreground",
  alta: "text-warning",
  critica: "text-destructive",
};

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: string) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function TaskList({ tasks, onEdit, onDelete, onStatusChange }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Nenhuma tarefa cadastrada.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map(task => {
        const sc = statusConfig[task.status] || statusConfig.pendente;
        const isOverdue = task.data_prazo && new Date(task.data_prazo) < new Date() && task.status !== "concluida" && task.status !== "cancelada";

        return (
          <Card key={task.id} className={`transition-all ${isOverdue ? "border-destructive/50" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium text-sm ${task.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>
                      {task.titulo}
                    </span>
                    <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                    {isOverdue && <Badge variant="destructive" className="text-xs">Atrasada</Badge>}
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="bg-muted px-1.5 py-0.5 rounded">{typeLabels[task.tipo] || task.tipo}</span>
                    {task.prioridade && (
                      <span className={priorityColors[task.prioridade] || ""}>
                        ● {task.prioridade.charAt(0).toUpperCase() + task.prioridade.slice(1)}
                      </span>
                    )}
                    {task.data_prazo && (
                      <span>Prazo: {format(new Date(task.data_prazo), "dd/MM/yy", { locale: ptBR })}</span>
                    )}
                    {task.responsavel && <span>👤 {task.responsavel}</span>}
                    {task.operational_stages?.nome && <span>📋 {task.operational_stages.nome}</span>}
                    {(task.custo_estimado || task.custo_real) && (
                      <span>
                        💰 {task.custo_real ? formatCurrency(task.custo_real) : `Est: ${formatCurrency(task.custo_estimado!)}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {task.status === "pendente" && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onStatusChange(task, "em_andamento")}>
                      <PlayCircle className="h-4 w-4 text-primary" />
                    </Button>
                  )}
                  {task.status === "em_andamento" && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onStatusChange(task, "concluida")}>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(task)}><Pencil className="mr-2 h-3 w-3" />Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(task)} className="text-destructive"><Trash2 className="mr-2 h-3 w-3" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
