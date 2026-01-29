import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const mockData = [
  { status: "Planejamento", hectares: 2.5, color: "hsl(35, 35%, 60%)" },
  { status: "Em preparo", hectares: 1.8, color: "hsl(35, 85%, 50%)" },
  { status: "Plantada", hectares: 5.5, color: "hsl(80, 50%, 55%)" },
  { status: "Em produção", hectares: 3.2, color: "hsl(142, 40%, 28%)" },
  { status: "Colhida", hectares: 1.0, color: "hsl(25, 45%, 35%)" },
];

export function AreaStatusChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Status das Áreas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData} layout="vertical" margin={{ left: 20 }}>
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
                formatter={(value: number) => [`${value} ha`, "Hectares"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Bar dataKey="hectares" radius={[0, 4, 4, 0]}>
                {mockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
