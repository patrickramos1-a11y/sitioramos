import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  CheckSquare, Search, Plus, MoreVertical, CalendarDays, Flag,
  AlertTriangle, Folder, User, Inbox,
} from "lucide-react";
import type { Task } from "@/hooks/useTasks";
import type { Operation } from "@/hooks/useOperations";
import { useResponsaveis } from "@/hooks/useResponsaveis";

interface Props {
  tasks: Task[];
  operations: Operation[];
  onCreate: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
}

type Grouping = "projeto" | "prazo" | "responsavel" | "lista";

const PRIORIDADES: Record<string, { label: string; cls: string }> = {
  baixa: { label: "Baixa", cls: "text-muted-foreground" },
  media: { label: "Média", cls: "text-foreground" },
  alta: { label: "Alta", cls: "text-amber-600" },
  critica: { label: "Crítica", cls: "text-destructive" },
};

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

export function TasksBoard({ tasks, operations, onCreate, onEdit, onDelete, onToggleComplete }: Props) {
  const { data: responsaveis = [] } = useResponsaveis();

  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState<string>("ativas");
  const [fPrioridade, setFPrioridade] = useState<string>("all");
  const [fResponsavel, setFResponsavel] = useState<string>("all");
  const [fParent, setFParent] = useState<string>("all");
  const [fPrazo, setFPrazo] = useState<string>("all");
  const [grouping, setGrouping] = useState<Grouping>("projeto");

  // mapa stage_id -> {projetoNome, subNome|null}
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

  // parentOptions hierárquico para select
  const parentOptions = useMemo(
    () =>
      operations.map(o => ({
        id: o.id,
        nome: o.nome,
        children: (o.children || []).map(c => ({ id: c.id, nome: c.nome })),
      })),
    [operations]
  );

  const filtered = useMemo(() => {
    const today = todayISO();
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndISO = weekEnd.toISOString().split("T")[0];
    const monthEnd = new Date();
    monthEnd.setDate(monthEnd.getDate() + 30);
    const monthEndISO = monthEnd.toISOString().split("T")[0];

    return tasks.filter(t => {
      if (search && !`${t.titulo} ${t.descricao || ""}`.toLowerCase().includes(search.toLowerCase())) return false;

      if (fStatus === "ativas" && (t.status === "concluida" || t.status === "cancelada")) return false;
      if (fStatus === "pendentes" && t.status !== "pendente") return false;
      if (fStatus === "andamento" && t.status !== "em_andamento") return false;
      if (fStatus === "concluidas" && t.status !== "concluida") return false;
      if (fStatus === "atrasadas" && !(t.data_prazo && isPast(t.data_prazo) && t.status !== "concluida" && t.status !== "cancelada")) return false;

      if (fPrioridade !== "all" && (t.prioridade || "media") !== fPrioridade) return false;
      if (fResponsavel !== "all" && (t.responsavel_id || "__none__") !== fResponsavel) return false;

      if (fParent !== "all") {
        if (fParent === "__none__") {
          if (t.stage_id) return false;
        } else {
          // pode ser projeto ou subprojeto. Aceita match direto ou se tarefa está em subprojeto cujo pai é fParent.
          const info = t.stage_id ? stageMap.get(t.stage_id) : null;
          if (!info) return false;
          if (t.stage_id !== fParent && info.projetoId !== fParent) return false;
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
  }, [tasks, search, fStatus, fPrioridade, fResponsavel, fParent, fPrazo, stageMap]);

  // KPIs
  const today = todayISO();
  const total = tasks.length;
  const pendentes = tasks.filter(t => t.status === "pendente").length;
  const andamento = tasks.filter(t => t.status === "em_andamento").length;
  const atrasadas = tasks.filter(t => t.data_prazo && isPast(t.data_prazo) && t.status !== "concluida" && t.status !== "cancelada").length;
  const concluidasHoje = tasks.filter(t => t.status === "concluida" && t.data_conclusao === today).length;

  // Agrupamento
  const groups = useMemo(() => {
    if (grouping === "lista") return [{ key: "Todas", label: "Todas", items: filtered }];

    if (grouping === "projeto") {
      const g = new Map<string, { label: string; items: Task[]; sortKey: string }>();
      for (const t of filtered) {
        const info = t.stage_id ? stageMap.get(t.stage_id) : null;
        const label = info
          ? `${info.projetoNome}${info.subNome ? ` › ${info.subNome}` : ""}`
          : "Sem projeto";
        const key = t.stage_id || "__none__";
        if (!g.has(key)) g.set(key, { label, items: [], sortKey: label });
        g.get(key)!.items.push(t);
      }
      return Array.from(g.entries())
        .sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey))
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

    // prazo
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

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={onCreate} className="gap-1">
            <Plus className="h-4 w-4" /> Tarefa
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ativas">Ativas</SelectItem>
              <SelectItem value="pendentes">Pendentes</SelectItem>
              <SelectItem value="andamento">Em andamento</SelectItem>
              <SelectItem value="atrasadas">Atrasadas</SelectItem>
              <SelectItem value="concluidas">Concluídas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fPrioridade} onValueChange={setFPrioridade}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas prioridades</SelectItem>
              {Object.entries(PRIORIDADES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fResponsavel} onValueChange={setFResponsavel}>
            <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Responsável" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos responsáveis</SelectItem>
              <SelectItem value="__none__">Sem responsável</SelectItem>
              {responsaveis.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.apelido || r.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fParent} onValueChange={setFParent}>
            <SelectTrigger className="w-[200px] h-9"><SelectValue placeholder="Projeto" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">Todos os projetos</SelectItem>
              <SelectItem value="__none__">Sem projeto</SelectItem>
              {parentOptions.map(p => [
                <SelectItem key={p.id} value={p.id} className="font-medium">📁 {p.nome}</SelectItem>,
                ...(p.children || []).map(c => (
                  <SelectItem key={c.id} value={c.id} className="pl-8 text-xs">↳ {c.nome}</SelectItem>
                )),
              ])}
            </SelectContent>
          </Select>
          <Select value={fPrazo} onValueChange={setFPrazo}>
            <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Prazo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer prazo</SelectItem>
              <SelectItem value="atrasadas">Atrasadas</SelectItem>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Próx. 7 dias</SelectItem>
              <SelectItem value="mes">Próx. 30 dias</SelectItem>
              <SelectItem value="sem_prazo">Sem prazo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline">Total: <span className="ml-1 font-semibold">{total}</span></Badge>
        <Badge variant="outline">Pendentes: <span className="ml-1 font-semibold">{pendentes}</span></Badge>
        <Badge variant="outline">Em andamento: <span className="ml-1 font-semibold text-primary">{andamento}</span></Badge>
        <Badge variant="outline" className="border-destructive/40">Atrasadas: <span className="ml-1 font-semibold text-destructive">{atrasadas}</span></Badge>
        <Badge variant="outline">Concluídas hoje: <span className="ml-1 font-semibold text-success">{concluidasHoje}</span></Badge>
      </div>

      {/* Agrupamento */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Agrupar por:</span>
        {(["projeto", "prazo", "responsavel", "lista"] as Grouping[]).map(g => (
          <Button
            key={g}
            type="button"
            size="sm"
            variant={grouping === g ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => setGrouping(g)}
          >
            {g === "projeto" ? "Projeto" : g === "prazo" ? "Prazo" : g === "responsavel" ? "Responsável" : "Lista plana"}
          </Button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/10">
          <div className="rounded-full bg-muted p-4 mb-3">
            <Inbox className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-medium">Nenhuma tarefa encontrada</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {tasks.length === 0 ? "Comece criando a primeira tarefa." : "Ajuste os filtros para ver outras tarefas."}
          </p>
          <Button onClick={onCreate} size="sm"><Plus className="h-4 w-4 mr-1" />Nova tarefa</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(g => (
            <div key={g.key} className="space-y-1.5">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</h3>
                <Badge variant="secondary" className="h-5 text-[10px]">{g.items.length}</Badge>
              </div>
              <div className="border rounded-lg divide-y bg-card">
                {g.items.map(t => {
                  const done = t.status === "concluida";
                  const overdue = t.data_prazo && isPast(t.data_prazo) && !done;
                  const stage = t.stage_id ? stageMap.get(t.stage_id) : null;
                  const resp = t.responsavel_id ? respMap.get(t.responsavel_id) : null;
                  const prioridade = PRIORIDADES[t.prioridade || "media"] || PRIORIDADES.media;

                  return (
                    <div key={t.id} className="flex items-start gap-2 p-2.5 hover:bg-muted/30 transition-colors">
                      <Checkbox
                        checked={done}
                        onCheckedChange={() => onToggleComplete(t)}
                        className="mt-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => onEdit(t)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className={`text-sm font-medium leading-tight ${done ? "line-through text-muted-foreground" : ""}`}>
                          {t.titulo}
                        </div>
                        {t.descricao && (
                          <div className="text-xs text-muted-foreground truncate mt-0.5">{t.descricao}</div>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {stage && (
                            <Badge variant="secondary" className="h-5 text-[10px] gap-1">
                              <Folder className="h-3 w-3" />
                              {stage.projetoNome}{stage.subNome ? ` › ${stage.subNome}` : ""}
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
                              className={`h-5 text-[10px] gap-1 ${
                                overdue ? "border-destructive text-destructive"
                                : isToday(t.data_prazo) ? "border-amber-500 text-amber-600"
                                : ""
                              }`}
                            >
                              {overdue ? <AlertTriangle className="h-3 w-3" /> : <CalendarDays className="h-3 w-3" />}
                              {formatPrazo(t.data_prazo)}
                            </Badge>
                          )}
                          {(t.prioridade && t.prioridade !== "media") && (
                            <Badge variant="outline" className={`h-5 text-[10px] gap-1 ${prioridade.cls}`}>
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
                          <DropdownMenuItem onClick={() => onDelete(t)} className="text-destructive">
                            Excluir
                          </DropdownMenuItem>
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
