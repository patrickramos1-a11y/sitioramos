import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinanceiroAnalytics, type FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { fmtBRL } from "@/lib/financeiro/finCalc";
import { colorForEntity } from "@/lib/financeiro/entityColors";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

export function PorCategoriaSubTab({ filters }: { filters: FinFilters }) {
  const a = useFinanceiroAnalytics(filters);

  // Heatmap categoria × ciclo
  const { matriz, ciclos, categorias } = useMemo(() => {
    const cycleIds = new Set<string>();
    const catIds = new Set<string>();
    const cell = new Map<string, number>();
    for (const r of a.filtered) {
      if (r.tx.tipo !== "saida") continue;
      const cid = r.classif?.cycle_id ?? r.tx.cycle_id;
      const catId = r.classif?.categoria_id;
      if (!cid || !catId) continue;
      cycleIds.add(cid);
      catIds.add(catId);
      const k = `${catId}|${cid}`;
      cell.set(k, (cell.get(k) || 0) + Number(r.tx.valor));
    }
    const ciclos = Array.from(cycleIds).map((id) => {
      const c: any = (a.cycles as any[]).find((x) => x.id === id);
      return { id, nome: c ? `${c.cultura} — ${c.areas?.nome ?? "—"}` : "—", color: colorForEntity("cycle", id) };
    });
    const categorias = Array.from(catIds).map((id) => {
      const c = a.cats.find((x) => x.id === id);
      return { id, nome: c?.nome ?? "—" };
    });
    // ordenar categorias pelo total (desc)
    categorias.sort((x, y) => {
      const sx = ciclos.reduce((s, c) => s + (cell.get(`${x.id}|${c.id}`) || 0), 0);
      const sy = ciclos.reduce((s, c) => s + (cell.get(`${y.id}|${c.id}`) || 0), 0);
      return sy - sx;
    });
    return { matriz: cell, ciclos, categorias };
  }, [a.filtered, a.cycles, a.cats]);

  const max = Math.max(1, ...Array.from(matriz.values()));

  // Top 15 categorias do período
  const top = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of a.filtered) {
      if (r.tx.tipo !== "saida" || !r.classif?.categoria_id) continue;
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
      .sort((x, y) => y.valor - x.valor)
      .slice(0, 15);
  }, [a.filtered, a.cats]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Top 15 categorias do período</CardTitle></CardHeader>
        <CardContent>
          {top.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Sem dados no período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, top.length * 28)}>
              <BarChart data={top} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nome" width={150} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number, _n, p: any) => [`${fmtBRL(v)} (${(p.payload.share * 100).toFixed(1)}%)`, "Total"]} />
                <Bar dataKey="valor">
                  {top.map((t) => <Cell key={t.id} fill={t.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Heatmap — Categoria × Ciclo</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {ciclos.length === 0 || categorias.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Sem cruzamento de categoria × ciclo. Classifique os lançamentos.</p>
          ) : (
            <table className="text-[10px] border-separate border-spacing-0.5">
              <thead>
                <tr>
                  <th className="text-left px-2 py-1 sticky left-0 bg-background"></th>
                  {ciclos.map((c) => (
                    <th key={c.id} className="px-2 py-1 text-left whitespace-nowrap" style={{ minWidth: 100 }}>
                      <div className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />
                        <span className="truncate max-w-[120px]" title={c.nome}>{c.nome}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categorias.map((cat) => (
                  <tr key={cat.id}>
                    <td className="px-2 py-1 sticky left-0 bg-background font-medium whitespace-nowrap">{cat.nome}</td>
                    {ciclos.map((c) => {
                      const v = matriz.get(`${cat.id}|${c.id}`) || 0;
                      const intensity = v / max;
                      return (
                        <td
                          key={c.id}
                          className="px-2 py-1 text-right tabular-nums"
                          style={{
                            background: v > 0
                              ? `hsl(from ${c.color} h s l / ${0.15 + intensity * 0.65})`
                              : "transparent",
                            color: intensity > 0.5 ? "white" : undefined,
                          }}
                          title={`${cat.nome} × ${c.nome}: ${fmtBRL(v)}`}
                        >
                          {v > 0 ? `${(v / 1000).toFixed(1)}k` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
