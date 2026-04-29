import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Operation, OperationInsert } from "@/hooks/useOperations";
import { OPERATION_CATEGORIES, STAGE_STATUS_OPTIONS_FORM, addDaysISO } from "@/lib/operacaoConfig";

const NONE = "__none__";

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
  /** Possíveis etapas para vínculo "depende de" (mesma operação principal) */
  siblingStages?: { id: string; nome: string }[];
  onSubmit: (data: OperationInsert) => void;
  isSubmitting: boolean;
  title?: string;
}

export function OperationForm({
  open, onOpenChange, operation, parentId, areaId, cycleId, talhaoId,
  areas, cycles, siblingStages, onSubmit, isSubmitting, title,
}: OperationFormProps) {
  const isInheritedContext = Boolean(parentId || operation?.parent_id);
  const isStage = isInheritedContext; // sub-operações = etapas

  const [formData, setFormData] = useState({
    nome: "",
    tipo: "outro",
    categoria: "" as string,
    descricao: "",
    status: "planejada",
    prioridade: "media",
    data_inicio_prevista: "",
    data_inicio_real: "",
    data_fim_prevista: "",
    data_fim_real: "",
    duracao_prevista_dias: "" as string | number,
    depends_on_id: "" as string,
    responsavel: "",
    ordem: 0,
    observacoes: "",
    area_id: areaId || "",
    cycle_id: cycleId || "",
  });

  useEffect(() => {
    if (operation) {
      setFormData({
        nome: operation.nome,
        tipo: operation.tipo,
        categoria: operation.categoria || "",
        descricao: operation.descricao || "",
        status: operation.status === "nao_iniciada" ? "planejada" : operation.status,
        prioridade: operation.prioridade || "media",
        data_inicio_prevista: operation.data_inicio_prevista || "",
        data_inicio_real: operation.data_inicio_real || "",
        data_fim_prevista: operation.data_fim_prevista || "",
        data_fim_real: operation.data_fim_real || "",
        duracao_prevista_dias: operation.duracao_prevista_dias ?? "",
        depends_on_id: operation.depends_on_id || "",
        responsavel: operation.responsavel || "",
        ordem: operation.ordem,
        observacoes: operation.observacoes || "",
        area_id: operation.area_id || "",
        cycle_id: operation.cycle_id || "",
      });
    } else {
      setFormData({
        nome: "", tipo: "outro", categoria: "", descricao: "", status: "planejada",
        prioridade: "media", data_inicio_prevista: "", data_inicio_real: "",
        data_fim_prevista: "", data_fim_real: "", duracao_prevista_dias: "",
        depends_on_id: "", responsavel: "", ordem: 0,
        observacoes: "", area_id: areaId || "", cycle_id: cycleId || "",
      });
    }
  }, [operation, open, areaId, cycleId]);

  const availableCycles = (cycles || []).filter((cycle) => cycle.area_id === formData.area_id);

  // Preview da data prevista de conclusão
  const previewFimPrevisto = useMemo(() => {
    const dur = Number(formData.duracao_prevista_dias);
    if (formData.data_inicio_prevista && dur > 0) {
      return addDaysISO(formData.data_inicio_prevista, dur - 1);
    }
    return formData.data_fim_prevista || "";
  }, [formData.data_inicio_prevista, formData.duracao_prevista_dias, formData.data_fim_prevista]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      nome: formData.nome,
      tipo: formData.tipo,
      categoria: formData.categoria || null,
      descricao: formData.descricao || null,
      status: formData.status,
      prioridade: formData.prioridade,
      ordem: formData.ordem,
      observacoes: formData.observacoes || null,
      responsavel: formData.responsavel || null,
      parent_id: parentId || null,
      talhao_id: talhaoId || null,
      area_id: formData.area_id || null,
      cycle_id: formData.cycle_id || null,
      data_inicio_prevista: formData.data_inicio_prevista || null,
      data_inicio_real: formData.data_inicio_real || null,
      data_fim_prevista: previewFimPrevisto || null,
      data_fim_real: formData.data_fim_real || null,
      duracao_prevista_dias: formData.duracao_prevista_dias ? Number(formData.duracao_prevista_dias) : null,
      depends_on_id: formData.depends_on_id || null,
    });
  };

  const formTitle = title || (operation
    ? (isStage ? "Editar Etapa" : "Editar Projeto")
    : (isStage ? "Nova Etapa" : "Novo Projeto"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formTitle}</DialogTitle>
          <DialogDescription>
            {isStage
              ? "Defina duração, responsável e dependência. Datas são calculadas automaticamente."
              : "Cadastre um projeto. Área/Ciclo são opcionais para projetos administrativos."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input value={formData.nome} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} required placeholder={isStage ? "Ex: Visitas técnicas" : "Ex: Projeto da Casa de Farinha"} />
            </div>

            {!isStage && (
              <div className="col-span-2">
                <Label>Categoria</Label>
                <Select value={formData.categoria || NONE} onValueChange={v => setFormData(p => ({ ...p, categoria: v === NONE ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— Sem categoria —</SelectItem>
                    {OPERATION_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isStage && areas && areas.length > 0 && (
              <div>
                <Label>Área (opcional)</Label>
                <Select value={formData.area_id || NONE} onValueChange={v => setFormData(p => ({ ...p, area_id: v === NONE ? "" : v, cycle_id: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Sem área" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— Sem área —</SelectItem>
                    {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isStage && availableCycles.length > 0 && (
              <div>
                <Label>Ciclo (opcional)</Label>
                <Select value={formData.cycle_id || NONE} onValueChange={v => setFormData(p => ({ ...p, cycle_id: v === NONE ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Sem ciclo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— Sem ciclo —</SelectItem>
                    {availableCycles.map(c => <SelectItem key={c.id} value={c.id}>{c.cultura}</SelectItem>)}
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
                  {STAGE_STATUS_OPTIONS_FORM.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
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

            <div className="col-span-2">
              <Label>Responsável</Label>
              <Input value={formData.responsavel} onChange={e => setFormData(p => ({ ...p, responsavel: e.target.value }))} placeholder="Ex: Patrick" />
            </div>

            {isStage && siblingStages && siblingStages.length > 0 && (
              <div className="col-span-2">
                <Label>Depende de (etapa antecessora)</Label>
                <Select value={formData.depends_on_id || NONE} onValueChange={v => setFormData(p => ({ ...p, depends_on_id: v === NONE ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Sem dependência" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— Sem dependência —</SelectItem>
                    {siblingStages.filter(s => s.id !== operation?.id).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">A data de início será calculada automaticamente.</p>
              </div>
            )}

            <div>
              <Label>Início Previsto</Label>
              <Input type="date" value={formData.data_inicio_prevista} onChange={e => setFormData(p => ({ ...p, data_inicio_prevista: e.target.value }))} />
            </div>
            <div>
              <Label>Duração prevista (dias)</Label>
              <Input type="number" min="1" value={formData.duracao_prevista_dias} onChange={e => setFormData(p => ({ ...p, duracao_prevista_dias: e.target.value }))} placeholder="Ex: 30" />
            </div>

            <div className="col-span-2 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
              📅 <strong>Fim previsto calculado:</strong>{" "}
              {previewFimPrevisto
                ? new Date(previewFimPrevisto).toLocaleDateString("pt-BR")
                : "preencha início e duração"}
            </div>

            <div>
              <Label>Início Real</Label>
              <Input type="date" value={formData.data_inicio_real} onChange={e => setFormData(p => ({ ...p, data_inicio_real: e.target.value }))} />
            </div>
            <div>
              <Label>Fim Real</Label>
              <Input type="date" value={formData.data_fim_real} onChange={e => setFormData(p => ({ ...p, data_fim_real: e.target.value }))} />
            </div>

            <div className="col-span-2">
              <Label>Descrição</Label>
              <Textarea value={formData.descricao} onChange={e => setFormData(p => ({ ...p, descricao: e.target.value }))} rows={2} />
            </div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea value={formData.observacoes} onChange={e => setFormData(p => ({ ...p, observacoes: e.target.value }))} rows={2} />
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
