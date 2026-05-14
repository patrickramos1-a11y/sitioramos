import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal, Calendar } from "lucide-react";
import type { FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { useFinNaturezas } from "@/hooks/financeiro/useFinNaturezas";
import { useFinCategorias } from "@/hooks/financeiro/useFinCategorias";
import { useFinCentrosCusto } from "@/hooks/financeiro/useFinCentrosCusto";
import { useFinProjetos } from "@/hooks/financeiro/useFinProjetos";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { useLoans } from "@/hooks/useLoans";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const ALL = "__all__";

type Props = {
  value: FinFilters;
  onChange: (v: FinFilters) => void;
};

function iso(d: Date) { return d.toISOString().slice(0, 10); }
function presetMonth(offset = 0) {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset);
  const y = d.getFullYear(); const m = d.getMonth();
  return { startDate: iso(new Date(y, m, 1)), endDate: iso(new Date(y, m + 1, 0)) };
}
function presetDays(n: number) {
  const e = new Date(); const s = new Date(); s.setDate(s.getDate() - n + 1);
  return { startDate: iso(s), endDate: iso(e) };
}
function presetYear(offset = 0) {
  const y = new Date().getFullYear() + offset;
  return { startDate: `${y}-01-01`, endDate: `${y}-12-31` };
}
function presetQuarter() {
  const d = new Date(); const q = Math.floor(d.getMonth() / 3);
  const y = d.getFullYear();
  return { startDate: iso(new Date(y, q * 3, 1)), endDate: iso(new Date(y, q * 3 + 3, 0)) };
}

const PERIODS = [
  { id: "7d",   label: "7 dias",  fn: () => presetDays(7) },
  { id: "30d",  label: "30 dias", fn: () => presetDays(30) },
  { id: "mes",  label: "Mês",     fn: () => presetMonth(0) },
  { id: "ant",  label: "Mês ant", fn: () => presetMonth(-1) },
  { id: "tri",  label: "Trim.",   fn: () => presetQuarter() },
  { id: "ano",  label: "Ano",     fn: () => presetYear(0) },
  { id: "tudo", label: "Tudo",    fn: () => ({ startDate: undefined, endDate: undefined }) },
];

export function FinanceiroFilters({ value, onChange }: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: naturezas = [] } = useFinNaturezas();
  const { data: cats = [] } = useFinCategorias();
  const { data: centros = [] } = useFinCentrosCusto();
  const { data: projetos = [] } = useFinProjetos();
  const { areas = [] } = useAreas();
  const { cycles = [] } = useCycles();
  const { loans = [] } = useLoans();

  const set = (patch: Partial<FinFilters>) => onChange({ ...value, ...patch });
  const reset = () => onChange({ classificacao: "todos", revisao: "todos", incluirNaoRevisados: true });

  const v = (s?: string) => s ?? ALL;
  const u = (s: string) => (s === ALL ? undefined : s);

  const activePeriod = useMemo(() => {
    if (!value.startDate && !value.endDate) return "tudo";
    for (const p of PERIODS) {
      const r = p.fn();
      if (r.startDate === value.startDate && r.endDate === value.endDate) return p.id;
    }
    return "custom";
  }, [value.startDate, value.endDate]);

  const activeCount = [
    value.tipo,
    value.classificacao && value.classificacao !== "todos" ? value.classificacao : null,
    value.revisao && value.revisao !== "todos" ? value.revisao : null,
    value.naturezaId, value.categoriaId, value.centroCustoId,
    value.areaId, value.cycleId, value.projetoId, value.loanId,
  ].filter(Boolean).length;

  const summary = useMemo(() => {
    const parts: string[] = [];
    parts.push(PERIODS.find((p) => p.id === activePeriod)?.label ?? "Período");
    if (value.tipo) parts.push(value.tipo === "entrada" ? "Entradas" : "Saídas");
    if (activeCount > 0) parts.push(`${activeCount} filtro${activeCount > 1 ? "s" : ""}`);
    return parts.join(" · ");
  }, [activePeriod, value.tipo, activeCount]);

  const PeriodChips = () => (
    <div className="flex flex-wrap gap-1.5">
      {PERIODS.map((p) => {
        const active = activePeriod === p.id;
        return (
          <button
            key={p.id}
            onClick={() => set(p.fn())}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-muted text-muted-foreground border-border"
            )}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );

  const FilterFields = ({ dense = false }: { dense?: boolean }) => (
    <div className={cn("grid gap-2", dense ? "grid-cols-2" : "sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6")}>
      <div>
        <Label className="text-[10px]">De</Label>
        <Input type="date" className="h-9" value={value.startDate ?? ""} onChange={(e) => set({ startDate: e.target.value || undefined })} />
      </div>
      <div>
        <Label className="text-[10px]">Até</Label>
        <Input type="date" className="h-9" value={value.endDate ?? ""} onChange={(e) => set({ endDate: e.target.value || undefined })} />
      </div>
      <div>
        <Label className="text-[10px]">Tipo</Label>
        <Select value={v(value.tipo)} onValueChange={(x) => set({ tipo: u(x) as any })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px]">Classificação</Label>
        <Select value={value.classificacao ?? "todos"} onValueChange={(x) => set({ classificacao: x as any })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="classificados">Classificados</SelectItem>
            <SelectItem value="nao_classificados">Não classificados</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px]">Revisão</Label>
        <Select value={value.revisao ?? "todos"} onValueChange={(x) => set({ revisao: x as any })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="revisados">Revisados</SelectItem>
            <SelectItem value="nao_revisados">Não revisados</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px]">Natureza</Label>
        <Select value={v(value.naturezaId)} onValueChange={(x) => set({ naturezaId: u(x) })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas</SelectItem>
            {naturezas.map((n) => <SelectItem key={n.id} value={n.id}>{n.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px]">Categoria</Label>
        <Select value={v(value.categoriaId)} onValueChange={(x) => set({ categoriaId: u(x) })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas</SelectItem>
            {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px]">Centro de Custo</Label>
        <Select value={v(value.centroCustoId)} onValueChange={(x) => set({ centroCustoId: u(x) })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {centros.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px]">Área / Talhão</Label>
        <Select value={v(value.areaId)} onValueChange={(x) => set({ areaId: u(x) })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas</SelectItem>
            {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px]">Ciclo</Label>
        <Select value={v(value.cycleId)} onValueChange={(x) => set({ cycleId: u(x) })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {cycles.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.cultura} — {c.areas?.nome ?? "—"}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px]">Projeto</Label>
        <Select value={v(value.projetoId)} onValueChange={(x) => set({ projetoId: u(x) })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {projetos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px]">Empréstimo</Label>
        <Select value={v(value.loanId)} onValueChange={(x) => set({ loanId: u(x) })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {loans.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.origem_credor}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-full flex items-center gap-2 pt-1">
        <Switch
          id="incluir-nrev"
          checked={value.incluirNaoRevisados !== false}
          onCheckedChange={(c) => set({ incluirNaoRevisados: c })}
        />
        <Label htmlFor="incluir-nrev" className="text-[11px] leading-tight">
          Incluir não revisados nos relatórios
        </Label>
      </div>
    </div>
  );

  // ============ MOBILE: Compact summary bar + Sheet ============
  if (isMobile) {
    return (
      <>
        <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <CardContent className="p-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary shrink-0 ml-1" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none">Filtros</p>
              <p className="text-xs font-medium truncate">{summary}</p>
            </div>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 relative">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Editar
                  {activeCount > 0 && (
                    <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-[9px]">{activeCount}</Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] overflow-y-auto p-4">
                <SheetHeader className="pb-3">
                  <SheetTitle className="text-base">Filtros</SheetTitle>
                </SheetHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-2">Período rápido</p>
                    <PeriodChips />
                  </div>
                  <div className="border-t pt-3">
                    <FilterFields dense />
                  </div>
                  <div className="flex gap-2 pt-3 border-t sticky bottom-0 bg-background pb-1">
                    <Button variant="outline" className="flex-1" onClick={reset}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Limpar
                    </Button>
                    <Button className="flex-1" onClick={() => setSheetOpen(false)}>Aplicar</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>
      </>
    );
  }

  // ============ DESKTOP ============
  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">Período:</span>
          <PeriodChips />
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={reset}><RotateCcw className="h-3.5 w-3.5 mr-1" />Limpar</Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
              {open ? <ChevronUp className="h-3.5 w-3.5 mr-1" /> : <ChevronDown className="h-3.5 w-3.5 mr-1" />}
              {open ? "Menos" : "Mais"} filtros
              {activeCount > 0 && <Badge className="ml-1.5 h-4 px-1 text-[9px]">{activeCount}</Badge>}
            </Button>
          </div>
        </div>
        {open && <div className="pt-2 border-t"><FilterFields /></div>}
      </CardContent>
    </Card>
  );
}
