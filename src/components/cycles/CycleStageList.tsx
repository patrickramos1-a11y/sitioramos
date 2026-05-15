import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle2, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ComputedStage, STAGE_STATUS_COLOR, STAGE_STATUS_LABEL } from "@/lib/cycles/stageCalc";
import { cn } from "@/lib/utils";

interface Props {
  computed: ComputedStage[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onConfirm: (id: string) => void;
  onReschedule: (id: string) => void;
  costsByStage?: Record<string, number>;
  tasksByStage?: Record<string, { total: number; done: number }>;
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function CycleStageList({
  computed,
  onEdit,
  onDelete,
  onConfirm,
  onReschedule,
  costsByStage = {},
  tasksByStage = {},
}: Props) {
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
      {computed.map((c, idx) => {
        const cls = STAGE_STATUS_COLOR[c.statusEfetivo];
        const cost = costsByStage[c.stage.id!] || 0;
        const t = tasksByStage[c.stage.id!];
        const previsto = `Dia ${c.diaInicio}–${c.diaFim} · ${format(c.dataInicio, "dd/MM/yy", {
          locale: ptBR,
        })} a ${format(c.dataFim, "dd/MM/yy", { locale: ptBR })}`;
        const real =
          c.dataInicioReal && c.dataFimReal
            ? `${format(c.dataInicioReal, "dd/MM/yy", { locale: ptBR })} a ${format(
                c.dataFimReal,
                "dd/MM/yy",
                { locale: ptBR },
              )}`
            : null;

        return (
          <Card
            key={c.stage.id}
            className={cn(c.isAtual && "border-primary", c.isRealizada && "opacity-90")}
          >
            <CardContent className="py-3 px-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-muted-foreground tabular-nums">
                      {idx + 1}.
                    </span>
                    <span className="font-medium text-sm">{c.stage.nome}</span>
                    <Badge variant="outline" className={cn("text-[10px]", cls)}>
                      {STAGE_STATUS_LABEL[c.statusEfetivo]}
                    </Badge>
                    {c.isAtual && c.statusEfetivo !== "atrasada" && (
                      <Badge className="text-[10px]">Atual</Badge>
                    )}
                  </div>
                  {c.stage.atividade && (
                    <div className="text-xs text-muted-foreground mt-0.5 italic">
                      {c.stage.atividade}
                    </div>
                  )}
                  <div className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
                    <div>
                      <span className="font-medium">Previsto:</span> {previsto}
                    </div>
                    {real && (
                      <div className="text-foreground/80">
                        <span className="font-medium">Real:</span> {real}
                        {c.duracaoReal != null && (
                          <> · {c.duracaoReal} dia(s)</>
                        )}
                      </div>
                    )}
                    {c.statusEfetivo === "em_andamento" && (
                      <div>{Math.max(0, c.diasRestantes)} dia(s) restante(s)</div>
                    )}
                    {c.statusEfetivo === "atrasada" && !real && (
                      <div className="text-destructive">
                        Atrasada há {Math.abs(c.diasRestantes)} dia(s)
                      </div>
                    )}
                    {c.diasAtraso !== 0 && real && (
                      <div className={c.diasAtraso > 0 ? "text-destructive" : "text-emerald-700"}>
                        {c.diasAtraso > 0
                          ? `Atraso: +${c.diasAtraso} dia(s)`
                          : `Adiantamento: ${Math.abs(c.diasAtraso)} dia(s)`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => onEdit(c.stage.id!)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7"
                    onClick={() => onDelete(c.stage.id!)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                {cost > 0 && (
                  <span>
                    Custos: <span className="text-destructive font-semibold">{formatBRL(cost)}</span>
                  </span>
                )}
                {t && (
                  <span>
                    Tarefas: {t.done}/{t.total}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 pt-1 flex-wrap">
                {!c.isRealizada && (
                  <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => onConfirm(c.stage.id!)}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Confirmar execução
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onReschedule(c.stage.id!)}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Reprogramar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
