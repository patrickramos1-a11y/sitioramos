import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  label: string;
  value: string;
  hint?: string;
  accentColor?: string; // HSL string — pinta a barrinha lateral e o ícone
  warn?: boolean;
};

export function KpiCard({ icon, label, value, hint, accentColor, warn }: Props) {
  return (
    <Card
      className={`relative overflow-hidden ${warn ? "border-amber-300" : ""}`}
      style={accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : undefined}
    >
      <CardHeader className="pb-1.5">
        <CardTitle className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-normal">
          <span style={accentColor ? { color: accentColor } : undefined}>{icon}</span>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-lg font-semibold leading-tight">{value}</p>
        {hint && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={hint}>
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
