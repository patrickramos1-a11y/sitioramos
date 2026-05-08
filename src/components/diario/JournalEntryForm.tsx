import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsavelSelect } from "@/components/responsaveis/ResponsavelSelect";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { NotebookPen, Camera } from "lucide-react";

const NONE = "__none__";
const todayISO = () => new Date().toISOString().split("T")[0];

const TIPOS = [
  { value: "observacao", label: "Observação geral" },
  { value: "plantio", label: "Plantio" },
  { value: "limpeza", label: "Limpeza / manejo" },
  { value: "colheita", label: "Colheita" },
  { value: "clima", label: "Clima" },
  { value: "manutencao", label: "Manutenção" },
  { value: "ocorrencia", label: "Ocorrência" },
  { value: "visita", label: "Visita" },
  { value: "ambiental", label: "Ambiental" },
  { value: "financeiro", label: "Financeiro relacionado" },
  { value: "outro", label: "Outro" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JournalEntryForm({ open, onOpenChange }: Props) {
  const { areas = [] } = useAreas() as any;
  const { cycles = [] } = useCycles() as any;
  const { create } = useJournalEntries();

  const [entryDate, setEntryDate] = useState(todayISO());
  const [areaId, setAreaId] = useState("");
  const [cycleId, setCycleId] = useState("");
  const [entryType, setEntryType] = useState("observacao");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setEntryDate(todayISO());
      setAreaId("");
      setCycleId("");
      setEntryType("observacao");
      setTitle("");
      setDescription("");
      setResponsavelId("");
      setNotes("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate(
      {
        entry_date: entryDate,
        area_id: areaId || null,
        cycle_id: cycleId || null,
        entry_type: entryType,
        title: title.trim(),
        description: description.trim() || null,
        responsavel_id: responsavelId || null,
        notes: notes.trim() || null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto bg-[hsl(44_38%_97%)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <span className="h-8 w-8 rounded-lg bg-brand-leaf/15 text-brand-leaf flex items-center justify-center">
              <NotebookPen className="h-4 w-4" />
            </span>
            Diário de Campo
          </DialogTitle>
          <DialogDescription>
            Registre acontecimentos, observações e avanços da operação.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data</Label>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
            </div>
            <div>
              <Label>Tipo de registro</Label>
              <Select value={entryType} onValueChange={setEntryType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Título *</Label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Avanço da limpeza autorizada na área 5,23 ha"
              required
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que aconteceu no campo hoje."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Área</Label>
              <Select value={areaId || NONE} onValueChange={(v) => setAreaId(v === NONE ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— Nenhuma —</SelectItem>
                  {areas.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ciclo / Projeto</Label>
              <Select value={cycleId || NONE} onValueChange={(v) => setCycleId(v === NONE ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— Nenhum —</SelectItem>
                  {cycles.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.cultura || "Ciclo"}{c.areas?.nome ? ` · ${c.areas.nome}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ResponsavelSelect
            label="Responsável"
            value={responsavelId}
            onChange={(id) => setResponsavelId(id || "")}
          />

          <div className="rounded-lg border border-dashed border-brand-leaf/40 bg-brand-leaf/5 p-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Camera className="h-4 w-4 text-brand-leaf" />
            Adicionar foto ou evidência (em breve)
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas livres"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending || !title.trim()} className="bg-brand-leaf hover:bg-brand-leaf/90">
              {create.isPending ? "Salvando..." : "Salvar Registro"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
