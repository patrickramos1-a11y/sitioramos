import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import type { FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { useFinNaturezas } from "@/hooks/financeiro/useFinNaturezas";
import { useFinCategorias } from "@/hooks/financeiro/useFinCategorias";
import { useFinCentrosCusto } from "@/hooks/financeiro/useFinCentrosCusto";
import { useFinProjetos } from "@/hooks/financeiro/useFinProjetos";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { useLoans } from "@/hooks/useLoans";

const ALL = "__all__";

type Props = {
  value: FinFilters;
  onChange: (v: FinFilters) => void;
};

function presetMonth(offset = 0): { startDate: string; endDate: string } {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
}

function presetYear(offset = 0): { startDate: string; endDate: string } {
  const y = new Date().getFullYear() + offset;
  return { startDate: `${y}-01-01`, endDate: `${y}-12-31` };
}

export function FinanceiroFilters({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
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

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">Período:</span>
          <Button size="sm" variant="outline" onClick={() => set(presetMonth(0))}>Mês atual</Button>
          <Button size="sm" variant="outline" onClick={() => set(presetMonth(-1))}>Mês anterior</Button>
          <Button size="sm" variant="outline" onClick={() => set(presetYear(0))}>Ano</Button>
          <Button size="sm" variant="outline" onClick={() => set({ startDate: undefined, endDate: undefined })}>Tudo</Button>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={reset}><RotateCcw className="h-3.5 w-3.5 mr-1" />Limpar</Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
              {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {open ? "Menos" : "Mais"} filtros
            </Button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <div>
            <Label className="text-[10px]">De</Label>
            <Input type="date" className="h-8" value={value.startDate ?? ""} onChange={(e) => set({ startDate: e.target.value || undefined })} />
          </div>
          <div>
            <Label className="text-[10px]">Até</Label>
            <Input type="date" className="h-8" value={value.endDate ?? ""} onChange={(e) => set({ endDate: e.target.value || undefined })} />
          </div>
          <div>
            <Label className="text-[10px]">Tipo</Label>
            <Select value={v(value.tipo)} onValueChange={(x) => set({ tipo: u(x) as any })}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
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
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
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
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="revisados">Revisados</SelectItem>
                <SelectItem value="nao_revisados">Não revisados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2 pb-1">
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

        {open && (
          <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 pt-2 border-t">
            <div>
              <Label className="text-[10px]">Natureza</Label>
              <Select value={v(value.naturezaId)} onValueChange={(x) => set({ naturezaId: u(x) })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  {naturezas.map((n) => <SelectItem key={n.id} value={n.id}>{n.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Categoria</Label>
              <Select value={v(value.categoriaId)} onValueChange={(x) => set({ categoriaId: u(x) })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Centro de Custo</Label>
              <Select value={v(value.centroCustoId)} onValueChange={(x) => set({ centroCustoId: u(x) })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {centros.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Área / Talhão</Label>
              <Select value={v(value.areaId)} onValueChange={(x) => set({ areaId: u(x) })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Ciclo</Label>
              <Select value={v(value.cycleId)} onValueChange={(x) => set({ cycleId: u(x) })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {cycles.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.cultura} — {c.areas?.nome ?? "—"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Projeto Investimento</Label>
              <Select value={v(value.projetoId)} onValueChange={(x) => set({ projetoId: u(x) })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {projetos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Empréstimo</Label>
              <Select value={v(value.loanId)} onValueChange={(x) => set({ loanId: u(x) })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {loans.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.origem_credor}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
