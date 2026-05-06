import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Operation, OperationInsert } from "@/hooks/useOperations";
import { OPERATION_CATEGORIES, STAGE_STATUS_OPTIONS_FORM, addDaysISO, getCategoryColor } from "@/lib/operacaoConfig";
import { CalendarDays, Link2, RotateCcw } from "lucide-react";
import { ResponsavelSelect } from "@/components/responsaveis/ResponsavelSelect";

const NONE = "__none__";
const todayISO = () => new Date().toISOString().split("T")[0];

const operationTypes = [
  { value: "preparo", label: "Preparo" }, { value: "plantio", label: "Plantio" },
  { value: "leiras", label: "Leiras" }, { value: "herbicida", label: "Herbicida" },
  { value: "capina", label: "Capina" }, { value: "adubacao", label: "Adubação" },
  { value: "colheita", label: "Colheita" }, { value: "beneficiamento", label: "Beneficiamento" },
  { value: "documentacao", label: "Documentação" }, { value: "manutencao", label: "Manutenção" },
  { value: "outro", label: "Outro" },
];

const priorityOptions = [
  { value: "baixa", label: "Baixa" }, { value: "media", label: "Média" },
  { value: "alta", label: "Alta" }, { value: "critica", label: "Crítica" },
];

const NIVEL_TIPOS = [
  { value: "projeto", label: "Projeto", desc: "Iniciativa principal" },
  { value: "subprojeto", label: "Subprojeto", desc: "Bloco dentro do projeto" },
];

const DURATION_PRESETS = [
  { label: "+7d", days: 7 },
  { label: "+15d", days: 15 },
  { label: "+30d", days: 30 },
  { label: "+60d", days: 60 },
  { label: "+90d", days: 90 },
  { label: "+1 sem", days: 7 },
  { label: "+1 mês", days: 30 },
];

interface OperationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: Operation | null;
  parentId?: string | null;
  parentNivelTipo?: string | null;
  defaultNivelTipo?: string;
  areaId: string;
  cycleId: string;
  talhaoId?: string | null;
  areas?: { id: string; nome: string }[];
  cycles?: { id: string; cultura: string; area_id: string }[];
  siblingStages?: { id: string; nome: string }[];
  /** Lista de projetos para vincular */
  allProjects?: { id: string; nome: string }[];
  onSubmit: (data: OperationInsert & { nivel_tipo?: string; linked_project_id?: string | null }) => void;
  isSubmitting: boolean;
  title?: string;
}

export function OperationForm({
  open, onOpenChange, operation, parentId, parentNivelTipo, defaultNivelTipo,
  areaId, cycleId, talhaoId, areas, cycles, siblingStages, allProjects,
  onSubmit, isSubmitting, title,
}: OperationFormProps) {
  const isChild = Boolean(parentId || operation?.parent_id);

  const [formData, setFormData] = useState({
    nome: "",
    nivel_tipo: defaultNivelTipo || (isChild ? "subprojeto" : "projeto"),
    tipo: "outro",
    categoria: "" as string,
    descricao: "",
    status: "planejada",
    prioridade: "media",
    data_inicio_prevista: todayISO(),
    data_inicio_real: "",
    data_fim_prevista: "",
    data_fim_real: "",
    duracao_prevista_dias: "" as string | number,
    depends_on_id: "" as string,
    linked_project_id: "" as string,
    responsavel: "",
    responsavel_id: "" as string,
    ordem: 0,
    observacoes: "",
    area_id: areaId || "",
    cycle_id: cycleId || "",
  });

  useEffect(() => {
    if (!open) return;
    if (operation) {
      setFormData({
        nome: operation.nome,
        nivel_tipo: (operation as any).nivel_tipo || (operation.parent_id ? "subprojeto" : "projeto"),
        tipo: operation.tipo,
        categoria: operation.categoria || "",
        descricao: operation.descricao || "",
        status: operation.status === "nao_iniciada" ? "planejada" : operation.status,
        prioridade: operation.prioridade || "media",
        data_inicio_prevista: operation.data_inicio_prevista || todayISO(),
        data_inicio_real: operation.data_inicio_real || "",
        data_fim_prevista: operation.data_fim_prevista || "",
        data_fim_real: operation.data_fim_real || "",
        duracao_prevista_dias: operation.duracao_prevista_dias ?? "",
        depends_on_id: operation.depends_on_id || "",
        linked_project_id: (operation as any).linked_project_id || "",
        responsavel: operation.responsavel || "",
        responsavel_id: (operation as any).responsavel_id || "",
        ordem: operation.ordem,
        observacoes: operation.observacoes || "",
        area_id: operation.area_id || "",
        cycle_id: operation.cycle_id || "",
      });
    } else {
      setFormData({
        nome: "", nivel_tipo: defaultNivelTipo || (isChild ? "subprojeto" : "projeto"),
        tipo: "outro", categoria: "", descricao: "", status: "planejada",
        prioridade: "media", data_inicio_prevista: todayISO(), data_inicio_real: "",
        data_fim_prevista: "", data_fim_real: "", duracao_prevista_dias: "",
        depends_on_id: "", linked_project_id: "", responsavel: "", responsavel_id: "", ordem: 0,
        observacoes: "", area_id: areaId || "", cycle_id: cycleId || "",
      });
    }
  }, [operation, open, areaId, cycleId, defaultNivelTipo, isChild]);

  const availableCycles = (cycles || []).filter((c) => c.area_id === formData.area_id);

  // ===== Sincronização bidirecional início/duração/fim =====
  const recomputeFim = (inicio: string, dias: number | string) => {
    const d = Number(dias);
    if (inicio && d > 0) return addDaysISO(inicio, d - 1);
    return "";
  };

  const setInicio = (v: string) => {
    setFormData(p => {
      const novo = { ...p, data_inicio_prevista: v };
      const d = Number(p.duracao_prevista_dias);
      if (v && d > 0) novo.data_fim_prevista = addDaysISO(v, d - 1);
      return novo;
    });
  };

  const setDuracao = (dias: number | string) => {
    setFormData(p => {
      const d = Number(dias);
      const novo = { ...p, duracao_prevista_dias: dias };
      if (p.data_inicio_prevista && d > 0) {
        novo.data_fim_prevista = addDaysISO(p.data_inicio_prevista, d - 1);
      }
      return novo;
    });
  };

  const setFim = (v: string) => {
    setFormData(p => {
      const novo = { ...p, data_fim_prevista: v };
      if (v && p.data_inicio_prevista) {
        const ms = new Date(v).getTime() - new Date(p.data_inicio_prevista).getTime();
        const dias = Math.max(1, Math.round(ms / 86400000) + 1);
        novo.duracao_prevista_dias = dias;
      }
      return novo;
    });
  };

  const addPreset = (days: number) => {
    setFormData(p => {
      const atual = Number(p.duracao_prevista_dias) || 0;
      const novaDur = atual + days;
      const novo: any = { ...p, duracao_prevista_dias: novaDur };
      const inicio = p.data_inicio_prevista || todayISO();
      novo.data_inicio_prevista = inicio;
      novo.data_fim_prevista = addDaysISO(inicio, novaDur - 1);
      return novo;
    });
  };

  const resetDuracao = () => {
    setFormData(p => ({ ...p, duracao_prevista_dias: "", data_fim_prevista: "" }));
  };

  const previewFimPrevisto = useMemo(
    () => formData.data_fim_prevista || recomputeFim(formData.data_inicio_prevista, formData.duracao_prevista_dias),
    [formData.data_fim_prevista, formData.data_inicio_prevista, formData.duracao_prevista_dias]
  );

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
      responsavel_id: formData.responsavel_id || null,
      parent_id: parentId || operation?.parent_id || null,
      talhao_id: talhaoId || null,
      area_id: formData.area_id || null,
      cycle_id: formData.cycle_id || null,
      data_inicio_prevista: formData.data_inicio_prevista || null,
      data_inicio_real: formData.data_inicio_real || null,
      data_fim_prevista: previewFimPrevisto || null,
      data_fim_real: formData.data_fim_real || null,
      duracao_prevista_dias: formData.duracao_prevista_dias ? Number(formData.duracao_prevista_dias) : null,
      depends_on_id: formData.depends_on_id || null,
      nivel_tipo: formData.nivel_tipo,
      linked_project_id: formData.linked_project_id || null,
    } as any);
  };

  const formTitle = title || (operation
    ? `Editar ${formData.nivel_tipo === "projeto" ? "Projeto" : "Subprojeto"}`
    : `Novo ${formData.nivel_tipo === "projeto" ? "Projeto" : "Subprojeto"}`);

  const projectsForLink = (allProjects || []).filter(p => p.id !== operation?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: getCategoryColor(formData.categoria) }}
            />
            {formTitle}
          </DialogTitle>
          <DialogDescription>
            {isChild
              ? "Define um item dentro de um projeto. Datas e duração ficam sincronizadas."
              : "Cadastre um projeto principal. A duração pode ser somada por chips."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))}
                required placeholder="Ex: Plantio Mandioca 5,2 ha"
              />
            </div>

            <div className="col-span-2">
              <Label>Nível</Label>
              <Select value={formData.nivel_tipo} onValueChange={v => setFormData(p => ({ ...p, nivel_tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NIVEL_TIPOS.map(n => (
                    <SelectItem key={n.value} value={n.value}>
                      <div className="flex flex-col">
                        <span>{n.label}</span>
                        <span className="text-[10px] text-muted-foreground">{n.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            {!isChild && areas && areas.length > 0 && (
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

            {!isChild && availableCycles.length > 0 && (
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

            {/* Tipo, Status, Prioridade e Ordem ocultos — usam valores padrão */}

            <div className="col-span-2">
              <ResponsavelSelect
                label="Responsável"
                value={formData.responsavel_id}
                onChange={(id) => setFormData(p => ({ ...p, responsavel_id: id || "" }))}
              />
            </div>

            {/* Vínculo com outro projeto */}
            {projectsForLink.length > 0 && (
              <div className="col-span-2">
                <Label className="flex items-center gap-1"><Link2 className="h-3.5 w-3.5" /> Vincular a outro projeto</Label>
                <Select value={formData.linked_project_id || NONE} onValueChange={v => setFormData(p => ({ ...p, linked_project_id: v === NONE ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Sem vínculo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— Sem vínculo —</SelectItem>
                    {projectsForLink.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isChild && siblingStages && siblingStages.length > 0 && (
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
              </div>
            )}

            {/* ===== Bloco de DATAS sincronizadas ===== */}
            <div className="col-span-2 rounded-lg border bg-muted/20 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> Cronograma previsto
                </span>
                <Button type="button" size="sm" variant="ghost" className="h-6 text-[11px]" onClick={resetDuracao}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Limpar
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[11px]">Início</Label>
                  <Input type="date" value={formData.data_inicio_prevista} onChange={e => setInicio(e.target.value)} />
                </div>
                <div>
                  <Label className="text-[11px]">Duração (dias)</Label>
                  <Input
                    type="number" min="1"
                    value={formData.duracao_prevista_dias}
                    onChange={e => setDuracao(e.target.value)}
                    placeholder="—"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Fim previsto</Label>
                  <Input type="date" value={previewFimPrevisto} onChange={e => setFim(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {DURATION_PRESETS.map(p => (
                  <Button
                    key={p.label} type="button" size="sm" variant="outline"
                    className="h-7 text-[11px] px-2"
                    onClick={() => addPreset(p.days)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground">
                Clique nos chips para somar à duração. Tudo se sincroniza automaticamente.
              </p>
            </div>

            {/* Início Real e Fim Real ocultos — preenchidos via ações no Gantt */}

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
