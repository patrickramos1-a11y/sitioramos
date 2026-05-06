import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Task, TaskInsert } from "@/hooks/useTasks";
import { ResponsavelSelect } from "@/components/responsaveis/ResponsavelSelect";

interface SimpleTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  defaultStageId?: string;
  onSubmit: (data: TaskInsert) => void;
  isSubmitting: boolean;
}

export function SimpleTaskForm({ open, onOpenChange, task, defaultStageId, onSubmit, isSubmitting }: SimpleTaskFormProps) {
  const [titulo, setTitulo] = useState("");
  const [responsavelId, setResponsavelId] = useState<string>("");

  useEffect(() => {
    if (task) {
      setTitulo(task.titulo);
      setResponsavelId((task as any).responsavel_id || "");
    } else {
      setTitulo("");
      setResponsavelId("");
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    onSubmit({
      titulo: titulo.trim(),
      stage_id: task?.stage_id || defaultStageId || null,
      responsavel_id: responsavelId || null,
      tipo: task?.tipo || "operacional",
      status: task?.status || "pendente",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          <DialogDescription>Apenas descrição e responsável. Sem prazos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Descrição *</Label>
            <Input
              autoFocus
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex.: Comprar mudas"
              required
            />
          </div>
          <div>
            <ResponsavelSelect
              label="Responsável"
              value={responsavelId}
              onChange={(id) => setResponsavelId(id || "")}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !titulo.trim()}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
