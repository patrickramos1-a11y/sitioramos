import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinanceiroAnalytics, type FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { fmtBRL, monthKey } from "@/lib/financeiro/finCalc";
import { colorForEntity } from "@/lib/financeiro/entityColors";
import { usePropriedade } from "@/hooks/usePropriedade";
import { safeDiv } from "@/lib/financeiro/perHectare";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, LineChart, Line } from "recharts";
import { KpiCard } from "./KpiCard";
import { Hammer, Percent, Layers, MapPin } from "lucide-react";

export function InvestimentosSubTab({ filters }: { filters: FinFilters }) {
  const a = useFinanceiroAnalytics(filters);
  const { propriedade } = usePropriedade();
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
        id: pid,
        nome: proj?.nome ?? "—",
        total,
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
    return Array.from(map.entries())
      .map(([mes, valor]) => ({ mes, valor }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }, [investimentos]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<Hammer className="h-4 w-4" />} label="Investido (período)" value={fmtBRL(totalInvestido)} accentColor="hsl(45 90% 55%)" />
        <KpiCard icon={<Layers className="h-4 w-4" />} label="Investido acumulado" value={fmtBRL(investidoAcumulado)} accentColor="hsl(25 85% 55%)" hint="Todas as movimentações" />
        <KpiCard icon={<MapPin className="h-4 w-4" />} label="R$/ha investido" value={fmtBRL(safeDiv(investidoAcumulado, haPropriedade))} accentColor="hsl(310 70% 55%)" hint={haPropriedade ? `${haPropriedade} ha totais` : "Cadastre a propriedade"} />
        <KpiCard icon={<Percent className="h-4 w-4" />} label="Projetos ativos" value={`${projetosAtivos.length}`} accentColor="hsl(285 65% 58%)" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Investimento por projeto (cor única)</CardTitle></CardHeader>
          <CardContent>
            {porProjeto.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">Sem investimentos no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, porProjeto.length * 32)}>
                <BarChart data={porProjeto} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="nome" width={140} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => fmtBRL(v)} />
                  <Bar dataKey="total">
                    {porProjeto.map((p) => <Cell key={p.id} fill={p.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Evolução mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} />
                <Line type="monotone" dataKey="valor" stroke="hsl(45 90% 55%)" strokeWidth={2.5} dot={false} name="Investimento" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Detalhamento por projeto</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">Projeto</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2">Previsto</th>
                  <th className="text-right px-3 py-2">Realizado</th>
                  <th className="text-right px-3 py-2">% execução</th>
                </tr>
              </thead>
              <tbody>
                {porProjeto.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2 flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-sm" style={{ background: p.color }} />
                      {p.nome}
                    </td>
                    <td className="px-3 py-2">{p.status}</td>
                    <td className="text-right px-3 py-2">{fmtBRL(p.previsto)}</td>
                    <td className="text-right px-3 py-2">{fmtBRL(p.total)}</td>
                    <td className="text-right px-3 py-2">{(p.execucao * 100).toFixed(0)}%</td>
                  </tr>
                ))}
                {porProjeto.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Sem projetos com investimentos.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
