import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, MapPin, AlertTriangle } from "lucide-react";
import { Area } from "@/hooks/useAreas";
import {
  AllocationType,
  haParaTarefas,
  tarefasParaHa,
  allocOccupiedHa,
  formatTarefas,
} from "@/lib/territory/tarefas";

export interface AllocationDraft {
  id?: string;
  area_id: string;
  allocation_type: AllocationType;
  tarefas_ocupadas: number;
  percentual: number | null;
  hectares_ocupados: number;
  observacao: string | null;
}

interface Props {
  areas: Area[];
  value: AllocationDraft[];
  onChange: (next: AllocationDraft[]) => void;
}

const TYPE_OPTIONS: { value: AllocationType; label: string }[] = [
  { value: "full_area", label: "Área inteira" },
  { value: "tasks", label: "Quantidade de tarefas" },
  { value: "percentage", label: "Percentual da área" },
  { value: "manual_area", label: "Área manual (ha)" },
];

export function CycleAllocationsManager({ areas, value, onChange }: Props) {
  const totals = useMemo(() => {
    let ha = 0;
    let tarefas = 0;
    for (const a of value) {
      const area = areas.find((x: any) => x.id === a.area_id);
      const areaHa = Number((area as any)?.tamanho_hectares || 0);
      const occHa = allocOccupiedHa(a, areaHa);
      ha += occHa;
      tarefas += haParaTarefas(occHa);
    }
    return { ha, tarefas };
  }, [value, areas]);

  const update = (idx: number, patch: Partial<AllocationDraft>) => {
    const next = [...value];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  const add = () =>
    onChange([
      ...value,
      {
        area_id: "",
        allocation_type: "full_area",
        tarefas_ocupadas: 0,
        percentual: null,
        hectares_ocupados: 0,
        observacao: null,
      },
    ]);

  return (
    <div className="space-y-3 rounded-md border p-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Áreas e tarefas vinculadas
          </div>
          <p className="text-xs text-muted-foreground">
            Vincule este ciclo a uma ou mais áreas. 1 tarefa = 2.500 m² = 0,25 ha.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="h-3 w-3 mr-1" /> Adicionar vínculo
        </Button>
      </div>

      {value.length === 0 && (
        <div className="text-xs text-muted-foreground italic py-3 text-center">
          Nenhum vínculo territorial. Clique em "Adicionar vínculo" para começar.
        </div>
      )}

      <div className="space-y-2">
        {value.map((alloc, idx) => {
          const area: any = areas.find((a) => a.id === alloc.area_id);
          const areaHa = Number(area?.tamanho_hectares || 0);
          const areaTarefas = haParaTarefas(areaHa);
          const occupiedHa = allocOccupiedHa(alloc, areaHa);
          const occupiedTarefas = haParaTarefas(occupiedHa);
          const overflow = area && occupiedHa > areaHa + 0.001;

          return (
            <div key={idx} className="rounded-md border bg-background p-3 space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Área *</Label>
                  <Select
                    value={alloc.area_id || undefined}
                    onValueChange={(v) => update(idx, { area_id: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione a área" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.nome} — {Number(a.tamanho_hectares).toFixed(2)} ha
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Tipo de ocupação *</Label>
                  <Select
                    value={alloc.allocation_type}
                    onValueChange={(v) =>
                      update(idx, { allocation_type: v as AllocationType })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {alloc.allocation_type === "tasks" && (
                <div>
                  <Label className="text-xs">
                    Quantidade de tarefas{" "}
                    {area && (
                      <span className="text-muted-foreground">
                        (máx {formatTarefas(areaTarefas)})
                      </span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    className="h-9"
                    value={alloc.tarefas_ocupadas || ""}
                    onChange={(e) =>
                      update(idx, { tarefas_ocupadas: Number(e.target.value) })
                    }
                  />
                </div>
              )}

              {alloc.allocation_type === "percentage" && (
                <div>
                  <Label className="text-xs">Percentual (%) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="h-9"
                    value={alloc.percentual ?? ""}
                    onChange={(e) =>
                      update(idx, { percentual: Number(e.target.value) })
                    }
                  />
                </div>
              )}

              {alloc.allocation_type === "manual_area" && (
                <div>
                  <Label className="text-xs">Hectares ocupados *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-9"
                    value={alloc.hectares_ocupados || ""}
                    onChange={(e) =>
                      update(idx, { hectares_ocupados: Number(e.target.value) })
                    }
                  />
                </div>
              )}

              <div>
                <Label className="text-xs">Observação</Label>
                <Input
                  className="h-9"
                  placeholder="Opcional"
                  value={alloc.observacao || ""}
                  onChange={(e) => update(idx, { observacao: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="text-muted-foreground">
                  Ocupação:{" "}
                  <span className="font-medium text-foreground">
                    {occupiedHa.toFixed(2)} ha • {formatTarefas(occupiedTarefas)} tarefas
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive h-7"
                  onClick={() => remove(idx)}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Remover
                </Button>
              </div>

              {overflow && (
                <div className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Ocupação maior que a área
                  total ({areaHa.toFixed(2)} ha).
                </div>
              )}
            </div>
          );
        })}
      </div>

      {value.length > 0 && (
        <div className="rounded-md bg-primary/5 border border-primary/20 p-2 text-xs flex justify-between">
          <span className="text-muted-foreground">Total ocupado pelo ciclo</span>
          <span className="font-semibold text-primary">
            {totals.ha.toFixed(2)} ha • {formatTarefas(totals.tarefas)} tarefas
          </span>
        </div>
      )}
    </div>
  );
}
