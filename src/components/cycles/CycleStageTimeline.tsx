import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ComputedStage, STAGE_STATUS_COLOR, STAGE_STATUS_LABEL } from "@/lib/cycles/stageCalc";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  computed: ComputedStage[];
  cycleStartIso: string;
  durationDias: number;
  cor?: string;
}

export function CycleStageTimeline({ computed, cycleStartIso, durationDias, cor = "hsl(var(--primary))" }: Props) {
  const isMobile = useIsMobile();
  const today = new Date();

  if (computed.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        Nenhuma etapa cadastrada ainda.
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-1">
          {computed.map((c) => {
            const cls = STAGE_STATUS_COLOR[c.statusEfetivo];
            return (
              <div
                key={c.stage.id}
                className={cn(
                  "relative flex items-start gap-3 rounded-lg p-3",
                  c.isAtual && "ring-2 ring-primary/40 bg-primary/5",
                )}
              >
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-background"
                  style={{ borderColor: c.isAtual ? cor : undefined }}>
                  <span className="text-[10px] font-bold tabular-nums">
                    {c.stage.inicio_relativo_dias}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{c.stage.nome}</span>
                    <Badge variant="outline" className={cn("text-[10px]", cls)}>
                      {STAGE_STATUS_LABEL[c.statusEfetivo]}
                    </Badge>
                    {c.isAtual && <Badge className="text-[10px]">Etapa atual</Badge>}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Dia {c.stage.inicio_relativo_dias}–{c.stage.inicio_relativo_dias + c.stage.duracao_dias - 1} ·{" "}
                    {format(c.dataInicio, "dd/MM", { locale: ptBR })} a{" "}
                    {format(c.dataFim, "dd/MM/yy", { locale: ptBR })}
                    {c.statusEfetivo === "em_andamento" && (
                      <> · {Math.max(0, c.diasRestantes)} dia(s) restante(s)</>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop: Gantt horizontal
  const total = Math.max(durationDias, ...computed.map((c) => c.stage.inicio_relativo_dias + c.stage.duracao_dias)) || 1;
  const todayOffset = differenceInCalendarDays(today, new Date(cycleStartIso));
  const todayPct = Math.max(0, Math.min(100, (todayOffset / total) * 100));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Dia 0 — {format(new Date(cycleStartIso), "dd/MM/yyyy", { locale: ptBR })}</span>
        <span>Dia {total}</span>
      </div>
      <div className="relative space-y-1.5">
        {/* Today marker */}
        {todayOffset >= 0 && todayOffset <= total && (
          <div
            className="absolute top-0 bottom-0 w-px bg-destructive z-10 pointer-events-none"
            style={{ left: `${todayPct}%` }}
          >
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-destructive font-semibold whitespace-nowrap">
              Hoje
            </span>
          </div>
        )}

        {computed.map((c) => {
          const leftPct = (c.stage.inicio_relativo_dias / total) * 100;
          const widthPct = Math.max(2, (c.stage.duracao_dias / total) * 100);
          const cls = STAGE_STATUS_COLOR[c.statusEfetivo];
          return (
            <div key={c.stage.id} className="grid grid-cols-[160px_1fr] items-center gap-3">
              <div className="text-xs truncate">
                <div className="font-medium truncate">{c.stage.nome}</div>
                <div className="text-[10px] text-muted-foreground">
                  Dia {c.stage.inicio_relativo_dias}–{c.stage.inicio_relativo_dias + c.stage.duracao_dias - 1}
                </div>
              </div>
              <div className="relative h-7 bg-muted/40 rounded">
                <div
                  className={cn(
                    "absolute top-0 bottom-0 rounded flex items-center justify-center text-[10px] font-semibold px-2 truncate",
                    cls,
                    c.isAtual && "ring-2 ring-primary",
                  )}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  title={`${c.stage.nome} · ${STAGE_STATUS_LABEL[c.statusEfetivo]}`}
                >
                  <span className="truncate">{c.stage.nome}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
