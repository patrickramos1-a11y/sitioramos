import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Plus, SlidersHorizontal, X, MoreVertical,
  CalendarDays, Flag, AlertTriangle, Folder, User, Inbox,
} from "lucide-react";
import type { Task } from "@/hooks/useTasks";
import type { Operation } from "@/hooks/useOperations";
import { useResponsaveis } from "@/hooks/useResponsaveis";
import { cn } from "@/lib/utils";

interface Props {
  tasks: Task[];
  operations: Operation[];
  onCreate: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
}

type Grouping = "projeto" | "prazo" | "responsavel" | "lista";
type StatusFilter = "ativas" | "pendentes" | "andamento" | "atrasadas" | "concluidas" | "all";
type PrazoFilter = "all" | "atrasadas" | "hoje" | "semana" | "mes" | "sem_prazo";

const PRIORIDADES: Record<string, { label: string; cls: string }> = {
  baixa: { label: "Baixa", cls: "text-muted-foreground" },
  media: { label: "Média", cls: "text-foreground" },
  alta: { label: "Alta", cls: "text-amber-600" },
  critica: { label: "Crítica", cls: "text-destructive" },
};

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ativas", label: "Ativas" },
  { value: "pendentes", label: "Pendentes" },
  { value: "andamento", label: "Em andamento" },
  { value: "atrasadas", label: "Atrasadas" },
  { value: "concluidas", label: "Concluídas" },
  { value: "all", label: "Todas" },
];

const PRAZO_OPTIONS: { value: PrazoFilter; label: string }[] = [
  { value: "all", label: "Qualquer" },
  { value: "atrasadas", label: "Atrasadas" },
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Próx. 7 dias" },
  { value: "mes", label: "Próx. 30 dias" },
  { value: "sem_prazo", label: "Sem prazo" },
];

const todayISO = () => new Date().toISOString().split("T")[0];
const isPast = (d: string | null) => !!d && d < todayISO();
const isToday = (d: string | null) => d === todayISO();
const daysFromNow = (d: string | null) => {
  if (!d) return null;
  const ms = new Date(d).getTime() - new Date(todayISO()).getTime();
  return Math.round(ms / 86400000);
};
function formatPrazo(d: string | null) {
  if (!d) return "Sem prazo";
  const diff = daysFromNow(d)!;
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  if (diff < 0) return `${Math.abs(diff)}d atrás`;
  if (diff <= 7) return `em ${diff}d`;
  return new Date(d).toLocaleDateString("pt-BR");
}

export function MobileTasksView({ tasks, operations, onCreate, onEdit, onDelete, onToggleComplete }: Props) {
  const { data: responsaveis = [] } = useResponsaveis();

  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fStatus, setFStatus] = useState<StatusFilter>("ativas");
  const [fPrioridade, setFPrioridade] = useState<Set<string>>(new Set());
  const [fResponsaveis, setFResponsaveis] = useState<Set<string>>(new Set()); // "__none__" allowed
  const [fParents, setFParents] = useState<Set<string>>(new Set()); // stage_id (op or sub) or "__none__"
  const [fPrazo, setFPrazo] = useState<PrazoFilter>("all");
  const [grouping, setGrouping] = useState<Grouping>("projeto");

  const stageMap = useMemo(() => {
    const m = new Map<string, { projetoNome: string; subNome: string | null; projetoId: string }>();
    for (const op of operations) {
      m.set(op.id, { projetoNome: op.nome, subNome: null, projetoId: op.id });
      for (const sub of op.children || []) {
        m.set(sub.id, { projetoNome: op.nome, subNome: sub.nome, projetoId: op.id });
      }
    }
    return m;
  }, [operations]);

  const respMap = useMemo(() => {
    const m = new Map<string, { nome: string; cor: string }>();
    for (const r of responsaveis) m.set(r.id, { nome: r.apelido || r.nome, cor: r.cor });
    return m;
  }, [responsaveis]);

  const filtered = useMemo(() => {
    const today = todayISO();
    const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndISO = weekEnd.toISOString().split("T")[0];
    const monthEnd = new Date(); monthEnd.setDate(monthEnd.getDate() + 30);
    const monthEndISO = monthEnd.toISOString().split("T")[0];

    return tasks.filter(t => {
      if (search && !`${t.titulo} ${t.descricao || ""}`.toLowerCase().includes(search.toLowerCase())) return false;

      if (fStatus === "ativas" && (t.status === "concluida" || t.status === "cancelada")) return false;
      if (fStatus === "pendentes" && t.status !== "pendente") return false;
      if (fStatus === "andamento" && t.status !== "em_andamento") return false;
      if (fStatus === "concluidas" && t.status !== "concluida") return false;
      if (fStatus === "atrasadas" && !(t.data_prazo && isPast(t.data_prazo) && t.status !== "concluida" && t.status !== "cancelada")) return false;

      if (fPrioridade.size > 0 && !fPrioridade.has(t.prioridade || "media")) return false;

      if (fResponsaveis.size > 0) {
        const key = t.responsavel_id || "__none__";
        if (!fResponsaveis.has(key)) return false;
      }

      if (fParents.size > 0) {
        if (!t.stage_id) {
          if (!fParents.has("__none__")) return false;
        } else {
          const info = stageMap.get(t.stage_id);
          const matchesDirect = fParents.has(t.stage_id);
          const matchesProjeto = info ? fParents.has(info.projetoId) : false;
          if (!matchesDirect && !matchesProjeto) return false;
        }
      }

      if (fPrazo !== "all") {
        const p = t.data_prazo;
        if (fPrazo === "sem_prazo" && p) return false;
        if (fPrazo === "atrasadas" && !(p && p < today)) return false;
        if (fPrazo === "hoje" && p !== today) return false;
        if (fPrazo === "semana" && !(p && p >= today && p <= weekEndISO)) return false;
        if (fPrazo === "mes" && !(p && p >= today && p <= monthEndISO)) return false;
      }

      return true;
    });
  }, [tasks, search, fStatus, fPrioridade, fResponsaveis, fParents, fPrazo, stageMap]);

  // KPIs sobre todas as tarefas (não filtradas)
  const today = todayISO();
  const total = tasks.length;
  const pendentes = tasks.filter(t => t.status === "pendente").length;
  const andamento = tasks.filter(t => t.status === "em_andamento").length;
  const atrasadas = tasks.filter(t => t.data_prazo && isPast(t.data_prazo) && t.status !== "concluida" && t.status !== "cancelada").length;
  const concluidasHoje = tasks.filter(t => t.status === "concluida" && t.data_conclusao === today).length;

  const groups = useMemo(() => {
    if (grouping === "lista") return [{ key: "Todas", label: "Todas", items: filtered }];

    if (grouping === "projeto") {
      const g = new Map<string, { label: string; items: Task[] }>();
      for (const t of filtered) {
        const info = t.stage_id ? stageMap.get(t.stage_id) : null;
        const label = info ? `${info.projetoNome}${info.subNome ? ` › ${info.subNome}` : ""}` : "Sem projeto";
        const key = t.stage_id || "__none__";
        if (!g.has(key)) g.set(key, { label, items: [] });
        g.get(key)!.items.push(t);
      }
      return Array.from(g.entries())
        .sort((a, b) => a[1].label.localeCompare(b[1].label))
        .map(([key, v]) => ({ key, label: v.label, items: v.items }));
    }

    if (grouping === "responsavel") {
      const g = new Map<string, { label: string; items: Task[] }>();
      for (const t of filtered) {
        const r = t.responsavel_id ? respMap.get(t.responsavel_id) : null;
        const key = t.responsavel_id || "__none__";
        const label = r?.nome || "Sem responsável";
        if (!g.has(key)) g.set(key, { label, items: [] });
        g.get(key)!.items.push(t);
      }
      return Array.from(g.entries())
        .sort((a, b) => a[1].label.localeCompare(b[1].label))
        .map(([key, v]) => ({ key, label: v.label, items: v.items }));
    }

    const buckets: Record<string, Task[]> = {
      Atrasadas: [], Hoje: [], Amanhã: [], "Esta semana": [], "Mais tarde": [], "Sem prazo": [],
    };
    const todayD = todayISO();
    const week = new Date(); week.setDate(week.getDate() + 7);
    const weekISO = week.toISOString().split("T")[0];
    for (const t of filtered) {
      const p = t.data_prazo;
      if (!p) buckets["Sem prazo"].push(t);
      else if (p < todayD && t.status !== "concluida") buckets.Atrasadas.push(t);
      else if (p === todayD) buckets.Hoje.push(t);
      else if (daysFromNow(p) === 1) buckets["Amanhã"].push(t);
      else if (p <= weekISO) buckets["Esta semana"].push(t);
      else buckets["Mais tarde"].push(t);
    }
    return Object.entries(buckets)
      .filter(([, items]) => items.length > 0)
      .map(([key, items]) => ({ key, label: key, items }));
  }, [filtered, grouping, stageMap, respMap]);

  const activeFilterCount =
    (fStatus !== "ativas" ? 1 : 0) +
    fPrioridade.size +
    fResponsaveis.size +
    fParents.size +
    (fPrazo !== "all" ? 1 : 0);

  const toggleSet = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    val: string,
  ) => {
    setter(prev => {
      const n = new Set(prev);
      n.has(val) ? n.delete(val) : n.add(val);
      return n;
    });
  };

  const clearAll = () => {
    setFStatus("ativas");
    setFPrioridade(new Set());
    setFResponsaveis(new Set());
    setFParents(new Set());
    setFPrazo("all");
  };

  return (
    <div className="space-y-2">
      {/* Toolbar compacta: busca + filtros + add */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-7 h-9 text-sm"
          />
        </div>
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0 h-9 px-2.5 gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[9px]">{activeFilterCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col">
            <SheetHeader className="px-4 py-3 border-b">
              <SheetTitle className="text-base flex items-center justify-between">
                Filtros de tarefas
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
                    Limpar tudo
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-5">
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Status</h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {STATUS_OPTIONS.map(s => {
                      const active = fStatus === s.value;
                      return (
                        <button
                          key={s.value}
                          onClick={() => setFStatus(s.value)}
                          className={cn(
                            "rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors",
                            active ? "bg-primary text-primary-foreground border-primary"
                                   : "bg-card hover:bg-muted/50 text-foreground border-border",
                          )}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Prioridade</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(PRIORIDADES).map(([k, v]) => {
                      const active = fPrioridade.has(k);
                      return (
                        <button
                          key={k}
                          onClick={() => toggleSet(setFPrioridade, k)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs transition-colors",
                            active ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/40",
                            v.cls,
                          )}
                        >
                          {v.label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {responsaveis.length > 0 && (
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Responsáveis</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleSet(setFResponsaveis, "__none__")}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs transition-colors",
                          fResponsaveis.has("__none__") ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/40",
                        )}
                      >
                        Sem responsável
                      </button>
                      {responsaveis.map(r => {
                        const active = fResponsaveis.has(r.id);
                        return (
                          <button
                            key={r.id}
                            onClick={() => toggleSet(setFResponsaveis, r.id)}
                            className={cn(
                              "flex items-center gap-1.5 rounded-full border pl-1 pr-3 py-1 text-xs transition-all",
                              active ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/40",
                            )}
                          >
                            <span className="h-5 w-5 rounded-full ring-1 ring-background shrink-0" style={{ backgroundColor: r.cor }} />
                            <span className="truncate max-w-[120px]">{r.apelido || r.nome}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {operations.length > 0 && (
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Projeto</h4>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/40 cursor-pointer">
                        <Checkbox
                          checked={fParents.has("__none__")}
                          onCheckedChange={() => toggleSet(setFParents, "__none__")}
                        />
                        <span className="text-sm flex-1 text-muted-foreground">Sem projeto</span>
                      </label>
                      {operations.map(op => (
                        <div key={op.id} className="space-y-1">
                          <label className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/40 cursor-pointer">
                            <Checkbox
                              checked={fParents.has(op.id)}
                              onCheckedChange={() => toggleSet(setFParents, op.id)}
                            />
                            <span className="text-sm font-medium flex-1 truncate">📁 {op.nome}</span>
                          </label>
                          {(op.children || []).map(sub => (
                            <label key={sub.id} className="flex items-center gap-2 px-2 py-1.5 pl-8 rounded-md hover:bg-muted/40 cursor-pointer">
                              <Checkbox
                                checked={fParents.has(sub.id)}
                                onCheckedChange={() => toggleSet(setFParents, sub.id)}
                              />
                              <span className="text-xs flex-1 truncate text-muted-foreground">↳ {sub.nome}</span>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Prazo</h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PRAZO_OPTIONS.map(p => {
                      const active = fPrazo === p.value;
                      return (
                        <button
                          key={p.value}
                          onClick={() => setFPrazo(p.value)}
                          className={cn(
                            "rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors",
                            active ? "bg-primary text-primary-foreground border-primary"
                                   : "bg-card hover:bg-muted/50 text-foreground border-border",
                          )}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            </ScrollArea>

            <div className="border-t p-3">
              <Button className="w-full h-11" onClick={() => setFiltersOpen(false)}>
                Aplicar ({filtered.length} {filtered.length === 1 ? "tarefa" : "tarefas"})
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <Button onClick={onCreate} size="icon" className="shrink-0 h-9 w-9" aria-label="Nova tarefa">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Chips ativos */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
          {fStatus !== "ativas" && (
            <Chip label={STATUS_OPTIONS.find(s => s.value === fStatus)?.label || fStatus} onRemove={() => setFStatus("ativas")} />
          )}
          {Array.from(fPrioridade).map(p => (
            <Chip key={`p-${p}`} label={PRIORIDADES[p]?.label || p} onRemove={() => toggleSet(setFPrioridade, p)} />
          ))}
          {Array.from(fResponsaveis).map(id => {
            if (id === "__none__") return <Chip key="r-none" label="Sem resp." onRemove={() => toggleSet(setFResponsaveis, id)} />;
            const r = respMap.get(id);
            if (!r) return null;
            return <Chip key={`r-${id}`} label={r.nome} color={r.cor} onRemove={() => toggleSet(setFResponsaveis, id)} />;
          })}
          {Array.from(fParents).map(id => {
            if (id === "__none__") return <Chip key="par-none" label="Sem projeto" onRemove={() => toggleSet(setFParents, id)} />;
            const info = stageMap.get(id);
            const label = info ? `${info.projetoNome}${info.subNome ? ` › ${info.subNome}` : ""}` : id;
            return <Chip key={`par-${id}`} label={label} onRemove={() => toggleSet(setFParents, id)} />;
          })}
          {fPrazo !== "all" && (
            <Chip label={PRAZO_OPTIONS.find(p => p.value === fPrazo)?.label || fPrazo} onRemove={() => setFPrazo("all")} />
          )}
        </div>
      )}

      {/* KPIs compactos */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar text-[11px] -mx-1 px-1 py-1">
        <Kpi label="Total" value={total} />
        <Sep />
        <Kpi label="Pend." value={pendentes} />
        <Sep />
        <Kpi label="Andam." value={andamento} valueClass="text-primary" />
        <Sep />
        <Kpi label="Atras." value={atrasadas} valueClass="text-destructive" />
        <Sep />
        <Kpi label="Hoje ✓" value={concluidasHoje} valueClass="text-success" />
      </div>

      {/* Agrupar por */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
        <span className="text-[11px] text-muted-foreground shrink-0">Agrupar:</span>
        {(["projeto", "prazo", "responsavel", "lista"] as Grouping[]).map(g => {
          const active = grouping === g;
          const label = g === "projeto" ? "Projeto" : g === "prazo" ? "Prazo" : g === "responsavel" ? "Resp." : "Lista";
          return (
            <button
              key={g}
              onClick={() => setGrouping(g)}
              className={cn(
                "shrink-0 h-7 px-3 rounded-full text-[11px] font-medium border transition-colors",
                active ? "bg-primary text-primary-foreground border-primary"
                       : "bg-card text-foreground border-border hover:bg-muted/50",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/10">
          <div className="rounded-full bg-muted p-4 mb-3">
            <Inbox className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-sm">Nenhuma tarefa encontrada</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {tasks.length === 0 ? "Comece criando a primeira tarefa." : "Ajuste os filtros para ver outras tarefas."}
          </p>
          <Button onClick={onCreate} size="sm"><Plus className="h-4 w-4 mr-1" />Nova tarefa</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(g => (
            <div key={g.key} className="space-y-1.5">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground truncate">{g.label}</h3>
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{g.items.length}</Badge>
              </div>
              <div className="border rounded-lg divide-y bg-card">
                {g.items.map(t => {
                  const done = t.status === "concluida";
                  const overdue = t.data_prazo && isPast(t.data_prazo) && !done;
                  const stage = t.stage_id ? stageMap.get(t.stage_id) : null;
                  const resp = t.responsavel_id ? respMap.get(t.responsavel_id) : null;
                  const prioridade = PRIORIDADES[t.prioridade || "media"] || PRIORIDADES.media;
                  return (
                    <div key={t.id} className="flex items-start gap-2 p-2.5 active:bg-muted/40 transition-colors">
                      <Checkbox checked={done} onCheckedChange={() => onToggleComplete(t)} className="mt-0.5" />
                      <button type="button" onClick={() => onEdit(t)} className="flex-1 text-left min-w-0">
                        <div className={cn("text-sm font-medium leading-tight", done && "line-through text-muted-foreground")}>
                          {t.titulo}
                        </div>
                        {t.descricao && (
                          <div className="text-xs text-muted-foreground truncate mt-0.5">{t.descricao}</div>
                        )}
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {stage && (
                            <Badge variant="secondary" className="h-5 text-[10px] gap-1 max-w-[180px]">
                              <Folder className="h-3 w-3 shrink-0" />
                              <span className="truncate">{stage.projetoNome}{stage.subNome ? ` › ${stage.subNome}` : ""}</span>
                            </Badge>
                          )}
                          {resp && (
                            <Badge variant="outline" className="h-5 text-[10px] gap-1" style={{ borderColor: resp.cor, color: resp.cor }}>
                              <User className="h-3 w-3" />
                              {resp.nome}
                            </Badge>
                          )}
                          {t.data_prazo && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "h-5 text-[10px] gap-1",
                                overdue ? "border-destructive text-destructive"
                                : isToday(t.data_prazo) ? "border-amber-500 text-amber-600" : "",
                              )}
                            >
                              {overdue ? <AlertTriangle className="h-3 w-3" /> : <CalendarDays className="h-3 w-3" />}
                              {formatPrazo(t.data_prazo)}
                            </Badge>
                          )}
                          {t.prioridade && t.prioridade !== "media" && (
                            <Badge variant="outline" className={cn("h-5 text-[10px] gap-1", prioridade.cls)}>
                              <Flag className="h-3 w-3" />
                              {prioridade.label}
                            </Badge>
                          )}
                        </div>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(t)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(t)} className="text-destructive">Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ label, color, onRemove }: { label: string; color?: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 pl-2 pr-1 py-1 text-[11px] font-medium"
    >
      {color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
      <span className="truncate max-w-[140px]">{label}</span>
      <X className="h-3 w-3 opacity-70" />
    </button>
  );
}

function Kpi({ label, value, valueClass }: { label: string; value: number; valueClass?: string }) {
  return (
    <div className="shrink-0 inline-flex items-baseline gap-1">
      <span className={cn("font-semibold text-sm", valueClass)}>{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function Sep() {
  return <span className="shrink-0 text-muted-foreground/40">·</span>;
}
