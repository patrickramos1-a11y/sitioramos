import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task, TaskInsert } from "@/hooks/useTasks";
import { Stage } from "@/hooks/useStages";

const taskTypes = [
  { value: "operacional", label: "Operacional" },
  { value: "compra", label: "Compra" },
  { value: "contratacao", label: "Contratação" },
  { value: "documentacao", label: "Documentação" },
  { value: "financeiro", label: "Financeiro" },
  { value: "manutencao", label: "Manutenção" },
  { value: "logistica", label: "Logística" },
  { value: "outro", label: "Outro" },
];

const statusOptions = [
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "atrasada", label: "Atrasada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "pausada", label: "Pausada" },
];

const priorityOptions = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  stages: Stage[];
  defaultValues?: Partial<TaskInsert>;
  onSubmit: (data: TaskInsert) => void;
  isSubmitting: boolean;
}

export function TaskForm({ open, onOpenChange, task, stages, defaultValues, onSubmit, isSubmitting }: TaskFormProps) {
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    tipo: "operacional",
    status: "pendente",
    prioridade: "media",
    stage_id: "",
    data_inicio_prevista: "",
    data_inicio_real: "",
    data_prazo: "",
    data_conclusao: "",
    responsavel: "",
    custo_estimado: "",
    custo_real: "",
    observacoes: "",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        titulo: task.titulo,
        descricao: task.descricao || "",
        tipo: task.tipo,
        status: task.status,
        prioridade: task.prioridade || "media",
        stage_id: task.stage_id || "",
        data_inicio_prevista: task.data_inicio_prevista || "",
        data_inicio_real: task.data_inicio_real || "",
        data_prazo: task.data_prazo || "",
        data_conclusao: task.data_conclusao || "",
        responsavel: task.responsavel || "",
        custo_estimado: task.custo_estimado?.toString() || "",
        custo_real: task.custo_real?.toString() || "",
        observacoes: task.observacoes || "",
      });
    } else {
      setFormData({
        titulo: "", descricao: "", tipo: "operacional", status: "pendente",
        prioridade: "media", stage_id: defaultValues?.stage_id || "",
        data_inicio_prevista: "", data_inicio_real: "", data_prazo: "",
        data_conclusao: "", responsavel: "", custo_estimado: "", custo_real: "", observacoes: "",
      });
    }
  }, [task, open, defaultValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...defaultValues,
      titulo: formData.titulo,
      descricao: formData.descricao || null,
      tipo: formData.tipo,
      status: formData.status,
      prioridade: formData.prioridade,
      stage_id: formData.stage_id || null,
      data_inicio_prevista: formData.data_inicio_prevista || null,
      data_inicio_real: formData.data_inicio_real || null,
      data_prazo: formData.data_prazo || null,
      data_conclusao: formData.data_conclusao || null,
      responsavel: formData.responsavel || null,
      custo_estimado: formData.custo_estimado ? Number(formData.custo_estimado) : null,
      custo_real: formData.custo_real ? Number(formData.custo_real) : null,
      observacoes: formData.observacoes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Título *</Label>
              <Input value={formData.titulo} onChange={e => setFormData(p => ({ ...p, titulo: e.target.value }))} required />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={formData.tipo} onValueChange={v => setFormData(p => ({ ...p, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {taskTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={formData.prioridade} onValueChange={v => setFormData(p => ({ ...p, prioridade: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {stages.length > 0 && (
              <div>
                <Label>Etapa vinculada</Label>
                <Select value={formData.stage_id} onValueChange={v => setFormData(p => ({ ...p, stage_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Início Previsto</Label>
              <Input type="date" value={formData.data_inicio_prevista} onChange={e => setFormData(p => ({ ...p, data_inicio_prevista: e.target.value }))} />
            </div>
            <div>
              <Label>Início Real</Label>
              <Input type="date" value={formData.data_inicio_real} onChange={e => setFormData(p => ({ ...p, data_inicio_real: e.target.value }))} />
            </div>
            <div>
              <Label>Prazo</Label>
              <Input type="date" value={formData.data_prazo} onChange={e => setFormData(p => ({ ...p, data_prazo: e.target.value }))} />
            </div>
            <div>
              <Label>Conclusão</Label>
              <Input type="date" value={formData.data_conclusao} onChange={e => setFormData(p => ({ ...p, data_conclusao: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Responsável</Label>
              <Input value={formData.responsavel} onChange={e => setFormData(p => ({ ...p, responsavel: e.target.value }))} />
            </div>
            <div>
              <Label>Custo Estimado (R$)</Label>
              <Input type="number" step="0.01" value={formData.custo_estimado} onChange={e => setFormData(p => ({ ...p, custo_estimado: e.target.value }))} />
            </div>
            <div>
              <Label>Custo Real (R$)</Label>
              <Input type="number" step="0.01" value={formData.custo_real} onChange={e => setFormData(p => ({ ...p, custo_real: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Descrição</Label>
              <Textarea value={formData.descricao} onChange={e => setFormData(p => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea value={formData.observacoes} onChange={e => setFormData(p => ({ ...p, observacoes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
