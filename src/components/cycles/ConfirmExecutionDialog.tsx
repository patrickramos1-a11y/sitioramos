import { useEffect, useMemo, useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { ComputedStage } from "@/lib/cycles/stageCalc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResponsaveis } from "@/hooks/useResponsaveis";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  computed: ComputedStage | null;
  isSubmitting?: boolean;
  onConfirm: (payload: {
    data_inicio_real: string;
    data_fim_real: string;
    observacao: string | null;
    responsavel_id: string | null;
    pushNext: boolean;
    deltaDias: number;
  }) => void;
}

const NONE = "__none__";

export function ConfirmExecutionDialog({ open, onOpenChange, computed, onConfirm, isSubmitting }: Props) {
  const { data: responsaveis = [] } = useResponsaveis() as any;
  const [dataInicioReal, setDataInicioReal] = useState("");
  const [dataFimReal, setDataFimReal] = useState("");
  const [observacao, setObservacao] = useState("");
  const [responsavelId, setResponsavelId] = useState(NONE);
  const [pushNext, setPushNext] = useState<"sim" | "nao">("nao");

  useEffect(() => {
    if (!open || !computed) return;
    setDataInicioReal(
      computed.stage.data_inicio_real || format(computed.dataInicio, "yyyy-MM-dd"),
    );
    setDataFimReal(computed.stage.data_fim_real || format(computed.dataFim, "yyyy-MM-dd"));
    setObservacao("");
    setResponsavelId(computed.stage.responsavel_id ? (computed.stage as any).responsavel_id : NONE);
    setPushNext("nao");
  }, [open, computed]);

  const delta = useMemo(() => {
    if (!computed || !dataFimReal) return 0;
    return differenceInCalendarDays(parseISO(dataFimReal), computed.dataFim);
  }, [computed, dataFimReal]);

  if (!computed) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Confirmar execução · {computed.stage.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3">
            Previsto: {format(computed.dataInicio, "dd/MM/yyyy", { locale: ptBR })} a{" "}
            {format(computed.dataFim, "dd/MM/yyyy", { locale: ptBR })} (dia {computed.diaInicio} a{" "}
            {computed.diaFim})
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início real</Label>
              <Input type="date" value={dataInicioReal} onChange={(e) => setDataInicioReal(e.target.value)} />
            </div>
            <div>
              <Label>Fim real</Label>
              <Input type="date" value={dataFimReal} onChange={(e) => setDataFimReal(e.target.value)} />
            </div>
          </div>
          {delta !== 0 && (
            <div
              className={`text-xs rounded-md px-3 py-2 border ${
                delta > 0
                  ? "bg-destructive/10 text-destructive border-destructive/30"
                  : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30"
              }`}
            >
              {delta > 0
                ? `Atraso de ${delta} dia(s) em relação ao previsto.`
                : `Adiantamento de ${Math.abs(delta)} dia(s).`}
            </div>
          )}
          <div>
            <Label>Responsável</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger>
                <SelectValue />
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
          <div>
            <Label>Observação</Label>
            <Textarea rows={2} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </div>
          {delta !== 0 && (
            <div>
              <Label>Empurrar próximas etapas?</Label>
              <Select value={pushNext} onValueChange={(v) => setPushNext(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não, manter cronograma</SelectItem>
                  <SelectItem value="sim">
                    Sim, ajustar próximas em {delta > 0 ? "+" : ""}
                    {delta} dia(s)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={() =>
                onConfirm({
                  data_inicio_real: dataInicioReal,
                  data_fim_real: dataFimReal,
                  observacao: observacao.trim() || null,
                  responsavel_id: responsavelId === NONE ? null : responsavelId,
                  pushNext: pushNext === "sim",
                  deltaDias: delta,
                })
              }
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
