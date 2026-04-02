import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Operation, OperationInsert } from "@/hooks/useOperations";

const operationTypes = [
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

interface OperationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: Operation | null;
  parentId?: string | null;
  areaId: string;
  cycleId: string;
  talhaoId?: string | null;
  areas?: { id: string; nome: string }[];
  cycles?: { id: string; cultura: string; area_id: string }[];
  onSubmit: (data: OperationInsert) => void;
  isSubmitting: boolean;
  title?: string;
}

export function OperationForm({
  open, onOpenChange, operation, parentId, areaId, cycleId, talhaoId,
  areas, cycles, onSubmit, isSubmitting, title,
}: OperationFormProps) {
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
    area_id: areaId,
    cycle_id: cycleId,
  });

  useEffect(() => {
    if (operation) {
      setFormData({
        nome: operation.nome,
        tipo: operation.tipo,
        descricao: operation.descricao || "",
        status: operation.status,
        prioridade: operation.prioridade || "media",
        data_inicio_prevista: operation.data_inicio_prevista || "",
        data_inicio_real: operation.data_inicio_real || "",
        data_fim_prevista: operation.data_fim_prevista || "",
        data_fim_real: operation.data_fim_real || "",
        responsavel: operation.responsavel || "",
        ordem: operation.ordem,
        observacoes: operation.observacoes || "",
        area_id: operation.area_id,
        cycle_id: operation.cycle_id,
      });
    } else {
      setFormData({
        nome: "", tipo: "outro", descricao: "", status: "nao_iniciada",
        prioridade: "media", data_inicio_prevista: "", data_inicio_real: "",
        data_fim_prevista: "", data_fim_real: "", responsavel: "", ordem: 0,
        observacoes: "", area_id: areaId, cycle_id: cycleId,
      });
    }
  }, [operation, open, areaId, cycleId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      parent_id: parentId || null,
      talhao_id: talhaoId || null,
      data_inicio_prevista: formData.data_inicio_prevista || null,
      data_inicio_real: formData.data_inicio_real || null,
      data_fim_prevista: formData.data_fim_prevista || null,
      data_fim_real: formData.data_fim_real || null,
      descricao: formData.descricao || null,
      observacoes: formData.observacoes || null,
      responsavel: formData.responsavel || null,
    });
  };

  const formTitle = title || (operation ? "Editar Operação" : parentId ? "Nova Suboperação" : "Nova Operação");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input value={formData.nome} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} required placeholder="Ex: Plantio mandioca 5,2 ha" />
            </div>

            {areas && areas.length > 0 && (
              <div>
                <Label>Área *</Label>
                <Select value={formData.area_id} onValueChange={v => setFormData(p => ({ ...p, area_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {cycles && cycles.length > 0 && (
              <div>
                <Label>Ciclo *</Label>
                <Select value={formData.cycle_id} onValueChange={v => setFormData(p => ({ ...p, cycle_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.cultura}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Tipo</Label>
              <Select value={formData.tipo} onValueChange={v => setFormData(p => ({ ...p, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {operationTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
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
