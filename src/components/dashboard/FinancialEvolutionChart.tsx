import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const mockData = [
  { month: "Jan", receitas: 0, custos: 2500, investimentos: 5000 },
  { month: "Fev", receitas: 0, custos: 3800, investimentos: 2000 },
  { month: "Mar", receitas: 0, custos: 4200, investimentos: 1500 },
  { month: "Abr", receitas: 1500, custos: 2100, investimentos: 500 },
  { month: "Mai", receitas: 3200, custos: 1800, investimentos: 0 },
  { month: "Jun", receitas: 5800, custos: 1500, investimentos: 0 },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
  }).format(value);
};

export function FinancialEvolutionChart() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg">Evolução Financeira Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData}>
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
      </CardContent>
    </Card>
  );
}
