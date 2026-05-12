import { useMemo } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cashCategoryConfig, getSubcategoriaConfig, type CashCategory } from "@/lib/categoryConfig";
import type { CashAnalyticsFilters } from "@/hooks/useCashAnalytics";

interface Area { id: string; nome: string }
interface Cycle { id: string; cultura: string; area_id: string | null }

interface Props {
  value: CashAnalyticsFilters;
  onChange: (f: CashAnalyticsFilters) => void;
  areas: Area[];
  cycles: Cycle[];
  compact?: boolean;
}

const NONE = "__none__";

export function GlobalFiltersBar({ value, onChange, areas, cycles, compact }: Props) {
  const subcategoriaOptions = useMemo(() => {
    if (!value.categoria) return [];
    const dict = getSubcategoriaConfig(value.categoria);
    return Object.entries(dict).map(([k, v]) => ({ value: k, label: v.label }));
  }, [value.categoria]);

  const availableCycles = value.areaId
    ? cycles.filter((c) => c.area_id === value.areaId)
    : cycles;

  const hasAny =
    !!value.startDate ||
    !!value.endDate ||
    !!value.areaId ||
    !!value.cycleId ||
    !!value.categoria ||
    !!value.subcategoria ||
    !!value.tipo ||
    !!value.withoutArea ||
    !!value.withoutCycle;

  const set = (patch: Partial<CashAnalyticsFilters>) => onChange({ ...value, ...patch });

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4 text-muted-foreground" />
          Filtros
          {hasAny && <Badge variant="secondary" className="text-[10px] h-5">ativos</Badge>}
        </div>
        {hasAny && (
          <Button variant="ghost" size="sm" className="h-7" onClick={() => onChange({})}>
            <X className="h-3.5 w-3.5 mr-1" /> Limpar
          </Button>
        )}
      </div>

      <div className={`grid gap-2 ${compact ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"}`}>
        <div>
          <Label className="text-[11px] text-muted-foreground">De</Label>
          <Input
            type="date"
            className="h-9 text-sm"
            value={value.startDate || ""}
            onChange={(e) => set({ startDate: e.target.value || undefined })}
          />
        </div>
        <div>
          <Label className="text-[11px] text-muted-foreground">Até</Label>
          <Input
            type="date"
            className="h-9 text-sm"
            value={value.endDate || ""}
            onChange={(e) => set({ endDate: e.target.value || undefined })}
          />
        </div>
        <div>
          <Label className="text-[11px] text-muted-foreground">Categoria</Label>
          <Select
            value={value.categoria || NONE}
            onValueChange={(v) => set({ categoria: v === NONE ? undefined : (v as CashCategory), subcategoria: undefined })}
          >
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Todas</SelectItem>
              {Object.entries(cashCategoryConfig).map(([k, c]) => (
                <SelectItem key={k} value={k}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[11px] text-muted-foreground">Subcategoria</Label>
          <Select
            value={value.subcategoria || NONE}
            onValueChange={(v) => set({ subcategoria: v === NONE ? undefined : v })}
            disabled={!value.categoria}
          >
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={value.categoria ? "Todas" : "Selecione categoria"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Todas</SelectItem>
              {subcategoriaOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[11px] text-muted-foreground">Área</Label>
          <Select
            value={value.areaId || NONE}
            onValueChange={(v) => set({ areaId: v === NONE ? undefined : v, cycleId: undefined })}
          >
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Todas</SelectItem>
              {areas.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[11px] text-muted-foreground">Ciclo</Label>
          <Select
            value={value.cycleId || NONE}
            onValueChange={(v) => set({ cycleId: v === NONE ? undefined : v })}
          >
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Todos</SelectItem>
              {availableCycles.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.cultura}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={value.tipo === "entrada" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => set({ tipo: value.tipo === "entrada" ? undefined : "entrada" })}
        >
          Entradas
        </Button>
        <Button
          variant={value.tipo === "saida" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => set({ tipo: value.tipo === "saida" ? undefined : "saida" })}
        >
          Saídas
        </Button>
        <Button
          variant={value.withoutCycle ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => set({ withoutCycle: !value.withoutCycle })}
        >
          Sem ciclo
        </Button>
        <Button
          variant={value.withoutArea ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => set({ withoutArea: !value.withoutArea })}
        >
          Sem área
        </Button>
      </div>
    </div>
  );
}
