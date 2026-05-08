import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task, TaskInsert } from "@/hooks/useTasks";
import { ResponsavelSelect } from "@/components/responsaveis/ResponsavelSelect";

interface ParentOption {
  id: string;
  nome: string;
  children?: { id: string; nome: string }[];
}

interface SimpleTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  defaultStageId?: string;
  parentOptions?: ParentOption[];
  onSubmit: (data: TaskInsert) => void;
  isSubmitting: boolean;
}

const NONE = "__none__";

export function SimpleTaskForm({ open, onOpenChange, task, defaultStageId, parentOptions, onSubmit, isSubmitting }: SimpleTaskFormProps) {
  const [titulo, setTitulo] = useState("");
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [data, setData] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  const [stageId, setStageId] = useState<string>("");

  useEffect(() => {
    if (task) {
      setTitulo(task.titulo);
      setResponsavelId((task as any).responsavel_id || "");
      setData(task.data_prazo || "");
      setObservacoes(task.observacoes || "");
      setStageId(task.stage_id || "");
    } else {
      setTitulo("");
      setResponsavelId("");
      setData("");
      setObservacoes("");
      setStageId(defaultStageId || "");
    }
  }, [task, open, defaultStageId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    if (!stageId) return;
    onSubmit({
      titulo: titulo.trim(),
      stage_id: stageId,
      responsavel_id: responsavelId || null,
      data_prazo: data || null,
      observacoes: observacoes.trim() || null,
      tipo: task?.tipo || "operacional",
      status: task?.status || "pendente",
    });
  };

  const showParentPicker = !task && parentOptions && parentOptions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Editar subtarefa" : "Nova subtarefa"}</DialogTitle>
          <DialogDescription>Item de checklist operacional. Tudo opcional além da descrição.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {showParentPicker && (
            <div>
              <Label>Adicionar em *</Label>
              <Select value={stageId || NONE} onValueChange={(v) => setStageId(v === NONE ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Escolha o projeto ou subprojeto" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value={NONE}>— Selecione —</SelectItem>
                  {parentOptions!.map(p => [
                    <SelectItem key={p.id} value={p.id} className="font-medium">📁 {p.nome}</SelectItem>,
                    ...(p.children || []).map(c => (
                      <SelectItem key={c.id} value={c.id} className="pl-8 text-xs">↳ {c.nome}</SelectItem>
                    )),
                  ])}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Descrição *</Label>
            <Input
              autoFocus
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex.: Comprar herbicida"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data</Label>
              <Input type="date" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div>
              <ResponsavelSelect
                label="Responsável"
                value={responsavelId}
                onChange={(id) => setResponsavelId(id || "")}
              />
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Notas, links de anexos, etc."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !titulo.trim() || !stageId}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
