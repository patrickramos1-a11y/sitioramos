import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingUp, TrendingDown, Wallet, Sprout, Hammer, Banknote, FileWarning, Receipt, Landmark, CheckCircle2 } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { FinanceiroFilters } from "./FinanceiroFilters";
import { useFinanceiroAnalytics, defaultFilters, type FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { fmtBRL, sumValor, sumByGrupo, monthKey } from "@/lib/financeiro/finCalc";
import { grupoColors, grupoLabels, isEntradaGrupo, isSaidaGrupo, type GrupoGerencial } from "@/lib/financeiro/managementGroup";

export function DashboardTab() {
  const [filters, setFilters] = useState<FinFilters>(defaultFilters);
  const a = useFinanceiroAnalytics(filters);

  const totalsByGrupo = useMemo(() => sumByGrupo(a.filtered), [a.filtered]);
  const totalEntradas = useMemo(
    () => a.filtered.filter((r) => r.tx.tipo === "entrada").reduce((s, r) => s + Number(r.tx.valor), 0),
    [a.filtered]
  );
  const totalSaidas = useMemo(
    () => a.filtered.filter((r) => r.tx.tipo === "saida").reduce((s, r) => s + Number(r.tx.valor), 0),
    [a.filtered]
  );
  const naoClassif = a.filtered.filter((r) => r.grupo === "nao_classificado");
  const classifiedCount = a.filtered.length - naoClassif.length;
  const pctClass = a.filtered.length ? classifiedCount / a.filtered.length : 0;

  const resultadoOperacional =
    (totalsByGrupo.receita_operacional || 0) -
    (totalsByGrupo.custo_plantacao || 0) -
    (totalsByGrupo.despesa_geral || 0);

  const resultadoCaixa = totalEntradas - totalSaidas;

  // Saldo atual = todos pagos (sem filtros). Usa resolved completo.
  const saldoAtual = useMemo(() => {
    const e = a.resolved.filter((r) => r.tx.tipo === "entrada").reduce((s, r) => s + Number(r.tx.valor), 0);
    const s = a.resolved.filter((r) => r.tx.tipo === "saida").reduce((sm, r) => sm + Number(r.tx.valor), 0);
    return e - s;
  }, [a.resolved]);

  // Empréstimos ativos
  const loansAtivos = a.loans.filter((l: any) => l.status === "ativo");
  const saldoDevedorTotal = a.loanMetrics
    .filter((m) => m.loan.status === "ativo")
    .reduce((s, m) => s + m.saldoDevedor, 0);

  // Investimentos em projetos andamento
  const projetosAtivos = a.projetos.filter((p) => p.status === "em_andamento");
  const investimentosEmAndamento = a.filtered
    .filter((r) => r.grupo === "investimento" && r.classif?.projeto_investimento_id && projetosAtivos.find((p) => p.id === r.classif!.projeto_investimento_id))
    .reduce((s, r) => s + Number(r.tx.valor), 0);

  return (
    <div className="space-y-4">
      <FinanceiroFilters value={filters} onChange={setFilters} />

      {naoClassif.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-3 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <span>
              Existem <strong>{naoClassif.length}</strong> lançamentos não classificados ({fmtBRL(sumValor(naoClassif))}) no período filtrado.
              Indicadores de resultado operacional, custo de plantação e investimento consideram apenas lançamentos classificados.
            </span>
          </CardContent>
        </Card>
      )}

      {/* KPI linha 1 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Wallet className="h-4 w-4" />} label="Saldo atual (caixa)" value={fmtBRL(saldoAtual)} hint="Todas as movimentações" />
        <Kpi icon={<TrendingUp className="h-4 w-4 text-emerald-600" />} label="Entradas (período)" value={fmtBRL(totalEntradas)}
          hint={`Op: ${fmtBRL(totalsByGrupo.receita_operacional || 0)} · Aporte: ${fmtBRL(totalsByGrupo.aporte_socios || 0)} · Empr.: ${fmtBRL(totalsByGrupo.entrada_emprestimo || 0)}`} />
        <Kpi icon={<TrendingDown className="h-4 w-4 text-rose-600" />} label="Saídas (período)" value={fmtBRL(totalSaidas)}
          hint={`Plant.: ${fmtBRL(totalsByGrupo.custo_plantacao || 0)} · Inv.: ${fmtBRL(totalsByGrupo.investimento || 0)} · Empr.: ${fmtBRL((totalsByGrupo.pagamento_emprestimo || 0) + (totalsByGrupo.juros_tarifas || 0))}`} />
        <Kpi icon={<Receipt className="h-4 w-4" />} label="Resultado operacional" value={fmtBRL(resultadoOperacional)}
          hint="Receita Op. − Custo Plant. − Despesa Geral" warn={naoClassif.length > 0} />
      </div>

      {/* KPI linha 2 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Banknote className="h-4 w-4" />} label="Resultado de caixa" value={fmtBRL(resultadoCaixa)} hint="Entradas − Saídas (todas)" />
        <Kpi icon={<Sprout className="h-4 w-4" />} label="Custos de plantação" value={fmtBRL(totalsByGrupo.custo_plantacao || 0)} hint="No período" />
        <Kpi icon={<Hammer className="h-4 w-4" />} label="Investimentos em andamento" value={fmtBRL(investimentosEmAndamento)} hint={`${projetosAtivos.length} projeto(s)`} />
        <Kpi icon={<FileWarning className="h-4 w-4 text-amber-600" />} label="Não classificados" value={`${naoClassif.length}`} hint={fmtBRL(sumValor(naoClassif))} />
      </div>

      {/* KPI linha 3 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Landmark className="h-4 w-4" />} label="Empréstimos ativos" value={`${loansAtivos.length}`} hint={`Saldo devedor: ${fmtBRL(saldoDevedorTotal)}`} />
        <Kpi icon={<TrendingDown className="h-4 w-4" />} label="Pagamentos de empréstimo" value={fmtBRL(totalsByGrupo.pagamento_emprestimo || 0)} hint={`Juros/Tarifas: ${fmtBRL(totalsByGrupo.juros_tarifas || 0)}`} />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Aportes dos sócios" value={fmtBRL(totalsByGrupo.aporte_socios || 0)} hint="No período" />
        <Kpi icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="% classificação" value={`${(pctClass * 100).toFixed(0)}%`} hint={`${classifiedCount} de ${a.filtered.length}`} />
      </div>

      <ChartsGrid analytics={a} totalsByGrupo={totalsByGrupo} />
    </div>
  );
}

function Kpi({ icon, label, value, hint, warn }: { icon: React.ReactNode; label: string; value: string; hint?: string; warn?: boolean }) {
  return (
    <Card className={warn ? "border-amber-300" : ""}>
      <CardHeader className="pb-1.5">
        <CardTitle className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-normal">
          {icon} {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-lg font-semibold leading-tight">{value}</p>
        {hint && <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={hint}>{hint}</p>}
      </CardContent>
    </Card>
  );
}

function ChartsGrid({ analytics, totalsByGrupo }: { analytics: ReturnType<typeof useFinanceiroAnalytics>; totalsByGrupo: Record<GrupoGerencial, number> }) {
  // Mensal entradas x saídas
  const mensal = useMemo(() => {
    const map = new Map<string, { mes: string; entradas: number; saidas: number }>();
    for (const r of analytics.filtered) {
      const k = monthKey(r.tx.data);
      if (!map.has(k)) map.set(k, { mes: k, entradas: 0, saidas: 0 });
      const m = map.get(k)!;
      if (r.tx.tipo === "entrada") m.entradas += Number(r.tx.valor);
      else m.saidas += Number(r.tx.valor);
    }
    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [analytics.filtered]);

  const composEntradas = (Object.keys(totalsByGrupo) as GrupoGerencial[])
    .filter((g) => isEntradaGrupo(g) && totalsByGrupo[g] > 0)
    .map((g) => ({ name: grupoLabels[g], value: totalsByGrupo[g], color: grupoColors[g] }));

  const composSaidas = (Object.keys(totalsByGrupo) as GrupoGerencial[])
    .filter((g) => isSaidaGrupo(g) && totalsByGrupo[g] > 0)
    .map((g) => ({ name: grupoLabels[g], value: totalsByGrupo[g], color: grupoColors[g] }));

  // Custos por área
  const porArea = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of analytics.filtered) {
      if (r.grupo !== "custo_plantacao") continue;
      const aid = r.classif?.area_id ?? r.tx.area_id;
      if (!aid) continue;
      map.set(aid, (map.get(aid) || 0) + Number(r.tx.valor));
    }
    return Array.from(map.entries()).map(([aid, total]) => ({
      nome: analytics.areas.find((a) => a.id === aid)?.nome ?? "—",
      total,
    })).sort((a, b) => b.total - a.total);
  }, [analytics.filtered, analytics.areas]);

  // Custos por ciclo
  const porCiclo = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of analytics.filtered) {
      if (r.grupo !== "custo_plantacao") continue;
      const cid = r.classif?.cycle_id ?? r.tx.cycle_id;
      if (!cid) continue;
      map.set(cid, (map.get(cid) || 0) + Number(r.tx.valor));
    }
    return Array.from(map.entries()).map(([cid, total]) => {
      const c: any = analytics.cycles.find((x: any) => x.id === cid);
      return { nome: c ? `${c.cultura} — ${c.areas?.nome ?? ""}` : "—", total };
    }).sort((a, b) => b.total - a.total);
  }, [analytics.filtered, analytics.cycles]);

  // Investimentos por projeto
  const porProjeto = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of analytics.filtered) {
      if (r.grupo !== "investimento") continue;
      const pid = r.classif?.projeto_investimento_id;
      if (!pid) continue;
      map.set(pid, (map.get(pid) || 0) + Number(r.tx.valor));
    }
    return Array.from(map.entries()).map(([pid, total]) => ({
      nome: analytics.projetos.find((p) => p.id === pid)?.nome ?? "—",
      total,
    })).sort((a, b) => b.total - a.total);
  }, [analytics.filtered, analytics.projetos]);

  // Despesas por categoria
  const porCategoria = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of analytics.filtered) {
      if (r.tx.tipo !== "saida" || !r.classif?.categoria_id) continue;
      map.set(r.classif.categoria_id, (map.get(r.classif.categoria_id) || 0) + Number(r.tx.valor));
    }
    return Array.from(map.entries()).map(([id, total]) => ({
      nome: analytics.cats.find((c) => c.id === id)?.nome ?? "—",
      total,
    })).sort((a, b) => b.total - a.total).slice(0, 12);
  }, [analytics.filtered, analytics.cats]);

  // Custos por centro
  const porCentro = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of analytics.filtered) {
      if (r.tx.tipo !== "saida" || !r.classif?.centro_custo_id) continue;
      map.set(r.classif.centro_custo_id, (map.get(r.classif.centro_custo_id) || 0) + Number(r.tx.valor));
    }
    return Array.from(map.entries()).map(([id, total]) => ({
      nome: analytics.centros.find((c) => c.id === id)?.nome ?? "—",
      total,
    })).sort((a, b) => b.total - a.total);
  }, [analytics.filtered, analytics.centros]);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ChartCard title="Entradas × Saídas por mês">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={mensal}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => fmtBRL(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="entradas" fill="hsl(142 65% 45%)" name="Entradas" />
            <Bar dataKey="saidas" fill="hsl(355 65% 55%)" name="Saídas" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Composição das entradas">
        <PieBlock data={composEntradas} />
      </ChartCard>

      <ChartCard title="Composição das saídas">
        <PieBlock data={composSaidas} />
      </ChartCard>

      <ChartCard title="Despesas por categoria (top 12)">
        <BarBlock data={porCategoria} />
      </ChartCard>

      <ChartCard title="Custos por centro de custo">
        <BarBlock data={porCentro} />
      </ChartCard>

      <ChartCard title="Custos por área / talhão">
        <BarBlock data={porArea} />
      </ChartCard>

      <ChartCard title="Custos por ciclo produtivo">
        <BarBlock data={porCiclo} />
      </ChartCard>

      <ChartCard title="Investimentos por projeto">
        <BarBlock data={porProjeto} />
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function PieBlock({ data }: { data: { name: string; value: number; color: string }[] }) {
  if (!data.length) return <p className="text-xs text-muted-foreground py-8 text-center">Sem dados no período.</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label={(e: any) => e.name}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip formatter={(v: number) => fmtBRL(v)} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function BarBlock({ data }: { data: { nome: string; total: number }[] }) {
  if (!data.length) return <p className="text-xs text-muted-foreground py-8 text-center">Sem dados no período.</p>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 26)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="nome" width={140} tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v: number) => fmtBRL(v)} />
        <Bar dataKey="total" fill="hsl(142 50% 45%)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
