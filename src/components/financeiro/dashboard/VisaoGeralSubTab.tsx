import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function VisaoGeralSubTab({ filters }: { filters: FinFilters }) {
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
  const saldoDevedorTotal = a.loanMetrics
    .filter((m) => m.loan.status === "ativo")
    .reduce((s, m) => s + m.saldoDevedor, 0);

  // Mensal entradas x saídas + saldo acumulado
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
    return arr.map((m) => {
      acc += m.entradas - m.saidas;
      return { ...m, saldo: acc };
    });
  }, [a.filtered]);

  const burnMensal = mensal.length > 0 ? mensal.reduce((s, m) => s + m.saidas, 0) / mensal.length : 0;
  const runwayMeses = burnMensal > 0 ? saldoAtual / burnMensal : 0;

  const composEntradas = (Object.keys(totalsByGrupo) as GrupoGerencial[])
    .filter((g) => isEntradaGrupo(g) && totalsByGrupo[g] > 0)
    .map((g) => ({ name: grupoLabels[g], value: totalsByGrupo[g], color: grupoColors[g] }));

  const composSaidas = (Object.keys(totalsByGrupo) as GrupoGerencial[])
    .filter((g) => isSaidaGrupo(g) && totalsByGrupo[g] > 0)
    .map((g) => ({ name: grupoLabels[g], value: totalsByGrupo[g], color: grupoColors[g] }));

  return (
    <div className="space-y-4">
      {naoClassif.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-3 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <span>
              Existem <strong>{naoClassif.length}</strong> lançamentos não classificados ({fmtBRL(sumValor(naoClassif))}) no período filtrado.
            </span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<Wallet className="h-4 w-4" />} label="Saldo atual (caixa)" value={fmtBRL(saldoAtual)} hint="Todas as movimentações" accentColor="hsl(190 80% 45%)" />
        <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Entradas (período)" value={fmtBRL(totalEntradas)} accentColor="hsl(142 65% 45%)"
          hint={`Op: ${fmtBRL(receitaOp)} · Aporte: ${fmtBRL(totalsByGrupo.aporte_socios || 0)} · Empr.: ${fmtBRL(totalsByGrupo.entrada_emprestimo || 0)}`} />
        <KpiCard icon={<TrendingDown className="h-4 w-4" />} label="Saídas (período)" value={fmtBRL(totalSaidas)} accentColor="hsl(355 65% 55%)"
          hint={`Plant.: ${fmtBRL(custoPlant)} · Inv.: ${fmtBRL(totalsByGrupo.investimento || 0)} · Empr.: ${fmtBRL((totalsByGrupo.pagamento_emprestimo || 0) + (totalsByGrupo.juros_tarifas || 0))}`} />
        <KpiCard icon={<Receipt className="h-4 w-4" />} label="Resultado operacional" value={fmtBRL(resultadoOperacional)} accentColor="hsl(265 65% 58%)"
          hint="Receita Op. − Custo Plant. − Despesa Geral" warn={naoClassif.length > 0} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<Percent className="h-4 w-4" />} label="Margem operacional" value={fmtPct(margemOperacional)} accentColor="hsl(285 65% 58%)" hint={`Resultado / Receita Op.`} />
        <KpiCard icon={<Banknote className="h-4 w-4" />} label="Resultado de caixa" value={fmtBRL(resultadoCaixa)} accentColor="hsl(165 65% 40%)" hint="Entradas − Saídas (todas)" />
        <KpiCard icon={<Flame className="h-4 w-4" />} label="Burn mensal médio" value={fmtBRL(burnMensal)} accentColor="hsl(15 80% 55%)" hint={`Runway: ${runwayMeses > 0 ? runwayMeses.toFixed(1) + " meses" : "—"}`} />
        <KpiCard icon={<CheckCircle2 className="h-4 w-4" />} label="% classificação" value={`${(pctClass * 100).toFixed(0)}%`} accentColor="hsl(142 55% 42%)" hint={`${classifiedCount} de ${a.filtered.length}`} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<Sprout className="h-4 w-4" />} label="Custos de plantação" value={fmtBRL(custoPlant)} accentColor="hsl(28 75% 50%)" hint="No período" />
        <KpiCard icon={<Hammer className="h-4 w-4" />} label="Investimentos" value={fmtBRL(totalsByGrupo.investimento || 0)} accentColor="hsl(45 90% 55%)" hint={`${a.projetos.filter((p) => p.status === "em_andamento").length} projeto(s) ativos`} />
        <KpiCard icon={<Landmark className="h-4 w-4" />} label="Empréstimos ativos" value={`${loansAtivos.length}`} accentColor="hsl(355 65% 55%)" hint={`Saldo devedor: ${fmtBRL(saldoDevedorTotal)}`} />
        <KpiCard icon={<FileWarning className="h-4 w-4" />} label="Não classificados" value={`${naoClassif.length}`} accentColor="hsl(48 95% 55%)" hint={fmtBRL(sumValor(naoClassif))} warn={naoClassif.length > 0} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Entradas × Saídas por mês</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Saldo acumulado</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={mensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} />
                <Line type="monotone" dataKey="saldo" stroke="hsl(190 80% 45%)" strokeWidth={2.5} name="Saldo" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Composição das entradas</CardTitle></CardHeader>
          <CardContent><PieBlock data={composEntradas} /></CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Composição das saídas</CardTitle></CardHeader>
          <CardContent><PieBlock data={composSaidas} /></CardContent>
        </Card>
      </div>
    </div>
  );
}

function PieBlock({ data }: { data: { name: string; value: number; color: string }[] }) {
  if (!data.length) return <p className="text-xs text-muted-foreground py-8 text-center">Sem dados no período.</p>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label={(e: any) => e.name}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip formatter={(v: number) => fmtBRL(v)} />
      </PieChart>
    </ResponsiveContainer>
  );
}
