import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sprout, ArrowRight } from "lucide-react";
import type { useCashAnalytics } from "@/hooks/useCashAnalytics";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Props {
  analytics: ReturnType<typeof useCashAnalytics>;
  onSelectCycle: (cycleId: string | null) => void;
}

export function ByCycleTab({ analytics, onSelectCycle }: Props) {
  const { byCycle } = analytics;
  if (byCycle.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Sem lançamentos no período.
        </CardContent>
      </Card>
    );
  }
  const maxSaidas = Math.max(...byCycle.map((c) => c.saidas), 1);

  return (
    <div className="space-y-3">
      {byCycle.map((c) => {
        const isOrfo = !c.cycleId;
        const saidasPct = (c.saidas / maxSaidas) * 100;
        return (
          <Card key={c.cycleId || "_orfo_"} className={isOrfo ? "border-amber-500/40" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sprout className={`h-4 w-4 ${isOrfo ? "text-amber-600" : "text-primary"}`} />
                  {c.cultura}
                  {c.areaNome && !isOrfo && <span className="text-xs text-muted-foreground font-normal">· {c.areaNome}</span>}
                  {isOrfo && <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700">sem vínculo</Badge>}
                  <span className="text-xs text-muted-foreground font-normal">· {c.count} lançamento{c.count !== 1 ? "s" : ""}</span>
                </CardTitle>
                {c.cycleId && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onSelectCycle(c.cycleId)}>
                    Ver lançamentos <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground">Entradas</p>
                  <p className="font-semibold text-success tabular-nums">{formatCurrency(c.entradas)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Saídas</p>
                  <p className="font-semibold text-destructive tabular-nums">{formatCurrency(c.saidas)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Saldo</p>
                  <p className={`font-semibold tabular-nums ${c.saldo >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(c.saldo)}</p>
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
