import { useState } from "react";
import { format, differenceInCalendarDays, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ComputedStage, STAGE_STATUS_LABEL } from "@/lib/cycles/stageCalc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Check,
  CircleDot,
  AlertTriangle,
  Circle,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import { useResponsaveis } from "@/hooks/useResponsaveis";

interface Props {
  computed: ComputedStage[];
  cycleStartIso: string;
  durationDias: number;
  cor?: string;
  onConcluir?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddBefore?: (id: string) => void;
  onAddAfter?: (id: string) => void;
  onAddAtEnd?: () => void;
}

function shade(hex: string, idx: number, total: number): string {
  const ratio = 0.55 + (idx / Math.max(1, total - 1)) * 0.4;
  const a = Math.round(ratio * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "realizada")
    return <Check className="h-3 w-3" strokeWidth={3} />;
  if (status === "atrasada")
    return <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />;
  if (status === "em_andamento")
    return <CircleDot className="h-3 w-3" strokeWidth={2.5} />;
  return <Circle className="h-3 w-3" strokeWidth={2} />;
}

export function CycleStageTimeline({
  computed,
  cycleStartIso,
  durationDias,
  cor = "#22c55e",
  onConcluir,
  onEdit,
  onDelete,
  onAddBefore,
  onAddAfter,
  onAddAtEnd,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(false);
  const { data: responsaveis = [] } = useResponsaveis(true);
  const respMap = new Map(responsaveis.map((r: any) => [r.id, r.apelido || r.nome]));

  const today = new Date();
  const start = parseISO(cycleStartIso);

  if (computed.length === 0) {
    return (
      <div className="space-y-4 text-center py-10">
        <p className="text-sm text-muted-foreground">
          Nenhuma etapa cadastrada ainda.
        </p>
        {onAddAtEnd && (
          <Button onClick={onAddAtEnd} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Adicionar primeira etapa
          </Button>
        )}
      </div>
    );
  }

  const total =
    Math.max(
      durationDias,
      ...computed.map(
        (c) => c.stage.inicio_relativo_dias + c.stage.duracao_dias,
      ),
    ) || 1;
  const end = addDays(start, total);
  const todayOffset = differenceInCalendarDays(today, start);
  const todayPct = Math.max(0, Math.min(100, (todayOffset / total) * 100));
  const showToday = todayOffset >= 0 && todayOffset <= total;
  const tempoPct = Math.round(
    Math.max(0, Math.min(1, todayOffset / total)) * 100,
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="text-muted-foreground">
            <span className="font-medium text-foreground">
              {format(start, "dd/MM/yyyy", { locale: ptBR })}
            </span>{" "}
            →{" "}
            <span className="font-medium text-foreground">
              {format(end, "dd/MM/yyyy", { locale: ptBR })}
            </span>
            <span className="mx-2">·</span>
            {total} dias · {tempoPct}% decorrido
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setExpandAll((v) => !v);
                setExpandedId(null);
              }}
            >
              {expandAll ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5 mr-1" /> Recolher tudo
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5 mr-1" /> Expandir tudo
                </>
              )}
            </Button>
            {onAddAtEnd && (
              <Button size="sm" className="h-7 text-xs" onClick={onAddAtEnd}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Etapa
              </Button>
            )}
          </div>
        </div>

        {/* Timeline bar */}
        <div className="relative">
          <div className="flex w-full min-h-[60px] rounded-lg overflow-hidden border bg-muted/30 relative">
            {computed.map((c, idx) => {
              const isRealizada = c.isRealizada;
              const isAtual = c.isAtual;
              const isAtrasada = c.statusEfetivo === "atrasada";
              const isExpanded =
                expandAll || expandedId === c.stage.id;
              const bg = isAtrasada && !isRealizada
                ? "hsl(var(--destructive) / 0.55)"
                : isRealizada
                  ? cor
                  : isAtual
                    ? `${cor}cc`
                    : shade(cor, idx, computed.length);

              return (
                <Tooltip key={c.stage.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId((curr) =>
                          curr === c.stage.id ? null : c.stage.id,
                        )
                      }
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-0.5 px-2 py-2 border-r last:border-r-0 overflow-hidden transition-all text-center cursor-pointer hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/60",
                        isAtual && "ring-2 ring-inset ring-primary z-10",
                        isExpanded && "ring-2 ring-inset ring-foreground/40",
                      )}
                      style={{
                        flex: `${c.stage.duracao_dias} 1 90px`,
                        minWidth: 90,
                        background: bg,
                        color: "#fff",
                        textShadow: "0 1px 2px rgba(0,0,0,0.45)",
                      }}
                    >
                      <div className="flex items-center gap-1 max-w-full">
                        <StatusIcon status={c.statusEfetivo} />
                        <span className="text-[11px] font-bold truncate">
                          {c.stage.nome}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-95 font-medium">
                        {c.stage.duracao_dias}d
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="font-semibold">{c.stage.nome}</div>
                    <div>
                      {format(c.dataInicio, "dd/MM", { locale: ptBR })} →{" "}
                      {format(c.dataFim, "dd/MM/yyyy", { locale: ptBR })} ·{" "}
                      {c.stage.duracao_dias}d
                    </div>
                    <div className="text-muted-foreground">
                      {STAGE_STATUS_LABEL[c.statusEfetivo]}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {showToday && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-foreground/80 z-20 pointer-events-none"
              style={{ left: `${todayPct}%` }}
            >
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold whitespace-nowrap bg-foreground text-background px-1.5 py-0.5 rounded">
                Hoje
              </span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: cor }}
            />{" "}
            Concluída
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-sm ring-2 ring-primary"
              style={{ background: `${cor}cc` }}
            />{" "}
            Atual
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: shade(cor, 0, 8) }}
            />{" "}
            Prevista
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-destructive/55" />{" "}
            Atrasada
          </span>
          <span className="ml-auto opacity-80">
            Clique em uma etapa para detalhes
          </span>
        </div>

        {/* Detail panels */}
        <div className="space-y-2">
          {computed.map((c) => {
            const isOpen = expandAll || expandedId === c.stage.id;
            if (!isOpen) return null;
            const respName = c.stage.responsavel_id
              ? respMap.get(c.stage.responsavel_id)
              : null;
            return (
              <div
                key={c.stage.id}
                className="rounded-lg border bg-card p-3 space-y-3"
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold text-white"
                        style={{ background: cor }}
                      >
                        {c.stage.ordem}
                      </span>
                      <h4 className="font-semibold text-sm">{c.stage.nome}</h4>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                          c.statusEfetivo === "realizada" &&
                            "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300",
                          c.statusEfetivo === "atrasada" &&
                            "bg-destructive/10 text-destructive border-destructive/40",
                          c.statusEfetivo === "em_andamento" &&
                            "bg-primary/10 text-primary border-primary/40",
                          c.statusEfetivo === "nao_iniciada" &&
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {STAGE_STATUS_LABEL[c.statusEfetivo]}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      <div>
                        Previsto:{" "}
                        <span className="text-foreground font-medium">
                          {format(c.dataInicio, "dd/MM/yyyy", { locale: ptBR })}
                        </span>{" "}
                        →{" "}
                        <span className="text-foreground font-medium">
                          {format(c.dataFim, "dd/MM/yyyy", { locale: ptBR })}
                        </span>{" "}
                        · {c.stage.duracao_dias} dia(s)
                      </div>
                      {c.dataFimReal && (
                        <div>
                          Concluída em:{" "}
                          <span className="text-emerald-600 font-medium">
                            {format(c.dataFimReal, "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </span>
                          {c.diasAtraso > 0 && (
                            <span className="text-destructive ml-2">
                              ({c.diasAtraso}d atraso)
                            </span>
                          )}
                        </div>
                      )}
                      {respName && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {respName}
                        </div>
                      )}
                      {c.stage.atividade && (
                        <div className="italic">{c.stage.atividade}</div>
                      )}
                      {(c.stage as any).observacoes && (
                        <div className="text-muted-foreground/80">
                          {(c.stage as any).observacoes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1 border-t">
                  {!c.isRealizada && onConcluir && (
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onConcluir(c.stage.id!)}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Concluir
                    </Button>
                  )}
                  {onAddBefore && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onAddBefore(c.stage.id!)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-0.5" /> Antes
                    </Button>
                  )}
                  {onAddAfter && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onAddAfter(c.stage.id!)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-0.5" /> Depois
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => onEdit(c.stage.id!)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => onDelete(c.stage.id!)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
