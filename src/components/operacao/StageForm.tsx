import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stage, StageInsert } from "@/hooks/useStages";

const stageTypes = [
  { value: "preparo", label: "Preparo" },
  { value: "plantio", label: "Plantio" },
  { value: "leiras", label: "Leiras" },
  { value: "herbicida", label: "Herbicida" },
  { value: "capina", label: "Capina" },
  { value: "adubacao", label: "Adubação" },
  { value: "colheita", label: "Colheita" },
  { value: "beneficiamento", label: "Beneficiamento" },
  { value: "documentacao", label: "Documentação" },
  { value: "manutencao", label: "Manutenção" },
  { value: "outro", label: "Outro" },
];

const statusOptions = [
  { value: "nao_iniciada", label: "Não Iniciada" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "atrasada", label: "Atrasada" },
  { value: "pausada", label: "Pausada" },
];

const priorityOptions = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

interface StageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: Stage | null;
  cycleId: string;
  areaId: string;
  talhaoId?: string;
  onSubmit: (data: StageInsert) => void;
  isSubmitting: boolean;
}

export function StageForm({ open, onOpenChange, stage, cycleId, areaId, talhaoId, onSubmit, isSubmitting }: StageFormProps) {
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "outro",
    descricao: "",
    status: "nao_iniciada",
    prioridade: "media",
    data_inicio_prevista: "",
    data_inicio_real: "",
    data_fim_prevista: "",
    data_fim_real: "",
    responsavel: "",
    ordem: 0,
    observacoes: "",
  });

  useEffect(() => {
    if (stage) {
      setFormData({
        nome: stage.nome,
        tipo: stage.tipo,
        descricao: stage.descricao || "",
        status: stage.status,
        prioridade: stage.prioridade || "media",
        data_inicio_prevista: stage.data_inicio_prevista || "",
        data_inicio_real: stage.data_inicio_real || "",
        data_fim_prevista: stage.data_fim_prevista || "",
        data_fim_real: stage.data_fim_real || "",
        responsavel: stage.responsavel || "",
        ordem: stage.ordem,
        observacoes: stage.observacoes || "",
      });
    } else {
      setFormData({
        nome: "", tipo: "outro", descricao: "", status: "nao_iniciada",
        prioridade: "media", data_inicio_prevista: "", data_inicio_real: "",
        data_fim_prevista: "", data_fim_real: "", responsavel: "", ordem: 0, observacoes: "",
      });
    }
  }, [stage, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      cycle_id: cycleId,
      area_id: areaId,
      talhao_id: talhaoId || null,
      data_inicio_prevista: formData.data_inicio_prevista || null,
      data_inicio_real: formData.data_inicio_real || null,
      data_fim_prevista: formData.data_fim_prevista || null,
      data_fim_real: formData.data_fim_real || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stage ? "Editar Etapa" : "Nova Etapa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input value={formData.nome} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} required />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={formData.tipo} onValueChange={v => setFormData(p => ({ ...p, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stageTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
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
            <div>
              <Label>Ordem</Label>
              <Input type="number" value={formData.ordem} onChange={e => setFormData(p => ({ ...p, ordem: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Início Previsto</Label>
              <Input type="date" value={formData.data_inicio_prevista} onChange={e => setFormData(p => ({ ...p, data_inicio_prevista: e.target.value }))} />
            </div>
            <div>
              <Label>Início Real</Label>
              <Input type="date" value={formData.data_inicio_real} onChange={e => setFormData(p => ({ ...p, data_inicio_real: e.target.value }))} />
            </div>
            <div>
              <Label>Fim Previsto</Label>
              <Input type="date" value={formData.data_fim_prevista} onChange={e => setFormData(p => ({ ...p, data_fim_prevista: e.target.value }))} />
            </div>
            <div>
              <Label>Fim Real</Label>
              <Input type="date" value={formData.data_fim_real} onChange={e => setFormData(p => ({ ...p, data_fim_real: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Responsável</Label>
              <Input value={formData.responsavel} onChange={e => setFormData(p => ({ ...p, responsavel: e.target.value }))} />
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
