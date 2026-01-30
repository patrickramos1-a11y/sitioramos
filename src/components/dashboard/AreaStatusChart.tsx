import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const statusColors: Record<string, string> = {
  "Planejamento": "hsl(35, 35%, 60%)",
  "Em preparo": "hsl(35, 85%, 50%)",
  "Plantada": "hsl(80, 50%, 55%)",
  "Em produção": "hsl(142, 40%, 28%)",
  "Colhida": "hsl(25, 45%, 35%)",
};

interface AreaStatusChartProps {
  data: { status: string; hectares: number }[];
}

export function AreaStatusChart({ data }: AreaStatusChartProps) {
  const chartData = data.map(item => ({
    ...item,
    color: statusColors[item.status] || "hsl(var(--muted))",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Status das Áreas</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Nenhuma área cadastrada
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" unit=" ha" stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  dataKey="status" 
                  type="category" 
                  width={100}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)} ha`, "Hectares"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="hectares" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
