import { useEffect, useMemo, useState } from "react";
import { Operation } from "@/hooks/useOperations";
import { Task } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, AlertTriangle, Lock, CheckCircle2, Filter, X, ChevronLeft, CalendarDays } from "lucide-react";
import { addDays, addMonths, differenceInDays, format, startOfDay, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getResponsavelColor, getCategoryEmoji, getCategoryLabel, deriveStageStatus,
  computeStageMetrics, OPERATION_CATEGORIES, STAGE_STATUS_OPTIONS_FORM,
} from "@/lib/operacaoConfig";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ZoomLevel = "week" | "month" | "geral";

interface GanttItem {
  id: string;
  name: string;
  level: number;
  derivedStatus: string;
  rawStatus: string;
  responsavel: string | null;
  categoria: string | null;
  dependsOnId: string | null;
  startPrev: Date | null;
  endPrev: Date | null;
  startReal: Date | null;
  endReal: Date | null;
  parentId?: string;
  type: "operation" | "sub-operation" | "task";
  hasChildren: boolean;
  metrics: ReturnType<typeof computeStageMetrics>;
}

interface GanttTimelineProps {
  operations: Operation[];
  tasks: Task[];
  onItemClick?: (id: string, type: "operation" | "sub-operation" | "task") => void;
}

export function GanttTimeline({ operations, tasks, onItemClick }: GanttTimelineProps) {
  const [zoom, setZoom] = useState<ZoomLevel>("month");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filterResponsavel, setFilterResponsavel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [onlyDeps, setOnlyDeps] = useState(false);
  // Data âncora da janela visível (centro/início aproximado)
  const [anchorDate, setAnchorDate] = useState<Date>(() => startOfDay(new Date()));

  useEffect(() => {
    setExpandedIds(new Set(operations.map(o => o.id)));
  }, [operations.length]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Mapa de status concluído por etapa (para travas de dependência)
  const concludedMap = useMemo(() => {
    const m = new Map<string, boolean>();
    operations.forEach(op => {
      const all = [op, ...(op.children || [])];
      all.forEach(s => m.set(s.id, !!s.data_fim_real || s.status === "concluida"));
    });
    return m;
  }, [operations]);

  // Lista de responsáveis únicos
  const responsaveis = useMemo(() => {
    const set = new Set<string>();
    operations.forEach(op => {
      if (op.responsavel) set.add(op.responsavel);
      (op.children || []).forEach(s => s.responsavel && set.add(s.responsavel));
    });
    return Array.from(set);
  }, [operations]);

  const buildItem = (s: Operation, level: number, parentId?: string, type: GanttItem["type"] = "sub-operation"): GanttItem => {
    const dependencyConcluded = s.depends_on_id ? (concludedMap.get(s.depends_on_id) || false) : true;
    const derived = deriveStageStatus({
      status: s.status,
      data_inicio_real: s.data_inicio_real,
      data_fim_real: s.data_fim_real,
      data_fim_prevista: s.data_fim_prevista,
      depends_on_id: s.depends_on_id,
      dependencyConcluded,
    });
    return {
      id: s.id,
      name: s.nome,
      level,
      derivedStatus: derived,
      rawStatus: s.status,
      responsavel: s.responsavel,
      categoria: s.categoria,
      dependsOnId: s.depends_on_id,
      startPrev: s.data_inicio_prevista ? new Date(s.data_inicio_prevista) : null,
      endPrev: s.data_fim_prevista ? new Date(s.data_fim_prevista) : null,
      startReal: s.data_inicio_real ? new Date(s.data_inicio_real) : null,
      endReal: s.data_fim_real ? new Date(s.data_fim_real) : null,
      parentId,
      type,
      hasChildren: (s as any).children?.length > 0 || tasks.some(t => t.stage_id === s.id),
      metrics: computeStageMetrics({
        data_inicio_prevista: s.data_inicio_prevista,
        data_inicio_real: s.data_inicio_real,
        data_fim_prevista: s.data_fim_prevista,
        data_fim_real: s.data_fim_real,
        duracao_prevista_dias: s.duracao_prevista_dias,
      }),
    };
  };

  // Lista plana visível com filtros
  const items = useMemo(() => {
    const result: GanttItem[] = [];

    const passesFilter = (it: GanttItem) => {
      if (filterResponsavel !== "all" && it.responsavel !== filterResponsavel) return false;
      if (filterStatus !== "all" && it.derivedStatus !== filterStatus) return false;
      if (filterCategoria !== "all" && it.categoria !== filterCategoria) return false;
      if (onlyOverdue && it.derivedStatus !== "atrasada") return false;
      if (onlyDeps && !it.dependsOnId) return false;
      return true;
    };

    for (const op of operations) {
      const opItem = buildItem(op, 0, undefined, "operation");

      // Construir sub-items
      const childItems: GanttItem[] = [];
      for (const sub of (op.children || [])) {
        childItems.push(buildItem(sub, 1, op.id, "sub-operation"));
      }

      // Categoria do projeto herdada para etapas sem categoria
      childItems.forEach(c => { if (!c.categoria) c.categoria = opItem.categoria; });

      // Filtragem: mostrar projeto se ele OU algum filho passa
      const filteredChildren = childItems.filter(passesFilter);
      const opPasses = passesFilter(opItem);
      if (!opPasses && filteredChildren.length === 0) continue;

      result.push(opItem);
      if (expandedIds.has(op.id)) {
        result.push(...filteredChildren);
      }
    }

    return result;
  }, [operations, tasks, expandedIds, filterResponsavel, filterStatus, filterCategoria, onlyOverdue, onlyDeps, concludedMap]);

  // Janela de tempo navegável: 1 mês para trás + horizonte conforme zoom
  const { timelineStart, timelineEnd, columns, colWidth } = useMemo(() => {
    // Janela: 1 mês antes do anchor até 11 meses depois (12 meses totais = visão anual)
    const start = startOfDay(addMonths(startOfMonth(anchorDate), -1));
    const end = startOfDay(addMonths(start, 13));

    let cols: { label: string; date: Date }[] = [];
    let cw = 80;

    switch (zoom) {
      case "week":
        cols = eachDayOfInterval({ start, end }).map(d => ({ label: format(d, "dd/MM", { locale: ptBR }), date: d }));
        cw = 36;
        break;
      case "month":
        cols = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map(d => ({ label: format(d, "dd/MM", { locale: ptBR }), date: d }));
        cw = 70;
        break;
      case "geral":
        cols = eachMonthOfInterval({ start, end }).map(d => ({ label: format(d, "MMM/yy", { locale: ptBR }), date: d }));
        cw = 90;
        break;
    }

    return { timelineStart: start, timelineEnd: end, columns: cols, colWidth: cw };
  }, [anchorDate, zoom]);

  const totalWidth = columns.length * colWidth;
  const totalDays = Math.max(1, differenceInDays(timelineEnd, timelineStart));

  const dayToPx = (d: Date) => (differenceInDays(d, timelineStart) / totalDays) * totalWidth;

  const getBarPosition = (start: Date | null, end: Date | null) => {
    if (!start) return null;
    const actualEnd = end || addDays(start, 1);
    const left = dayToPx(start);
    const width = dayToPx(actualEnd) - left;
    return { left: Math.max(0, left), width: Math.max(8, width) };
  };

  const ROW_HEIGHT = 40;
  const LABEL_WIDTH = 240;

  if (operations.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Nenhum projeto cadastrado. Crie um projeto para visualizar a timeline.
      </div>
    );
  }

  const clearFilters = () => {
    setFilterResponsavel("all");
    setFilterStatus("all");
    setFilterCategoria("all");
    setOnlyOverdue(false);
    setOnlyDeps(false);
  };

  const hasActiveFilters = filterResponsavel !== "all" || filterStatus !== "all" || filterCategoria !== "all" || onlyOverdue || onlyDeps;

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="h-3 w-3" />Filtros:</span>

          <Select value={filterResponsavel} onValueChange={setFilterResponsavel}>
            <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="Responsável" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos responsáveis</SelectItem>
              {responsaveis.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {STAGE_STATUS_OPTIONS_FORM.concat([
                { value: "atrasada", label: "Atrasada" },
                { value: "travada", label: "Travada" },
              ]).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {OPERATION_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button variant={onlyOverdue ? "destructive" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setOnlyOverdue(v => !v)}>
            <AlertTriangle className="h-3 w-3 mr-1" />Atrasadas
          </Button>
          <Button variant={onlyDeps ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setOnlyDeps(v => !v)}>
            <Lock className="h-3 w-3 mr-1" />Com dependência
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />Limpar
            </Button>
          )}

          <div className="ml-auto flex items-center gap-1 flex-wrap">
            {/* Navegação temporal */}
            <div className="flex items-center gap-1 mr-2 bg-muted/40 rounded-md p-0.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setAnchorDate(d => addMonths(d, -1))}
                title="Mês anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setAnchorDate(startOfDay(new Date()))}
                title="Ir para hoje"
              >
                <CalendarDays className="h-3 w-3" />
                Hoje
              </Button>
              <span className="text-[10px] text-muted-foreground px-1 min-w-[68px] text-center">
                {format(anchorDate, "MMM/yy", { locale: ptBR })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setAnchorDate(d => addMonths(d, 1))}
                title="Próximo mês"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            <span className="text-xs text-muted-foreground mr-1">Zoom:</span>
            {(["week", "month", "geral"] as ZoomLevel[]).map(z => (
              <Button key={z} variant={zoom === z ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setZoom(z)}>
                {z === "week" ? "Semana" : z === "month" ? "Mês" : "Geral"}
              </Button>
            ))}
          </div>
        </div>

        {/* Gantt */}
        <div className="border rounded-lg overflow-hidden bg-background">
          <div className="flex">
            {/* Labels */}
            <div className="shrink-0 border-r bg-muted/30 sticky left-0 z-20" style={{ width: LABEL_WIDTH }}>
              <div className="h-9 border-b flex items-center px-3 bg-muted/50">
                <span className="text-xs font-semibold text-muted-foreground">Projeto / Etapa</span>
              </div>
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-1 border-b hover:bg-muted/50 cursor-pointer transition-colors"
                  style={{ height: ROW_HEIGHT, paddingLeft: 6 + item.level * 14 }}
                  onClick={() => onItemClick?.(item.id, item.type)}
                >
                  {item.hasChildren && item.level === 0 ? (
                    <button className="p-0.5" onClick={e => { e.stopPropagation(); toggleExpand(item.id); }}>
                      {expandedIds.has(item.id)
                        ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  ) : (
                    <span className="w-4" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs truncate ${item.level === 0 ? "font-semibold" : ""}`}>
                      {item.level === 0 && <span className="mr-1">{getCategoryEmoji(item.categoria)}</span>}
                      {item.name}
                    </div>
                    {item.responsavel && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: getResponsavelColor(item.responsavel) }} />
                        {item.responsavel}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="overflow-x-auto flex-1">
              <div style={{ width: totalWidth, minWidth: "100%" }} className="relative">
                {/* Headers */}
                <div className="h-9 border-b flex bg-muted/20 sticky top-0 z-10">
                  {columns.map((col, i) => (
                    <div key={i} className="border-r flex items-center justify-center text-[10px] text-muted-foreground shrink-0" style={{ width: colWidth }}>
                      {col.label}
                    </div>
                  ))}
                </div>

                {/* Linhas */}
                {items.map((item, rowIdx) => {
                  const status = item.derivedStatus;
                  const respColor = getResponsavelColor(item.responsavel);
                  const start = item.startReal || item.startPrev;
                  const endPrev = item.endPrev;
                  const endReal = item.endReal;
                  const today = new Date();

                  // posição barra principal (do início até max(fimPrev, hoje se atrasada, fimReal))
                  const visualEnd = endReal ||
                    (status === "atrasada" && endPrev ? today : endPrev);
                  const pos = getBarPosition(start, visualEnd);

                  // posição da extensão de atraso (do fimPrev até hoje)
                  const overdueExt = status === "atrasada" && endPrev ? {
                    left: dayToPx(endPrev),
                    width: Math.max(4, dayToPx(today) - dayToPx(endPrev)),
                  } : null;

                  // % consumido visual
                  const progressPct = status === "concluida" ? 100 : item.metrics.percentConsumido;

                  // Estilo conforme status — paleta verde Sítio Ramos
                  // Planejado: outline verde claro · Em execução: preenchimento progressivo (cor responsável) · Concluído: verde sólido
                  // Atrasado: barra normal + extensão verde-escura hachurada · Travada: cinza tracejado
                  let barStyle: React.CSSProperties = {};
                  let barClasses = "absolute top-1.5 rounded cursor-pointer transition-all hover:brightness-110 flex items-center px-1.5 text-[10px] font-medium overflow-hidden";

                  if (status === "concluida") {
                    barStyle = { backgroundColor: "hsl(142 60% 38%)", color: "white" };
                  } else if (status === "em_andamento" || status === "atrasada") {
                    // base: verde claro outline + barra de progresso interna preenchida com cor do responsável
                    barStyle = { backgroundColor: "hsl(142 50% 92%)", border: "1.5px solid hsl(142 55% 55%)", color: "hsl(142 60% 25%)" };
                  } else if (status === "travada") {
                    barStyle = { backgroundColor: "hsl(var(--muted))", border: "2px dashed hsl(var(--muted-foreground))", color: "hsl(var(--muted-foreground))" };
                  } else if (status === "cancelada") {
                    barStyle = { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", textDecoration: "line-through", opacity: 0.6 };
                  } else {
                    // planejada / futura
                    barStyle = { backgroundColor: "hsl(142 40% 95%)", border: `1.5px dashed hsl(142 40% 65%)`, color: "hsl(142 50% 35%)" };
                  }

                  return (
                    <div key={item.id} className="relative border-b" style={{ height: ROW_HEIGHT }}>
                      {/* Grid */}
                      {columns.map((_, i) => (
                        <div key={i} className="absolute top-0 bottom-0 border-r border-dashed border-muted/30" style={{ left: i * colWidth, width: colWidth }} />
                      ))}

                      {/* Linha de hoje */}
                      {(() => {
                        const todayPx = dayToPx(today);
                        if (todayPx > 0 && todayPx < totalWidth) {
                          return <div className="absolute top-0 bottom-0 w-0.5 bg-primary/70 z-10" style={{ left: todayPx }} />;
                        }
                        return null;
                      })()}

                      {/* Extensão de atraso (hachura vermelha) */}
                      {overdueExt && (
                        <div
                          className="absolute top-1.5 rounded-r"
                          style={{
                            left: overdueExt.left,
                            width: overdueExt.width,
                            height: ROW_HEIGHT - 12,
                            background: "repeating-linear-gradient(45deg, hsl(var(--destructive) / 0.7), hsl(var(--destructive) / 0.7) 4px, hsl(var(--destructive) / 0.4) 4px, hsl(var(--destructive) / 0.4) 8px)",
                          }}
                        />
                      )}

                      {/* Barra principal */}
                      {pos && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={barClasses}
                              style={{ ...barStyle, left: pos.left, width: pos.width, height: ROW_HEIGHT - 12 }}
                              onClick={() => onItemClick?.(item.id, item.type)}
                            >
                              {/* Progresso interno */}
                              {status === "em_andamento" && progressPct > 0 && progressPct < 100 && (
                                <div className="absolute inset-y-0 left-0 bg-white/25 rounded-l" style={{ width: `${progressPct}%` }} />
                              )}
                              <div className="relative z-10 flex items-center gap-1 truncate">
                                {status === "travada" && <Lock className="h-3 w-3 shrink-0" />}
                                {status === "atrasada" && <AlertTriangle className="h-3 w-3 shrink-0" />}
                                {status === "concluida" && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                                {pos.width > 50 && <span className="truncate">{item.name}</span>}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs space-y-1">
                            <div className="font-semibold">{item.name}</div>
                            {item.categoria && <div>📂 {getCategoryLabel(item.categoria)}</div>}
                            {item.responsavel && <div>👤 {item.responsavel}</div>}
                            <div>Status: <strong>{status}</strong></div>
                            {item.startPrev && <div>Início prev: {format(item.startPrev, "dd/MM/yy")}</div>}
                            {item.endPrev && <div>Fim prev: {format(item.endPrev, "dd/MM/yy")}</div>}
                            {item.metrics.duracaoPrevista !== null && <div>Duração prev: {item.metrics.duracaoPrevista}d</div>}
                            {item.metrics.diasRestantes !== null && status !== "concluida" && (
                              <div>{item.metrics.diasRestantes >= 0 ? `${item.metrics.diasRestantes} dias restantes` : `${Math.abs(item.metrics.diasRestantes)} dias atrasada`}</div>
                            )}
                            {item.metrics.duracaoReal !== null && <div>Duração real: {item.metrics.duracaoReal}d</div>}
                            {item.metrics.diferencaPlanExec !== null && (
                              <div>Diferença: {item.metrics.diferencaPlanExec >= 0 ? "+" : ""}{item.metrics.diferencaPlanExec}d</div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {!pos && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground/50">sem datas</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Conectores SVG entre etapas dependentes */}
                <svg className="absolute top-9 left-0 pointer-events-none" width={totalWidth} height={items.length * ROW_HEIGHT}>
                  {items.map((item, idx) => {
                    if (!item.dependsOnId) return null;
                    const depIdx = items.findIndex(i => i.id === item.dependsOnId);
                    if (depIdx === -1) return null;
                    const dep = items[depIdx];
                    const depEnd = dep.endReal || dep.endPrev;
                    const myStart = item.startReal || item.startPrev;
                    if (!depEnd || !myStart) return null;
                    const x1 = dayToPx(depEnd);
                    const y1 = depIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                    const x2 = dayToPx(myStart);
                    const y2 = idx * ROW_HEIGHT + ROW_HEIGHT / 2;
                    return (
                      <g key={`conn-${item.id}`}>
                        <path
                          d={`M ${x1} ${y1} L ${x1 + 6} ${y1} L ${x1 + 6} ${y2} L ${x2 - 4} ${y2}`}
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth="1"
                          fill="none"
                          strokeDasharray="3,2"
                          opacity="0.6"
                        />
                        <polygon
                          points={`${x2 - 4},${y2 - 3} ${x2},${y2} ${x2 - 4},${y2 + 3}`}
                          fill="hsl(var(--muted-foreground))"
                          opacity="0.6"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-2.5 rounded bg-primary" />Em andamento
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-2.5 rounded border-2 border-dashed border-primary" />Planejada
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-2.5 rounded bg-muted border border-border" />Concluída
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-destructive" />Atrasada
          </span>
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3" />Travada por dependência
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <span className="inline-block w-0.5 h-3 bg-primary" />Hoje
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
