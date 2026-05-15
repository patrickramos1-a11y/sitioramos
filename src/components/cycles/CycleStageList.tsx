import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ComputedStage, STAGE_STATUS_COLOR, STAGE_STATUS_LABEL } from "@/lib/cycles/stageCalc";
import { cn } from "@/lib/utils";

interface Props {
  computed: ComputedStage[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  costsByStage?: Record<string, number>;
  tasksByStage?: Record<string, { total: number; done: number }>;
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function CycleStageList({ computed, onEdit, onDelete, costsByStage = {}, tasksByStage = {} }: Props) {
  if (computed.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Nenhuma etapa cadastrada.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {computed.map((c) => {
        const cls = STAGE_STATUS_COLOR[c.statusEfetivo];
        const cost = costsByStage[c.stage.id!] || 0;
        const t = tasksByStage[c.stage.id!];
        return (
          <Card key={c.stage.id} className={cn(c.isAtual && "border-primary")}>
            <CardContent className="py-3 px-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{c.stage.nome}</span>
                    <Badge variant="outline" className={cn("text-[10px]", cls)}>
                      {STAGE_STATUS_LABEL[c.statusEfetivo]}
                    </Badge>
                    {c.isAtual && <Badge className="text-[10px]">Atual</Badge>}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Dia {c.stage.inicio_relativo_dias} • {c.stage.duracao_dias} dias •{" "}
                    {format(c.dataInicio, "dd/MM/yy", { locale: ptBR })} a{" "}
                    {format(c.dataFim, "dd/MM/yy", { locale: ptBR })}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(c.stage.id!)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(c.stage.id!)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                {cost > 0 && <span>Custos: <span className="text-destructive font-semibold">{formatBRL(cost)}</span></span>}
                {t && <span>Tarefas: {t.done}/{t.total}</span>}
                {c.statusEfetivo === "em_andamento" && (
                  <span>{Math.max(0, c.diasRestantes)} dia(s) restante(s)</span>
                )}
                {c.statusEfetivo === "atrasada" && (
                  <span className="text-destructive">Atrasada há {Math.abs(c.diasRestantes)} dia(s)</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
