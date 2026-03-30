import { Stage } from "@/hooks/useStages";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Pause, AlertTriangle, Circle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  nao_iniciada: { label: "Não Iniciada", icon: Circle, color: "text-muted-foreground" },
  em_andamento: { label: "Em Andamento", icon: Clock, color: "text-primary" },
  concluida: { label: "Concluída", icon: CheckCircle2, color: "text-success" },
  atrasada: { label: "Atrasada", icon: AlertTriangle, color: "text-destructive" },
  pausada: { label: "Pausada", icon: Pause, color: "text-warning" },
};

interface CycleTimelineProps {
  stages: Stage[];
  onStageClick?: (stage: Stage) => void;
}

export function CycleTimeline({ stages, onStageClick }: CycleTimelineProps) {
  if (stages.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Nenhuma etapa cadastrada neste ciclo.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-1">
        {stages.map((stage, index) => {
          const config = statusConfig[stage.status] || statusConfig.nao_iniciada;
          const Icon = config.icon;
          const isLast = index === stages.length - 1;

          return (
            <div
              key={stage.id}
              className="relative flex items-start gap-4 pl-0 cursor-pointer hover:bg-muted/50 rounded-lg p-3 transition-colors"
              onClick={() => onStageClick?.(stage)}
            >
              {/* Timeline dot */}
              <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-background ${
                stage.status === "concluida" ? "border-success" :
                stage.status === "em_andamento" ? "border-primary" :
                stage.status === "atrasada" ? "border-destructive" :
                "border-muted-foreground/30"
              }`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{stage.nome}</span>
                  <Badge variant={
                    stage.status === "concluida" ? "default" :
                    stage.status === "em_andamento" ? "secondary" :
                    stage.status === "atrasada" ? "destructive" :
                    "outline"
                  } className="text-xs">
                    {config.label}
                  </Badge>
                  {stage.prioridade === "alta" && <Badge variant="destructive" className="text-xs">Alta</Badge>}
                  {stage.prioridade === "critica" && <Badge variant="destructive" className="text-xs">Crítica</Badge>}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                  {stage.data_inicio_real && (
                    <span>Início: {format(new Date(stage.data_inicio_real), "dd/MM/yy", { locale: ptBR })}</span>
                  )}
                  {stage.data_fim_real && (
                    <span>Fim: {format(new Date(stage.data_fim_real), "dd/MM/yy", { locale: ptBR })}</span>
                  )}
                  {!stage.data_fim_real && stage.data_fim_prevista && (
                    <span>Previsão: {format(new Date(stage.data_fim_prevista), "dd/MM/yy", { locale: ptBR })}</span>
                  )}
                  {stage.responsavel && <span>👤 {stage.responsavel}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
