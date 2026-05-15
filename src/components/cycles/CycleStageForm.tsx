import { useEffect, useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResponsaveis } from "@/hooks/useResponsaveis";
import { CycleStage } from "@/hooks/useCycleStages";
import { Loader2, Plus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cycleId: string;
  cycleStartIso: string;
  stage?: CycleStage | null;
  allStages: CycleStage[];
  /** Posição inicial sugerida — id de etapa de referência se vier de + Antes/+ Depois */
  initialPosition?: { mode: "after_last" | "before" | "after"; refStageId?: string };
  onSubmit: (payload: {
    nome: string;
    duracao_dias: number;
    atividade: string | null;
    observacoes: string | null;
    responsavel_id: string | null;
    position?: { mode: "after_last" | "before" | "after"; refStageId?: string };
  }) => void;
  isSubmitting?: boolean;
}

const NONE = "__none__";
type PositionMode = "after_last" | "before" | "after";

export function CycleStageForm({
  open,
  onOpenChange,
  cycleStartIso,
  stage,
  allStages,
  initialPosition,
  onSubmit,
  isSubmitting,
}: Props) {
  const { data: responsaveis = [] } = useResponsaveis() as any;
  const [nome, setNome] = useState("");
  const [duracao, setDuracao] = useState(5);
  const [atividade, setAtividade] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [showObs, setShowObs] = useState(false);
  const [responsavelId, setResponsavelId] = useState<string>(NONE);

  const [positionMode, setPositionMode] = useState<PositionMode>("after_last");
  const [refStageId, setRefStageId] = useState<string>("");

  const sortedOthers = useMemo(
    () => [...allStages].filter((s) => s.id !== stage?.id).sort((a, b) => a.ordem - b.ordem),
    [allStages, stage?.id],
  );

  useEffect(() => {
    if (!open) return;
    if (stage) {
      setNome(stage.nome);
      setDuracao(Math.max(1, stage.duracao_dias));
      setAtividade(stage.atividade || "");
      setObservacoes(stage.observacoes || "");
      setShowObs(!!stage.observacoes);
      setResponsavelId(stage.responsavel_id || NONE);
    } else {
      setNome("");
      setDuracao(5);
      setAtividade("");
      setObservacoes("");
      setShowObs(false);
      setResponsavelId(NONE);
      setPositionMode(initialPosition?.mode || "after_last");
      setRefStageId(initialPosition?.refStageId || "");
    }
  }, [open, stage, initialPosition]);

  // Compute previewed start day based on chosen position
  const previewIni = useMemo(() => {
    if (stage) return stage.inicio_relativo_dias;
    if (positionMode === "after_last") {
      return sortedOthers.reduce((s, x) => s + x.duracao_dias, 0);
    }
    if (refStageId) {
      const ref = sortedOthers.find((s) => s.id === refStageId);
      if (!ref) return 0;
      if (positionMode === "before") return ref.inicio_relativo_dias;
      return ref.inicio_relativo_dias + ref.duracao_dias;
    }
    return 0;
  }, [stage, positionMode, refStageId, sortedOthers]);

  const start = cycleStartIso ? addDays(parseISO(cycleStartIso), previewIni) : null;
  const end = cycleStartIso ? addDays(parseISO(cycleStartIso), previewIni + Math.max(0, duracao - 1)) : null;

  const handle = () => {
    if (!nome.trim() || duracao < 1) return;
    onSubmit({
      nome: nome.trim(),
      duracao_dias: Math.max(1, Math.floor(duracao)),
      atividade: atividade.trim() || null,
      observacoes: observacoes.trim() || null,
      responsavel_id: responsavelId === NONE ? null : responsavelId,
      position: stage ? undefined : { mode: positionMode, refStageId: refStageId || undefined },
    });
  };

  const needsRef = (positionMode === "before" || positionMode === "after") && sortedOthers.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stage ? "Editar etapa" : "Nova etapa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Plantio, 1ª Capina"
              autoFocus
            />
          </div>

          <div>
            <Label>Duração (dias) *</Label>
            <Input
              type="number"
              min={1}
              value={duracao}
              onChange={(e) => setDuracao(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          {!stage && sortedOthers.length > 0 && (
            <div>
              <Label>Posição</Label>
              <Select value={positionMode} onValueChange={(v) => setPositionMode(v as PositionMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="after_last">No final (depois da última)</SelectItem>
                  <SelectItem value="before">Antes de…</SelectItem>
                  <SelectItem value="after">Depois de…</SelectItem>
                </SelectContent>
              </Select>
              {needsRef && (
                <Select value={refStageId} onValueChange={setRefStageId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Escolher etapa de referência" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedOthers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.ordem}. {s.nome} ({s.duracao_dias}d)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {start && end && (
            <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Previsto: {format(start, "dd/MM/yyyy", { locale: ptBR })} a{" "}
              {format(end, "dd/MM/yyyy", { locale: ptBR })} · {duracao} dia(s)
            </div>
          )}

          <div>
            <Label>Atividade / observação curta</Label>
            <Input
              value={atividade}
              onChange={(e) => setAtividade(e.target.value)}
              placeholder="Ex: Aplicar adubo NPK"
            />
          </div>

          <div>
            <Label>Responsável</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger>
                <SelectValue placeholder="Sem responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sem responsável</SelectItem>
                {responsaveis.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.apelido || r.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showObs ? (
            <div>
              <Label>Observações</Label>
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
            </div>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowObs(true)} className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar observação
            </Button>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handle} disabled={isSubmitting || !nome.trim()}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {stage ? "Salvar" : "Criar etapa"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
