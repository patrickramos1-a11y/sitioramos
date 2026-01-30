import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
  }).format(value);
};

interface FinancialEvolutionChartProps {
  data: { month: string; receitas: number; custos: number; investimentos: number }[];
}

export function FinancialEvolutionChart({ data }: FinancialEvolutionChartProps) {
  const hasData = data.some(d => d.receitas > 0 || d.custos > 0 || d.investimentos > 0);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg">Evolução Financeira Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Nenhum dado financeiro nos últimos 6 meses
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="receitas" 
                  name="Receitas"
                  stroke="hsl(142, 40%, 28%)" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(142, 40%, 28%)" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="custos" 
                  name="Custos"
                  stroke="hsl(10, 65%, 45%)" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(10, 65%, 45%)" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="investimentos" 
                  name="Investimentos"
                  stroke="hsl(35, 85%, 50%)" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(35, 85%, 50%)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
