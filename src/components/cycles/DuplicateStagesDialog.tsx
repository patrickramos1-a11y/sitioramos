import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCycles } from "@/hooks/useCycles";
import { useCycleStages } from "@/hooks/useCycleStages";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  targetCycleId: string;
}

export function DuplicateStagesDialog({ open, onOpenChange, targetCycleId }: Props) {
  const { cycles } = useCycles();
  const { duplicateFromCycle } = useCycleStages(targetCycleId);
  const [sourceId, setSourceId] = useState("");

  const eligible = cycles.filter((c: any) => c.id !== targetCycleId);

  const handle = async () => {
    if (!sourceId) return;
    await duplicateFromCycle.mutateAsync({ sourceCycleId: sourceId, targetCycleId });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Duplicar etapas de outro ciclo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Ciclo origem</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {eligible.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.cultura} {c.areas?.nome ? `· ${c.areas.nome}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">
              As etapas serão copiadas como "Não iniciada".
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handle} disabled={!sourceId || duplicateFromCycle.isPending}>
              {duplicateFromCycle.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Duplicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
