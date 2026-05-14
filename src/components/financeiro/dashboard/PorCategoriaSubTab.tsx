import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinanceiroAnalytics, type FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { fmtBRL } from "@/lib/financeiro/finCalc";
import { colorForEntity } from "@/lib/financeiro/entityColors";
import { ChartCard } from "./ChartCard";

const ALL = "__all__";

export function PorCategoriaSubTab({ filters }: { filters: FinFilters }) {
  const a = useFinanceiroAnalytics(filters);
  const [cicloFilter, setCicloFilter] = useState<string>(ALL);

  const ciclosOpts = useMemo(() => {
    const ids = new Set<string>();
    for (const r of a.filtered) {
      const cid = r.classif?.cycle_id ?? r.tx.cycle_id;
      if (cid) ids.add(cid);
    }
    return Array.from(ids).map((id) => {
      const c: any = (a.cycles as any[]).find((x) => x.id === id);
      return { id, nome: c ? `${c.cultura} — ${c.areas?.nome ?? "—"}` : "—", color: colorForEntity("cycle", id) };
    });
  }, [a.filtered, a.cycles]);

  const top = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of a.filtered) {
      if (r.tx.tipo !== "saida" || !r.classif?.categoria_id) continue;
      const cid = r.classif?.cycle_id ?? r.tx.cycle_id;
      if (cicloFilter !== ALL && cid !== cicloFilter) continue;
      m.set(r.classif.categoria_id, (m.get(r.classif.categoria_id) || 0) + Number(r.tx.valor));
    }
    const total = Array.from(m.values()).reduce((s, v) => s + v, 0);
    return Array.from(m.entries())
      .map(([id, valor]) => ({
        id,
        nome: a.cats.find((c) => c.id === id)?.nome ?? "—",
        valor,
        share: total > 0 ? valor / total : 0,
        color: colorForEntity("categoria", id),
      }))
      .sort((x, y) => y.valor - x.valor);
  }, [a.filtered, a.cats, cicloFilter]);

  const totalGeral = top.reduce((s, t) => s + t.valor, 0);
  const max = Math.max(1, ...top.map((t) => t.valor));

  return (
    <div className="space-y-3 md:space-y-4">
      <Card>
        <CardContent className="p-3 grid gap-2 grid-cols-2 sm:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Total saídas</p>
            <p className="text-base font-semibold tabular-nums">{fmtBRL(totalGeral)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Categorias</p>
            <p className="text-base font-semibold tabular-nums">{top.length}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Filtrar por ciclo</p>
            <Select value={cicloFilter} onValueChange={setCicloFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os ciclos</SelectItem>
                {ciclosOpts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <ChartCard title="Categorias por gasto" accent="hsl(265 65% 58%)" table={<CategTable rows={top} totalGeral={totalGeral} />}>
        {top.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">Sem dados no período.</p>
        ) : (
          <div className="space-y-1.5">
            {top.map((t) => {
              const w = (t.valor / max) * 100;
              return (
                <div key={t.id} className="space-y-0.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: t.color }} />
                      <span className="truncate" title={t.nome}>{t.nome}</span>
                    </span>
                    <span className="tabular-nums shrink-0 font-medium">{fmtBRL(t.valor)}</span>
                    <span className="tabular-nums shrink-0 text-[10px] text-muted-foreground w-10 text-right">{(t.share * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, background: t.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ChartCard>
    </div>
  );
}

function CategTable({ rows, totalGeral }: { rows: any[]; totalGeral: number }) {
  return (
    <div className="overflow-auto max-h-[60vh]">
      <table className="w-full text-[11px]">
        <thead className="sticky top-0 bg-background"><tr>
          <th className="text-left px-2 py-1">Categoria</th>
          <th className="text-right px-2 py-1">Valor</th>
          <th className="text-right px-2 py-1">%</th>
        </tr></thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-t">
              <td className="px-2 py-1 flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: t.color }} />{t.nome}</td>
              <td className="text-right px-2 py-1 tabular-nums">{fmtBRL(t.valor)}</td>
              <td className="text-right px-2 py-1 tabular-nums">{totalGeral ? ((t.valor / totalGeral) * 100).toFixed(1) : 0}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
