import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from "recharts";
import { useFinanceiroAnalytics, type FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { fmtBRL } from "@/lib/financeiro/finCalc";
import { custoTotalCiclo, receitaTotalCiclo, hectaresCiclo, diasDecorridos, safeDiv } from "@/lib/financeiro/perHectare";
import { colorForEntity } from "@/lib/financeiro/entityColors";
import { X, GitCompare, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartCard } from "./ChartCard";
import { useIsMobile } from "@/hooks/use-mobile";

export function PorCicloSubTab({ filters }: { filters: FinFilters }) {
  const a = useFinanceiroAnalytics(filters);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const linhas = useMemo(() => {
    return (a.cycles as any[])
      .map((c) => {
        const ha = hectaresCiclo(c, a.areas as any);
        const custo = custoTotalCiclo(c.id, a.filtered);
        const receita = receitaTotalCiclo(c.id, a.filtered);
        const dias = diasDecorridos(c);
        return {
          id: c.id, nome: `${c.cultura} — ${c.areas?.nome ?? "—"}`, status: c.status,
          ha, dias, custo, receita, resultado: receita - custo,
          custoHa: safeDiv(custo, ha), receitaHa: safeDiv(receita, ha), custoDia: safeDiv(custo, dias),
          color: colorForEntity("cycle", c.id), raw: c,
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
    <div className="space-y-3 md:space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between gap-2">
            <span>Ciclos no período</span>
            <span className="text-[10px] font-normal text-muted-foreground">Toque para comparar (até 4)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {linhas.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Sem dados no período.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {linhas.map((l) => {
                const sel = selecionados.includes(l.id);
                const disabled = !sel && selecionados.length >= 4;
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleSelect(l.id)}
                    disabled={disabled}
                    className={cn(
                      "text-left rounded-md border p-2.5 transition-all relative",
                      sel ? "ring-2 shadow-sm" : "hover:bg-muted/30",
                      disabled && "opacity-40"
                    )}
                    style={{
                      borderLeftWidth: 3,
                      borderLeftColor: l.color,
                      ...(sel ? { boxShadow: `0 0 0 2px ${l.color}` } : {}),
                    }}
                  >
                    {sel && (
                      <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full flex items-center justify-center text-white" style={{ background: l.color }}>
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-medium truncate flex-1" title={l.nome}>{l.nome}</span>
                      <Badge variant="outline" className="text-[9px] shrink-0">{l.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                      <span>Ha: <span className="text-foreground tabular-nums">{l.ha.toFixed(1)}</span></span>
                      <span>Dias: <span className="text-foreground tabular-nums">{l.dias}</span></span>
                      <span className="col-span-2">Custo: <span className="text-foreground font-medium tabular-nums">{fmtBRL(l.custo)}</span> · <span className="tabular-nums">{fmtBRL(l.custoHa)}/ha</span></span>
                      {l.receita > 0 && (
                        <span className="col-span-2 text-emerald-700">Receita: <strong className="tabular-nums">{fmtBRL(l.receita)}</strong></span>
                      )}
                      <span className={cn("col-span-2 font-medium", l.resultado >= 0 ? "text-emerald-700" : "text-rose-700")}>
                        Resultado: <span className="tabular-nums">{fmtBRL(l.resultado)}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selecionados.length >= 1 && (
        <CompararCiclos
          ids={selecionados}
          analytics={a}
          onClear={() => setSelecionados([])}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

function CompararCiclos({ ids, analytics, onClear, isMobile }: { ids: string[]; analytics: ReturnType<typeof useFinanceiroAnalytics>; onClear: () => void; isMobile: boolean }) {
  const ciclos = useMemo(() => ids.map((id) => {
    const c: any = (analytics.cycles as any[]).find((x) => x.id === id);
    const ha = hectaresCiclo(c, analytics.areas as any);
    const custo = custoTotalCiclo(id, analytics.filtered);
    const receita = receitaTotalCiclo(id, analytics.filtered);
    const dias = diasDecorridos(c);
    return { id, nome: c ? `${c.cultura} — ${c.areas?.nome ?? "—"}` : "—", ha, dias, custo, receita, resultado: receita - custo, custoHa: safeDiv(custo, ha), color: colorForEntity("cycle", id), raw: c };
  }), [ids, analytics]);

  const porCategoria = useMemo(() => {
    const catNames = new Map<string, string>();
    const data = new Map<string, Record<string, number>>();
    for (const r of analytics.filtered) {
      const cid = r.classif?.cycle_id ?? r.tx.cycle_id;
      if (!cid || !ids.includes(cid)) continue;
      if (r.tx.tipo !== "saida") continue;
      const catId = r.classif?.categoria_id ?? "sem_categoria";
      const catNome = r.classif?.categoria_id ? analytics.cats.find((c) => c.id === catId)?.nome ?? "—" : "Sem categoria";
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
      .slice(0, 10);
  }, [ids, analytics]);

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
    const arr: any[] = [];
    for (let d = 0; d <= maxDias; d += Math.max(1, Math.floor(maxDias / 60))) {
      const point: any = { dia: d };
      for (const id of ids) {
        const dayVals = Object.entries(buckets).filter(([k]) => Number(k) <= d).reduce((s, [, v]) => s + (v[id] || 0), 0);
        point[id] = dayVals;
      }
      arr.push(point);
    }
    return arr;
  }, [ids, analytics, ciclos]);

  const ChartH = isMobile ? 220 : 280;

  return (
    <Card className="border-primary/30 bg-primary/[0.02]">
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <GitCompare className="h-4 w-4" /> Comparando {ciclos.length} ciclo(s)
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={onClear}><X className="h-3.5 w-3.5 mr-1" />Limpar</Button>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4">
        {/* Stacked cards on mobile */}
        <div className={cn("grid gap-2", ciclos.length === 1 ? "" : "sm:grid-cols-2 lg:grid-cols-4")}>
          {ciclos.map((c) => (
            <Card key={c.id} className="overflow-hidden" style={{ borderLeftWidth: 4, borderLeftColor: c.color }}>
              <CardContent className="p-2.5 space-y-1">
                <p className="text-xs font-medium truncate" title={c.nome}>{c.nome}</p>
                <p className="text-base font-semibold tabular-nums">{fmtBRL(c.custo)}</p>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                  <span>{c.ha.toFixed(1)} ha · {c.dias}d</span>
                  <span className="text-right tabular-nums">{fmtBRL(c.custoHa)}/ha</span>
                  {c.receita > 0 && <span className="col-span-2 text-emerald-700">Receita: <strong className="tabular-nums">{fmtBRL(c.receita)}</strong></span>}
                  <span className={cn("col-span-2 font-medium", c.resultado >= 0 ? "text-emerald-700" : "text-rose-700")}>
                    Result.: <span className="tabular-nums">{fmtBRL(c.resultado)}</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <ChartCard title="Gasto por categoria (top 10)" accent="hsl(265 65% 58%)">
          {porCategoria.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, porCategoria.length * (isMobile ? 28 : 32))}>
              <BarChart data={porCategoria} layout="vertical" margin={{ left: -5, right: 5, top: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="categoria" width={isMobile ? 90 : 130} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                {ciclos.map((c) => (
                  <Bar key={c.id} dataKey={c.id} name={c.nome.split(" — ")[0]} fill={c.color} radius={[0, 3, 3, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Custo acumulado por dia decorrido" accent="hsl(28 75% 50%)">
          <ResponsiveContainer width="100%" height={ChartH}>
            <LineChart data={acumuladoDia} margin={{ left: -10, right: 5, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dia" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} hide={isMobile} width={isMobile ? 0 : 40} />
              <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
              {ciclos.map((c) => (
                <Line key={c.id} type="monotone" dataKey={c.id} stroke={c.color} strokeWidth={2.5} dot={false} name={c.nome.split(" — ")[0]} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </CardContent>
    </Card>
  );
}
