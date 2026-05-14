import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useFinanceiroAnalytics, type FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { fmtBRL } from "@/lib/financeiro/finCalc";
import { custoTotalArea, receitaTotalArea, hectaresArea, safeDiv } from "@/lib/financeiro/perHectare";
import { colorForEntity } from "@/lib/financeiro/entityColors";
import { usePropriedade } from "@/hooks/usePropriedade";
import { ChartCard } from "./ChartCard";
import { useIsMobile } from "@/hooks/use-mobile";

export function PorAreaSubTab({ filters }: { filters: FinFilters }) {
  const a = useFinanceiroAnalytics(filters);
  const { propriedade } = usePropriedade();
  const isMobile = useIsMobile();

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
          custo, receita, resultado,
          custoHa: safeDiv(custo, ha),
          receitaHa: safeDiv(receita, ha),
          resultadoHa: safeDiv(resultado, ha),
          color: colorForEntity("area", area.id),
        };
      })
      .filter((l) => l.custo > 0 || l.receita > 0)
      .sort((x, y) => y.custo - x.custo);
  }, [a.areas, a.filtered]);

  const totals = useMemo(() => linhas.reduce(
    (acc, l) => ({ ha: acc.ha + l.ha, custo: acc.custo + l.custo, receita: acc.receita + l.receita }),
    { ha: 0, custo: 0, receita: 0 }
  ), [linhas]);

  const haPropriedade = Number(propriedade?.area_total_hectares || 0);
  const maxValor = Math.max(1, ...linhas.map((l) => Math.max(l.custo, l.receita)));

  return (
    <div className="space-y-3 md:space-y-4">
      <Card>
        <CardContent className="p-3 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <Mini label="Hectares" value={`${totals.ha.toFixed(1)} ha`} hint={haPropriedade ? `de ${haPropriedade} ha` : undefined} />
          <Mini label="Custo total" value={fmtBRL(totals.custo)} hint={`R$/ha: ${fmtBRL(safeDiv(totals.custo, totals.ha))}`} accent="hsl(355 65% 55%)" />
          <Mini label="Receita total" value={fmtBRL(totals.receita)} hint={`R$/ha: ${fmtBRL(safeDiv(totals.receita, totals.ha))}`} accent="hsl(142 65% 45%)" />
          <Mini label="Resultado" value={fmtBRL(totals.receita - totals.custo)} hint={`R$/ha: ${fmtBRL(safeDiv(totals.receita - totals.custo, totals.ha))}`} accent="hsl(265 65% 58%)" />
        </CardContent>
      </Card>

      <ChartCard
        title="Áreas por desempenho"
        accent="hsl(142 65% 45%)"
        table={<AreasTable linhas={linhas} />}
      >
        {linhas.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">Sem dados no período.</p>
        ) : (
          <div className="space-y-2">
            {linhas.map((l) => {
              const wCusto = (l.custo / maxValor) * 100;
              const wReceita = (l.receita / maxValor) * 100;
              return (
                <div key={l.id} className="rounded-md border border-border p-2.5 space-y-1.5" style={{ borderLeftWidth: 3, borderLeftColor: l.color }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium truncate" title={l.nome}>{l.nome}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{l.ha.toFixed(1)} ha</span>
                  </div>
                  {/* Custo bar */}
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-rose-700">Custo</span>
                      <span className="tabular-nums">{fmtBRL(l.custo)} <span className="text-muted-foreground">· {fmtBRL(l.custoHa)}/ha</span></span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${wCusto}%`, background: "hsl(355 65% 55%)" }} />
                    </div>
                  </div>
                  {/* Receita bar */}
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-emerald-700">Receita</span>
                      <span className="tabular-nums">{fmtBRL(l.receita)} <span className="text-muted-foreground">· {fmtBRL(l.receitaHa)}/ha</span></span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${wReceita}%`, background: "hsl(142 65% 45%)" }} />
                    </div>
                  </div>
                  <div className={`text-[11px] font-medium tabular-nums pt-0.5 border-t border-dashed ${l.resultado >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    Resultado: {fmtBRL(l.resultado)} <span className="text-muted-foreground font-normal">({fmtBRL(l.resultadoHa)}/ha)</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ChartCard>
    </div>
  );
}

function AreasTable({ linhas }: { linhas: any[] }) {
  return (
    <div className="overflow-auto max-h-[60vh]">
      <table className="w-full text-[11px]">
        <thead className="sticky top-0 bg-background"><tr>
          <th className="text-left px-2 py-1">Área</th>
          <th className="text-right px-2 py-1">Ha</th>
          <th className="text-right px-2 py-1">Custo</th>
          <th className="text-right px-2 py-1">Receita</th>
          <th className="text-right px-2 py-1">Result.</th>
        </tr></thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.id} className="border-t">
              <td className="px-2 py-1 flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />{l.nome}</td>
              <td className="text-right px-2 py-1 tabular-nums">{l.ha.toFixed(1)}</td>
              <td className="text-right px-2 py-1 tabular-nums text-rose-700">{fmtBRL(l.custo)}</td>
              <td className="text-right px-2 py-1 tabular-nums text-emerald-700">{fmtBRL(l.receita)}</td>
              <td className={`text-right px-2 py-1 tabular-nums font-medium ${l.resultado >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmtBRL(l.resultado)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Mini({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: string }) {
  return (
    <div style={accent ? { borderLeft: `2px solid ${accent}`, paddingLeft: 8 } : undefined}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
      <p className="text-base font-semibold tabular-nums leading-tight">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{hint}</p>}
    </div>
  );
}
