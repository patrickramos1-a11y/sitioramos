import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { CycleStage } from "@/hooks/useCycleStages";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  stage: CycleStage | null;
  isSubmitting?: boolean;
  onConfirm: (payload: {
    inicio_relativo_dias: number;
    duracao_dias: number;
    motivo: string;
    pushNext: boolean;
    deltaDias: number;
  }) => void;
}

export function RescheduleStageDialog({ open, onOpenChange, stage, onConfirm, isSubmitting }: Props) {
  const [inicio, setInicio] = useState(0);
  const [fim, setFim] = useState(1);
  const [motivo, setMotivo] = useState("");
  const [pushNext, setPushNext] = useState(true);

  useEffect(() => {
    if (!open || !stage) return;
    setInicio(stage.inicio_relativo_dias);
    setFim(stage.inicio_relativo_dias + Math.max(0, stage.duracao_dias - 1));
    setMotivo(stage.motivo_reprogramacao || "");
    setPushNext(true);
  }, [open, stage]);

  if (!stage) return null;

  const oldEnd = stage.inicio_relativo_dias + Math.max(0, stage.duracao_dias - 1);
  const delta = fim - oldEnd;
  const duracao = Math.max(1, fim - inicio + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Reprogramar · {stage.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início (dia)</Label>
              <Input
                type="number"
                min={0}
                value={inicio}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setInicio(v);
                  if (v > fim) setFim(v);
                }}
              />
            </div>
            <div>
              <Label>Fim (dia)</Label>
              <Input
                type="number"
                min={inicio}
                value={fim}
                onChange={(e) => setFim(Math.max(inicio, Number(e.target.value)))}
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Nova duração: {duracao} dia(s){" "}
            {delta !== 0 && <>· deslocamento de {delta > 0 ? "+" : ""}{delta} dia(s)</>}
          </div>
          <div>
            <Label>Motivo da reprogramação</Label>
            <Textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          {delta !== 0 && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={pushNext} onCheckedChange={(v) => setPushNext(!!v)} />
              Empurrar próximas etapas em {delta > 0 ? "+" : ""}{delta} dia(s)
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={() =>
                onConfirm({
                  inicio_relativo_dias: inicio,
                  duracao_dias: duracao,
                  motivo: motivo.trim(),
                  pushNext,
                  deltaDias: delta,
                })
              }
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reprogramar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
