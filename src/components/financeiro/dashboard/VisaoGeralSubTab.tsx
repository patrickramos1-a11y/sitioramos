import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, TrendingUp, TrendingDown, Wallet, Sprout, Hammer, Banknote, FileWarning, Receipt, Landmark, CheckCircle2, Percent, Flame } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, CartesianGrid, LineChart, Line,
} from "recharts";
import { useFinanceiroAnalytics, type FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { fmtBRL, fmtPct, sumValor, sumByGrupo, monthKey } from "@/lib/financeiro/finCalc";
import { grupoColors, grupoLabels, isEntradaGrupo, isSaidaGrupo, type GrupoGerencial } from "@/lib/financeiro/managementGroup";
import { safeDiv } from "@/lib/financeiro/perHectare";
import { KpiCard } from "./KpiCard";
import { MobileKpiRow } from "./MobileKpiRow";
import { ChartCard } from "./ChartCard";
import { useIsMobile } from "@/hooks/use-mobile";

export function VisaoGeralSubTab({ filters }: { filters: FinFilters }) {
  const a = useFinanceiroAnalytics(filters);
  const isMobile = useIsMobile();

  const totalsByGrupo = useMemo(() => sumByGrupo(a.filtered), [a.filtered]);
  const totalEntradas = a.filtered.filter((r) => r.tx.tipo === "entrada").reduce((s, r) => s + Number(r.tx.valor), 0);
  const totalSaidas = a.filtered.filter((r) => r.tx.tipo === "saida").reduce((s, r) => s + Number(r.tx.valor), 0);
  const naoClassif = a.filtered.filter((r) => r.grupo === "nao_classificado");
  const classifiedCount = a.filtered.length - naoClassif.length;
  const pctClass = a.filtered.length ? classifiedCount / a.filtered.length : 0;

  const receitaOp = totalsByGrupo.receita_operacional || 0;
  const custoPlant = totalsByGrupo.custo_plantacao || 0;
  const despesaGeral = totalsByGrupo.despesa_geral || 0;
  const resultadoOperacional = receitaOp - custoPlant - despesaGeral;
  const margemOperacional = safeDiv(resultadoOperacional, receitaOp);
  const resultadoCaixa = totalEntradas - totalSaidas;

  const saldoAtual = useMemo(() => {
    const e = a.resolved.filter((r) => r.tx.tipo === "entrada").reduce((s, r) => s + Number(r.tx.valor), 0);
    const s = a.resolved.filter((r) => r.tx.tipo === "saida").reduce((sm, r) => sm + Number(r.tx.valor), 0);
    return e - s;
  }, [a.resolved]);

  const loansAtivos = a.loans.filter((l: any) => l.status === "ativo");
  const saldoDevedorTotal = a.loanMetrics.filter((m) => m.loan.status === "ativo").reduce((s, m) => s + m.saldoDevedor, 0);

  const mensal = useMemo(() => {
    const map = new Map<string, { mes: string; entradas: number; saidas: number }>();
    for (const r of a.filtered) {
      const k = monthKey(r.tx.data);
      if (!map.has(k)) map.set(k, { mes: k, entradas: 0, saidas: 0 });
      const m = map.get(k)!;
      if (r.tx.tipo === "entrada") m.entradas += Number(r.tx.valor);
      else m.saidas += Number(r.tx.valor);
    }
    const arr = Array.from(map.values()).sort((x, y) => x.mes.localeCompare(y.mes));
    let acc = 0;
    return arr.map((m) => { acc += m.entradas - m.saidas; return { ...m, saldo: acc, mesShort: m.mes.slice(5) }; });
  }, [a.filtered]);

  const burnMensal = mensal.length > 0 ? mensal.reduce((s, m) => s + m.saidas, 0) / mensal.length : 0;
  const runwayMeses = burnMensal > 0 ? saldoAtual / burnMensal : 0;

  // Delta vs primeiro mês (proxy "mês anterior")
  const deltaSaldo = mensal.length >= 2 ? (mensal[mensal.length - 1].saldo - mensal[mensal.length - 2].saldo) : 0;

  const composEntradas = (Object.keys(totalsByGrupo) as GrupoGerencial[])
    .filter((g) => isEntradaGrupo(g) && totalsByGrupo[g] > 0)
    .map((g) => ({ name: grupoLabels[g], value: totalsByGrupo[g], color: grupoColors[g] }));

  const composSaidas = (Object.keys(totalsByGrupo) as GrupoGerencial[])
    .filter((g) => isSaidaGrupo(g) && totalsByGrupo[g] > 0)
    .map((g) => ({ name: grupoLabels[g], value: totalsByGrupo[g], color: grupoColors[g] }));

  const ChartHeight = isMobile ? 200 : 260;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* HERO Saldo */}
      <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: "hsl(190 80% 45%)" }}>
        <CardContent className="p-3 md:p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Saldo atual em caixa</p>
            <p className="text-2xl md:text-3xl font-bold tabular-nums leading-tight">{fmtBRL(saldoAtual)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Resultado do período: <span className={resultadoCaixa >= 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>{fmtBRL(resultadoCaixa)}</span>
              {mensal.length >= 2 && (
                <span className="ml-2">· Δ mês: <span className={deltaSaldo >= 0 ? "text-emerald-600" : "text-rose-600"}>{deltaSaldo >= 0 ? "+" : ""}{fmtBRL(deltaSaldo)}</span></span>
              )}
            </p>
          </div>
          <div className="shrink-0 hidden sm:flex h-14 w-14 rounded-full items-center justify-center" style={{ background: "hsl(190 80% 45% / 0.12)" }}>
            <Wallet className="h-7 w-7" style={{ color: "hsl(190 80% 45%)" }} />
          </div>
        </CardContent>
      </Card>

      {naoClassif.length > 0 && (
        <button
          className="w-full text-left rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-xs flex items-center gap-2 hover:bg-amber-100/50 transition-colors"
        >
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="flex-1 truncate"><strong>{naoClassif.length}</strong> lançamentos não classificados ({fmtBRL(sumValor(naoClassif))})</span>
        </button>
      )}

      {/* KPI Carousel — Resultado */}
      <MobileKpiRow title="Resultado">
        <KpiCard compact={isMobile} icon={<Receipt className="h-3.5 w-3.5" />} label="Resultado op." value={fmtBRL(resultadoOperacional)} accentColor="hsl(265 65% 58%)" hint="Receita Op. − Custo Plant. − Despesa Geral" warn={naoClassif.length > 0} />
        <KpiCard compact={isMobile} icon={<Percent className="h-3.5 w-3.5" />} label="Margem op." value={fmtPct(margemOperacional)} accentColor="hsl(285 65% 58%)" hint="Resultado / Receita Op." />
        <KpiCard compact={isMobile} icon={<Banknote className="h-3.5 w-3.5" />} label="Result. caixa" value={fmtBRL(resultadoCaixa)} accentColor="hsl(165 65% 40%)" hint="Entradas − Saídas (todas)" />
        <KpiCard compact={isMobile} icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="% classificado" value={`${(pctClass * 100).toFixed(0)}%`} accentColor="hsl(142 55% 42%)" hint={`${classifiedCount} de ${a.filtered.length}`} />
      </MobileKpiRow>

      {/* KPI Carousel — Fluxo */}
      <MobileKpiRow title="Fluxo">
        <KpiCard compact={isMobile} icon={<TrendingUp className="h-3.5 w-3.5" />} label="Entradas" value={fmtBRL(totalEntradas)} accentColor="hsl(142 65% 45%)" hint={`Op: ${fmtBRL(receitaOp)} · Aporte: ${fmtBRL(totalsByGrupo.aporte_socios || 0)} · Empr.: ${fmtBRL(totalsByGrupo.entrada_emprestimo || 0)}`} />
        <KpiCard compact={isMobile} icon={<TrendingDown className="h-3.5 w-3.5" />} label="Saídas" value={fmtBRL(totalSaidas)} accentColor="hsl(355 65% 55%)" hint={`Plant.: ${fmtBRL(custoPlant)} · Inv.: ${fmtBRL(totalsByGrupo.investimento || 0)} · Empr.: ${fmtBRL((totalsByGrupo.pagamento_emprestimo || 0) + (totalsByGrupo.juros_tarifas || 0))}`} />
        <KpiCard compact={isMobile} icon={<Flame className="h-3.5 w-3.5" />} label="Burn mensal" value={fmtBRL(burnMensal)} accentColor="hsl(15 80% 55%)" hint={`Runway: ${runwayMeses > 0 ? runwayMeses.toFixed(1) + " meses" : "—"}`} />
        <KpiCard compact={isMobile} icon={<Wallet className="h-3.5 w-3.5" />} label="Saldo caixa" value={fmtBRL(saldoAtual)} accentColor="hsl(190 80% 45%)" hint="Todas as movimentações" />
      </MobileKpiRow>

      {/* KPI Carousel — Operação */}
      <MobileKpiRow title="Operação">
        <KpiCard compact={isMobile} icon={<Sprout className="h-3.5 w-3.5" />} label="Custo plant." value={fmtBRL(custoPlant)} accentColor="hsl(28 75% 50%)" hint="No período" />
        <KpiCard compact={isMobile} icon={<Hammer className="h-3.5 w-3.5" />} label="Investimentos" value={fmtBRL(totalsByGrupo.investimento || 0)} accentColor="hsl(45 90% 55%)" hint={`${a.projetos.filter((p) => p.status === "em_andamento").length} projeto(s) ativos`} />
        <KpiCard compact={isMobile} icon={<Landmark className="h-3.5 w-3.5" />} label="Empr. ativos" value={`${loansAtivos.length}`} accentColor="hsl(355 65% 55%)" hint={`Saldo devedor: ${fmtBRL(saldoDevedorTotal)}`} />
        <KpiCard compact={isMobile} icon={<FileWarning className="h-3.5 w-3.5" />} label="Não classif." value={`${naoClassif.length}`} accentColor="hsl(48 95% 55%)" hint={fmtBRL(sumValor(naoClassif))} warn={naoClassif.length > 0} />
      </MobileKpiRow>

      {/* CHARTS */}
      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Entradas × Saídas por mês" accent="hsl(190 80% 45%)" table={<MonthlyTable data={mensal} />}>
          <ResponsiveContainer width="100%" height={ChartHeight}>
            <BarChart data={mensal} margin={{ left: -10, right: 5, top: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mesShort" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} hide={isMobile} width={isMobile ? 0 : 40} />
              <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
              <Bar dataKey="entradas" fill="hsl(142 65% 45%)" name="Entradas" radius={[3, 3, 0, 0]} />
              <Bar dataKey="saidas" fill="hsl(355 65% 55%)" name="Saídas" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Saldo acumulado" accent="hsl(190 80% 45%)" table={<MonthlyTable data={mensal} cols={["saldo"]} />}>
          <ResponsiveContainer width="100%" height={ChartHeight}>
            <LineChart data={mensal} margin={{ left: -10, right: 5, top: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mesShort" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} hide={isMobile} width={isMobile ? 0 : 40} />
              <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="saldo" stroke="hsl(190 80% 45%)" strokeWidth={2.5} name="Saldo" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Composição de entradas" accent="hsl(142 65% 45%)" table={<CompTable data={composEntradas} />}>
          <DonutBlock data={composEntradas} height={ChartHeight} />
        </ChartCard>

        <ChartCard title="Composição de saídas" accent="hsl(355 65% 55%)" table={<CompTable data={composSaidas} />}>
          <DonutBlock data={composSaidas} height={ChartHeight} />
        </ChartCard>
      </div>
    </div>
  );
}

function DonutBlock({ data, height }: { data: { name: string; value: number; color: string }[]; height: number }) {
  if (!data.length) return <p className="text-xs text-muted-foreground py-8 text-center">Sem dados no período.</p>;
  const total = data.reduce((s, d) => s + d.value, 0);
  // top 5 + outros
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const display = rest.length > 0
    ? [...top, { name: "Outros", value: rest.reduce((s, d) => s + d.value, 0), color: "hsl(0 0% 60%)" }]
    : top;

  return (
    <div className="grid grid-cols-2 gap-2 items-center">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={display} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
            {display.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1">
        {display.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
            <span className="flex-1 truncate" title={d.name}>{d.name}</span>
            <span className="tabular-nums font-medium">{((d.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyTable({ data, cols = ["entradas", "saidas", "saldo"] }: { data: any[]; cols?: string[] }) {
  return (
    <div className="overflow-auto max-h-64">
      <table className="w-full text-[11px]">
        <thead className="sticky top-0 bg-background"><tr>
          <th className="text-left px-2 py-1">Mês</th>
          {cols.includes("entradas") && <th className="text-right px-2 py-1">Entradas</th>}
          {cols.includes("saidas") && <th className="text-right px-2 py-1">Saídas</th>}
          {cols.includes("saldo") && <th className="text-right px-2 py-1">Saldo</th>}
        </tr></thead>
        <tbody>
          {data.map((m) => (
            <tr key={m.mes} className="border-t">
              <td className="px-2 py-1">{m.mes}</td>
              {cols.includes("entradas") && <td className="text-right px-2 py-1 text-emerald-700 tabular-nums">{fmtBRL(m.entradas)}</td>}
              {cols.includes("saidas") && <td className="text-right px-2 py-1 text-rose-700 tabular-nums">{fmtBRL(m.saidas)}</td>}
              {cols.includes("saldo") && <td className="text-right px-2 py-1 tabular-nums font-medium">{fmtBRL(m.saldo)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompTable({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="overflow-auto max-h-64">
      <table className="w-full text-[11px]">
        <thead className="sticky top-0 bg-background"><tr>
          <th className="text-left px-2 py-1">Grupo</th>
          <th className="text-right px-2 py-1">Valor</th>
          <th className="text-right px-2 py-1">%</th>
        </tr></thead>
        <tbody>
          {data.sort((a, b) => b.value - a.value).map((d) => (
            <tr key={d.name} className="border-t">
              <td className="px-2 py-1 flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />{d.name}</td>
              <td className="text-right px-2 py-1 tabular-nums">{fmtBRL(d.value)}</td>
              <td className="text-right px-2 py-1 tabular-nums">{total ? ((d.value / total) * 100).toFixed(0) : 0}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
