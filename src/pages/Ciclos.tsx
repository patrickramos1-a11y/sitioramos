import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, RefreshCw, Search, Sprout, MapPin, Pencil } from "lucide-react";
import { useCycles, Cycle, CycleInsert } from "@/hooks/useCycles";
import { useAreas } from "@/hooks/useAreas";
import { useCycleAreaAllocations } from "@/hooks/useCycleAreaAllocations";
import { useCashTransactions } from "@/hooks/useCashTransactions";
import { CycleForm } from "@/components/cycles/CycleForm";
import { AllocationDraft } from "@/components/cycles/CycleAllocationsManager";
import { allocOccupiedHa, haParaTarefas, formatTarefas } from "@/lib/territory/tarefas";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const statusBadge: Record<string, { label: string; className: string }> = {
  planejamento: { label: "Planejamento", className: "bg-muted text-foreground" },
  ativo: { label: "Ativo", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  finalizado: { label: "Finalizado", className: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
};

async function syncAllocations(cycleId: string, drafts: AllocationDraft[]) {
  const { data: existing } = await supabase
    .from("cycle_area_allocations")
    .select("id")
    .eq("cycle_id", cycleId);
  const keepIds = drafts.filter((d) => d.id).map((d) => d.id!);
  const toDelete = (existing || []).filter((e: any) => !keepIds.includes(e.id));
  if (toDelete.length > 0) {
    await supabase
      .from("cycle_area_allocations")
      .delete()
      .in("id", toDelete.map((e: any) => e.id));
  }
  for (const d of drafts) {
    const payload: any = {
      cycle_id: cycleId,
      area_id: d.area_id,
      allocation_type: d.allocation_type,
      ocupa_area_inteira: d.allocation_type === "full_area",
      tarefas_ocupadas: d.allocation_type === "tasks" ? d.tarefas_ocupadas : 0,
      percentual: d.allocation_type === "percentage" ? d.percentual : null,
      hectares_ocupados: d.allocation_type === "manual_area" ? d.hectares_ocupados : 0,
      observacao: d.observacao || null,
    };
    if (d.id) {
      await supabase.from("cycle_area_allocations").update(payload).eq("id", d.id);
    } else {
      await supabase.from("cycle_area_allocations").insert(payload);
    }
  }
}

export default function Ciclos() {
  const { cycles, isLoading, createCycle, updateCycle } = useCycles();
  const { areas } = useAreas();
  const { allocations } = useCycleAreaAllocations({});
  const { costs } = useCosts();
  const { revenues } = useRevenues();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cycle | null>(null);
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
        let haOcupados = 0;
        const areasVinculadas: any[] = [];
        for (const a of cycleAllocs) {
          const ar: any = areas.find((x: any) => x.id === a.area_id);
          haOcupados += allocOccupiedHa(a, Number(ar?.tamanho_hectares || 0));
          if (ar) areasVinculadas.push({ area: ar, alloc: a });
        }
        const tarefasOcupadas = haParaTarefas(haOcupados);
        const custoTotal = costs
          .filter((x: any) => x.cycle_id === c.id)
          .reduce((s: number, x: any) => s + Number(x.valor || 0), 0);
        const receitaTotal = revenues
          .filter((x: any) => x.cycle_id === c.id)
          .reduce((s: number, x: any) => s + Number(x.quantidade || 0) * Number(x.preco_unitario || 0), 0);
        return { cycle: c, haOcupados, tarefasOcupadas, areasVinculadas, custoTotal, receitaTotal };
      });
  }, [cycles, allocations, areas, costs, revenues, search]);

  const handleSubmit = async (data: CycleInsert, drafts: AllocationDraft[]) => {
    try {
      let cycleId: string;
      if (editing) {
        const updated = await new Promise<any>((resolve, reject) => {
          updateCycle.mutate({ ...data, id: editing.id }, { onSuccess: resolve, onError: reject });
        });
        cycleId = updated.id;
      } else {
        const created = await new Promise<any>((resolve, reject) => {
          createCycle.mutate(data, { onSuccess: resolve, onError: reject });
        });
        cycleId = created.id;
      }
      await syncAllocations(cycleId, drafts);
      queryClient.invalidateQueries({ queryKey: ["cycle_area_allocations"] });
      setFormOpen(false);
      setEditing(null);
      toast({ title: "Vínculos territoriais salvos" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar vínculos", description: e.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <RefreshCw className="h-6 w-6 text-primary" /> Ciclos
            </h1>
            <p className="text-sm text-muted-foreground">
              Estrutura produtiva — vincule ciclos a uma ou mais áreas físicas.
            </p>
          </div>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
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
            {rows.map(({ cycle, haOcupados, tarefasOcupadas, areasVinculadas, custoTotal, receitaTotal }) => {
              const sb = statusBadge[cycle.status] || statusBadge.planejamento;
              return (
                <Card key={cycle.id} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sprout className="h-4 w-4 text-primary" />
                        {cycle.cultura}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sb.className}`}>
                          {sb.label}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => { setEditing(cycle); setFormOpen(true); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
                        Ocupação territorial
                      </div>
                      {areasVinculadas.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">Nenhum vínculo</span>
                      ) : (
                        <ul className="space-y-1">
                          {areasVinculadas.map(({ area, alloc }) => {
                            const occHa = allocOccupiedHa(alloc, Number(area.tamanho_hectares || 0));
                            const occTar = haParaTarefas(occHa);
                            const desc =
                              alloc.allocation_type === "full_area" ? "área inteira"
                              : alloc.allocation_type === "tasks" ? `${formatTarefas(alloc.tarefas_ocupadas || 0)} tarefa(s)`
                              : alloc.allocation_type === "percentage" ? `${alloc.percentual ?? 0}%`
                              : "manual";
                            return (
                              <li key={alloc.id} className="text-xs flex items-center justify-between gap-2 border-l-2 border-primary/40 pl-2">
                                <Link to={`/areas/${area.id}`} className="inline-flex items-center gap-1 hover:underline">
                                  <MapPin className="h-3 w-3" />
                                  {area.nome}
                                </Link>
                                <span className="text-muted-foreground tabular-nums">
                                  {desc} • {occHa.toFixed(2)} ha
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">Total ocupado</div>
                        <div className="font-semibold tabular-nums">
                          {haOcupados.toFixed(2)} ha
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {formatTarefas(tarefasOcupadas)} tarefas
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-muted-foreground">Custos / Receitas</div>
                        <div className="text-xs font-semibold tabular-nums text-destructive">{formatCurrency(custoTotal)}</div>
                        <div className="text-xs font-semibold tabular-nums text-emerald-600">{formatCurrency(receitaTotal)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CycleForm
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        cycle={editing}
        areas={areas}
        onSubmit={handleSubmit}
        isSubmitting={createCycle.isPending || updateCycle.isPending}
      />
    </AppLayout>
  );
}
