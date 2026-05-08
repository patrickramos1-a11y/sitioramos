import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task, TaskInsert } from "@/hooks/useTasks";
import { ResponsavelSelect } from "@/components/responsaveis/ResponsavelSelect";
import { CollapsibleField } from "@/components/ui/collapsible-field";
import { CalendarDays, CheckCircle2, CheckSquare, Folder, FolderTree, RotateCcw, Flag } from "lucide-react";
import { addDaysISO } from "@/lib/operacaoConfig";

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
const todayISO = () => new Date().toISOString().split("T")[0];

const PRAZO_PRESETS = [
  { label: "Hoje", days: 0 },
  { label: "Amanhã", days: 1 },
  { label: "+3d", days: 3 },
  { label: "+7d", days: 7 },
  { label: "+15d", days: 15 },
  { label: "+30d", days: 30 },
];

const PRIORIDADES = [
  { value: "baixa", label: "Baixa", color: "text-muted-foreground" },
  { value: "media", label: "Média", color: "text-foreground" },
  { value: "alta", label: "Alta", color: "text-amber-600" },
  { value: "critica", label: "Crítica", color: "text-destructive" },
];

export function SimpleTaskForm({
  open, onOpenChange, task, defaultStageId, parentOptions, onSubmit, isSubmitting,
}: SimpleTaskFormProps) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [data, setData] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  const [stageId, setStageId] = useState<string>("");
  const [prioridade, setPrioridade] = useState<string>("media");

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitulo(task.titulo);
      setDescricao(task.descricao || "");
      setResponsavelId((task as any).responsavel_id || "");
      setData(task.data_prazo || "");
      setObservacoes(task.observacoes || "");
      setStageId(task.stage_id || "");
      setPrioridade((task as any).prioridade || "media");
    } else {
      setTitulo("");
      setDescricao("");
      setResponsavelId("");
      setData("");
      setObservacoes("");
      setStageId(defaultStageId || "");
      setPrioridade("media");
    }
  }, [task, open, defaultStageId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !stageId) return;
    onSubmit({
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      stage_id: stageId,
      responsavel_id: responsavelId || null,
      data_prazo: data || null,
      observacoes: observacoes.trim() || null,
      tipo: task?.tipo || "operacional",
      status: task?.status || "pendente",
      prioridade,
    } as any);
  };

  const showParentPicker = !task && parentOptions && parentOptions.length > 0;

  const setPrazoPreset = (days: number) => setData(addDaysISO(todayISO(), days));

  // Trigger label hierárquico no select de pai
  const selectedLabel = useMemo(() => {
    if (!stageId || !parentOptions) return null;
    for (const p of parentOptions) {
      if (p.id === stageId) return { tipo: "projeto", projeto: p.nome, sub: null as string | null };
      const sub = (p.children || []).find(c => c.id === stageId);
      if (sub) return { tipo: "subprojeto", projeto: p.nome, sub: sub.nome };
    }
    return null;
  }, [stageId, parentOptions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            Tarefa
          </DialogTitle>
          <DialogDescription>
            Item operacional vinculado a um projeto ou subprojeto. Tudo opcional além do título.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pai */}
          {showParentPicker && (
            <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
              <Label className="flex items-center gap-1 text-xs font-semibold">
                <FolderTree className="h-3.5 w-3.5" /> Vincular em *
              </Label>
              <Select value={stageId || NONE} onValueChange={(v) => setStageId(v === NONE ? "" : v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Escolha o projeto ou subprojeto">
                    {selectedLabel ? (
                      <span className="flex items-center gap-1.5 text-left">
                        <Folder className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">
                          {selectedLabel.projeto}
                          {selectedLabel.sub && (
                            <span className="text-muted-foreground"> › {selectedLabel.sub}</span>
                          )}
                        </span>
                      </span>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value={NONE}>— Selecione —</SelectItem>
                  {parentOptions!.map(p => [
                    <SelectItem key={p.id} value={p.id} className="font-medium">
                      📁 {p.nome}
                    </SelectItem>,
                    ...(p.children || []).map(c => (
                      <SelectItem key={c.id} value={c.id} className="pl-8 text-xs">
                        ↳ {c.nome}
                      </SelectItem>
                    )),
                  ])}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Título e descrição */}
          <div className="space-y-3">
            <div>
              <Label>Título *</Label>
              <Input
                autoFocus
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex.: Comprar herbicida"
                required
              />
            </div>
            <CollapsibleField label="Descrição" value={descricao}>
              <Textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                rows={2}
                placeholder="Detalhe a tarefa, se necessário"
              />
            </CollapsibleField>
          </div>

          {/* Responsável + Prioridade */}
          <div className="grid grid-cols-2 gap-3">
            <ResponsavelSelect
              label="Responsável"
              value={responsavelId}
              onChange={(id) => setResponsavelId(id || "")}
            />
            <div>
              <Label className="flex items-center gap-1"><Flag className="h-3.5 w-3.5" /> Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className={p.color}>{p.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prazo com chips */}
          <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1 text-xs font-semibold">
                <CalendarDays className="h-3.5 w-3.5" /> Prazo
              </Label>
              {data && (
                <Button type="button" size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => setData("")}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Limpar
                </Button>
              )}
            </div>
            <Input type="date" value={data} onChange={e => setData(e.target.value)} className="bg-background" />
            <div className="flex flex-wrap gap-1.5">
              {PRAZO_PRESETS.map(p => (
                <Button
                  key={p.label} type="button" size="sm" variant="outline"
                  className="h-7 text-[11px] px-2"
                  onClick={() => setPrazoPreset(p.days)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <CollapsibleField label="Observações" value={observacoes}>
            <Textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Notas, links de anexos, etc."
              rows={2}
            />
          </CollapsibleField>

          <div className="flex flex-wrap justify-between gap-2">
            {task && task.status !== "concluida" && (
              <Button
                type="button"
                variant="outline"
                className="text-success border-success/40 hover:bg-success/10"
                onClick={() => onSubmit({
                  id: task.id,
                  titulo: titulo.trim() || task.titulo,
                  status: "concluida",
                  data_conclusao: new Date().toISOString().split("T")[0],
                } as any)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting || !titulo.trim() || !stageId}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
