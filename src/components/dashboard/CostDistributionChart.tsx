import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const mockData = [
  { name: "Preparo de solo", value: 4500, color: "hsl(25, 45%, 35%)" },
  { name: "Mudas/Sementes", value: 3200, color: "hsl(142, 40%, 28%)" },
  { name: "Adubação", value: 2800, color: "hsl(80, 50%, 55%)" },
  { name: "Herbicida", value: 1500, color: "hsl(35, 85%, 50%)" },
  { name: "Mão de obra", value: 5200, color: "hsl(200, 60%, 45%)" },
  { name: "Combustível", value: 1800, color: "hsl(10, 65%, 45%)" },
  { name: "Outros", value: 1000, color: "hsl(35, 25%, 60%)" },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function CostDistributionChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribuição de Custos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={mockData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {mockData.map((entry, index) => (
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
      </CardContent>
    </Card>
  );
}
