import { useEffect, useMemo, useRef, useState } from "react";
import { Operation } from "@/hooks/useOperations";
import { Task } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SlidersHorizontal, X, LayoutGrid, CalendarDays, BarChart3,
  ChevronRight, ChevronDown, Clock, AlertTriangle, CheckCircle2, Circle, Pause,
  Rows3, Columns3, Grid2x2,
} from "lucide-react";
import {
  getProjectColor, getCategoryEmoji, getCategoryLabel, OPERATION_CATEGORIES,
  deriveStageStatus,
} from "@/lib/operacaoConfig";
import { ResponsavelBadge } from "@/components/responsaveis/ResponsavelBadge";
import { useResponsaveis } from "@/hooks/useResponsaveis";
import { format, isToday, startOfMonth, addMonths, addDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type ViewMode = "cards" | "agenda" | "gantt";

interface Props {
  operations: Operation[];
  tasks: Task[];
  areas: Array<{ id: string; nome: string }>;
  onItemClick: (id: string, type: "operation" | "sub-operation" | "task") => void;
  onAddSubproject: (parentId: string) => void;
  onAddTask: (stageId: string) => void;
}

interface Filters {
  status: string; // single
  responsavelIds: Set<string>;
  areaIds: Set<string>;
  categorias: Set<string>;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Todos", icon: Circle },
  { value: "em_andamento", label: "Em andamento", icon: Clock },
  { value: "atrasada", label: "Atrasadas", icon: AlertTriangle },
  { value: "planejada", label: "Pendentes", icon: Circle },
  { value: "concluida", label: "Concluídas", icon: CheckCircle2 },
  { value: "pausada", label: "Pausadas", icon: Pause },
];

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  em_andamento: { label: "Em andamento", cls: "bg-primary/15 text-primary border-primary/30" },
  atrasada:     { label: "Atrasada",     cls: "bg-destructive/15 text-destructive border-destructive/30" },
  concluida:    { label: "Concluída",    cls: "bg-success/15 text-success border-success/30" },
  planejada:    { label: "Planejada",    cls: "bg-muted text-muted-foreground border-border" },
  nao_iniciada: { label: "Planejada",    cls: "bg-muted text-muted-foreground border-border" },
  pausada:      { label: "Pausada",      cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  travada:      { label: "Travada",      cls: "bg-muted text-muted-foreground border-border" },
  cancelada:    { label: "Cancelada",    cls: "bg-muted text-muted-foreground/70 border-border" },
  reprogramada: { label: "Reprogramada", cls: "bg-muted text-muted-foreground border-border" },
};

function deriveOpStatus(op: Operation): string {
  return deriveStageStatus({
    status: op.status,
    data_inicio_real: op.data_inicio_real,
    data_fim_real: op.data_fim_real,
    data_fim_prevista: op.data_fim_prevista,
  });
}

function fmtRange(start?: string | null, end?: string | null) {
  if (!start && !end) return null;
  const s = start ? format(new Date(start), "dd MMM", { locale: ptBR }) : "?";
  const e = end ? format(new Date(end), "dd MMM", { locale: ptBR }) : "?";
  return `${s} – ${e}`;
}

export function MobileOperacaoView({ operations, tasks, areas, onItemClick, onAddSubproject, onAddTask }: Props) {
  const [view, setView] = useState<ViewMode>("cards");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    responsavelIds: new Set(),
    areaIds: new Set(),
    categorias: new Set(),
  });

  const { data: responsaveis = [] } = useResponsaveis(true);

  // Filtragem dos projetos raiz
  const filteredOps = useMemo(() => {
    return operations.filter(op => {
      if (filters.status !== "all" && deriveOpStatus(op) !== filters.status) return false;
      if (filters.areaIds.size > 0 && (!op.area_id || !filters.areaIds.has(op.area_id))) return false;
      if (filters.categorias.size > 0 && (!op.categoria || !filters.categorias.has(op.categoria))) return false;
      if (filters.responsavelIds.size > 0) {
        const ids = new Set<string>();
        if (op.responsavel_id) ids.add(op.responsavel_id);
        (op.children || []).forEach(c => c.responsavel_id && ids.add(c.responsavel_id));
        const hit = Array.from(filters.responsavelIds).some(r => ids.has(r));
        if (!hit) return false;
      }
      return true;
    });
  }, [operations, filters]);

  const activeFilterCount =
    (filters.status !== "all" ? 1 : 0) +
    filters.responsavelIds.size +
    filters.areaIds.size +
    filters.categorias.size;

  const clearAll = () => setFilters({
    status: "all",
    responsavelIds: new Set(),
    areaIds: new Set(),
    categorias: new Set(),
  });

  const removeChip = (kind: keyof Filters, val?: string) => {
    setFilters(prev => {
      if (kind === "status") return { ...prev, status: "all" };
      const next = new Set(prev[kind] as Set<string>);
      if (val) next.delete(val);
      return { ...prev, [kind]: next };
    });
  };

  const toggleSet = (kind: "responsavelIds" | "areaIds" | "categorias", val: string) => {
    setFilters(prev => {
      const next = new Set(prev[kind]);
      if (next.has(val)) next.delete(val); else next.add(val);
      return { ...prev, [kind]: next };
    });
  };

  return (
    <div className="space-y-2">
      {/* Linha 1: Filtros + Segmented (compactos) */}
      <div className="flex items-center gap-1.5">
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0 h-8 px-2.5 gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="text-xs">Filtros</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[9px] ml-0.5">{activeFilterCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col">
            <SheetHeader className="px-4 py-3 border-b">
              <SheetTitle className="text-base flex items-center justify-between">
                Filtros
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
                    Limpar tudo
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-5">
                {/* Status */}
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Status</h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {STATUS_OPTIONS.map(s => {
                      const active = filters.status === s.value;
                      const Icon = s.icon;
                      return (
                        <button
                          key={s.value}
                          onClick={() => setFilters(p => ({ ...p, status: s.value }))}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors",
                            active
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card hover:bg-muted/50 text-foreground border-border"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Responsáveis */}
                {responsaveis.length > 0 && (
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Responsáveis</h4>
                    <div className="flex flex-wrap gap-2">
                      {responsaveis.map(r => {
                        const active = filters.responsavelIds.has(r.id);
                        return (
                          <button
                            key={r.id}
                            onClick={() => toggleSet("responsavelIds", r.id)}
                            className={cn(
                              "flex items-center gap-1.5 rounded-full border pl-1 pr-3 py-1 text-xs transition-all",
                              active ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/40"
                            )}
                          >
                            <span
                              className="h-5 w-5 rounded-full ring-1 ring-background shrink-0"
                              style={{ backgroundColor: r.cor }}
                            />
                            <span className="truncate max-w-[120px]">{r.apelido || r.nome}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Áreas */}
                {areas.length > 0 && (
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Áreas</h4>
                    <div className="space-y-1">
                      {areas.map(a => (
                        <label key={a.id} className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/40 cursor-pointer">
                          <Checkbox
                            checked={filters.areaIds.has(a.id)}
                            onCheckedChange={() => toggleSet("areaIds", a.id)}
                          />
                          <span className="text-sm flex-1">{a.nome}</span>
                        </label>
                      ))}
                    </div>
                  </section>
                )}

                {/* Categorias */}
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Categorias</h4>
                  <div className="flex flex-wrap gap-2">
                    {OPERATION_CATEGORIES.map(c => {
                      const active = filters.categorias.has(c.value);
                      return (
                        <button
                          key={c.value}
                          onClick={() => toggleSet("categorias", c.value)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                            active ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/40"
                          )}
                        >
                          <span className="text-base leading-none">{c.emoji}</span>
                          <span>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            </ScrollArea>

            <div className="border-t p-3">
              <Button className="w-full h-11" onClick={() => setFiltersOpen(false)}>
                Aplicar ({filteredOps.length} {filteredOps.length === 1 ? "projeto" : "projetos"})
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Segmented compacto (icon-only) */}
        <div className="flex-1 flex items-center justify-end gap-0.5 p-0.5 bg-muted rounded-md">
          <SegBtn active={view === "cards"} onClick={() => setView("cards")} icon={LayoutGrid} label="Cards" />
          <SegBtn active={view === "agenda"} onClick={() => setView("agenda")} icon={CalendarDays} label="Agenda" />
          <SegBtn active={view === "gantt"} onClick={() => setView("gantt")} icon={BarChart3} label="Gantt" />
        </div>
      </div>

      {/* Linha 2: chips ativos (só aparece se houver) */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
          {filters.status !== "all" && (
            <FilterChip label={STATUS_STYLE[filters.status]?.label || filters.status} onRemove={() => removeChip("status")} />
          )}
          {Array.from(filters.responsavelIds).map(id => {
            const r = responsaveis.find(x => x.id === id);
            if (!r) return null;
            return <FilterChip key={id} label={r.apelido || r.nome} color={r.cor} onRemove={() => removeChip("responsavelIds", id)} />;
          })}
          {Array.from(filters.areaIds).map(id => {
            const a = areas.find(x => x.id === id);
            if (!a) return null;
            return <FilterChip key={id} label={a.nome} onRemove={() => removeChip("areaIds", id)} />;
          })}
          {Array.from(filters.categorias).map(v => {
            const c = OPERATION_CATEGORIES.find(x => x.value === v);
            if (!c) return null;
            return <FilterChip key={v} label={`${c.emoji} ${c.label}`} onRemove={() => removeChip("categorias", v)} />;
          })}
        </div>
      )}

      {/* View content */}
      {filteredOps.length === 0 ? (
        <EmptyState />
      ) : view === "cards" ? (
        <CardsView operations={filteredOps} tasks={tasks} onItemClick={onItemClick} onAddSubproject={onAddSubproject} onAddTask={onAddTask} />
      ) : view === "agenda" ? (
        <AgendaView operations={filteredOps} tasks={tasks} onItemClick={onItemClick} />
      ) : (
        <MiniGanttView operations={filteredOps} onItemClick={onItemClick} />
      )}
    </div>
  );
}

/* ---------- pieces ---------- */

function SegBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex items-center justify-center gap-1 px-2.5 h-7 rounded text-[11px] font-medium transition-all",
        active ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

function FilterChip({ label, color, onRemove }: { label: string; color?: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 pl-2 pr-1 py-1 text-[11px] font-medium"
    >
      {color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
      <span className="truncate max-w-[120px]">{label}</span>
      <X className="h-3 w-3 opacity-70" />
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border py-12 px-4 text-center">
      <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
      <p className="text-sm font-medium">Nenhum projeto encontrado</p>
      <p className="text-xs text-muted-foreground mt-1">Ajuste os filtros ou crie um novo projeto.</p>
    </div>
  );
}

/* ---------- Cards View (com layouts: lista, grade, kanban) ---------- */
type CardsLayout = "list" | "grid" | "kanban";

function CardsView({
  operations, tasks, onItemClick, onAddSubproject, onAddTask,
}: {
  operations: Operation[]; tasks: Task[];
  onItemClick: (id: string, type: "operation" | "sub-operation" | "task") => void;
  onAddSubproject: (parentId: string) => void;
  onAddTask: (stageId: string) => void;
}) {
  const [layout, setLayout] = useState<CardsLayout>("grid");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setExpanded(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const enriched = useMemo(() => operations.map(op => {
    const status = deriveOpStatus(op);
    const opTasks = tasks.filter(t => t.stage_id === op.id || (op.children || []).some(c => c.id === t.stage_id));
    const done = opTasks.filter(t => t.status === "concluida").length;
    const total = opTasks.length;
    const percent = total > 0 ? Math.round((done / total) * 100) : (op.progresso_percentual || 0);
    return { op, status, done, total, percent };
  }), [operations, tasks]);

  return (
    <div className="space-y-2">
      {/* Layout sub-toggle */}
      <div className="flex items-center justify-end gap-0.5">
        <LayoutBtn active={layout === "list"} onClick={() => setLayout("list")} icon={Rows3} label="Lista" />
        <LayoutBtn active={layout === "grid"} onClick={() => setLayout("grid")} icon={Grid2x2} label="Grade" />
        <LayoutBtn active={layout === "kanban"} onClick={() => setLayout("kanban")} icon={Columns3} label="Colunas" />
      </div>

      {layout === "kanban" ? (
        <KanbanCards enriched={enriched} onItemClick={onItemClick} />
      ) : (
        <div className={cn(layout === "grid" ? "grid grid-cols-2 gap-2" : "space-y-2")}>
          {enriched.map(({ op, status, done, total, percent }) => {
            const sty = STATUS_STYLE[status] || STATUS_STYLE.planejada;
            const color = getProjectColor(op.id);
            const emoji = getCategoryEmoji(op.categoria);
            const range = fmtRange(op.data_inicio_prevista, op.data_fim_prevista);
            const isExp = expanded.has(op.id);
            const subs = op.children || [];
            const compact = layout === "grid";

            return (
              <div
                key={op.id}
                className="relative bg-card rounded-xl border border-border shadow-sm overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />

                <button
                  onClick={() => onItemClick(op.id, "operation")}
                  className={cn("w-full text-left active:bg-muted/40", compact ? "pl-2.5 pr-2 pt-2 pb-1.5" : "pl-3.5 pr-3 pt-2.5 pb-1.5")}
                >
                  <div className="flex items-start gap-1.5">
                    <span className={cn("leading-none mt-0.5", compact ? "text-lg" : "text-xl")}>{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn("font-semibold leading-tight line-clamp-2", compact ? "text-[12px]" : "text-[14px]")}>{op.nome}</h3>
                      <span className={cn("inline-flex items-center font-medium px-1.5 py-0.5 rounded border mt-1", sty.cls, compact ? "text-[9px]" : "text-[10px]")}>
                        {sty.label}
                      </span>
                    </div>
                  </div>
                </button>

                {total > 0 && (
                  <div className={cn("pb-1.5", compact ? "px-2.5" : "px-3.5")}>
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
                      <span>{done}/{total}</span>
                      <span className="font-medium tabular-nums">{percent}%</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: color }} />
                    </div>
                  </div>
                )}

                <div className={cn("pb-2 flex items-center justify-between gap-1.5", compact ? "px-2.5" : "px-3.5")}>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground min-w-0">
                    {range && (
                      <span className="inline-flex items-center gap-0.5 truncate">
                        <CalendarDays className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{range}</span>
                      </span>
                    )}
                    {op.responsavel_id && !compact && (
                      <ResponsavelBadge responsavelId={op.responsavel_id} size="xs" />
                    )}
                  </div>
                  {subs.length > 0 && !compact && (
                    <button
                      onClick={() => toggle(op.id)}
                      className="text-[10px] font-medium text-muted-foreground inline-flex items-center gap-0.5 hover:text-foreground shrink-0"
                    >
                      {subs.length} {subs.length === 1 ? "etapa" : "etapas"}
                      {isExp ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </button>
                  )}
                  {compact && op.responsavel_id && (
                    <ResponsavelBadge responsavelId={op.responsavel_id} size="xs" />
                  )}
                </div>

                {isExp && subs.length > 0 && !compact && (
                  <div className="border-t border-border bg-muted/20 px-3 py-2 flex gap-1.5 overflow-x-auto no-scrollbar">
                    {subs.map(s => {
                      const ss = deriveOpStatus(s);
                      const ssty = STATUS_STYLE[ss] || STATUS_STYLE.planejada;
                      return (
                        <button
                          key={s.id}
                          onClick={() => onItemClick(s.id, "sub-operation")}
                          className="shrink-0 inline-flex items-center gap-1.5 bg-card border border-border rounded-full pl-1.5 pr-2.5 py-1 text-[11px] hover:bg-muted/60"
                        >
                          <span className={cn("h-2 w-2 rounded-full", ssty.cls.split(" ")[0])} />
                          <span className="truncate max-w-[140px]">{s.nome}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LayoutBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "h-7 w-7 inline-flex items-center justify-center rounded-md border transition-colors",
        active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

const KANBAN_COLS = [
  { key: "em_andamento", label: "Em andamento" },
  { key: "atrasada", label: "Atrasadas" },
  { key: "planejada", label: "Pendentes" },
  { key: "concluida", label: "Concluídas" },
  { key: "pausada", label: "Pausadas" },
] as const;

function KanbanCards({
  enriched, onItemClick,
}: {
  enriched: Array<{ op: Operation; status: string; done: number; total: number; percent: number }>;
  onItemClick: (id: string, type: "operation" | "sub-operation" | "task") => void;
}) {
  const buckets = useMemo(() => {
    const map = new Map<string, typeof enriched>();
    KANBAN_COLS.forEach(c => map.set(c.key, []));
    enriched.forEach(e => {
      const key = map.has(e.status) ? e.status : "planejada";
      map.get(key)!.push(e);
    });
    return map;
  }, [enriched]);

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-2 snap-x">
      {KANBAN_COLS.map(col => {
        const items = buckets.get(col.key) || [];
        const sty = STATUS_STYLE[col.key];
        return (
          <div key={col.key} className="shrink-0 w-[78vw] max-w-[280px] snap-start bg-muted/30 rounded-lg border border-border p-2 space-y-1.5">
            <div className="flex items-center justify-between px-1 pb-1 border-b border-border/60">
              <div className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", sty.cls.split(" ")[0])} />
                <span className="text-[11px] font-semibold uppercase tracking-wide">{col.label}</span>
              </div>
              <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">{items.length}</Badge>
            </div>
            {items.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-4">Nenhum projeto</p>
            ) : (
              items.map(({ op, percent, done, total }) => {
                const color = getProjectColor(op.id);
                const emoji = getCategoryEmoji(op.categoria);
                return (
                  <button
                    key={op.id}
                    onClick={() => onItemClick(op.id, "operation")}
                    className="relative w-full text-left bg-card rounded-md border border-border p-2 active:bg-muted/40 overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />
                    <div className="pl-1.5 flex items-start gap-1.5">
                      <span className="text-base leading-none mt-0.5">{emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium leading-tight line-clamp-2">{op.nome}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-[9px] text-muted-foreground">
                          {total > 0 && <span className="tabular-nums">{percent}%</span>}
                          {op.responsavel_id && <ResponsavelBadge responsavelId={op.responsavel_id} size="xs" />}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Agenda View ---------- */
function AgendaView({
  operations, tasks, onItemClick,
}: {
  operations: Operation[]; tasks: Task[];
  onItemClick: (id: string, type: "operation" | "sub-operation" | "task") => void;
}) {
  const items = useMemo(() => {
    const out: Array<{
      id: string; name: string; date: Date; rootId: string;
      categoria: string | null; status: string; responsavelId: string | null;
      type: "operation" | "sub-operation" | "task";
    }> = [];
    for (const op of operations) {
      const opDate = op.data_inicio_prevista || op.data_inicio_real || op.data_fim_prevista;
      if (opDate) {
        out.push({
          id: op.id, name: op.nome, date: new Date(opDate), rootId: op.id,
          categoria: op.categoria, status: deriveOpStatus(op),
          responsavelId: op.responsavel_id || null, type: "operation",
        });
      }
      for (const c of op.children || []) {
        const d = c.data_inicio_prevista || c.data_inicio_real || c.data_fim_prevista;
        if (!d) continue;
        out.push({
          id: c.id, name: c.nome, date: new Date(d), rootId: op.id,
          categoria: c.categoria || op.categoria, status: deriveOpStatus(c),
          responsavelId: c.responsavel_id || null, type: "sub-operation",
        });
      }
      for (const t of tasks) {
        if (t.stage_id !== op.id && !(op.children || []).some(c => c.id === t.stage_id)) continue;
        const d = t.data_prazo || t.data_inicio_prevista;
        if (!d) continue;
        out.push({
          id: t.id, name: t.titulo, date: new Date(d), rootId: op.id,
          categoria: op.categoria, status: t.status === "concluida" ? "concluida" : "planejada",
          responsavelId: t.responsavel_id || null, type: "task",
        });
      }
    }
    out.sort((a, b) => a.date.getTime() - b.date.getTime());
    return out;
  }, [operations, tasks]);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-10 px-4 text-center text-sm text-muted-foreground">
        Nenhum item com data nesta seleção.
      </div>
    );
  }

  // Group by month
  const groups = new Map<string, typeof items>();
  for (const it of items) {
    const k = format(it.date, "yyyy-MM");
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(it);
  }

  const currentMonthKey = format(new Date(), "yyyy-MM");
  const monthRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    const el = monthRefs.current.get(currentMonthKey);
    if (el) {
      el.scrollIntoView({ behavior: "auto", block: "start" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      {Array.from(groups.entries()).map(([k, arr]) => {
        const isCurrent = k === currentMonthKey;
        return (
          <div
            key={k}
            ref={(el) => { monthRefs.current.set(k, el); }}
            data-month={k}
          >
            <h4 className={cn(
              "sticky top-14 z-10 bg-background/95 backdrop-blur py-1 text-[10px] font-semibold uppercase tracking-wide",
              isCurrent ? "text-primary" : "text-muted-foreground"
            )}>
              {format(arr[0].date, "MMMM 'de' yyyy", { locale: ptBR })}
              {isCurrent && <span className="ml-1.5 text-[9px] font-normal normal-case">(atual)</span>}
            </h4>
            <div className="mt-1 divide-y divide-border/60 border border-border rounded-lg bg-card overflow-hidden">
              {arr.map(it => {
                const sty = STATUS_STYLE[it.status] || STATUS_STYLE.planejada;
                const color = getProjectColor(it.rootId);
                const today = isToday(it.date);
                const past = isBefore(it.date, new Date()) && it.status !== "concluida";
                return (
                  <button
                    key={it.id + it.type}
                    onClick={() => onItemClick(it.id, it.type)}
                    className="w-full flex items-center gap-2 text-left active:bg-muted/40 px-2 py-1.5"
                  >
                    <div className={cn(
                      "flex flex-col items-center justify-center w-8 shrink-0 rounded-md py-1",
                      today ? "bg-primary/10" : ""
                    )}>
                      <span className={cn(
                        "text-[13px] font-bold leading-none tabular-nums",
                        today ? "text-primary" : "text-foreground"
                      )}>
                        {format(it.date, "dd")}
                      </span>
                      <span className="text-[8px] uppercase text-muted-foreground mt-0.5">
                        {format(it.date, "EEE", { locale: ptBR })}
                      </span>
                    </div>
                    <span
                      className="w-0.5 self-stretch rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm leading-none">{getCategoryEmoji(it.categoria)}</span>
                        <p className="text-[12px] font-medium leading-tight line-clamp-1 flex-1">{it.name}</p>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className={cn("text-[9px] px-1 py-0 rounded border", sty.cls)}>
                          {sty.label}
                        </span>
                        {past && it.status !== "atrasada" && (
                          <span className="text-[9px] text-destructive font-medium">Atrasado</span>
                        )}
                      </div>
                    </div>
                    {it.responsavelId && (
                      <ResponsavelBadge responsavelId={it.responsavelId} size="xs" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Mini Gantt View ---------- */
type GanttZoom = "week" | "fortnight" | "month" | "quarter" | "year";

const ZOOM_LABEL: Record<GanttZoom, string> = {
  week: "Sem",
  fortnight: "15d",
  month: "Mês",
  quarter: "Tri",
  year: "Ano",
};

function MiniGanttView({
  operations, onItemClick,
}: {
  operations: Operation[];
  onItemClick: (id: string, type: "operation" | "sub-operation" | "task") => void;
}) {
  const [zoom, setZoom] = useState<GanttZoom>("month");

  const cfg = {
    week:      { cols: 8,  w: 70  },
    fortnight: { cols: 6,  w: 90  },
    month:     { cols: 12, w: 70  },
    quarter:   { cols: 8,  w: 90  },
    year:      { cols: 5,  w: 110 },
  }[zoom];

  // Determine timeline window
  const { start, columns, totalMs, totalWidth } = useMemo(() => {
    const now = new Date();
    let s: Date;
    let totalMs = 0;
    const cols: { label: string; date: Date }[] = [];
    if (zoom === "week") {
      // 8 semanas, começando 2 antes de hoje
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dow = today.getDay();
      const monday = addDays(today, -((dow + 6) % 7));
      s = addDays(monday, -2 * 7);
      for (let i = 0; i < cfg.cols; i++) {
        const d = addDays(s, i * 7);
        cols.push({ label: format(d, "dd/MM", { locale: ptBR }), date: d });
      }
      totalMs = cfg.cols * 7 * 24 * 60 * 60 * 1000;
    } else if (zoom === "fortnight") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      s = addDays(today, -30);
      for (let i = 0; i < cfg.cols; i++) {
        const d = addDays(s, i * 15);
        cols.push({ label: format(d, "dd/MM", { locale: ptBR }), date: d });
      }
      totalMs = cfg.cols * 15 * 24 * 60 * 60 * 1000;
    } else if (zoom === "month") {
      s = startOfMonth(addMonths(now, -3));
      for (let i = 0; i < cfg.cols; i++) {
        const d = addMonths(s, i);
        cols.push({ label: format(d, "MMM/yy", { locale: ptBR }), date: d });
      }
      totalMs = addMonths(s, cfg.cols).getTime() - s.getTime();
    } else if (zoom === "quarter") {
      s = startOfMonth(addMonths(now, -6));
      for (let i = 0; i < cfg.cols; i++) {
        const d = addMonths(s, i * 3);
        cols.push({ label: `T${Math.floor(d.getMonth()/3)+1}/${format(d, "yy")}`, date: d });
      }
      totalMs = addMonths(s, cfg.cols * 3).getTime() - s.getTime();
    } else {
      s = new Date(now.getFullYear() - 2, 0, 1);
      for (let i = 0; i < cfg.cols; i++) {
        const d = new Date(s.getFullYear() + i, 0, 1);
        cols.push({ label: format(d, "yyyy"), date: d });
      }
      totalMs = new Date(s.getFullYear() + cfg.cols, 0, 1).getTime() - s.getTime();
    }
    return { start: s, columns: cols, totalMs, totalWidth: cfg.cols * cfg.w };
  }, [zoom, cfg.cols, cfg.w]);

  const dayInWindow = (d: Date) => {
    const ms = d.getTime() - start.getTime();
    return Math.max(0, Math.min(1, ms / totalMs));
  };

  const todayPct = dayInWindow(new Date());

  return (
    <div className="space-y-2">
      {/* Zoom switcher slim */}
      <div className="flex items-center justify-end gap-0.5 p-0.5 bg-muted rounded-md w-fit ml-auto">
        {(["week", "fortnight", "month", "quarter", "year"] as GanttZoom[]).map(z => (
          <button
            key={z}
            onClick={() => setZoom(z)}
            className={cn(
              "text-[10px] font-medium px-2 h-6 rounded transition-all",
              zoom === z ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            )}
          >
            {ZOOM_LABEL[z]}
          </button>
        ))}
      </div>

      <div className="border border-border rounded-lg overflow-x-auto bg-card">
        <div style={{ width: totalWidth, minWidth: "100%" }}>
          {/* Header */}
          <div className="flex border-b border-border sticky top-0 bg-card z-10">
            {columns.map((c, i) => (
              <div
                key={i}
                className="text-[10px] font-medium text-muted-foreground text-center py-1.5 border-r border-border last:border-r-0"
                style={{ width: cfg.w, flexShrink: 0 }}
              >
                {c.label}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="relative">
            {/* Today line */}
            {todayPct >= 0 && todayPct <= 1 && (
              <div
                className="absolute top-0 bottom-0 w-px bg-destructive/60 z-10 pointer-events-none"
                style={{ left: `${todayPct * 100}%` }}
              />
            )}

            {operations.map(op => {
              const sPrev = op.data_inicio_prevista ? new Date(op.data_inicio_prevista) : null;
              const ePrev = op.data_fim_prevista ? new Date(op.data_fim_prevista) : null;
              const status = deriveOpStatus(op);
              const color = getProjectColor(op.id);
              const emoji = getCategoryEmoji(op.categoria);

              let leftPct = 0, widthPct = 0, hasBar = false;
              if (sPrev && ePrev) {
                const a = dayInWindow(sPrev);
                const b = dayInWindow(ePrev);
                if (b > 0 && a < 1) {
                  leftPct = a;
                  widthPct = Math.max(0.02, b - a);
                  hasBar = true;
                }
              }

              return (
                <div
                  key={op.id}
                  className="relative h-12 border-b border-border last:border-b-0 hover:bg-muted/30"
                >
                  {hasBar ? (
                    <button
                      onClick={() => onItemClick(op.id, "operation")}
                      className="absolute top-1.5 bottom-1.5 rounded-md flex items-center px-2 gap-1.5 text-white text-[11px] font-medium shadow-sm hover:brightness-110 transition-all overflow-hidden"
                      style={{
                        left: `${leftPct * 100}%`,
                        width: `${widthPct * 100}%`,
                        backgroundColor: color,
                        opacity: status === "concluida" ? 0.7 : 1,
                      }}
                    >
                      <span className="leading-none">{emoji}</span>
                      <span className="truncate">{op.nome}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onItemClick(op.id, "operation")}
                      className="absolute inset-0 flex items-center px-3 text-[11px] text-muted-foreground italic"
                    >
                      <span className="mr-1.5">{emoji}</span>
                      <span className="truncate">{op.nome}</span>
                      <span className="ml-2 text-[9px]">(sem datas)</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Toque na barra para abrir o projeto. Linha vermelha = hoje.
      </p>
    </div>
  );
}
