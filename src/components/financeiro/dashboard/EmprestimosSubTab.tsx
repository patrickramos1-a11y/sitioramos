import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useFinanceiroAnalytics, type FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { fmtBRL } from "@/lib/financeiro/finCalc";
import { colorForEntity } from "@/lib/financeiro/entityColors";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { KpiCard } from "./KpiCard";
import { MobileKpiRow } from "./MobileKpiRow";
import { ChartCard } from "./ChartCard";
import { Landmark, TrendingDown, Calendar, Percent } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function EmprestimosSubTab({ filters }: { filters: FinFilters }) {
  const a = useFinanceiroAnalytics(filters);
  const isMobile = useIsMobile();

  const ativos = a.loanMetrics.filter((m) => m.loan.status === "ativo");
  const saldoDevedor = ativos.reduce((s, m) => s + m.saldoDevedor, 0);
  const totalContratado = ativos.reduce((s, m) => s + m.totalPago + m.saldoDevedor, 0);
  const maxSaldo = Math.max(1, ...ativos.map((m) => m.saldoDevedor));

  const jurosPeriodo = useMemo(() => a.filtered.filter((r) => r.grupo === "juros_tarifas").reduce((s, r) => s + Number(r.tx.valor), 0), [a.filtered]);
  const pagamentoPeriodo = useMemo(() => a.filtered.filter((r) => r.grupo === "pagamento_emprestimo").reduce((s, r) => s + Number(r.tx.valor), 0), [a.filtered]);

  const hoje = Date.now();
  const venc30 = ativos.flatMap((m) => m.parcelasFuturas).filter((p) => {
    const t = new Date(p.data_vencimento + "T00:00:00").getTime();
    return t - hoje <= 30 * 86400000 && t - hoje >= 0;
  }).reduce((s, p) => s + Number(p.valor), 0);

  const cronograma = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of ativos) {
      for (const p of m.parcelasFuturas) {
        const k = p.data_vencimento.slice(0, 7);
        map.set(k, (map.get(k) || 0) + Number(p.valor));
      }
    }
    return Array.from(map.entries()).map(([mes, valor]) => ({ mes, mesShort: mes.slice(2), valor })).sort((a, b) => a.mes.localeCompare(b.mes)).slice(0, 24);
  }, [ativos]);

  return (
    <div className="space-y-3 md:space-y-4">
      <MobileKpiRow>
        <KpiCard compact={isMobile} icon={<Landmark className="h-3.5 w-3.5" />} label="Ativos" value={`${ativos.length}`} accentColor="hsl(355 65% 55%)" />
        <KpiCard compact={isMobile} icon={<TrendingDown className="h-3.5 w-3.5" />} label="Saldo devedor" value={fmtBRL(saldoDevedor)} accentColor="hsl(15 70% 50%)" />
        <KpiCard compact={isMobile} icon={<Percent className="h-3.5 w-3.5" />} label="Juros (período)" value={fmtBRL(jurosPeriodo)} accentColor="hsl(330 60% 55%)" hint={`Pagamentos: ${fmtBRL(pagamentoPeriodo)}`} />
        <KpiCard compact={isMobile} icon={<Calendar className="h-3.5 w-3.5" />} label="Vence 30d" value={fmtBRL(venc30)} accentColor="hsl(0 70% 60%)" />
      </MobileKpiRow>

      <ChartCard title="Empréstimos por credor" accent="hsl(355 65% 55%)">
        {ativos.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">Sem empréstimos ativos.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {ativos.sort((a, b) => b.saldoDevedor - a.saldoDevedor).map((m) => {
              const color = colorForEntity("loan", m.loan.id);
              const pctPago = m.totalPago + m.saldoDevedor > 0 ? m.totalPago / (m.totalPago + m.saldoDevedor) : 0;
              const wSaldo = (m.saldoDevedor / maxSaldo) * 100;
              return (
                <div key={m.loan.id} className="rounded-md border p-2.5 space-y-1.5" style={{ borderLeftWidth: 3, borderLeftColor: color }}>
                  <p className="text-xs font-medium truncate" title={m.loan.origem_credor}>{m.loan.origem_credor}</p>
                  <p className="text-base font-semibold tabular-nums" style={{ color }}>{fmtBRL(m.saldoDevedor)}</p>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                    <span>Pago: <span className="text-foreground tabular-nums">{fmtBRL(m.totalPago)}</span></span>
                    <span className="text-right">Juros: <span className="text-foreground tabular-nums">{fmtBRL(m.juros)}</span></span>
                    <span className="col-span-2">Parc. pagas: <span className="text-foreground">{m.parcelasPagas}</span></span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Quitação</span>
                      <span className="tabular-nums font-medium" style={{ color }}>{(pctPago * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pctPago * 100}%`, background: color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ChartCard>

      <ChartCard title="Cronograma de parcelas futuras" accent="hsl(0 70% 60%)">
        {cronograma.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">Sem parcelas futuras.</p>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
            <BarChart data={cronograma} margin={{ left: -10, right: 5, top: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mesShort" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} hide={isMobile} width={isMobile ? 0 : 40} />
              <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="valor" fill="hsl(355 65% 55%)" name="A pagar" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
