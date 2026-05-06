import { useEffect, useMemo, useRef, useState } from "react";
import { Operation } from "@/hooks/useOperations";
import { Task } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, AlertTriangle, Lock, CheckCircle2, Filter, X, ChevronLeft, CalendarDays } from "lucide-react";
import { addDays, addMonths, addWeeks, addYears, differenceInDays, format, startOfDay, startOfMonth, startOfWeek, startOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachYearOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getResponsavelColor, getCategoryEmoji, getCategoryLabel, deriveStageStatus,
  computeStageMetrics, OPERATION_CATEGORIES, STAGE_STATUS_OPTIONS_FORM,
} from "@/lib/operacaoConfig";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
type ZoomLevel = "day" | "week" | "month" | "year";

// Janela de colunas + largura mínima por coluna (timeline escapa do container e ganha scroll horizontal)
const ZOOM_CONFIG: Record<ZoomLevel, { columns: number; minColWidth: number; label: string; shortLabel: string }> = {
  day:   { columns: 60,  minColWidth: 56, label: "Dia",    shortLabel: "D" },
  week:  { columns: 36,  minColWidth: 70, label: "Semana", shortLabel: "S" },
  month: { columns: 24,  minColWidth: 90, label: "Mês",    shortLabel: "M" },
  year:  { columns: 10,  minColWidth: 140, label: "Ano",    shortLabel: "A" },
};

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
  areaId: string | null;
  cycleId: string | null;
  rootProjectId: string;
  permiteSimultaneidade: boolean;
  swimlane: number;
}

interface GanttTimelineProps {
  operations: Operation[];
  tasks: Task[];
  areas?: Array<{ id: string; nome: string }>;
  cycles?: Array<{ id: string; cultura?: string | null; area_id?: string | null }>;
  onItemClick?: (id: string, type: "operation" | "sub-operation" | "task") => void;
}

export function GanttTimeline({ operations, tasks, areas = [], cycles = [], onItemClick }: GanttTimelineProps) {
  const [zoom, setZoom] = useState<ZoomLevel>("month");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filterResponsavel, setFilterResponsavel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [onlyDeps, setOnlyDeps] = useState(false);
  // Data âncora = início da janela visível
  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    const now = startOfDay(new Date());
    return startOfMonth(addMonths(now, -6));
  });
  // Largura disponível para a faixa do timeline (medida)
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState<number>(800);

  useEffect(() => {
    if (!timelineRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setAvailableWidth(e.contentRect.width);
    });
    ro.observe(timelineRef.current);
    return () => ro.disconnect();
  }, []);

  // Projetos colapsados por padrão (não auto-expande)
  // Estado de expansão preservado entre renders

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

  const buildItem = (s: Operation, level: number, rootProjectId: string, parentId?: string, type: GanttItem["type"] = "sub-operation"): GanttItem => {
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
      areaId: s.area_id ?? null,
      cycleId: s.cycle_id ?? null,
      rootProjectId,
      permiteSimultaneidade: !!(s as any).permite_simultaneidade,
      swimlane: 0,
    };
  };

  // Lista plana visível com filtros + swimlanes para simultaneidade
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
      const opItem = buildItem(op, 0, op.id, undefined, "operation");

      const childItems: GanttItem[] = [];
      for (const sub of (op.children || [])) {
        childItems.push(buildItem(sub, 1, op.id, op.id, "sub-operation"));
      }
      childItems.forEach(c => { if (!c.categoria) c.categoria = opItem.categoria; });

      const filteredChildren = childItems.filter(passesFilter);
      const opPasses = passesFilter(opItem);
      if (!opPasses && filteredChildren.length === 0) continue;

      // Swimlanes apenas se expandido
      const byArea = new Map<string, GanttItem[]>();
      filteredChildren.forEach(c => {
        const key = c.areaId || "__noarea__";
        if (!byArea.has(key)) byArea.set(key, []);
        byArea.get(key)!.push(c);
      });
      byArea.forEach(groupChildren => {
        const lanes: Array<Date | null> = [];
        // ⚠️ Cópia para não mutar a ordem original (preserva ordem do banco mesmo após conclusão)
        const ordered = [...groupChildren].sort((a, b) => {
          const sa = (a.startReal || a.startPrev)?.getTime() ?? 0;
          const sb = (b.startReal || b.startPrev)?.getTime() ?? 0;
          return sa - sb;
        });
        for (const child of ordered) {
          const start = child.startReal || child.startPrev;
          const end = child.endReal || child.endPrev;
          if (!start || !end) { child.swimlane = 0; continue; }
          let assigned = -1;
          for (let i = 0; i < lanes.length; i++) {
            const laneEnd = lanes[i];
            if (!laneEnd || laneEnd <= start) { assigned = i; break; }
          }
          if (assigned === -1) {
            lanes.push(end);
            assigned = lanes.length - 1;
          } else {
            lanes[assigned] = end;
          }
          child.swimlane = assigned;
        }
      });

      result.push(opItem);
      if (expandedIds.has(op.id)) {
        result.push(...filteredChildren);
      }
    }

    return result;
  }, [operations, tasks, expandedIds, filterResponsavel, filterStatus, filterCategoria, onlyOverdue, onlyDeps, concludedMap]);


  // Janela: largura fixa por coluna; total cresce com nº de colunas e gera scroll horizontal
  const { timelineStart, timelineEnd, columns, colWidth } = useMemo(() => {
    const cfg = ZOOM_CONFIG[zoom];
    const cw = cfg.minColWidth;
    let start: Date;
    let cols: { label: string; date: Date }[] = [];
    let end: Date;

    switch (zoom) {
      case "day": {
        start = startOfDay(anchorDate);
        cols = eachDayOfInterval({ start, end: addDays(start, cfg.columns - 1) })
          .map(d => ({ label: format(d, "dd/MM", { locale: ptBR }), date: d }));
        end = addDays(start, cfg.columns);
        break;
      }
      case "week": {
        start = startOfWeek(anchorDate, { weekStartsOn: 1 });
        cols = Array.from({ length: cfg.columns }, (_, i) => addWeeks(start, i))
          .map(d => ({ label: format(d, "dd/MM", { locale: ptBR }), date: d }));
        end = addWeeks(start, cfg.columns);
        break;
      }
      case "month": {
        start = startOfMonth(anchorDate);
        cols = Array.from({ length: cfg.columns }, (_, i) => addMonths(start, i))
          .map(d => ({ label: format(d, "MMM/yy", { locale: ptBR }), date: d }));
        end = addMonths(start, cfg.columns);
        break;
      }
      case "year": {
        start = startOfYear(anchorDate);
        cols = Array.from({ length: cfg.columns }, (_, i) => addYears(start, i))
          .map(d => ({ label: format(d, "yyyy", { locale: ptBR }), date: d }));
        end = addYears(start, cfg.columns);
        break;
      }
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
    return { left, width: Math.max(8, width) };
  };

  // Navegação por 1 unidade (dia, semana, mês ou ano)
  const shiftWindow = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: colWidth * direction, behavior: "smooth" });
  };

  // Centralizar hoje no viewport
  const centerOnToday = () => {
    const el = scrollRef.current;
    if (!el) return;
    const todayPx = dayToPx(startOfDay(new Date()));
    const target = Math.max(0, todayPx - el.clientWidth / 2);
    el.scrollTo({ left: target, behavior: "smooth" });
  };

  // Centraliza no Hoje quando muda zoom ou monta
  useEffect(() => {
    const id = requestAnimationFrame(() => centerOnToday());
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, totalWidth]);

  const goToday = () => centerOnToday();

  const anchorLabel = useMemo(() => {
    const today = new Date();
    return format(today, "dd MMM yyyy", { locale: ptBR });
  }, []);

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
      <div className="space-y-3 w-full min-w-0 max-w-full">
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
            {/* Navegação temporal — uma janela por clique */}
            <div className="flex items-center gap-1 mr-2 bg-muted/40 rounded-md p-0.5">
              <Button
                variant="ghost" size="sm" className="h-7 w-7 p-0"
                onClick={() => shiftWindow(-1)} title="Janela anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline" size="sm" className="h-7 text-xs gap-1"
                onClick={goToday} title="Ir para hoje"
              >
                <CalendarDays className="h-3 w-3" />
                Hoje
              </Button>
              <span className="text-[10px] text-muted-foreground px-1 min-w-[120px] text-center">
                {anchorLabel}
              </span>
              <Button
                variant="ghost" size="sm" className="h-7 w-7 p-0"
                onClick={() => shiftWindow(1)} title="Próxima janela"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            <span className="text-xs text-muted-foreground mr-1">Zoom:</span>
            {(["day", "week", "month", "year"] as ZoomLevel[]).map(z => (
              <Button key={z} variant={zoom === z ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setZoom(z)}>
                {ZOOM_CONFIG[z].label}
              </Button>
            ))}
          </div>
        </div>

        {/* Gantt */}
        <div className="border rounded-lg overflow-hidden bg-background w-full max-w-full">
          <div className="flex w-full min-w-0">
            {/* Labels (sticky à esquerda) */}
            <div className="shrink-0 border-r bg-muted/20 sticky left-0 z-30" style={{ width: LABEL_WIDTH }}>
              <div className="h-10 border-b flex items-center px-3 bg-muted/40">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Projetos</span>
              </div>
              {items.map(item => {
                const isProject = item.level === 0;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-1.5 border-b cursor-pointer transition-colors ${
                      isProject ? "bg-muted/10 hover:bg-muted/30" : "hover:bg-muted/20"
                    }`}
                    style={{ height: ROW_HEIGHT, paddingLeft: 6 + item.level * 16 }}
                    onClick={() => onItemClick?.(item.id, item.type)}
                  >
                    {item.hasChildren && isProject ? (
                      <button
                        className="p-0.5 rounded hover:bg-muted transition-transform"
                        onClick={e => { e.stopPropagation(); toggleExpand(item.id); }}
                        aria-label={expandedIds.has(item.id) ? "Recolher" : "Expandir"}
                      >
                        <ChevronRight
                          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                            expandedIds.has(item.id) ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                    ) : (
                      <span className="w-4 inline-flex justify-center">
                        {!isProject && <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`truncate ${
                        isProject
                          ? "text-sm font-semibold text-foreground"
                          : "text-xs text-muted-foreground"
                      }`}>
                        {isProject && <span className="mr-1">{getCategoryEmoji(item.categoria)}</span>}
                        {item.name}
                      </div>
                      {item.responsavel && isProject && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: getResponsavelColor(item.responsavel) }} />
                          {item.responsavel}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timeline — scroll horizontal fluido */}
            <div
              ref={(el) => { timelineRef.current = el; scrollRef.current = el; }}
              className="overflow-x-auto overflow-y-hidden flex-1 min-w-0 scroll-smooth overscroll-x-contain"
            >
              <div style={{ width: totalWidth }} className="relative">
                {/* Headers */}
                <div className="h-10 border-b flex bg-muted/20 sticky top-0 z-10">
                  {columns.map((col, i) => (
                    <div key={i} className="border-r flex items-center justify-center text-[11px] font-medium text-muted-foreground shrink-0" style={{ width: colWidth }}>
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
                  let barClasses = "absolute rounded cursor-pointer transition-all hover:brightness-110 flex items-center px-1.5 text-[10px] font-medium overflow-hidden";

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

                  const isProject = item.level === 0;
                  const baseTop = isProject ? 5 : 9 + item.swimlane * 4;
                  const baseHeight = isProject
                    ? ROW_HEIGHT - 10
                    : Math.max(12, ROW_HEIGHT - 18 - item.swimlane * 6);

                  return (
                    <div key={item.id} className={`relative border-b ${isProject ? "bg-muted/5" : ""}`} style={{ height: ROW_HEIGHT }}>
                      {/* Grid */}
                      {columns.map((_, i) => (
                        <div key={i} className="absolute top-0 bottom-0 border-r border-dashed border-muted/30" style={{ left: i * colWidth, width: colWidth }} />
                      ))}

                      {/* Linha de hoje */}
                      {(() => {
                        const todayPx = dayToPx(today);
                        if (todayPx > 0 && todayPx < totalWidth) {
                          return (
                            <>
                              <div className="absolute top-0 bottom-0 w-[2px] bg-destructive/80 z-10 pointer-events-none" style={{ left: todayPx }} />
                              {rowIdx === 0 && (
                                <div className="absolute -top-3 z-20 px-1 py-0.5 rounded-sm bg-destructive text-destructive-foreground text-[9px] font-bold shadow-sm pointer-events-none" style={{ left: todayPx - 14 }}>
                                  HOJE
                                </div>
                              )}
                            </>
                          );
                        }
                        return null;
                      })()}

                      {/* Extensão de tempo excedido (verde escuro hachurado) */}
                      {overdueExt && (
                        <div
                          className="absolute rounded-r"
                          style={{
                            top: baseTop,
                            left: overdueExt.left,
                            width: overdueExt.width,
                            height: baseHeight,
                            background: "repeating-linear-gradient(45deg, hsl(142 70% 22%), hsl(142 70% 22%) 5px, hsl(142 60% 32%) 5px, hsl(142 60% 32%) 10px)",
                          }}
                        />
                      )}

                      {/* Barra principal */}
                      {pos && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={barClasses + (isProject ? " shadow-sm font-semibold text-[11px]" : "")}
                              style={{ ...barStyle, top: baseTop, left: pos.left, width: pos.width, height: baseHeight }}
                              onClick={() => onItemClick?.(item.id, item.type)}
                            >
                              {/* Progresso interno — preenchimento com cor do responsável */}
                              {(status === "em_andamento" || status === "atrasada") && progressPct > 0 && (
                                <div
                                  className="absolute inset-y-0 left-0 rounded-l"
                                  style={{ width: `${Math.min(100, progressPct)}%`, backgroundColor: respColor, opacity: 0.85 }}
                                />
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
            <span className="inline-block w-4 h-2.5 rounded border-2 border-dashed" style={{ borderColor: "hsl(142 40% 65%)", background: "hsl(142 40% 95%)" }} />Planejado
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-2.5 rounded" style={{ background: "hsl(142 50% 92%)", border: "1.5px solid hsl(142 55% 55%)" }} />Em execução
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-2.5 rounded" style={{ background: "hsl(142 60% 38%)" }} />Concluído
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-4 h-2.5 rounded"
              style={{ background: "repeating-linear-gradient(45deg, hsl(142 70% 22%), hsl(142 70% 22%) 3px, hsl(142 60% 32%) 3px, hsl(142 60% 32%) 6px)" }}
            />Tempo excedido
          </span>
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3" />Travada
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <span className="inline-block w-0.5 h-3 bg-destructive" />Hoje
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
