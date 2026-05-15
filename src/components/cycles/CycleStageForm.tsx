import { useEffect, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useResponsaveis } from "@/hooks/useResponsaveis";
import { CycleStage } from "@/hooks/useCycleStages";
import { STAGE_STATUS_LABEL, StageStatus } from "@/lib/cycles/stageCalc";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cycleId: string;
  cycleStartIso: string;
  stage?: CycleStage | null;
  defaultOrdem?: number;
  onSubmit: (payload: any) => void;
  isSubmitting?: boolean;
}

const NONE = "__none__";

export function CycleStageForm({
  open,
  onOpenChange,
  cycleId,
  cycleStartIso,
  stage,
  defaultOrdem = 0,
  onSubmit,
  isSubmitting,
}: Props) {
  const { data: responsaveis = [] } = useResponsaveis() as any;
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [inicioRelativo, setInicioRelativo] = useState(0);
  const [duracao, setDuracao] = useState(1);
  const [status, setStatus] = useState<StageStatus>("nao_iniciada");
  const [responsavelId, setResponsavelId] = useState<string>(NONE);
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (stage) {
      setNome(stage.nome);
      setDescricao(stage.descricao || "");
      setInicioRelativo(stage.inicio_relativo_dias);
      setDuracao(stage.duracao_dias);
      setStatus(stage.status);
      setResponsavelId(stage.responsavel_id || NONE);
      setObservacoes(stage.observacoes || "");
    } else {
      setNome("");
      setDescricao("");
      setInicioRelativo(0);
      setDuracao(1);
      setStatus("nao_iniciada");
      setResponsavelId(NONE);
      setObservacoes("");
    }
  }, [open, stage]);

  const start = cycleStartIso ? addDays(parseISO(cycleStartIso), inicioRelativo) : null;
  const end = start ? addDays(start, Math.max(0, duracao - 1)) : null;

  const handle = () => {
    if (!nome.trim()) return;
    onSubmit({
      cycle_id: cycleId,
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      ordem: stage?.ordem ?? defaultOrdem,
      inicio_relativo_dias: Math.max(0, Math.floor(inicioRelativo)),
      duracao_dias: Math.max(1, Math.floor(duracao)),
      status,
      responsavel_id: responsavelId === NONE ? null : responsavelId,
      observacoes: observacoes.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stage ? "Editar etapa" : "Nova etapa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Plantio, Capina" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início (dia do ciclo)</Label>
              <Input type="number" min={0} value={inicioRelativo} onChange={(e) => setInicioRelativo(Number(e.target.value))} />
              {start && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {format(start, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
            </div>
            <div>
              <Label>Duração (dias)</Label>
              <Input type="number" min={1} value={duracao} onChange={(e) => setDuracao(Number(e.target.value))} />
              {end && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  até {format(end, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StageStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STAGE_STATUS_LABEL).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável</Label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger><SelectValue placeholder="Sem responsável" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem responsável</SelectItem>
                  {responsaveis.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.apelido || r.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handle} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {stage ? "Salvar" : "Criar etapa"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
