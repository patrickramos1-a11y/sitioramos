import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, RefreshCw, Search, Sprout, MapPin } from "lucide-react";
import { useCycles } from "@/hooks/useCycles";
import { useAreas } from "@/hooks/useAreas";
import { useCycleAreaAllocations } from "@/hooks/useCycleAreaAllocations";
import { useCosts } from "@/hooks/useCosts";
import { useRevenues } from "@/hooks/useRevenues";
import { CycleForm } from "@/components/cycles/CycleForm";
import { haParaTarefas, formatTarefas } from "@/lib/territory/tarefas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const statusBadge: Record<string, { label: string; className: string }> = {
  planejamento: { label: "Planejamento", className: "bg-muted text-foreground" },
  ativo: { label: "Ativo", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  finalizado: { label: "Finalizado", className: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
};

export default function Ciclos() {
  const { cycles, isLoading, createCycle } = useCycles();
  const { areas } = useAreas();
  const { allocations } = useCycleAreaAllocations({});
  const { costs } = useCosts();
  const { revenues } = useRevenues();
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    return cycles
      .filter((c: any) =>
        !search ||
        c.cultura?.toLowerCase().includes(search.toLowerCase()) ||
        c.areas?.nome?.toLowerCase().includes(search.toLowerCase()),
      )
      .map((c: any) => {
        const cycleAllocs = allocations.filter((a: any) => a.cycle_id === c.id);
        const tarefasOcupadas = cycleAllocs.reduce((sum: number, a: any) => {
          if (a.ocupa_area_inteira) {
            const ar: any = areas.find((x: any) => x.id === a.area_id);
            return sum + haParaTarefas(Number(ar?.tamanho_hectares || 0));
          }
          return sum + Number(a.tarefas_ocupadas || 0);
        }, 0);
        const areasVinculadas = cycleAllocs
          .map((a: any) => areas.find((x: any) => x.id === a.area_id))
          .filter(Boolean);
        const custoTotal = costs
          .filter((x: any) => x.cycle_id === c.id)
          .reduce((s: number, x: any) => s + Number(x.valor || 0), 0);
        const receitaTotal = revenues
          .filter((x: any) => x.cycle_id === c.id)
          .reduce((s: number, x: any) => s + Number(x.quantidade || 0) * Number(x.preco_unitario || 0), 0);
        return { cycle: c, tarefasOcupadas, areasVinculadas, custoTotal, receitaTotal };
      });
  }, [cycles, allocations, areas, costs, revenues, search]);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <RefreshCw className="h-6 w-6 text-primary" /> Ciclos
            </h1>
            <p className="text-sm text-muted-foreground">
              Estrutura produtiva — vincule ciclos às áreas físicas e suas tarefas.
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo ciclo
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cultura ou área..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Sprout className="h-10 w-10 mx-auto mb-3 opacity-50" />
              Nenhum ciclo cadastrado ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ cycle, tarefasOcupadas, areasVinculadas, custoTotal, receitaTotal }) => {
              const sb = statusBadge[cycle.status] || statusBadge.planejamento;
              return (
                <Card key={cycle.id} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sprout className="h-4 w-4 text-primary" />
                        {cycle.cultura}
                      </CardTitle>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sb.className}`}>
                        {sb.label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="text-xs text-muted-foreground">
                      Plantio: {format(new Date(cycle.data_inicio_plantio), "dd/MM/yyyy", { locale: ptBR })}
                      {cycle.data_prevista_colheita && (
                        <> • Colheita: {format(new Date(cycle.data_prevista_colheita), "dd/MM/yyyy", { locale: ptBR })}</>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                        Áreas vinculadas
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {areasVinculadas.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">Nenhuma</span>
                        ) : (
                          areasVinculadas.map((a: any) => (
                            <Link
                              key={a.id}
                              to={`/areas/${a.id}`}
                              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border hover:bg-muted"
                            >
                              <MapPin className="h-3 w-3" />
                              {a.nome}
                            </Link>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">Tarefas</div>
                        <div className="font-semibold tabular-nums">{formatTarefas(tarefasOcupadas)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">Custos</div>
                        <div className="font-semibold tabular-nums text-destructive">{formatCurrency(custoTotal)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">Receitas</div>
                        <div className="font-semibold tabular-nums text-success">{formatCurrency(receitaTotal)}</div>
                      </div>
                    </div>

                    {cycle.area_id && (
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link to={`/areas/${cycle.area_id}`}>Ver área principal</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CycleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        areas={areas}
        onSubmit={(data) => {
          createCycle.mutate(data, { onSuccess: () => setFormOpen(false) });
        }}
        isSubmitting={createCycle.isPending}
      />
    </AppLayout>
  );
}
