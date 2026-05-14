import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from "recharts";
import { useFinanceiroAnalytics, type FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { fmtBRL } from "@/lib/financeiro/finCalc";
import { custoTotalArea, receitaTotalArea, hectaresArea, safeDiv } from "@/lib/financeiro/perHectare";
import { colorForEntity } from "@/lib/financeiro/entityColors";
import { usePropriedade } from "@/hooks/usePropriedade";

export function PorAreaSubTab({ filters }: { filters: FinFilters }) {
  const a = useFinanceiroAnalytics(filters);
  const { propriedade } = usePropriedade();
  const [agruparPorTalhao, setAgruparPorTalhao] = useState(false);

  const linhas = useMemo(() => {
    return a.areas
      .map((area: any) => {
        const ha = hectaresArea(area);
        const custo = custoTotalArea(area.id, a.filtered);
        const receita = receitaTotalArea(area.id, a.filtered);
        const resultado = receita - custo;
        return {
          id: area.id,
          nome: area.nome,
          ha,
          custo,
          receita,
          resultado,
          custoHa: safeDiv(custo, ha),
          receitaHa: safeDiv(receita, ha),
          resultadoHa: safeDiv(resultado, ha),
          color: colorForEntity("area", area.id),
        };
      })
      .filter((l) => l.custo > 0 || l.receita > 0)
      .sort((x, y) => y.custo - x.custo);
  }, [a.areas, a.filtered]);

  const totals = useMemo(() => {
    return linhas.reduce(
      (acc, l) => ({
        ha: acc.ha + l.ha,
        custo: acc.custo + l.custo,
        receita: acc.receita + l.receita,
      }),
      { ha: 0, custo: 0, receita: 0 }
    );
  }, [linhas]);

  const haPropriedade = Number(propriedade?.area_total_hectares || 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-3 grid gap-3 sm:grid-cols-4">
          <Mini label="Hectares com movimento" value={`${totals.ha.toFixed(2)} ha`} hint={haPropriedade ? `de ${haPropriedade} ha totais` : undefined} />
          <Mini label="Custo total" value={fmtBRL(totals.custo)} hint={`R$/ha médio: ${fmtBRL(safeDiv(totals.custo, totals.ha))}`} />
          <Mini label="Receita total" value={fmtBRL(totals.receita)} hint={`R$/ha médio: ${fmtBRL(safeDiv(totals.receita, totals.ha))}`} />
          <Mini label="Resultado" value={fmtBRL(totals.receita - totals.custo)} hint={`R$/ha: ${fmtBRL(safeDiv(totals.receita - totals.custo, totals.ha))}`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm">Custo por área (cor única por área)</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setAgruparPorTalhao((v) => !v)} disabled>
            {agruparPorTalhao ? "Por área" : "Por talhão"}
          </Button>
        </CardHeader>
        <CardContent>
          {linhas.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Sem dados no período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, linhas.length * 32)}>
              <BarChart data={linhas} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nome" width={140} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="custo" name="Custo">
                  {linhas.map((l) => <Cell key={l.id} fill={l.color} />)}
                </Bar>
                <Bar dataKey="receita" name="Receita" fill="hsl(142 65% 45%)" opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Detalhamento por área</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">Área</th>
                  <th className="text-right px-3 py-2">Hectares</th>
                  <th className="text-right px-3 py-2">Custo</th>
                  <th className="text-right px-3 py-2">R$/ha custo</th>
                  <th className="text-right px-3 py-2">Receita</th>
                  <th className="text-right px-3 py-2">R$/ha receita</th>
                  <th className="text-right px-3 py-2">Resultado</th>
                  <th className="text-right px-3 py-2">R$/ha resultado</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="px-3 py-2 flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-sm" style={{ background: l.color }} />
                      {l.nome}
                    </td>
                    <td className="text-right px-3 py-2">{l.ha.toFixed(2)}</td>
                    <td className="text-right px-3 py-2">{fmtBRL(l.custo)}</td>
                    <td className="text-right px-3 py-2 text-rose-700">{fmtBRL(l.custoHa)}</td>
                    <td className="text-right px-3 py-2">{fmtBRL(l.receita)}</td>
                    <td className="text-right px-3 py-2 text-emerald-700">{fmtBRL(l.receitaHa)}</td>
                    <td className={`text-right px-3 py-2 font-medium ${l.resultado >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmtBRL(l.resultado)}</td>
                    <td className={`text-right px-3 py-2 ${l.resultadoHa >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmtBRL(l.resultadoHa)}</td>
                  </tr>
                ))}
                {linhas.length === 0 && (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">Sem dados no período.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Mini({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-base font-semibold leading-tight">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}
