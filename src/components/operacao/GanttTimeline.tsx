import { useEffect, useMemo, useState } from "react";
import { Operation } from "@/hooks/useOperations";
import { Task } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown } from "lucide-react";
import { addDays, differenceInDays, format, startOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

type ZoomLevel = "day" | "week" | "month" | "quarter";

const statusColors: Record<string, { bg: string; text: string }> = {
  nao_iniciada: { bg: "bg-muted", text: "text-muted-foreground" },
  em_andamento: { bg: "bg-primary", text: "text-primary-foreground" },
  concluida: { bg: "bg-success", text: "text-success-foreground" },
  atrasada: { bg: "bg-destructive", text: "text-destructive-foreground" },
  pausada: { bg: "bg-warning", text: "text-warning-foreground" },
  pendente: { bg: "bg-muted", text: "text-muted-foreground" },
  cancelada: { bg: "bg-secondary", text: "text-secondary-foreground" },
};

interface GanttItem {
  id: string;
  name: string;
  level: number; // 0=operation, 1=sub-operation, 2=task
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  parentId?: string;
  type: "operation" | "sub-operation" | "task";
  hasChildren: boolean;
}

interface GanttTimelineProps {
  operations: Operation[];
  tasks: Task[];
  onItemClick?: (id: string, type: "operation" | "sub-operation" | "task") => void;
}

export function GanttTimeline({ operations, tasks, onItemClick }: GanttTimelineProps) {
  const [zoom, setZoom] = useState<ZoomLevel>("week");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(operations.map(o => o.id)));

  useEffect(() => {
    setExpandedIds(new Set(operations.flatMap(op => [op.id, ...(op.children || []).map(child => child.id)])));
  }, [operations]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Build flat list of visible items
  const items = useMemo(() => {
    const result: GanttItem[] = [];
    for (const op of operations) {
      const hasChildren = (op.children?.length || 0) > 0 || tasks.some(t => t.stage_id === op.id);
      result.push({
        id: op.id,
        name: op.nome,
        level: 0,
        status: op.status,
        startDate: op.data_inicio_real ? new Date(op.data_inicio_real) : op.data_inicio_prevista ? new Date(op.data_inicio_prevista) : null,
        endDate: op.data_fim_real ? new Date(op.data_fim_real) : op.data_fim_prevista ? new Date(op.data_fim_prevista) : null,
        progress: op.progresso_percentual || 0,
        type: "operation",
        hasChildren,
      });

      if (expandedIds.has(op.id)) {
        // Sub-operations
        for (const sub of (op.children || [])) {
          const subHasChildren = tasks.some(t => t.stage_id === sub.id);
          result.push({
            id: sub.id,
            name: sub.nome,
            level: 1,
            status: sub.status,
            startDate: sub.data_inicio_real ? new Date(sub.data_inicio_real) : sub.data_inicio_prevista ? new Date(sub.data_inicio_prevista) : null,
            endDate: sub.data_fim_real ? new Date(sub.data_fim_real) : sub.data_fim_prevista ? new Date(sub.data_fim_prevista) : null,
            progress: sub.progresso_percentual || 0,
            parentId: op.id,
            type: "sub-operation",
            hasChildren: subHasChildren,
          });

          if (expandedIds.has(sub.id)) {
            const subTasks = tasks.filter(t => t.stage_id === sub.id);
            for (const task of subTasks) {
              result.push({
                id: task.id,
                name: task.titulo,
                level: 2,
                status: task.status,
                startDate: task.data_inicio_real ? new Date(task.data_inicio_real) : task.data_inicio_prevista ? new Date(task.data_inicio_prevista) : null,
                endDate: task.data_conclusao ? new Date(task.data_conclusao) : task.data_prazo ? new Date(task.data_prazo) : null,
                progress: task.status === "concluida" ? 100 : task.status === "em_andamento" ? 50 : 0,
                parentId: sub.id,
                type: "task",
                hasChildren: false,
              });
            }
          }
        }

        const directTasks = tasks.filter(t => t.stage_id === op.id);
        for (const task of directTasks) {
          result.push({
            id: task.id,
            name: task.titulo,
            level: 1,
            status: task.status,
            startDate: task.data_inicio_real ? new Date(task.data_inicio_real) : task.data_inicio_prevista ? new Date(task.data_inicio_prevista) : null,
            endDate: task.data_conclusao ? new Date(task.data_conclusao) : task.data_prazo ? new Date(task.data_prazo) : null,
            progress: task.status === "concluida" ? 100 : task.status === "em_andamento" ? 50 : 0,
            parentId: op.id,
            type: "task",
            hasChildren: false,
          });
        }
      }
    }
    return result;
  }, [operations, tasks, expandedIds]);

  // Compute date range
  const { timelineStart, timelineEnd, columns, colWidth } = useMemo(() => {
    const allDates: Date[] = [];
    items.forEach(item => {
      if (item.startDate) allDates.push(item.startDate);
      if (item.endDate) allDates.push(item.endDate);
    });

    if (allDates.length === 0) {
      const now = new Date();
      allDates.push(addDays(now, -30), addDays(now, 60));
    }

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    const start = addDays(startOfDay(minDate), -7);
    const end = addDays(startOfDay(maxDate), 14);

    let cols: { label: string; date: Date }[] = [];
    let cw = 40;

    switch (zoom) {
      case "day":
        cols = eachDayOfInterval({ start, end }).map(d => ({ label: format(d, "dd", { locale: ptBR }), date: d }));
        cw = 36;
        break;
      case "week":
        cols = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map(d => ({ label: format(d, "dd/MM", { locale: ptBR }), date: d }));
        cw = 80;
        break;
      case "month":
        cols = eachMonthOfInterval({ start, end }).map(d => ({ label: format(d, "MMM yy", { locale: ptBR }), date: d }));
        cw = 120;
        break;
      case "quarter":
        cols = eachMonthOfInterval({ start, end }).filter((_, i) => i % 3 === 0).map(d => ({ label: `T${Math.ceil((d.getMonth() + 1) / 3)}/${format(d, "yy")}`, date: d }));
        cw = 160;
        break;
    }

    return { timelineStart: start, timelineEnd: end, columns: cols, colWidth: cw };
  }, [items, zoom]);

  const totalWidth = columns.length * colWidth;
  const totalDays = Math.max(1, differenceInDays(timelineEnd, timelineStart));

  const getBarPosition = (start: Date | null, end: Date | null) => {
    if (!start) return null;
    const actualEnd = end || addDays(start, 1);
    const leftDays = differenceInDays(start, timelineStart);
    const widthDays = Math.max(1, differenceInDays(actualEnd, start));
    const left = (leftDays / totalDays) * totalWidth;
    const width = (widthDays / totalDays) * totalWidth;
    return { left: Math.max(0, left), width: Math.max(8, width) };
  };

  const ROW_HEIGHT = 36;
  const LABEL_WIDTH = 220;

  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Nenhuma operação cadastrada. Crie uma operação para visualizar a timeline.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Zoom controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Zoom:</span>
        {(["day", "week", "month", "quarter"] as ZoomLevel[]).map(z => (
          <Button key={z} variant={zoom === z ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setZoom(z)}>
            {z === "day" ? "Dia" : z === "week" ? "Semana" : z === "month" ? "Mês" : "Trimestre"}
          </Button>
        ))}
      </div>

      {/* Gantt chart */}
      <div className="border rounded-lg overflow-hidden bg-background">
        <div className="flex">
          {/* Labels column */}
          <div className="shrink-0 border-r bg-muted/30" style={{ width: LABEL_WIDTH }}>
            {/* Header */}
            <div className="h-8 border-b flex items-center px-3">
              <span className="text-xs font-semibold text-muted-foreground">Operação</span>
            </div>
            {/* Rows */}
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-1 border-b hover:bg-muted/50 cursor-pointer transition-colors"
                style={{ height: ROW_HEIGHT, paddingLeft: 8 + item.level * 16 }}
                onClick={() => onItemClick?.(item.id, item.type)}
              >
                {item.hasChildren ? (
                  <button className="p-0.5" onClick={e => { e.stopPropagation(); toggleExpand(item.id); }}>
                    {expandedIds.has(item.id)
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                ) : (
                  <span className="w-4" />
                )}
                <span className={`text-xs truncate ${item.level === 0 ? "font-semibold" : item.level === 1 ? "font-medium" : "text-muted-foreground"}`}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>

          {/* Timeline area */}
          <div className="overflow-x-auto flex-1">
            <div style={{ width: totalWidth, minWidth: "100%" }}>
              {/* Column headers */}
              <div className="h-8 border-b flex">
                {columns.map((col, i) => (
                  <div key={i} className="border-r flex items-center justify-center text-xs text-muted-foreground shrink-0" style={{ width: colWidth }}>
                    {col.label}
                  </div>
                ))}
              </div>

              {/* Bars */}
              {items.map(item => {
                const pos = getBarPosition(item.startDate, item.endDate);
                const isOverdue = item.endDate && item.endDate < new Date() && item.status !== "concluida" && item.status !== "cancelada";
                const barColor = isOverdue ? statusColors.atrasada : statusColors[item.status] || statusColors.nao_iniciada;

                return (
                  <div key={item.id} className="relative border-b" style={{ height: ROW_HEIGHT }}>
                    {/* Grid lines */}
                    {columns.map((_, i) => (
                      <div key={i} className="absolute top-0 bottom-0 border-r border-dashed border-muted/40" style={{ left: i * colWidth, width: colWidth }} />
                    ))}

                    {/* Today line */}
                    {(() => {
                      const todayPos = (differenceInDays(new Date(), timelineStart) / totalDays) * totalWidth;
                      if (todayPos > 0 && todayPos < totalWidth) {
                        return <div className="absolute top-0 bottom-0 w-0.5 bg-primary/60 z-10" style={{ left: todayPos }} />;
                      }
                      return null;
                    })()}

                    {/* Bar */}
                    {pos && (
                      <div
                        className={`absolute top-1.5 rounded-sm cursor-pointer transition-opacity hover:opacity-80 ${barColor.bg} ${isOverdue ? "ring-1 ring-destructive" : ""}`}
                        style={{ left: pos.left, width: pos.width, height: ROW_HEIGHT - 12 }}
                        onClick={() => onItemClick?.(item.id, item.type)}
                      >
                        {/* Progress fill */}
                        {item.progress > 0 && item.progress < 100 && (
                          <div className="absolute inset-0 rounded-sm bg-background/20" style={{ width: `${item.progress}%` }} />
                        )}
                        {pos.width > 40 && (
                          <span className={`absolute inset-0 flex items-center px-1.5 text-[10px] truncate font-medium drop-shadow-sm ${barColor.text}`}>
                            {item.name}
                          </span>
                        )}
                      </div>
                    )}

                    {/* No dates indicator */}
                    {!pos && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground/50">sem datas</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
