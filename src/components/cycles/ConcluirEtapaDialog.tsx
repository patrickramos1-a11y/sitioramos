import { useEffect, useState } from "react";
import { format } from "date-fns";
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
import { ComputedStage } from "@/lib/cycles/stageCalc";
import { Loader2 } from "lucide-react";

const NONE = "__none__";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  computed: ComputedStage | null;
  onConfirm: (p: {
    data_real: string;
    observacao: string | null;
    responsavel_id: string | null;
  }) => void;
  isSubmitting?: boolean;
}

export function ConcluirEtapaDialog({ open, onOpenChange, computed, onConfirm, isSubmitting }: Props) {
  const { data: responsaveis = [] } = useResponsaveis() as any;
  const [dataReal, setDataReal] = useState(format(new Date(), "yyyy-MM-dd"));
  const [obs, setObs] = useState("");
  const [resp, setResp] = useState<string>(NONE);

  useEffect(() => {
    if (open && computed) {
      setDataReal(format(new Date(), "yyyy-MM-dd"));
      setObs("");
      setResp(computed.stage.responsavel_id || NONE);
    }
  }, [open, computed]);

  if (!computed) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Concluir etapa: {computed.stage.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Data real de conclusão *</Label>
            <Input type="date" value={dataReal} onChange={(e) => setDataReal(e.target.value)} />
          </div>
          <div>
            <Label>Responsável</Label>
            <Select value={resp} onValueChange={setResp}>
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
          <div>
            <Label>Observação</Label>
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button
              onClick={() =>
                onConfirm({
                  data_real: dataReal,
                  observacao: obs.trim() || null,
                  responsavel_id: resp === NONE ? null : resp,
                })
              }
              disabled={isSubmitting || !dataReal}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Concluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
