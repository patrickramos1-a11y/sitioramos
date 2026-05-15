import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle2, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ComputedStage, STAGE_STATUS_COLOR, STAGE_STATUS_LABEL } from "@/lib/cycles/stageCalc";
import { cn } from "@/lib/utils";

interface Props {
  computed: ComputedStage[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onConfirm: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onAddBefore: (id: string) => void;
  onAddAfter: (id: string) => void;
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
  onMove,
  onAddBefore,
  onAddAfter,
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
        const previsto = `${format(c.dataInicio, "dd/MM/yy", { locale: ptBR })} a ${format(c.dataFim, "dd/MM/yy", { locale: ptBR })}`;
        const real = c.dataFimReal ? format(c.dataFimReal, "dd/MM/yy", { locale: ptBR }) : null;

        return (
          <Card key={c.stage.id} className={cn(c.isAtual && "border-primary", c.isRealizada && "opacity-90")}>
            <CardContent className="py-3 px-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-muted-foreground tabular-nums">{idx + 1}.</span>
                    <span className="font-medium text-sm">{c.stage.nome}</span>
                    <Badge variant="outline" className={cn("text-[10px]", cls)}>
                      {STAGE_STATUS_LABEL[c.statusEfetivo]}
                    </Badge>
                    {c.isAtual && c.statusEfetivo !== "atrasada" && (
                      <Badge className="text-[10px]">Atual</Badge>
                    )}
                  </div>
                  {c.stage.atividade && (
                    <div className="text-xs text-muted-foreground mt-0.5 italic">{c.stage.atividade}</div>
                  )}
                  <div className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
                    <div>
                      <span className="font-medium">{c.stage.duracao_dias} dia(s)</span> · Previsto: {previsto}
                    </div>
                    {real && (
                      <div className="text-emerald-700 dark:text-emerald-400">
                        <span className="font-medium">Concluída em:</span> {real}
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
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-0.5">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onMove(c.stage.id!, "up")} disabled={idx === 0} title="Subir">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onMove(c.stage.id!, "down")} disabled={idx === computed.length - 1} title="Descer">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex gap-0.5">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(c.stage.id!)} title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onDelete(c.stage.id!)} title="Excluir">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
              {(cost > 0 || t) && (
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                  {cost > 0 && (
                    <span>Custos: <span className="text-destructive font-semibold">{formatBRL(cost)}</span></span>
                  )}
                  {t && <span>Tarefas: {t.done}/{t.total}</span>}
                </div>
              )}
              <div className="flex gap-1.5 pt-1 flex-wrap">
                {!c.isRealizada && (
                  <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => onConfirm(c.stage.id!)}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Concluir
                  </Button>
                )}
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onAddBefore(c.stage.id!)}>
                  <Plus className="h-3 w-3 mr-0.5" /> Antes
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onAddAfter(c.stage.id!)}>
                  <Plus className="h-3 w-3 mr-0.5" /> Depois
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
