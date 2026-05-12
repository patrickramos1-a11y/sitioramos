import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContatoSelect } from "@/components/contatos/ContatoSelect";

interface AreaOpt { id: string; nome: string }
interface CycleOpt { id: string; cultura: string; area_id: string | null }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  count: number;
  areas: AreaOpt[];
  cycles: CycleOpt[];
  onApply: (patch: { area_id?: string | null; cycle_id?: string | null; contato_id?: string | null }) => void;
}

const NONE = "__none__";

export function BulkEditDialog({ open, onOpenChange, count, areas, cycles, onApply }: Props) {
  const [setArea, setSetArea] = useState(false);
  const [areaId, setAreaId] = useState<string>(NONE);
  const [setCycle, setSetCycle] = useState(false);
  const [cycleId, setCycleId] = useState<string>(NONE);
  const [setContato, setSetContato] = useState(false);
  const [contatoId, setContatoId] = useState<string | null>(null);

  const availableCycles = setArea && areaId !== NONE ? cycles.filter((c) => c.area_id === areaId) : cycles;

  const reset = () => {
    setSetArea(false); setAreaId(NONE);
    setSetCycle(false); setCycleId(NONE);
    setSetContato(false); setContatoId(null);
  };

  const handleApply = () => {
    const patch: any = {};
    if (setArea) patch.area_id = areaId === NONE ? null : areaId;
    if (setCycle) patch.cycle_id = cycleId === NONE ? null : cycleId;
    if (setContato) patch.contato_id = contatoId;
    onApply(patch);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar {count} movimentações</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Marque os campos que deseja alterar. Apenas os campos marcados serão aplicados às movimentações selecionadas.
          </p>

          <div className="space-y-2 border rounded-md p-3">
            <div className="flex items-center gap-2">
              <Checkbox checked={setArea} onCheckedChange={(v) => setSetArea(!!v)} id="bulk-area" />
              <Label htmlFor="bulk-area" className="cursor-pointer">Atualizar Área</Label>
            </div>
            {setArea && (
              <Select value={areaId} onValueChange={(v) => { setAreaId(v); setCycleId(NONE); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem área</SelectItem>
                  {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2 border rounded-md p-3">
            <div className="flex items-center gap-2">
              <Checkbox checked={setCycle} onCheckedChange={(v) => setSetCycle(!!v)} id="bulk-cycle" />
              <Label htmlFor="bulk-cycle" className="cursor-pointer">Atualizar Ciclo</Label>
            </div>
            {setCycle && (
              <Select value={cycleId} onValueChange={setCycleId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem ciclo</SelectItem>
                  {availableCycles.map((c) => <SelectItem key={c.id} value={c.id}>{c.cultura}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2 border rounded-md p-3">
            <div className="flex items-center gap-2">
              <Checkbox checked={setContato} onCheckedChange={(v) => setSetContato(!!v)} id="bulk-contato" />
              <Label htmlFor="bulk-contato" className="cursor-pointer">Atualizar Contato</Label>
            </div>
            {setContato && <ContatoSelect value={contatoId} onChange={setContatoId} />}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleApply} disabled={!setArea && !setCycle && !setContato}>
            Aplicar a {count}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
