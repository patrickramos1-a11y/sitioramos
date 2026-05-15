import { format, differenceInCalendarDays, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ComputedStage, STAGE_STATUS_LABEL } from "@/lib/cycles/stageCalc";
import { cn } from "@/lib/utils";

interface Props {
  computed: ComputedStage[];
  cycleStartIso: string;
  durationDias: number;
  cor?: string;
}

// Generate distinct shades for each stage from a base color
function shade(hex: string, idx: number, total: number): string {
  // Use opacity variations for sequential blocks
  const ratio = 0.55 + (idx / Math.max(1, total - 1)) * 0.45;
  return `${hex}${Math.round(ratio * 255).toString(16).padStart(2, "0")}`;
}

export function CycleStageTimeline({
  computed,
  cycleStartIso,
  durationDias,
  cor = "#22c55e",
}: Props) {
  const today = new Date();

  if (computed.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        Nenhuma etapa cadastrada ainda.
      </div>
    );
  }

  const total = Math.max(
    durationDias,
    ...computed.map((c) => c.stage.inicio_relativo_dias + c.stage.duracao_dias),
  ) || 1;

  const start = parseISO(cycleStartIso);
  const end = addDays(start, total);
  const todayOffset = differenceInCalendarDays(today, start);
  const todayPct = Math.max(0, Math.min(100, (todayOffset / total) * 100));
  const showToday = todayOffset >= 0 && todayOffset <= total;
  const tempoPct = Math.round(Math.max(0, Math.min(1, todayOffset / total)) * 100);

  return (
    <div className="space-y-4">
      {/* Header dates */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{format(start, "dd/MM/yyyy", { locale: ptBR })}</span>
        <span className="font-medium text-foreground">{total} dias · {tempoPct}% decorrido</span>
        <span>{format(end, "dd/MM/yyyy", { locale: ptBR })}</span>
      </div>

      {/* Single segmented bar */}
      <div className="relative">
        <div className="flex w-full h-12 rounded-md overflow-hidden border bg-muted/30">
          {computed.map((c, idx) => {
            const widthPct = (c.stage.duracao_dias / total) * 100;
            const isRealizada = c.isRealizada;
            const isAtual = c.isAtual;
            const isAtrasada = c.statusEfetivo === "atrasada";
            const bg = isRealizada
              ? cor
              : isAtual
                ? `${cor}99`
                : shade(cor, idx, computed.length);
            return (
              <div
                key={c.stage.id}
                className={cn(
                  "relative flex flex-col items-center justify-center text-[10px] font-semibold border-r last:border-r-0 overflow-hidden transition-all",
                  isAtual && "ring-2 ring-inset ring-primary z-10",
                  isAtrasada && !isRealizada && "bg-destructive/30",
                )}
                style={{
                  width: `${widthPct}%`,
                  background: isAtrasada && !isRealizada ? undefined : bg,
                  color: "#fff",
                  textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                }}
                title={`${c.stage.nome} · ${c.stage.duracao_dias}d · ${STAGE_STATUS_LABEL[c.statusEfetivo]}`}
              >
                <span className="truncate px-1 max-w-full">{c.stage.nome}</span>
                <span className="opacity-90">{c.stage.duracao_dias}d</span>
              </div>
            );
          })}
        </div>

        {showToday && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-destructive z-20 pointer-events-none"
            style={{ left: `${todayPct}%` }}
          >
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-destructive font-semibold whitespace-nowrap">
              Hoje
            </span>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: cor }} /> Concluída
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm ring-2 ring-primary" style={{ background: `${cor}99` }} /> Atual
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: shade(cor, 0, 8) }} /> Prevista
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-destructive/30" /> Atrasada
        </span>
      </div>
    </div>
  );
}
