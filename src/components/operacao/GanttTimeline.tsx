import { useEffect, useMemo, useRef, useState } from "react";
import { Operation } from "@/hooks/useOperations";
import { Task } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronRight, ChevronDown, AlertTriangle, Lock, CheckCircle2, Circle, Filter, X, ChevronLeft, CalendarDays, PanelLeftClose, PanelLeftOpen, Link2, Trash2 } from "lucide-react";
import { addDays, addMonths, addWeeks, addYears, differenceInDays, format, startOfDay, startOfMonth, startOfWeek, startOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachYearOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getResponsavelColor, getCategoryEmoji, getCategoryLabel, deriveStageStatus,
  computeStageMetrics, OPERATION_CATEGORIES, STAGE_STATUS_OPTIONS_FORM, getCategoryColor,
  getProjectHsl, getContrastTextHsl,
} from "@/lib/operacaoConfig";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ProjectActionsMenu } from "./ProjectActionsMenu";
import { ResponsavelBadge } from "@/components/responsaveis/ResponsavelBadge";
import { useResponsaveis } from "@/hooks/useResponsaveis";
type ZoomLevel = "day" | "week" | "fortnight" | "month" | "bimonth" | "quarter" | "year" | "biennium";

// Cor visual por projeto: SEMPRE prioriza o id (paleta hash) para garantir
// que demandas distintas tenham cores distintas, mesmo dentro da mesma categoria.
const projectColorFor = (
  projectId: string,
  _categoria: string | null | undefined,
  opts?: { l?: number; s?: number; a?: number },
) => {
  const c = getProjectHsl(projectId);
  const s = opts?.s ?? c.s;
  const l = opts?.l ?? c.l;
  return opts?.a !== undefined
    ? `hsl(${c.h} ${s}% ${l}% / ${opts.a})`
    : `hsl(${c.h} ${s}% ${l}%)`;
};

// Janela de colunas + largura mínima por coluna (timeline escapa do container e ganha scroll horizontal)
const ZOOM_CONFIG: Record<ZoomLevel, { columns: number; minColWidth: number; label: string; shortLabel: string }> = {
  day:       { columns: 60, minColWidth: 56, label: "Dia",       shortLabel: "D" },
  week:      { columns: 36, minColWidth: 70, label: "Semana",    shortLabel: "S" },
  fortnight: { columns: 24, minColWidth: 80, label: "15 dias",   shortLabel: "Q" },
  month:     { columns: 24, minColWidth: 90, label: "Mês",       shortLabel: "M" },
  bimonth:   { columns: 18, minColWidth: 90, label: "Bimestre",  shortLabel: "B" },
  quarter:   { columns: 16, minColWidth: 90, label: "Trimestre", shortLabel: "T" },
  year:      { columns: 20, minColWidth: 90, label: "Ano",       shortLabel: "A" },
  biennium:  { columns: 12, minColWidth: 100, label: "2 anos",   shortLabel: "2A" },
};

interface GanttItem {
  id: string;
  name: string;
  level: number;
  derivedStatus: string;
  rawStatus: string;
  responsavel: string | null;
  responsavelId: string | null;
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
  /** Sub-itens que devem ser renderizados como barras INLINE na mesma linha
   *  (cadeia recolhida — quando o item está colapsado, seus descendentes não
   *  ganham linha própria, suas barras aparecem na timeline desta mesma linha). */
  inlineChain?: GanttItem[];
}

interface GanttTimelineProps {
  operations: Operation[];
  tasks: Task[];
  areas?: Array<{ id: string; nome: string }>;
  cycles?: Array<{ id: string; cultura?: string | null; area_id?: string | null }>;
  onItemClick?: (id: string, type: "operation" | "sub-operation" | "task") => void;
  onAddSubproject?: (parentId: string) => void;
  onAddSubtask?: (parentId: string) => void;
  onDeleteOperation?: (id: string) => void;
  onDuplicateOperation?: (id: string) => void;
  onCompleteOperation?: (id: string) => void;
  onReopenOperation?: (id: string) => void;
  onToggleTaskComplete?: (taskId: string, currentStatus: string) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function GanttTimeline({
  operations, tasks, areas = [], cycles = [], onItemClick,
  onAddSubproject, onAddSubtask, onDeleteOperation, onDuplicateOperation,
  onCompleteOperation, onReopenOperation, onToggleTaskComplete, onDeleteTask,
}: GanttTimelineProps) {
  const [zoom, setZoom] = useState<ZoomLevel>("month");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filterResponsavel, setFilterResponsavel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [onlyDeps, setOnlyDeps] = useState(false);
  const [projectsCollapsed, setProjectsCollapsed] = useState(false);
  // Data âncora = início da janela visível
  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    const now = startOfDay(new Date());
    return startOfMonth(addMonths(now, -6));
  });
  // Largura disponível para a faixa do timeline (medida)
  const timelineRef = useRef<HTMLDivElement | null>(null);
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

  // Mapa categoria do projeto raiz (para herdar a cor visual em sub-itens)
  const rootCategoryMap = useMemo(() => {
    const m = new Map<string, string | null>();
    operations.forEach(op => m.set(op.id, op.categoria ?? null));
    return m;
  }, [operations]);

  // Helpers de cor que usam a categoria do projeto raiz para identidade visual
  const projectColor = (projectId: string, opts?: { l?: number; s?: number; a?: number }) =>
    projectColorFor(projectId, rootCategoryMap.get(projectId) ?? null, opts);
  const getProjectColor = (projectId: string) => projectColor(projectId);

  // Lista de responsáveis únicos
  const { data: responsaveisList = [] } = useResponsaveis();
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
      responsavelId: (s as any).responsavel_id || null,
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

  // Lista plana visível com filtros + cadeia inline para subprojetos recolhidos
  const items = useMemo(() => {
    const result: GanttItem[] = [];

    const passesFilter = (it: GanttItem) => {
      if (filterResponsavel !== "all" && it.responsavelId !== filterResponsavel && it.responsavel !== filterResponsavel) return false;
      if (filterStatus !== "all" && it.derivedStatus !== filterStatus) return false;
      if (filterCategoria !== "all" && it.categoria !== filterCategoria) return false;
      if (onlyOverdue && it.derivedStatus !== "atrasada") return false;
      if (onlyDeps && !it.dependsOnId) return false;
      return true;
    };

    // Árvore real: para cada operação raiz, agrupa descendentes por parent_id direto
    for (const op of operations) {
      const allDescendants = (op.children || []) as Operation[];
      const childrenByParent = new Map<string, Operation[]>();
      for (const d of allDescendants) {
        const pid = d.parent_id || op.id;
        if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
        childrenByParent.get(pid)!.push(d);
      }

      const opItem = buildItem(op, 0, op.id, undefined, "operation");
      const opDirectTasks = tasks.filter(t => t.stage_id === op.id);
      opItem.hasChildren = opItem.hasChildren || opDirectTasks.length > 0;

      // Walk recursivo: respeita expandedIds. Quando recolhido, descendentes
      // viram barras inline na mesma linha do pai.
      const collectInline = (parentId: string): GanttItem[] => {
        const out: GanttItem[] = [];
        const directs = childrenByParent.get(parentId) || [];
        for (const d of directs) {
          const item = buildItem(d, 1, op.id, parentId, "sub-operation");
          if (!item.categoria) item.categoria = opItem.categoria;
          out.push(item);
          out.push(...collectInline(d.id));
        }
        return out;
      };

      const buildTaskItem = (t: Task, level: number, parentStageId: string): GanttItem => {
        const isDone = t.status === "concluida";
        return {
          id: t.id,
          name: t.titulo,
          level,
          derivedStatus: isDone ? "concluida" : "nao_iniciada",
          rawStatus: t.status,
          responsavel: t.responsavel,
          responsavelId: (t as any).responsavel_id || null,
          categoria: opItem.categoria,
          dependsOnId: null,
          startPrev: null,
          endPrev: null,
          startReal: null,
          endReal: null,
          parentId: parentStageId,
          type: "task",
          hasChildren: false,
          metrics: computeStageMetrics({
            data_inicio_prevista: null, data_inicio_real: null,
            data_fim_prevista: null, data_fim_real: null, duracao_prevista_dias: null,
          }),
          areaId: t.area_id,
          cycleId: t.cycle_id,
          rootProjectId: op.id,
          permiteSimultaneidade: false,
          swimlane: 0,
        };
      };

      const walk = (parentId: string, level: number, accum: GanttItem[]) => {
        const directs = childrenByParent.get(parentId) || [];
        for (const d of directs) {
          const item = buildItem(d, level, op.id, parentId, "sub-operation");
          if (!item.categoria) item.categoria = opItem.categoria;
          const childStages = childrenByParent.get(d.id)?.length ?? 0;
          const childTasks = tasks.filter(t => t.stage_id === d.id);
          item.hasChildren = childStages > 0 || childTasks.length > 0;

          if (item.hasChildren && !expandedIds.has(d.id)) {
            // Recolhido: anexa descendentes como cadeia inline (mesma linha)
            item.inlineChain = collectInline(d.id);
          }
          if (!passesFilter(item) && !(item.inlineChain || []).some(passesFilter)) continue;

          accum.push(item);

          if (item.hasChildren && expandedIds.has(d.id)) {
            walk(d.id, level + 1, accum);
            // Adiciona tarefas vinculadas a este subprojeto
            for (const t of childTasks) {
              accum.push(buildTaskItem(t, level + 1, d.id));
            }
          }
        }
      };

      const subAccum: GanttItem[] = [];
      walk(op.id, 1, subAccum);

      // Swimlanes para evitar sobreposição (apenas dentro do mesmo nível visual)
      const byKey = new Map<string, GanttItem[]>();
      subAccum.forEach(c => {
        const key = `${c.parentId}:${c.level}`;
        if (!byKey.has(key)) byKey.set(key, []);
        byKey.get(key)!.push(c);
      });
      byKey.forEach(groupChildren => {
        const lanes: Array<Date | null> = [];
        for (const child of groupChildren) {
          const start = child.startReal || child.startPrev;
          // Considera o fim da cadeia inline também
          let end = child.endReal || child.endPrev;
          for (const inl of child.inlineChain || []) {
            const inlEnd = inl.endReal || inl.endPrev;
            if (inlEnd && (!end || inlEnd > end)) end = inlEnd;
          }
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

      const opPasses = passesFilter(opItem);
      if (!opPasses && subAccum.length === 0) continue;

      result.push(opItem);
      if (expandedIds.has(op.id)) {
        result.push(...subAccum);
        // Subtarefas NÃO aparecem na timeline — são checklist dentro do subprojeto.
      }
    }

    return result;
  }, [operations, tasks, expandedIds, filterResponsavel, filterStatus, filterCategoria, onlyOverdue, onlyDeps, concludedMap]);

  // Mapa de progresso de checklist (subtarefas) por stage_id (projeto ou subprojeto)
  const checklistProgressByStage = useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    for (const t of tasks) {
      if (!t.stage_id) continue;
      const cur = map.get(t.stage_id) || { done: 0, total: 0 };
      cur.total += 1;
      if (t.status === "concluida") cur.done += 1;
      map.set(t.stage_id, cur);
    }
    // Agrega no projeto raiz: soma subtarefas dos subprojetos também
    for (const op of operations) {
      const rootAgg = { done: 0, total: 0 };
      const direct = map.get(op.id);
      if (direct) { rootAgg.done += direct.done; rootAgg.total += direct.total; }
      for (const child of (op.children || [])) {
        const c = map.get(child.id);
        if (c) { rootAgg.done += c.done; rootAgg.total += c.total; }
      }
      if (rootAgg.total > 0) map.set(op.id, rootAgg);
    }
    return map;
  }, [tasks, operations]);


  // Janela: colunas se ajustam à largura disponível (sem scroll horizontal)
  const { timelineStart, timelineEnd, columns, colWidth } = useMemo(() => {
    const cfg = ZOOM_CONFIG[zoom];
    // Largura por coluna: distribui pela área disponível, mas respeita o mínimo legível.
    // Quando a soma > área disponível, o container interno faz scroll horizontal.
    const cw = Math.max(cfg.minColWidth, availableWidth / cfg.columns);
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
      case "fortnight": {
        start = startOfDay(anchorDate);
        cols = Array.from({ length: cfg.columns }, (_, i) => addDays(start, i * 15))
          .map(d => ({ label: format(d, "dd/MM", { locale: ptBR }), date: d }));
        end = addDays(start, cfg.columns * 15);
        break;
      }
      case "month": {
        start = startOfMonth(anchorDate);
        cols = Array.from({ length: cfg.columns }, (_, i) => addMonths(start, i))
          .map(d => ({ label: format(d, "MMM/yy", { locale: ptBR }), date: d }));
        end = addMonths(start, cfg.columns);
        break;
      }
      case "bimonth": {
        start = startOfMonth(anchorDate);
        cols = Array.from({ length: cfg.columns }, (_, i) => addMonths(start, i * 2))
          .map(d => ({ label: format(d, "MMM/yy", { locale: ptBR }), date: d }));
        end = addMonths(start, cfg.columns * 2);
        break;
      }
      case "quarter": {
        start = startOfMonth(anchorDate);
        cols = Array.from({ length: cfg.columns }, (_, i) => addMonths(start, i * 3))
          .map(d => ({ label: format(d, "MMM/yy", { locale: ptBR }), date: d }));
        end = addMonths(start, cfg.columns * 3);
        break;
      }
      case "year": {
        start = startOfYear(anchorDate);
        cols = Array.from({ length: cfg.columns }, (_, i) => addYears(start, i))
          .map(d => ({ label: format(d, "yyyy", { locale: ptBR }), date: d }));
        end = addYears(start, cfg.columns);
        break;
      }
      case "biennium": {
        start = startOfYear(anchorDate);
        cols = Array.from({ length: cfg.columns }, (_, i) => addYears(start, i * 2))
          .map(d => ({ label: format(d, "yyyy", { locale: ptBR }), date: d }));
        end = addYears(start, cfg.columns * 2);
        break;
      }
    }

    return { timelineStart: start, timelineEnd: end, columns: cols, colWidth: cw };
  }, [anchorDate, zoom, availableWidth]);

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

  // Navegação por 1 coluna por clique (passo único conforme o zoom)
  const shiftWindow = (direction: 1 | -1) => {
    setAnchorDate(prev => {
      switch (zoom) {
        case "day":       return addDays(prev, direction);
        case "week":      return addWeeks(prev, direction);
        case "fortnight": return addDays(prev, direction * 15);
        case "month":     return addMonths(prev, direction);
        case "bimonth":   return addMonths(prev, direction * 2);
        case "quarter":   return addMonths(prev, direction * 3);
        case "year":      return addYears(prev, direction);
        case "biennium":  return addYears(prev, direction * 2);
      }
    });
  };

  // Centralizar hoje: ajusta âncora e rola o ScrollArea para que hoje fique no centro visível
  const centerOnToday = () => {
    const today = startOfDay(new Date());
    const half = Math.floor(ZOOM_CONFIG[zoom].columns / 2);
    switch (zoom) {
      case "day":       setAnchorDate(addDays(today, -half)); break;
      case "week":      setAnchorDate(startOfWeek(addWeeks(today, -half), { weekStartsOn: 1 })); break;
      case "fortnight": setAnchorDate(startOfDay(addDays(today, -half * 15))); break;
      case "month":     setAnchorDate(startOfMonth(addMonths(today, -half))); break;
      case "bimonth":   setAnchorDate(startOfMonth(addMonths(today, -half * 2))); break;
      case "quarter":   setAnchorDate(startOfMonth(addMonths(today, -half * 3))); break;
      case "year":      setAnchorDate(startOfYear(addYears(today, -half))); break;
      case "biennium":  setAnchorDate(startOfYear(addYears(today, -half * 2))); break;
    }
    // após re-render, rolar viewport
    requestAnimationFrame(() => {
      const root = timelineRef.current;
      if (!root) return;
      const viewport = root.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      if (!viewport) return;
      viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
    });
  };

  useEffect(() => { centerOnToday(); /* eslint-disable-next-line */ }, [zoom]);

  const goToday = () => centerOnToday();

  const anchorLabel = useMemo(() => {
    const today = new Date();
    return format(today, "dd MMM yyyy", { locale: ptBR });
  }, []);

  const ROW_HEIGHT = 40;
  const LABEL_WIDTH = projectsCollapsed ? 40 : 240;

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
              {responsaveisList.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.cor }} />
                    {r.nome}
                  </span>
                </SelectItem>
              ))}
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

            <div className="flex items-center gap-1 flex-wrap bg-muted/40 rounded-md p-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-1.5">Zoom</span>
              {(["day", "week", "fortnight", "month", "bimonth", "quarter", "year", "biennium"] as ZoomLevel[]).map(z => (
                <Button
                  key={z}
                  variant={zoom === z ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-[11px]"
                  onClick={() => setZoom(z)}
                >
                  {ZOOM_CONFIG[z].label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Gantt */}
        <div className="border rounded-lg overflow-hidden bg-background w-full max-w-full">
          <div className="flex w-full min-w-0">
            {/* Labels (sticky à esquerda) */}
            <div className="shrink-0 border-r bg-muted/20 sticky left-0 z-30" style={{ width: LABEL_WIDTH }}>
              <div className="h-10 border-b flex items-center justify-between px-2 bg-muted/40 gap-1">
                {!projectsCollapsed && (
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">Projetos</span>
                )}
                <button
                  onClick={() => setProjectsCollapsed(v => !v)}
                  className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground shrink-0 ml-auto"
                  title={projectsCollapsed ? "Expandir lista de projetos" : "Recolher lista de projetos"}
                  aria-label={projectsCollapsed ? "Expandir lista" : "Recolher lista"}
                >
                  {projectsCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
                </button>
              </div>
              {items.map(item => {
                const isProject = item.level === 0;
                if (projectsCollapsed) {
                  // Modo recolhido: apenas ícone/expand toggle por linha
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-center border-b cursor-pointer transition-colors ${
                        isProject ? "bg-muted/10 hover:bg-muted/30" : "hover:bg-muted/20"
                      }`}
                      style={{ height: ROW_HEIGHT }}
                      onClick={() => onItemClick?.(item.id, item.type)}
                      title={item.name}
                    >
                      {item.hasChildren ? (
                        <button
                          className="p-0.5 rounded hover:bg-muted"
                          onClick={e => { e.stopPropagation(); toggleExpand(item.id); }}
                          aria-label={expandedIds.has(item.id) ? "Recolher" : "Expandir"}
                        >
                          <ChevronRight
                            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                              expandedIds.has(item.id) ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                      ) : (
                        <span className="text-[11px]">{isProject ? getCategoryEmoji(item.categoria) : "·"}</span>
                      )}
                    </div>
                  );
                }
                const isTask = item.type === "task";
                const isDoneTask = isTask && item.derivedStatus === "concluida";
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-1.5 border-b cursor-pointer transition-colors ${
                      isProject ? "bg-muted/10 hover:bg-muted/30" : "hover:bg-muted/20"
                    }`}
                    style={{
                      height: ROW_HEIGHT,
                      paddingLeft: 6 + item.level * 16,
                      borderLeft: `3px solid ${getProjectColor(item.rootProjectId)}`,
                    }}
                    onClick={() => !isTask && onItemClick?.(item.id, item.type)}
                  >
                    {isTask ? (
                      <button
                        className="p-0.5 rounded hover:bg-muted"
                        onClick={e => { e.stopPropagation(); onToggleTaskComplete?.(item.id, item.rawStatus); }}
                        aria-label={isDoneTask ? "Reabrir tarefa" : "Concluir tarefa"}
                        title={isDoneTask ? "Reabrir tarefa" : "Concluir tarefa"}
                      >
                        {isDoneTask
                          ? <CheckCircle2 className="h-4 w-4 text-success" />
                          : <Circle className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    ) : item.hasChildren ? (
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
                    <div className="flex-1 min-w-0" onClick={(e) => { if (isTask) { e.stopPropagation(); onItemClick?.(item.id, item.type); } }}>
                      <div className={`truncate ${
                        isProject
                          ? "text-sm font-semibold text-foreground"
                          : isTask
                            ? `text-xs ${isDoneTask ? "text-muted-foreground line-through" : "text-foreground"}`
                            : "text-xs text-muted-foreground"
                      }`}>
                        {isProject && <span className="mr-1">{getCategoryEmoji(item.categoria)}</span>}
                        {item.name}
                      </div>
                      {(item.responsavelId || item.responsavel) && (isProject || isTask) && (
                        <div className="text-[10px] text-muted-foreground truncate">
                          {item.responsavelId ? (
                            <ResponsavelBadge responsavelId={item.responsavelId} size="xs" />
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: getResponsavelColor(item.responsavel!) }} />
                              {item.responsavel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {isTask ? (
                      onDeleteTask && (
                        <button
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={e => { e.stopPropagation(); onDeleteTask(item.id); }}
                          title="Excluir tarefa"
                          aria-label="Excluir tarefa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )
                    ) : (onAddSubproject || onAddSubtask || onDeleteOperation || onCompleteOperation) && (
                      <ProjectActionsMenu
                        level={item.level}
                        isCompleted={item.derivedStatus === "concluida"}
                        onAddSubproject={onAddSubproject ? () => onAddSubproject(item.id) : undefined}
                        onAddSubtask={onAddSubtask ? () => onAddSubtask(item.id) : undefined}
                        onEdit={() => onItemClick?.(item.id, item.type)}
                        onComplete={onCompleteOperation ? () => onCompleteOperation(item.id) : undefined}
                        onReopen={onReopenOperation ? () => onReopenOperation(item.id) : undefined}
                        onDuplicate={isProject && onDuplicateOperation ? () => onDuplicateOperation(item.id) : undefined}
                        onDelete={onDeleteOperation ? () => onDeleteOperation(item.id) : undefined}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Timeline — scroll horizontal interno apenas nesta área */}
            <ScrollArea ref={timelineRef} className="flex-1 min-w-0 overflow-hidden" type="always">
              <div
                className="overflow-y-hidden w-max min-w-full"
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
                  const isOverdue = status === "atrasada";
                  const isLateDone = status === "concluida_com_atraso";
                  const isDoneOnTime = status === "concluida";
                  const isDone = isDoneOnTime || isLateDone;
                  const isInProgress = status === "em_andamento";

                  // Geometria: barra principal SEMPRE termina no fim planejado quando há um
                  // (independente do status), exceto quando concluída no prazo (vai até endReal).
                  const mainEnd = isDoneOnTime
                    ? (endReal || endPrev)
                    : (endPrev || endReal);
                  const pos = getBarPosition(start, mainEnd);

                  // Extensão de tempo excedido
                  const overdueExt = (() => {
                    if (!endPrev || !pos) return null;
                    if (isOverdue || isInProgress) {
                      // só se hoje passou do fim planejado
                      const todayPx = dayToPx(today);
                      const endPrevPx = dayToPx(endPrev);
                      if (todayPx > endPrevPx) {
                        return { width: Math.max(4, todayPx - endPrevPx) };
                      }
                      return null;
                    }
                    if (isLateDone && endReal) {
                      const endRealPx = dayToPx(endReal);
                      const endPrevPx = dayToPx(endPrev);
                      if (endRealPx > endPrevPx) {
                        return { width: Math.max(4, endRealPx - endPrevPx) };
                      }
                    }
                    return null;
                  })();

                  // % preenchimento interno (cor do projeto, não do responsável)
                  const fillPct = (() => {
                    if (isDone) return 100;
                    if (isInProgress || isOverdue) {
                      if (!start) return 0;
                      const dPlan = item.metrics.duracaoPrevista || 1;
                      const elapsed = Math.max(0, differenceInDays(today, start));
                      return Math.min(100, Math.round((elapsed / dPlan) * 100));
                    }
                    return 0;
                  })();

                  const projHsl = getProjectHsl(item.rootProjectId);
                  const strong = projectColor(item.rootProjectId);
                  const soft = projectColor(item.rootProjectId, { l: 92, s: 45 });
                  const softer = projectColor(item.rootProjectId, { l: 96, s: 40 });
                  const dark = projectColor(item.rootProjectId, { l: 22 });
                  const mid = projectColor(item.rootProjectId, { l: 32 });
                  const isProject = item.level === 0;
                  const isSub = item.level === 1;

                  // Texto sempre calculado pelo contraste do fundo da barra
                  const textOnStrong = getContrastTextHsl(projHsl.l); // fundo = strong (l da paleta)
                  const textOnSoft = getContrastTextHsl(92);          // fundo = soft (claro) → escuro

                  // Estilo base da barra planejada — sempre cor do projeto, status muda só tratamento
                  let barStyle: React.CSSProperties = {};
                  let barTextColor = textOnSoft;
                  let icon: React.ReactNode = null;
                  if (status === "cancelada") {
                    barStyle = { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", textDecoration: "line-through", opacity: 0.6, border: "1.5px solid hsl(var(--muted-foreground) / 0.3)" };
                    barTextColor = "hsl(var(--muted-foreground))";
                  } else if (status === "travada") {
                    barStyle = {
                      backgroundColor: projectColor(item.rootProjectId, { l: 90, s: 15 }),
                      border: `1.5px dashed ${projectColor(item.rootProjectId, { l: 50, s: 25 })}`,
                      color: dark,
                    };
                    barTextColor = dark;
                    icon = <Lock className="h-3 w-3 shrink-0" />;
                  } else if (status === "pausada") {
                    barStyle = {
                      background: `repeating-linear-gradient(45deg, ${soft} 0 6px, ${projectColor(item.rootProjectId, { l: 86, s: 35 })} 6px 12px)`,
                      border: `1.5px solid ${strong}`,
                      color: dark,
                    };
                    barTextColor = dark;
                  } else if (isDone) {
                    barStyle = { backgroundColor: strong, color: textOnStrong, border: `1.5px solid ${strong}` };
                    barTextColor = textOnStrong;
                    icon = <CheckCircle2 className="h-3 w-3 shrink-0" />;
                  } else {
                    // planejada / em_andamento / atrasada — fundo claro (soft)
                    barStyle = { backgroundColor: soft, border: `1.5px solid ${strong}`, color: textOnSoft };
                    barTextColor = textOnSoft;
                    if (isOverdue) icon = <AlertTriangle className="h-3 w-3 shrink-0 text-destructive" />;
                  }

                  if (isProject) {
                    // projetos: borda mais grossa
                    barStyle.borderWidth = "2px";
                  } else if (item.level >= 2) {
                    // sub-sub: tracejado
                    if (!isDone && status !== "cancelada" && status !== "travada") {
                      barStyle.borderStyle = "dashed";
                    }
                  }

                  const baseTop = item.level >= 2 ? 7 : 5;
                  const baseHeight = ROW_HEIGHT - (item.level >= 2 ? 14 : 10);

                  // Tarefas: linha simples sem barra
                  if (item.type === "task") {
                    return (
                      <div key={item.id} className="relative border-b bg-muted/5" style={{ height: ROW_HEIGHT }}>
                        {columns.map((_, i) => (
                          <div key={i} className="absolute top-0 bottom-0 border-r border-dashed border-muted/30" style={{ left: i * colWidth, width: colWidth }} />
                        ))}
                        {(() => {
                          const todayPx = dayToPx(today);
                          if (todayPx > 0 && todayPx < totalWidth) {
                            return <div className="absolute top-0 bottom-0 w-[2px] bg-destructive/80 z-10 pointer-events-none" style={{ left: todayPx }} />;
                          }
                          return null;
                        })()}
                      </div>
                    );
                  }

                  const dPrev = item.metrics.duracaoPrevista;
                  const dReal = item.metrics.duracaoReal;
                  const dExc = item.metrics.diasExcedidos;
                  const dTot = item.metrics.diasTotais;
                  const dDec = item.metrics.diasDecorridos;

                  const extWidth = overdueExt?.width ?? 0;
                  const totalBarWidth = pos ? pos.width + extWidth : 0;
                  const isCompactRow = totalBarWidth < 140;

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

                      {/* Barra unificada (planejado + extensão excedida) */}
                      {pos && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute cursor-pointer transition-all hover:brightness-110"
                              style={{
                                top: baseTop,
                                left: pos.left,
                                width: totalBarWidth,
                                height: baseHeight,
                              }}
                              onClick={() => onItemClick?.(item.id, item.type)}
                            >
                              {/* Segmento PLANEJADO */}
                              <div
                                className="absolute top-0 left-0 flex items-center px-1.5 text-[10px] font-medium overflow-hidden"
                                style={{
                                  ...barStyle,
                                  width: pos.width,
                                  height: baseHeight,
                                  borderTopLeftRadius: 4,
                                  borderBottomLeftRadius: 4,
                                  borderTopRightRadius: extWidth > 0 ? 0 : 4,
                                  borderBottomRightRadius: extWidth > 0 ? 0 : 4,
                                  // Se tem extensão, remove a borda direita para emendar visualmente
                                  borderRight: extWidth > 0 ? "none" : (barStyle.border as string)?.includes("solid") || (barStyle.border as string)?.includes("dashed") ? undefined : barStyle.borderRight,
                                  fontWeight: isProject ? 600 : 500,
                                  fontSize: isProject ? 11 : 10,
                                }}
                              >
                                {/* Preenchimento interno (progresso na cor forte do projeto) */}
                                {fillPct > 0 && !isDone && (
                                  <div
                                    className="absolute inset-y-0 left-0 pointer-events-none"
                                    style={{
                                      width: `${Math.min(100, fillPct)}%`,
                                      background: strong,
                                      opacity: 0.85,
                                      borderTopLeftRadius: 3,
                                      borderBottomLeftRadius: 3,
                                    }}
                                  />
                                )}
                                {/* Marcador do responsável (dot esquerdo) */}
                                {item.responsavel && (
                                  <span
                                    className="relative z-10 inline-block h-2 w-2 rounded-full ring-1 ring-white/60 shrink-0 mr-1"
                                    style={{ backgroundColor: respColor }}
                                  />
                                )}
                                <div className="relative z-10 flex items-center gap-1 truncate flex-1 min-w-0" style={{ color: barTextColor, textShadow: barTextColor === "hsl(0 0% 100%)" ? "0 1px 2px rgba(0,0,0,0.25)" : "none" }}>
                                  {icon}
                                  {pos.width > 50 && <span className="truncate">{item.name}</span>}
                                </div>
                                {/* Chip "Nd planejado" no fim do segmento planejado */}
                                {pos.width > 60 && dPrev !== null && (() => {
                                  const isDarkBg = isDone;
                                  const chipBg = isDarkBg ? "rgba(255,255,255,0.22)" : projectColor(item.rootProjectId, { a: 0.18, l: 35 });
                                  const chipColor = isDarkBg ? "white" : dark;
                                  const label = isCompactRow ? `${dPrev}d` : (isDone && !isLateDone ? `${dReal ?? dPrev}d ✓` : `${dPrev}d plan`);
                                  return (
                                    <span
                                      className="relative z-10 ml-1 shrink-0 px-1.5 py-0.5 rounded-sm text-[9px] font-bold tabular-nums"
                                      style={{ backgroundColor: chipBg, color: chipColor }}
                                    >
                                      {label}
                                    </span>
                                  );
                                })()}
                                {pos.width > 110 && (() => {
                                  const cl = checklistProgressByStage.get(item.id);
                                  if (!cl || cl.total === 0) return null;
                                  const isDarkBg = isDone;
                                  const chipBg = isDarkBg ? "rgba(255,255,255,0.22)" : projectColor(item.rootProjectId, { a: 0.18, l: 35 });
                                  const chipColor = isDarkBg ? "white" : dark;
                                  return (
                                    <span
                                      className="relative z-10 ml-1 shrink-0 px-1.5 py-0.5 rounded-sm text-[9px] font-bold tabular-nums"
                                      style={{ backgroundColor: chipBg, color: chipColor }}
                                      title={`${cl.done} de ${cl.total} subtarefas concluídas`}
                                    >
                                      ☑ {cl.done}/{cl.total}
                                    </span>
                                  );
                                })()}
                              </div>

                              {/* Segmento EXCEDIDO — emendado visualmente, mesma cor base em tom mais escuro */}
                              {extWidth > 0 && (
                                <div
                                  className="absolute top-0 flex items-center justify-center px-1 overflow-hidden"
                                  style={{
                                    left: pos.width,
                                    width: extWidth,
                                    height: baseHeight,
                                    background: `repeating-linear-gradient(45deg, ${dark} 0 5px, ${mid} 5px 10px)`,
                                    borderTop: `1.5px solid ${strong}`,
                                    borderRight: `1.5px solid ${strong}`,
                                    borderBottom: `1.5px solid ${strong}`,
                                    borderTopRightRadius: 4,
                                    borderBottomRightRadius: 4,
                                  }}
                                >
                                  {extWidth > 36 && dExc > 0 && (
                                    <span className="text-[9px] font-bold tabular-nums text-white/95 px-1 py-0.5 rounded-sm" style={{ backgroundColor: "hsl(var(--destructive) / 0.85)" }}>
                                      {extWidth > 80 ? `+${dExc}d excedido` : `+${dExc}d`}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Chip TOTAL flutuante na ponta direita (só quando há excedido) */}
                              {extWidth > 0 && dTot !== null && totalBarWidth > 90 && (
                                <span
                                  className="absolute -top-2 right-0 px-1.5 py-0.5 rounded-sm text-[9px] font-bold tabular-nums shadow-sm border"
                                  style={{
                                    backgroundColor: "hsl(var(--background))",
                                    color: dark,
                                    borderColor: strong,
                                  }}
                                >
                                  {isCompactRow ? `${dTot}d` : `${dTot}d total`}
                                </span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs space-y-1 max-w-xs">
                            <div className="font-semibold flex items-center gap-2">
                              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: strong }} />
                              {item.name}
                            </div>
                            {item.categoria && <div className="text-muted-foreground">📂 {getCategoryLabel(item.categoria)}</div>}
                            {item.responsavel && <div className="text-muted-foreground">👤 {item.responsavel}</div>}
                            <div>Status: <strong>{
                              status === "concluida_com_atraso" ? "Concluída com atraso"
                              : status === "em_andamento" ? "Em andamento"
                              : status === "atrasada" ? "Atrasada"
                              : status === "concluida" ? "Concluída no prazo"
                              : status === "planejada" ? "Planejada"
                              : status === "travada" ? "Travada"
                              : status === "pausada" ? "Pausada"
                              : status
                            }</strong></div>
                            <div className="border-t pt-1 mt-1 space-y-0.5">
                              {item.startPrev && <div>Início previsto: {format(item.startPrev, "dd/MM/yy")}</div>}
                              {item.startReal && <div>Início real: {format(item.startReal, "dd/MM/yy")}</div>}
                              {endPrev && <div>Fim planejado: {format(endPrev, "dd/MM/yy")}</div>}
                              {endReal && <div>Fim real: {format(endReal, "dd/MM/yy")}</div>}
                            </div>
                            <div className="border-t pt-1 mt-1 space-y-0.5">
                              {dPrev !== null && <div>Dias planejados: <strong>{dPrev}d</strong></div>}
                              {dDec !== null && <div>Dias decorridos: <strong>{dDec}d</strong>{dPrev ? ` (${Math.round((item.metrics.percentualPlanejadoDecorrido || 0) * 100)}% do plano)` : ""}</div>}
                              {dExc > 0 && <div className="text-destructive font-semibold">Dias excedidos: +{dExc}d</div>}
                              {dTot !== null && <div>Dias totais: <strong>{dTot}d</strong></div>}
                              {dReal !== null && <div>Duração real: <strong>{dReal}d</strong></div>}
                            </div>
                            <div className="border-t pt-1 mt-1">
                              {isLateDone && <span className="text-destructive font-semibold">Concluída com {dExc}d de atraso</span>}
                              {isDoneOnTime && <span className="text-success font-semibold">Concluída no prazo</span>}
                              {isOverdue && !isDone && <span className="text-destructive font-semibold">Atrasada há {dExc}d</span>}
                              {isInProgress && !isOverdue && <span className="text-success">No prazo</span>}
                              {status === "planejada" && <span className="text-muted-foreground">Aguardando início</span>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {!pos && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground/50">sem datas</span>
                        </div>
                      )}

                      {/* Cadeia inline: barras dos descendentes na mesma linha (recolhido) */}
                      {(item.inlineChain || []).map(inl => {
                        const inlStart = inl.startReal || inl.startPrev;
                        const inlEnd = inl.endReal ||
                          (inl.derivedStatus === "atrasada" && inl.endPrev ? today : inl.endPrev);
                        const inlPos = getBarPosition(inlStart, inlEnd);
                        if (!inlPos) return null;
                        const inlProjHsl = getProjectHsl(item.rootProjectId);
                        const inlStrong = projectColor(item.rootProjectId);
                        const inlSoft = projectColor(item.rootProjectId, { l: 92, s: 45 });
                        const inlSofter = projectColor(item.rootProjectId, { l: 96, s: 40 });
                        const inlDark = projectColor(item.rootProjectId, { l: 18 });
                        const inlTextOnStrong = getContrastTextHsl(inlProjHsl.l);
                        let inlStyle: React.CSSProperties = {};
                        if (inl.derivedStatus === "concluida") {
                          inlStyle = { backgroundColor: inlStrong, color: inlTextOnStrong };
                        } else if (inl.level === 1) {
                          inlStyle = { backgroundColor: inlSoft, border: `2px solid ${inlStrong}`, color: inlDark };
                        } else {
                          inlStyle = { backgroundColor: inlSofter, border: `2px dashed ${inlStrong}`, color: inlDark };
                        }
                        // Conector pontilhado entre o pai e este filho (ou entre filhos)
                        const prevEndPx = pos ? pos.left + pos.width : inlPos.left;
                        const connectorLeft = Math.min(prevEndPx, inlPos.left);
                        const connectorWidth = Math.max(0, inlPos.left - prevEndPx);
                        return (
                          <div key={inl.id}>
                            {connectorWidth > 2 && (
                              <div
                                className="absolute pointer-events-none"
                                style={{
                                  top: baseTop + baseHeight / 2 - 1,
                                  left: connectorLeft,
                                  width: connectorWidth,
                                  height: 2,
                                  borderTop: `1.5px dotted ${getProjectColor(item.rootProjectId)}`,
                                  opacity: 0.6,
                                }}
                              />
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="absolute rounded-md cursor-pointer transition-all hover:brightness-110 flex items-center px-1.5 text-[10px] font-medium overflow-hidden"
                                  style={{
                                    ...inlStyle,
                                    top: baseTop, left: inlPos.left, width: inlPos.width, height: baseHeight,
                                    borderLeft: `2px solid ${getProjectColor(item.rootProjectId)}`,
                                  }}
                                  onClick={e => { e.stopPropagation(); onItemClick?.(inl.id, inl.type); }}
                                >
                                  <div className="relative z-10 flex items-center gap-1 truncate">
                                    {inl.derivedStatus === "concluida" && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                                    {inlPos.width > 40 && <span className="truncate">{inl.name}</span>}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs space-y-1">
                                <div className="font-semibold">{inl.name}</div>
                                <div className="text-muted-foreground">Cadeia de {item.name}</div>
                                <div>Status: <strong>{inl.derivedStatus}</strong></div>
                                {inl.startPrev && <div>Início: {format(inl.startPrev, "dd/MM/yy")}</div>}
                                {inl.endPrev && <div>Fim: {format(inl.endPrev, "dd/MM/yy")}</div>}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        );
                      })}
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
              <ScrollBar orientation="horizontal" className="bg-background/90" />
            </ScrollArea>
          </div>
        </div>

        {/* Legenda — reflete a nova semântica visual */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-2.5 rounded-sm" style={{ background: "hsl(200 50% 92%)", border: "1.5px solid hsl(200 60% 45%)" }} />
            Período planejado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-2.5 rounded-sm overflow-hidden relative" style={{ background: "hsl(200 50% 92%)", border: "1.5px solid hsl(200 60% 45%)" }}>
              <span className="absolute inset-y-0 left-0" style={{ width: "60%", background: "hsl(200 60% 45%)", opacity: 0.85 }} />
            </span>
            Progresso realizado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex w-7 h-2.5 rounded-sm overflow-hidden" style={{ border: "1.5px solid hsl(200 60% 45%)" }}>
              <span className="block h-full" style={{ width: "45%", background: "hsl(200 60% 45%)" }} />
              <span className="block h-full" style={{ width: "55%", background: "repeating-linear-gradient(45deg, hsl(200 60% 22%) 0 4px, hsl(200 60% 32%) 4px 8px)" }} />
            </span>
            Tempo excedido (continuação)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-2.5 rounded-sm" style={{ background: "hsl(145 65% 32%)" }} />
            <CheckCircle2 className="h-3 w-3 text-success" />Concluída
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-2.5 rounded-sm" style={{ background: "repeating-linear-gradient(45deg, hsl(200 50% 92%) 0 4px, hsl(200 50% 80%) 4px 8px)", border: "1.5px dashed hsl(200 60% 45%)" }} />
            <Lock className="h-3 w-3" />Pausada/Travada
          </span>
          <span className="flex items-center gap-1.5 ml-auto">
            <span className="inline-block w-0.5 h-3 bg-destructive" />Hoje
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
