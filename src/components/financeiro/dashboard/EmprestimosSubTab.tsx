import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinanceiroAnalytics, type FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { fmtBRL } from "@/lib/financeiro/finCalc";
import { colorForEntity } from "@/lib/financeiro/entityColors";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { KpiCard } from "./KpiCard";
import { Landmark, TrendingDown, Calendar, Percent } from "lucide-react";

export function EmprestimosSubTab({ filters }: { filters: FinFilters }) {
  const a = useFinanceiroAnalytics(filters);

  const ativos = a.loanMetrics.filter((m) => m.loan.status === "ativo");
  const saldoDevedor = ativos.reduce((s, m) => s + m.saldoDevedor, 0);

  const jurosPeriodo = useMemo(
    () => a.filtered.filter((r) => r.grupo === "juros_tarifas").reduce((s, r) => s + Number(r.tx.valor), 0),
    [a.filtered]
  );
  const pagamentoPeriodo = useMemo(
    () => a.filtered.filter((r) => r.grupo === "pagamento_emprestimo").reduce((s, r) => s + Number(r.tx.valor), 0),
    [a.filtered]
  );

  const hoje = Date.now();
  const venc30 = ativos.flatMap((m) => m.parcelasFuturas).filter((p) => {
    const t = new Date(p.data_vencimento + "T00:00:00").getTime();
    return t - hoje <= 30 * 86400000 && t - hoje >= 0;
  }).reduce((s, p) => s + Number(p.valor), 0);

  const porCredor = useMemo(() => {
    return ativos.map((m) => ({
      id: m.loan.id,
      nome: m.loan.origem_credor,
      saldo: m.saldoDevedor,
      pago: m.totalPago,
      juros: m.juros,
      parcelasPagas: m.parcelasPagas,
      color: colorForEntity("loan", m.loan.id),
    })).sort((x, y) => y.saldo - x.saldo);
  }, [ativos]);

  const cronograma = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of ativos) {
      for (const p of m.parcelasFuturas) {
        const k = p.data_vencimento.slice(0, 7);
        map.set(k, (map.get(k) || 0) + Number(p.valor));
      }
    }
    return Array.from(map.entries())
      .map(([mes, valor]) => ({ mes, valor }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(0, 24);
  }, [ativos]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<Landmark className="h-4 w-4" />} label="Empréstimos ativos" value={`${ativos.length}`} accentColor="hsl(355 65% 55%)" />
        <KpiCard icon={<TrendingDown className="h-4 w-4" />} label="Saldo devedor total" value={fmtBRL(saldoDevedor)} accentColor="hsl(15 70% 50%)" />
        <KpiCard icon={<Percent className="h-4 w-4" />} label="Juros pagos (período)" value={fmtBRL(jurosPeriodo)} accentColor="hsl(330 60% 55%)" hint={`Pagamentos: ${fmtBRL(pagamentoPeriodo)}`} />
        <KpiCard icon={<Calendar className="h-4 w-4" />} label="Vencendo em 30 dias" value={fmtBRL(venc30)} accentColor="hsl(0 70% 60%)" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Saldo devedor por credor</CardTitle></CardHeader>
          <CardContent>
            {porCredor.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">Sem empréstimos ativos.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, porCredor.length * 36)}>
                <BarChart data={porCredor} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="nome" width={140} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => fmtBRL(v)} />
                  <Bar dataKey="saldo" name="Saldo devedor">
                    {porCredor.map((p) => <Cell key={p.id} fill={p.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cronograma de parcelas futuras</CardTitle></CardHeader>
          <CardContent>
            {cronograma.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">Sem parcelas futuras.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cronograma}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmtBRL(v)} />
                  <Bar dataKey="valor" fill="hsl(355 65% 55%)" name="A pagar" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
