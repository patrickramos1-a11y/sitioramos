import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap } from "lucide-react";
import { OperationInsert } from "@/hooks/useOperations";
import { addDaysISO } from "@/lib/operacaoConfig";

interface QuickOperationSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  areas: { id: string; nome: string }[];
  cycles: { id: string; cultura: string; area_id: string }[];
  defaultAreaId?: string;
  knownResponsaveis?: string[];
  onSubmit: (data: OperationInsert) => void;
  isSubmitting?: boolean;
}

const DURATION_PRESETS = [7, 15, 30, 60, 90];

export function QuickOperationSheet({
  open, onOpenChange, areas, cycles, defaultAreaId, knownResponsaveis = [], onSubmit, isSubmitting,
}: QuickOperationSheetProps) {
  const [nome, setNome] = useState("");
  const [duracao, setDuracao] = useState<number>(30);
  const [duracaoLivre, setDuracaoLivre] = useState<string>("");
  const [responsavel, setResponsavel] = useState("");
  const [areaId, setAreaId] = useState<string>(defaultAreaId || "__none__");

  useEffect(() => {
    if (open) {
      setNome("");
      setDuracao(30);
      setDuracaoLivre("");
      setResponsavel("");
      setAreaId(defaultAreaId || "__none__");
    }
  }, [open, defaultAreaId]);

  const areaCycles = useMemo(
    () => cycles.filter(c => areaId !== "__none__" && c.area_id === areaId),
    [cycles, areaId]
  );

  const finalDuration = duracaoLivre ? Math.max(1, parseInt(duracaoLivre, 10) || 0) : duracao;

  const handleSubmit = () => {
    if (!nome.trim() || !finalDuration) return;
    const today = new Date().toISOString().split("T")[0];
    const fim = addDaysISO(today, Math.max(0, finalDuration - 1));
    const cycleId = areaCycles[0]?.id || null;
    const payload: OperationInsert = {
      nome: nome.trim(),
      tipo: "outro",
      status: "em_andamento",
      prioridade: "media",
      data_inicio_prevista: today,
      data_inicio_real: today,
      data_fim_prevista: fim,
      duracao_prevista_dias: finalDuration,
      responsavel: responsavel.trim() || null,
      area_id: areaId !== "__none__" ? areaId : null,
      cycle_id: cycleId,
      parent_id: null,
    };
    onSubmit(payload);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[92vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Criação rápida
          </SheetTitle>
          <SheetDescription>Cadastre uma operação em segundos. A barra aparece direto na timeline a partir de hoje.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-4">
          <div className="space-y-1.5">
            <Label htmlFor="quick-nome">Nome da operação *</Label>
            <Input
              id="quick-nome"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex.: Capina área 5,23 ha"
              autoFocus
              className="text-base h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Duração</Label>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map(d => (
                <Button
                  key={d}
                  type="button"
                  variant={!duracaoLivre && duracao === d ? "default" : "outline"}
                  size="sm"
                  className="h-10 px-4"
                  onClick={() => { setDuracao(d); setDuracaoLivre(""); }}
                >
                  {d} dias
                </Button>
              ))}
            </div>
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="Outra duração (dias)"
              value={duracaoLivre}
              onChange={e => setDuracaoLivre(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quick-resp">Responsável</Label>
            <Input
              id="quick-resp"
              list="quick-resp-list"
              value={responsavel}
              onChange={e => setResponsavel(e.target.value)}
              placeholder="Quem vai executar?"
              className="h-11"
            />
            <datalist id="quick-resp-list">
              {knownResponsaveis.map(r => <option key={r} value={r} />)}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label>Área (opcional)</Label>
            <Select value={areaId} onValueChange={setAreaId}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Sem área" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sem área (projeto geral)</SelectItem>
                {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Início: <strong>hoje</strong> · Previsão de término em <strong>{finalDuration}</strong> dias
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 h-11" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button
              className="flex-1 h-11"
              onClick={handleSubmit}
              disabled={!nome.trim() || !finalDuration || isSubmitting}
            >
              {isSubmitting ? "Criando..." : "Criar agora"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
