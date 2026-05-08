import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, DollarSign, Filter, X, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCashTransactions, CashTransactionInsert } from "@/hooks/useCashTransactions";
import { useOperations } from "@/hooks/useOperations";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { useResponsaveis } from "@/hooks/useResponsaveis";
import { cashCategoryConfig, CashCategory, costTypeConfig } from "@/lib/categoryConfig";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const COST_CATEGORIES: CashCategory[] = ["custo_operacional", "investimento", "despesa_financeira"];

export default function Lancamentos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const operationFilter = searchParams.get("operation") || "all";
  const areaFilter = searchParams.get("area") || "all";

  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [periodStart, setPeriodStart] = useState<string>("");
  const [periodEnd, setPeriodEnd] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { areas } = useAreas();
  const { operations } = useOperations();
  const { cycles } = useCycles();
  const { data: responsaveis = [] } = useResponsaveis();
  const { transactions, createTransaction, deleteTransaction } = useCashTransactions({
    areaId: areaFilter !== "all" ? areaFilter : undefined,
    operationId: operationFilter !== "all" ? operationFilter : undefined,
    startDate: periodStart || undefined,
    endDate: periodEnd || undefined,
  });

  // flatten operations (root + children) for picker/lookup
  const allOps = useMemo(() => {
    const list: Array<{ id: string; nome: string; rootName: string }> = [];
    operations.forEach(op => {
      list.push({ id: op.id, nome: op.nome, rootName: op.nome });
      (op.children || []).forEach(c => list.push({ id: c.id, nome: `↳ ${c.nome}`, rootName: op.nome }));
    });
    return list;
  }, [operations]);

  const opNameById = useMemo(() => new Map(allOps.map(o => [o.id, o.nome])), [allOps]);

  // Filtragem por categoria (somente saídas relevantes)
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (t.tipo !== "saida") return false;
      if (categoriaFilter !== "all" && t.categoria !== categoriaFilter) return false;
      return true;
    });
  }, [transactions, categoriaFilter]);

  const totalFiltrado = filtered.reduce((s, t) => s + Number(t.valor), 0);

  // Form
  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    categoria: "custo_operacional" as CashCategory,
    subtipo: "",
    valor: "",
    descricao: "",
    responsavel_id: "",
    area_id: areaFilter !== "all" ? areaFilter : "",
    cycle_id: "",
    project_id: "",
    subproject_id: "",
    observacoes: "",
  });

  // Projects = root operations only
  const projects = useMemo(() => operations.filter(o => !o.parent_id), [operations]);
  const subprojects = useMemo(() => {
    if (!form.project_id) return [];
    const proj = operations.find(o => o.id === form.project_id);
    return (proj?.children || []).filter((c: any) => !c.parent_id || c.parent_id === form.project_id);
  }, [operations, form.project_id]);
  const cyclesForArea = useMemo(() => {
    if (!form.area_id) return [];
    return cycles.filter(c => c.area_id === form.area_id);
  }, [cycles, form.area_id]);

  const openNewForm = () => {
    setForm({
      data: new Date().toISOString().split("T")[0],
      categoria: "custo_operacional",
      subtipo: "",
      valor: "",
      descricao: "",
      responsavel_id: "",
      area_id: areaFilter !== "all" ? areaFilter : "",
      cycle_id: "",
      project_id: operationFilter !== "all" ? (operations.find(o => o.id === operationFilter && !o.parent_id)?.id || "") : "",
      subproject_id: "",
      observacoes: "",
    });
    setFormOpen(true);
  };

  // Auto-open from ?new=1 (mobile home shortcut)
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openNewForm();
      const np = new URLSearchParams(searchParams);
      np.delete("new");
      setSearchParams(np, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = () => {
    if (!form.valor || !form.categoria) return;
    const subLabel = form.subtipo ? costTypeConfig[form.subtipo]?.label || form.subtipo : "";
    const desc = form.descricao
      ? (subLabel ? `${subLabel}: ${form.descricao}` : form.descricao)
      : subLabel || null;

    // operation_id: prefer subproject, fallback to project
    const operation_id = form.subproject_id || form.project_id || null;

    const payload: CashTransactionInsert = {
      data: form.data,
      tipo: "saida",
      categoria: form.categoria,
      valor: Number(form.valor),
      descricao: desc,
      operation_id,
      area_id: form.area_id || null,
      cycle_id: form.cycle_id || null,
      responsavel_id: form.responsavel_id || null,
      observacoes: form.observacoes || null,
    } as any;

    createTransaction.mutate(payload as any, {
      onSuccess: () => setFormOpen(false),
    });
  };

  const clearFilters = () => {
    setCategoriaFilter("all");
    setPeriodStart("");
    setPeriodEnd("");
    setSearchParams({});
  };

  const hasFilters = operationFilter !== "all" || areaFilter !== "all" || categoriaFilter !== "all" || periodStart || periodEnd;

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lançamentos</h1>
            <p className="text-sm text-muted-foreground">Custos e despesas vinculadas às operações produtivas</p>
          </div>
          <div className="flex gap-2">
            {operationFilter !== "all" && (
              <Button asChild variant="outline" size="sm">
                <Link to="/operacao"><ArrowLeft className="h-4 w-4 mr-1" />Operação</Link>
              </Button>
            )}
            <Button onClick={openNewForm}>
              <Plus className="h-4 w-4 mr-1" />Novo lançamento
            </Button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs">Total filtrado</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-destructive">{fmt(totalFiltrado)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs">Quantidade</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold">{filtered.length}</div>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs">Operação ativa</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-sm font-semibold truncate">
                {operationFilter !== "all" ? (opNameById.get(operationFilter) || "—") : "Todas"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[160px]">
              <Label className="text-xs">Operação</Label>
              <Select
                value={operationFilter}
                onValueChange={(v) => {
                  const next = new URLSearchParams(searchParams);
                  if (v === "all") next.delete("operation"); else next.set("operation", v);
                  setSearchParams(next);
                }}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas operações</SelectItem>
                  {allOps.map(o => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <Label className="text-xs">Área</Label>
              <Select
                value={areaFilter}
                onValueChange={(v) => {
                  const next = new URLSearchParams(searchParams);
                  if (v === "all") next.delete("area"); else next.set("area", v);
                  setSearchParams(next);
                }}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas áreas</SelectItem>
                  {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <Label className="text-xs">Categoria</Label>
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {COST_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{cashCategoryConfig[c].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <div>
                <Label className="text-xs">De</Label>
                <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="h-9 w-[140px]" />
              </div>
              <div>
                <Label className="text-xs">Até</Label>
                <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="h-9 w-[140px]" />
              </div>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                <X className="h-3 w-3 mr-1" />Limpar
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Lista */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Filter className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Nenhum lançamento encontrado com esses filtros.
              </CardContent>
            </Card>
          ) : (
            filtered.map(t => {
              const cat = cashCategoryConfig[t.categoria];
              const Icon = cat?.icon || DollarSign;
              const opName = t.operation_id ? opNameById.get(t.operation_id) : null;
              return (
                <Card key={t.id} className="hover:shadow-sm">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${cat?.bgColor || "bg-muted"}`}>
                      <Icon className={`h-4 w-4 ${cat?.color || ""}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{t.descricao || cat?.label || "Lançamento"}</span>
                        {opName && <Badge variant="outline" className="text-[10px]">⚙ {opName}</Badge>}
                        {t.areas?.nome && <Badge variant="outline" className="text-[10px]">📍 {t.areas.nome}</Badge>}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {format(new Date(t.data), "dd/MM/yy", { locale: ptBR })} · {cat?.label}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-destructive tabular-nums">{fmt(Number(t.valor))}</div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(t.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Data *</Label>
                <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
              </div>
              <div>
                <Label>Valor *</Label>
                <Input type="number" step="0.01" placeholder="0,00" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Categoria *</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as CashCategory, subtipo: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COST_CATEGORIES.map(c => <SelectItem key={c} value={c}>{cashCategoryConfig[c].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {form.categoria === "custo_operacional" && (
              <div>
                <Label>Tipo de custo</Label>
                <Select value={form.subtipo} onValueChange={v => setForm({ ...form, subtipo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(costTypeConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Responsável</Label>
              <Select value={form.responsavel_id || "__none__"} onValueChange={v => setForm({ ...form, responsavel_id: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {responsaveis.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.cor }} />
                        {r.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-3 space-y-3">
              <div>
                <Label>Área</Label>
                <Select
                  value={form.area_id || "__none__"}
                  onValueChange={v => setForm({ ...form, area_id: v === "__none__" ? "" : v, cycle_id: "" })}
                >
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhuma</SelectItem>
                    {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {form.area_id && cyclesForArea.length > 0 && (
                <div>
                  <Label>Ciclo</Label>
                  <Select value={form.cycle_id || "__none__"} onValueChange={v => setForm({ ...form, cycle_id: v === "__none__" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {cyclesForArea.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.cultura} · {format(new Date(c.data_inicio_plantio), "MMM/yy", { locale: ptBR })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="border-t pt-3 space-y-3">
              <div>
                <Label>Projeto</Label>
                <Select
                  value={form.project_id || "__none__"}
                  onValueChange={v => setForm({ ...form, project_id: v === "__none__" ? "" : v, subproject_id: "" })}
                >
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {form.project_id && subprojects.length > 0 && (
                <div>
                  <Label>Subprojeto</Label>
                  <Select value={form.subproject_id || "__none__"} onValueChange={v => setForm({ ...form, subproject_id: v === "__none__" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {subprojects.map((s: any) => <SelectItem key={s.id} value={s.id}>↳ {s.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Compra de adubo NPK" />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.valor || createTransaction.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteTransaction.mutate(deleteId); setDeleteId(null); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
