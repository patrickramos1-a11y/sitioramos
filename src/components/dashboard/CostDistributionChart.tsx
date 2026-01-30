import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const typeColors: Record<string, string> = {
  "Preparo de solo": "hsl(25, 45%, 35%)",
  "Mudas/Sementes": "hsl(142, 40%, 28%)",
  "Adubação": "hsl(80, 50%, 55%)",
  "Herbicida": "hsl(35, 85%, 50%)",
  "Mão de obra": "hsl(200, 60%, 45%)",
  "Combustível": "hsl(10, 65%, 45%)",
  "Trator": "hsl(280, 50%, 45%)",
  "Outros": "hsl(35, 25%, 60%)",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

interface CostDistributionChartProps {
  data: { name: string; value: number }[];
}

export function CostDistributionChart({ data }: CostDistributionChartProps) {
  const chartData = data.map(item => ({
    ...item,
    color: typeColors[item.name] || "hsl(var(--muted))",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribuição de Custos</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Nenhum custo registrado
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend 
                  layout="vertical" 
                  align="right" 
                  verticalAlign="middle"
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
