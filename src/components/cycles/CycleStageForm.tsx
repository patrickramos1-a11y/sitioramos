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
  defaultOrdem?: number;
  allStages: CycleStage[];
  onSubmit: (payload: any) => void;
  isSubmitting?: boolean;
}

const NONE = "__none__";

type PositionMode = "after_last" | "before" | "after" | "manual";

export function CycleStageForm({
  open,
  onOpenChange,
  cycleId,
  cycleStartIso,
  stage,
  defaultOrdem = 0,
  allStages,
  onSubmit,
  isSubmitting,
}: Props) {
  const { data: responsaveis = [] } = useResponsaveis() as any;
  const [nome, setNome] = useState("");
  const [atividade, setAtividade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [showDescricao, setShowDescricao] = useState(false);
  const [showObservacoes, setShowObservacoes] = useState(false);
  const [diaInicio, setDiaInicio] = useState(0);
  const [diaFim, setDiaFim] = useState(1);
  const [responsavelId, setResponsavelId] = useState<string>(NONE);
  const [observacoes, setObservacoes] = useState("");

  const [positionMode, setPositionMode] = useState<PositionMode>("after_last");
  const [refStageId, setRefStageId] = useState<string>("");

  const sortedOthers = useMemo(
    () =>
      [...allStages]
        .filter((s) => s.id !== stage?.id)
        .sort((a, b) => a.inicio_relativo_dias - b.inicio_relativo_dias),
    [allStages, stage?.id],
  );

  const lastEnd = useMemo(() => {
    if (sortedOthers.length === 0) return 0;
    return Math.max(...sortedOthers.map((s) => s.inicio_relativo_dias + Math.max(0, s.duracao_dias - 1)));
  }, [sortedOthers]);

  useEffect(() => {
    if (!open) return;
    if (stage) {
      setNome(stage.nome);
      setAtividade(stage.atividade || "");
      setDescricao(stage.descricao || "");
      setShowDescricao(!!stage.descricao);
      setShowObservacoes(!!stage.observacoes);
      setDiaInicio(stage.inicio_relativo_dias);
      setDiaFim(stage.inicio_relativo_dias + Math.max(0, stage.duracao_dias - 1));
      setResponsavelId(stage.responsavel_id || NONE);
      setObservacoes(stage.observacoes || "");
      setPositionMode("manual");
    } else {
      setNome("");
      setAtividade("");
      setDescricao("");
      setShowDescricao(false);
      setShowObservacoes(false);
      const sugestao = lastEnd + 1;
      setDiaInicio(sugestao);
      setDiaFim(sugestao + 4);
      setResponsavelId(NONE);
      setObservacoes("");
      setPositionMode("after_last");
      setRefStageId("");
    }
  }, [open, stage, lastEnd]);

  // Position auto-adjust
  useEffect(() => {
    if (positionMode === "after_last") {
      const ini = lastEnd + 1;
      setDiaInicio(ini);
      setDiaFim((f) => Math.max(ini, f));
    } else if (positionMode === "before" && refStageId) {
      const ref = sortedOthers.find((s) => s.id === refStageId);
      if (ref) {
        const fim = Math.max(0, ref.inicio_relativo_dias - 1);
        const ini = Math.max(0, fim - 3);
        setDiaInicio(ini);
        setDiaFim(fim);
      }
    } else if (positionMode === "after" && refStageId) {
      const ref = sortedOthers.find((s) => s.id === refStageId);
      if (ref) {
        const ini = ref.inicio_relativo_dias + Math.max(0, ref.duracao_dias);
        setDiaInicio(ini);
        setDiaFim(ini + 3);
      }
    }
  }, [positionMode, refStageId, lastEnd, sortedOthers]);

  const start = cycleStartIso ? addDays(parseISO(cycleStartIso), diaInicio) : null;
  const end = cycleStartIso ? addDays(parseISO(cycleStartIso), diaFim) : null;
  const duracao = Math.max(1, diaFim - diaInicio + 1);

  const handle = () => {
    if (!nome.trim()) return;
    onSubmit({
      cycle_id: cycleId,
      nome: nome.trim(),
      atividade: atividade.trim() || null,
      descricao: descricao.trim() || null,
      ordem: stage?.ordem ?? defaultOrdem,
      inicio_relativo_dias: Math.max(0, Math.floor(diaInicio)),
      inicio_relativo_dias_min: Math.max(0, Math.floor(diaInicio)),
      duracao_dias: duracao,
      status: stage?.status ?? "nao_iniciada",
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
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Plantio, 1ª Capina" />
          </div>
          <div>
            <Label>Atividade</Label>
            <Input
              value={atividade}
              onChange={(e) => setAtividade(e.target.value)}
              placeholder="Ex: Capina manual obrigatória"
            />
          </div>

          {!stage && (
            <div>
              <Label>Posição da etapa</Label>
              <Select value={positionMode} onValueChange={(v) => setPositionMode(v as PositionMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="after_last">Depois da última etapa</SelectItem>
                  <SelectItem value="before" disabled={sortedOthers.length === 0}>
                    Antes de uma etapa existente
                  </SelectItem>
                  <SelectItem value="after" disabled={sortedOthers.length === 0}>
                    Depois de uma etapa existente
                  </SelectItem>
                  <SelectItem value="manual">Definir manualmente</SelectItem>
                </SelectContent>
              </Select>
              {(positionMode === "before" || positionMode === "after") && (
                <Select value={refStageId} onValueChange={setRefStageId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Escolher etapa de referência" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedOthers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nome} (dia {s.inicio_relativo_dias})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início (dia do ciclo)</Label>
              <Input
                type="number"
                min={0}
                value={diaInicio}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setDiaInicio(v);
                  if (v > diaFim) setDiaFim(v);
                }}
              />
              {start && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {format(start, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
            </div>
            <div>
              <Label>Fim — limite máximo (dia)</Label>
              <Input
                type="number"
                min={diaInicio}
                value={diaFim}
                onChange={(e) => setDiaFim(Math.max(diaInicio, Number(e.target.value)))}
              />
              {end && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {format(end, "dd/MM/yyyy", { locale: ptBR })} · {duracao} dia(s)
                </p>
              )}
            </div>
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

          {showDescricao ? (
            <div>
              <Label>Descrição</Label>
              <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} />
            </div>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowDescricao(true)} className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar descrição
            </Button>
          )}

          {showObservacoes ? (
            <div>
              <Label>Observações</Label>
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
            </div>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowObservacoes(true)} className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar observação
            </Button>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
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
