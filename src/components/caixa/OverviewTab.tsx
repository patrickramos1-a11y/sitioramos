import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import type { useCashAnalytics } from "@/hooks/useCashAnalytics";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// Earthy palette aligned to project tokens (HSL strings)
const PALETTE = [
  "hsl(142 71% 45%)", // success-ish
  "hsl(25 95% 53%)",
  "hsl(48 96% 53%)",
  "hsl(199 89% 48%)",
  "hsl(280 65% 60%)",
  "hsl(0 84% 60%)",
  "hsl(160 60% 45%)",
  "hsl(35 91% 33%)",
  "hsl(217 91% 60%)",
  "hsl(330 81% 60%)",
];

type Analytics = ReturnType<typeof useCashAnalytics>;

interface Props {
  analytics: Analytics;
  onSelectSubcategoria?: (categoria: string, subcategoria: string | null) => void;
}

export function OverviewTab({ analytics, onSelectSubcategoria }: Props) {
  const { totals, compositionSaidas, compositionEntradas, monthly, orphans } = analytics;

  const donutData = compositionSaidas.slice(0, 10).map((c, i) => ({
    name: c.label,
    value: c.total,
    color: PALETTE[i % PALETTE.length],
    key: c.key,
    categoria: c.categoria,
    subcategoria: c.subcategoria,
  }));

  const totalSaidas = totals.saidas || 1;

  return (
    <div className="space-y-4">
      {/* Orphan alert */}
      {(orphans.semCiclo > 0 || orphans.semArea > 0) && (
        <Card className="border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm flex-1">
              <p className="font-medium text-amber-900 dark:text-amber-200">
                Lançamentos sem rastreabilidade
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {orphans.semCiclo > 0 && <>{orphans.semCiclo} sem ciclo</>}
                {orphans.semCiclo > 0 && orphans.semArea > 0 && " · "}
                {orphans.semArea > 0 && <>{orphans.semArea} sem área</>}
                {" — vincule-os para análises mais precisas."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Composition donut - Saídas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Composição de Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {donutData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhuma saída no período.</p>
            ) : (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={2}
                        onClick={(d: any) => onSelectSubcategoria?.(d.categoria, d.subcategoria)}
                      >
                        {donutData.map((d) => (
                          <Cell key={d.key} fill={d.color} className="cursor-pointer" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => formatCurrency(v)}
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-1.5 mt-2 max-h-44 overflow-y-auto">
                  {compositionSaidas.slice(0, 10).map((c, i) => {
                    const pct = (c.total / totalSaidas) * 100;
                    return (
                      <li
                        key={c.key}
                        className="text-xs flex items-center gap-2 cursor-pointer hover:bg-muted/40 rounded px-1.5 py-1"
                        onClick={() => onSelectSubcategoria?.(c.categoria, c.subcategoria)}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ background: PALETTE[i % PALETTE.length] }}
                        />
                        <span className="flex-1 truncate">{c.label}</span>
                        <span className="text-muted-foreground tabular-nums">{pct.toFixed(1)}%</span>
                        <span className="font-medium tabular-nums">{formatCurrency(c.total)}</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        {/* Composition - Entradas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Composição de Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compositionEntradas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhuma entrada no período.</p>
            ) : (
              <ul className="space-y-2.5">
                {compositionEntradas.map((c) => {
                  const pct = totals.entradas > 0 ? (c.total / totals.entradas) * 100 : 0;
                  return (
                    <li key={c.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{c.label}</span>
                        <span className="text-success tabular-nums">{formatCurrency(c.total)}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground">{pct.toFixed(1)}% · {c.count} lançamento{c.count !== 1 ? "s" : ""}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly evolution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Evolução Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthly.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Sem dados no período.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="entradas" fill="hsl(142 71% 45%)" name="Entradas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" fill="hsl(0 72% 51%)" name="Saídas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
