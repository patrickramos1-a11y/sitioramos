import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFinanceiroAnalytics, type FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { fmtBRL, monthKey } from "@/lib/financeiro/finCalc";
import { colorForEntity } from "@/lib/financeiro/entityColors";
import { usePropriedade } from "@/hooks/usePropriedade";
import { safeDiv } from "@/lib/financeiro/perHectare";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { KpiCard } from "./KpiCard";
import { MobileKpiRow } from "./MobileKpiRow";
import { ChartCard } from "./ChartCard";
import { Hammer, Percent, Layers, MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function InvestimentosSubTab({ filters }: { filters: FinFilters }) {
  const a = useFinanceiroAnalytics(filters);
  const { propriedade } = usePropriedade();
  const isMobile = useIsMobile();
  const haPropriedade = Number(propriedade?.area_total_hectares || 0);

  const investimentos = useMemo(() => a.filtered.filter((r) => r.grupo === "investimento"), [a.filtered]);
  const totalInvestido = investimentos.reduce((s, r) => s + Number(r.tx.valor), 0);
  const investidoAcumulado = a.resolved.filter((r) => r.grupo === "investimento").reduce((s, r) => s + Number(r.tx.valor), 0);
  const projetosAtivos = a.projetos.filter((p) => p.status === "em_andamento");

  const porProjeto = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of investimentos) {
      const pid = r.classif?.projeto_investimento_id;
      if (!pid) continue;
      map.set(pid, (map.get(pid) || 0) + Number(r.tx.valor));
    }
    return Array.from(map.entries()).map(([pid, total]) => {
      const proj: any = a.projetos.find((p) => p.id === pid);
      return {
        id: pid, nome: proj?.nome ?? "—", total,
        previsto: Number(proj?.valor_previsto || 0),
        execucao: proj?.valor_previsto ? safeDiv(total, Number(proj.valor_previsto)) : 0,
        status: proj?.status ?? "—",
        color: colorForEntity("project", pid),
      };
    }).sort((x, y) => y.total - x.total);
  }, [investimentos, a.projetos]);

  const evolucao = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of investimentos) {
      const k = monthKey(r.tx.data);
      map.set(k, (map.get(k) || 0) + Number(r.tx.valor));
    }
    return Array.from(map.entries()).map(([mes, valor]) => ({ mes, mesShort: mes.slice(5), valor })).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [investimentos]);

  return (
    <div className="space-y-3 md:space-y-4">
      <MobileKpiRow>
        <KpiCard compact={isMobile} icon={<Hammer className="h-3.5 w-3.5" />} label="Investido (período)" value={fmtBRL(totalInvestido)} accentColor="hsl(45 90% 55%)" />
        <KpiCard compact={isMobile} icon={<Layers className="h-3.5 w-3.5" />} label="Acumulado" value={fmtBRL(investidoAcumulado)} accentColor="hsl(25 85% 55%)" hint="Todas as movimentações" />
        <KpiCard compact={isMobile} icon={<MapPin className="h-3.5 w-3.5" />} label="R$/ha investido" value={fmtBRL(safeDiv(investidoAcumulado, haPropriedade))} accentColor="hsl(310 70% 55%)" hint={haPropriedade ? `${haPropriedade} ha totais` : "Cadastre a propriedade"} />
        <KpiCard compact={isMobile} icon={<Percent className="h-3.5 w-3.5" />} label="Projetos ativos" value={`${projetosAtivos.length}`} accentColor="hsl(285 65% 58%)" />
      </MobileKpiRow>

      <ChartCard title="Projetos de investimento" accent="hsl(45 90% 55%)" table={<ProjTable rows={porProjeto} />}>
        {porProjeto.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">Sem investimentos no período.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {porProjeto.map((p) => {
              const pct = Math.min(100, p.execucao * 100);
              return (
                <div key={p.id} className="rounded-md border p-2.5 space-y-1.5" style={{ borderLeftWidth: 3, borderLeftColor: p.color }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium truncate flex-1" title={p.nome}>{p.nome}</span>
                    <Badge variant="outline" className="text-[9px] shrink-0">{p.status}</Badge>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-semibold tabular-nums" style={{ color: p.color }}>{fmtBRL(p.total)}</span>
                    {p.previsto > 0 && <span className="text-[10px] text-muted-foreground tabular-nums">/ {fmtBRL(p.previsto)}</span>}
                  </div>
                  {p.previsto > 0 && (
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Execução</span>
                        <span className="tabular-nums font-medium" style={{ color: p.color }}>{(p.execucao * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ChartCard>

      <ChartCard title="Evolução mensal" accent="hsl(45 90% 55%)">
        {evolucao.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">Sem dados.</p>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
            <LineChart data={evolucao} margin={{ left: -10, right: 5, top: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mesShort" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} hide={isMobile} width={isMobile ? 0 : 40} />
              <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="valor" stroke="hsl(45 90% 55%)" strokeWidth={2.5} dot={false} name="Investimento" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function ProjTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-auto max-h-[60vh]">
      <table className="w-full text-[11px]">
        <thead className="sticky top-0 bg-background"><tr>
          <th className="text-left px-2 py-1">Projeto</th>
          <th className="text-left px-2 py-1">Status</th>
          <th className="text-right px-2 py-1">Previsto</th>
          <th className="text-right px-2 py-1">Realiz.</th>
          <th className="text-right px-2 py-1">%</th>
        </tr></thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="px-2 py-1 flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />{p.nome}</td>
              <td className="px-2 py-1">{p.status}</td>
              <td className="text-right px-2 py-1 tabular-nums">{fmtBRL(p.previsto)}</td>
              <td className="text-right px-2 py-1 tabular-nums">{fmtBRL(p.total)}</td>
              <td className="text-right px-2 py-1 tabular-nums">{(p.execucao * 100).toFixed(0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
