import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell, LineChart, Line } from "recharts";
import { useFinanceiroAnalytics, type FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { fmtBRL } from "@/lib/financeiro/finCalc";
import { custoTotalCiclo, receitaTotalCiclo, hectaresCiclo, diasDecorridos, safeDiv } from "@/lib/financeiro/perHectare";
import { colorForEntity } from "@/lib/financeiro/entityColors";
import { X, GitCompare } from "lucide-react";

export function PorCicloSubTab({ filters }: { filters: FinFilters }) {
  const a = useFinanceiroAnalytics(filters);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const linhas = useMemo(() => {
    return (a.cycles as any[])
      .map((c) => {
        const ha = hectaresCiclo(c, a.areas as any);
        const custo = custoTotalCiclo(c.id, a.filtered);
        const receita = receitaTotalCiclo(c.id, a.filtered);
        const dias = diasDecorridos(c);
        return {
          id: c.id,
          nome: `${c.cultura} — ${c.areas?.nome ?? "—"}`,
          status: c.status,
          ha,
          dias,
          custo,
          receita,
          resultado: receita - custo,
          custoHa: safeDiv(custo, ha),
          receitaHa: safeDiv(receita, ha),
          custoDia: safeDiv(custo, dias),
          color: colorForEntity("cycle", c.id),
          raw: c,
        };
      })
      .filter((l) => l.custo > 0 || l.receita > 0)
      .sort((x, y) => y.custo - x.custo);
  }, [a.cycles, a.areas, a.filtered]);

  const toggleSelect = (id: string) => {
    setSelecionados((sel) => {
      if (sel.includes(id)) return sel.filter((x) => x !== id);
      if (sel.length >= 4) return sel;
      return [...sel, id];
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm">Ciclos no período</CardTitle>
          <span className="text-[11px] text-muted-foreground">
            Selecione até 4 para comparar
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2"></th>
                  <th className="text-left px-3 py-2">Ciclo</th>
                  <th className="text-right px-3 py-2">Ha</th>
                  <th className="text-right px-3 py-2">Dias</th>
                  <th className="text-right px-3 py-2">Custo</th>
                  <th className="text-right px-3 py-2">R$/ha</th>
                  <th className="text-right px-3 py-2">R$/dia</th>
                  <th className="text-right px-3 py-2">Receita</th>
                  <th className="text-right px-3 py-2">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => {
                  const sel = selecionados.includes(l.id);
                  return (
                    <tr key={l.id} className={`border-t cursor-pointer hover:bg-muted/30 ${sel ? "bg-primary/5" : ""}`} onClick={() => toggleSelect(l.id)}>
                      <td className="px-3 py-2">
                        <input type="checkbox" checked={sel} readOnly className="pointer-events-none" />
                      </td>
                      <td className="px-3 py-2 flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-sm" style={{ background: l.color }} />
                        <span>{l.nome}</span>
                        <Badge variant="outline" className="text-[9px]">{l.status}</Badge>
                      </td>
                      <td className="text-right px-3 py-2">{l.ha.toFixed(2)}</td>
                      <td className="text-right px-3 py-2">{l.dias}</td>
                      <td className="text-right px-3 py-2">{fmtBRL(l.custo)}</td>
                      <td className="text-right px-3 py-2 text-rose-700">{fmtBRL(l.custoHa)}</td>
                      <td className="text-right px-3 py-2">{fmtBRL(l.custoDia)}</td>
                      <td className="text-right px-3 py-2">{fmtBRL(l.receita)}</td>
                      <td className={`text-right px-3 py-2 font-medium ${l.resultado >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmtBRL(l.resultado)}</td>
                    </tr>
                  );
                })}
                {linhas.length === 0 && (
                  <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">Sem dados no período.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selecionados.length >= 1 && (
        <CompararCiclos
          ids={selecionados}
          analytics={a}
          onClear={() => setSelecionados([])}
        />
      )}
    </div>
  );
}

function CompararCiclos({ ids, analytics, onClear }: { ids: string[]; analytics: ReturnType<typeof useFinanceiroAnalytics>; onClear: () => void }) {
  const ciclos = useMemo(() => {
    return ids.map((id) => {
      const c: any = (analytics.cycles as any[]).find((x) => x.id === id);
      const ha = hectaresCiclo(c, analytics.areas as any);
      const custo = custoTotalCiclo(id, analytics.filtered);
      const receita = receitaTotalCiclo(id, analytics.filtered);
      const dias = diasDecorridos(c);
      return {
        id,
        nome: c ? `${c.cultura} — ${c.areas?.nome ?? "—"}` : "—",
        ha,
        dias,
        custo,
        receita,
        resultado: receita - custo,
        custoHa: safeDiv(custo, ha),
        color: colorForEntity("cycle", id),
        raw: c,
      };
    });
  }, [ids, analytics]);

  // Por categoria, dentro de cada ciclo
  const porCategoria = useMemo(() => {
    const catNames = new Map<string, string>();
    const data = new Map<string, Record<string, number>>();
    for (const r of analytics.filtered) {
      const cid = r.classif?.cycle_id ?? r.tx.cycle_id;
      if (!cid || !ids.includes(cid)) continue;
      if (r.tx.tipo !== "saida") continue;
      const catId = r.classif?.categoria_id ?? "sem_categoria";
      const catNome = r.classif?.categoria_id
        ? analytics.cats.find((c) => c.id === catId)?.nome ?? "—"
        : "Sem categoria";
      catNames.set(catId, catNome);
      if (!data.has(catId)) data.set(catId, {});
      const row = data.get(catId)!;
      row[cid] = (row[cid] || 0) + Number(r.tx.valor);
    }
    return Array.from(data.entries())
      .map(([catId, row]) => ({ categoria: catNames.get(catId) ?? "—", ...row }))
      .sort((a, b) => {
        const sa = ids.reduce((s, i) => s + ((a as any)[i] || 0), 0);
        const sb = ids.reduce((s, i) => s + ((b as any)[i] || 0), 0);
        return sb - sa;
      })
      .slice(0, 12);
  }, [ids, analytics]);

  // Custo acumulado por dia decorrido (normalização)
  const acumuladoDia = useMemo(() => {
    const maxDias = Math.max(...ciclos.map((c) => c.dias), 30);
    const buckets: Record<number, Record<string, number>> = {};
    for (const r of analytics.filtered) {
      if (r.grupo !== "custo_plantacao") continue;
      const cid = r.classif?.cycle_id ?? r.tx.cycle_id;
      if (!cid || !ids.includes(cid)) continue;
      const c: any = (analytics.cycles as any[]).find((x) => x.id === cid);
      if (!c) continue;
      const start = new Date(c.data_inicio_plantio + "T00:00:00").getTime();
      const t = new Date(r.tx.data + "T00:00:00").getTime();
      const dia = Math.max(0, Math.floor((t - start) / 86400000));
      if (!buckets[dia]) buckets[dia] = {};
      buckets[dia][cid] = (buckets[dia][cid] || 0) + Number(r.tx.valor);
    }
    const acc: Record<string, number> = {};
    const arr: any[] = [];
    for (let d = 0; d <= maxDias; d += Math.max(1, Math.floor(maxDias / 60))) {
      const point: any = { dia: d };
      for (const id of ids) {
        const dayVals = Object.entries(buckets)
          .filter(([k]) => Number(k) <= d)
          .reduce((s, [, v]) => s + (v[id] || 0), 0);
        acc[id] = dayVals;
        point[id] = dayVals;
      }
      arr.push(point);
    }
    return arr;
  }, [ids, analytics, ciclos]);

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <GitCompare className="h-4 w-4" />
          Comparando {ciclos.length} ciclo(s)
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={onClear}><X className="h-3.5 w-3.5 mr-1" />Limpar</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`grid gap-3 ${ciclos.length === 1 ? "sm:grid-cols-1" : ciclos.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
          {ciclos.map((c) => (
            <Card key={c.id} style={{ borderLeftWidth: 4, borderLeftColor: c.color }}>
              <CardContent className="p-3 space-y-1.5">
                <p className="text-xs font-medium truncate" title={c.nome}>{c.nome}</p>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                  <span>Ha: <strong className="text-foreground">{c.ha.toFixed(2)}</strong></span>
                  <span>Dias: <strong className="text-foreground">{c.dias}</strong></span>
                  <span>Custo: <strong className="text-foreground">{fmtBRL(c.custo)}</strong></span>
                  <span>R$/ha: <strong className="text-foreground">{fmtBRL(c.custoHa)}</strong></span>
                  <span>Receita: <strong className="text-foreground">{fmtBRL(c.receita)}</strong></span>
                  <span className={c.resultado >= 0 ? "text-emerald-700" : "text-rose-700"}>Result.: <strong>{fmtBRL(c.resultado)}</strong></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Gasto por categoria (top 12)</CardTitle></CardHeader>
          <CardContent>
            {porCategoria.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">Sem dados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(260, porCategoria.length * 30)}>
                <BarChart data={porCategoria} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="categoria" width={140} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => fmtBRL(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {ciclos.map((c) => (
                    <Bar key={c.id} dataKey={c.id} name={c.nome} fill={c.color} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Custo acumulado por dia decorrido</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={acumuladoDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" tick={{ fontSize: 10 }} label={{ value: "dias desde plantio", position: "insideBottom", offset: -2, style: { fontSize: 10 } }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {ciclos.map((c) => (
                  <Line key={c.id} type="monotone" dataKey={c.id} stroke={c.color} strokeWidth={2.5} dot={false} name={c.nome} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
