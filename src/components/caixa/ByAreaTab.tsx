import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight } from "lucide-react";
import type { useCashAnalytics } from "@/hooks/useCashAnalytics";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Props {
  analytics: ReturnType<typeof useCashAnalytics>;
  onSelectArea: (areaId: string | null) => void;
}

export function ByAreaTab({ analytics, onSelectArea }: Props) {
  const { byArea } = analytics;
  if (byArea.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Sem lançamentos no período.
        </CardContent>
      </Card>
    );
  }

  const maxSaidas = Math.max(...byArea.map((a) => a.saidas), 1);

  return (
    <div className="space-y-3">
      {byArea.map((a) => {
        const isOrfa = !a.areaId;
        const saidasPct = (a.saidas / maxSaidas) * 100;
        return (
          <Card key={a.areaId || "_orfa_"} className={isOrfa ? "border-amber-500/40" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className={`h-4 w-4 ${isOrfa ? "text-amber-600" : "text-primary"}`} />
                  {a.areaNome}
                  {isOrfa && <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700">sem vínculo</Badge>}
                  <span className="text-xs text-muted-foreground font-normal">· {a.count} lançamento{a.count !== 1 ? "s" : ""}</span>
                </CardTitle>
                {a.areaId && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onSelectArea(a.areaId)}>
                    Ver lançamentos <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground">Entradas</p>
                  <p className="font-semibold text-success tabular-nums">{formatCurrency(a.entradas)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Saídas</p>
                  <p className="font-semibold text-destructive tabular-nums">{formatCurrency(a.saidas)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Saldo</p>
                  <p className={`font-semibold tabular-nums ${a.saldo >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(a.saldo)}</p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-destructive/70" style={{ width: `${saidasPct}%` }} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
