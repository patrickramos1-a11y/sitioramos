import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { useResponsaveis } from "@/hooks/useResponsaveis";
import {
  useMapGeographicRecords,
  type GeographicRecordItem,
  type GeographicRecordType,
} from "@/hooks/useMapGeographicRecords";
import { exportEntryKml, exportSingleGeometry } from "@/lib/kmlExport";
import { formatArea, formatLength } from "@/lib/geoMath";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Focus, Link2, Loader2, MapPin, Pencil, Search, Trash2, Download, Route, Shapes } from "lucide-react";
import { toast } from "sonner";

const NONE = "__none__";

interface Props {
  onFocusItem: (itemId: string) => void;
  onBusyChange?: (busy: boolean) => void;
}

function recordTypeLabel(type: GeographicRecordType) {
  return type === "point" ? "Ponto" : type === "line" ? "Linha" : "Poligono";
}

function entryTitle(item: GeographicRecordItem) {
  return item.entry?.title || (item.entry?.entry_date ? `Diario ${item.entry.entry_date}` : "Registro do Diario");
}

export function GeographicRecordsPanel({ onFocusItem, onBusyChange }: Props) {
  const { areas = [] } = useAreas() as any;
  const { cycles = [] } = useCycles() as any;
  const { data: responsaveis = [] } = useResponsaveis(true);
  const records = useMapGeographicRecords();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<GeographicRecordType | "all">("all");
  const [linkFilter, setLinkFilter] = useState<"all" | "with" | "without">("all");
  const [editItem, setEditItem] = useState<GeographicRecordItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAreaId, setFormAreaId] = useState(NONE);
  const [formCycleId, setFormCycleId] = useState(NONE);
  const [formResponsavelId, setFormResponsavelId] = useState(NONE);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return records.items.filter((item) => {
      const q = search.trim().toLowerCase();
      const searchable = `${item.name} ${item.description || ""} ${entryTitle(item)}`.toLowerCase();
      const hasLink = Boolean(item.entry?.area_id || item.entry?.cycle_id || item.entry?.responsavel_id);
      return (
        (!q || searchable.includes(q)) &&
        (typeFilter === "all" || item.geometryType === typeFilter) &&
        (linkFilter === "all" || (linkFilter === "with" ? hasLink : !hasLink))
      );
    });
  }, [records.items, search, typeFilter, linkFilter]);

  const visibleCount = filtered.filter((item) => !records.hiddenIds.includes(item.id)).length;

  const startEdit = (item: GeographicRecordItem) => {
    setEditItem(item);
    setFormName(item.name);
    setFormDescription(item.description || "");
    setFormAreaId(item.entry?.area_id || NONE);
    setFormCycleId(item.entry?.cycle_id || NONE);
    setFormResponsavelId(item.entry?.responsavel_id || NONE);
  };

  const saveEdit = async () => {
    if (!editItem) return;
    await records.updateRecord.mutateAsync({
      item: editItem,
      name: formName.trim() || editItem.name,
      description: formDescription.trim() || null,
      areaId: formAreaId === NONE ? null : formAreaId,
      cycleId: formCycleId === NONE ? null : formCycleId,
      responsavelId: formResponsavelId === NONE ? null : formResponsavelId,
    });
    setEditItem(null);
  };

  const handleExport = async (item: GeographicRecordItem) => {
    if (!item.entryId) {
      toast.error("Item sem registro do Diario vinculado.");
      return;
    }
    setExportingId(item.id);
    try {
      if (item.source === "diary_geometry" && item.rawGeometry) {
        exportSingleGeometry(
          {
            id: item.entryId,
            title: item.entry?.title,
            description: item.entry?.description,
            entry_date: item.entry?.entry_date,
          },
          item.rawGeometry,
        );
      } else if (item.rawPoint) {
        await exportEntryKml(
          {
            id: item.entryId,
            title: item.entry?.title,
            description: item.entry?.description,
            entry_date: item.entry?.entry_date,
          },
          [item.rawPoint],
          [],
        );
      }
      toast.success("Exportacao KML iniciada.");
    } catch (error: any) {
      toast.error(error?.message || "Falha ao exportar item.");
    } finally {
      setExportingId(null);
    }
  };

  const busy = Boolean(editItem) || records.updateRecord.isPending || records.removeRecord.isPending;

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-brand-leaf/15 bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-brand-forest">Registros Geograficos</h3>
            <p className="text-xs text-muted-foreground">
              Pontos, linhas e poligonos criados no Diario de Campo, com suporte a vinculacao e controle de visibilidade.
            </p>
          </div>
          <div className="text-[11px] text-muted-foreground">{visibleCount} visivel</div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label className="text-[11px]">Buscar</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 pl-8" placeholder="Nome, descricao ou registro..." />
            </div>
          </div>
          <div>
            <Label className="text-[11px]">Tipo</Label>
            <Select value={typeFilter} onValueChange={(value: GeographicRecordType | "all") => setTypeFilter(value)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="point">Ponto</SelectItem>
                <SelectItem value="line">Linha</SelectItem>
                <SelectItem value="polygon">Poligono</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-[11px]">Vinculo</Label>
            <Select value={linkFilter} onValueChange={(value: "all" | "with" | "without") => setLinkFilter(value)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with">Com vinculo</SelectItem>
                <SelectItem value="without">Sem vinculo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {records.isLoading ? (
            <div className="rounded-xl border border-brand-leaf/15 bg-muted/10 p-4 text-sm text-muted-foreground">Carregando registros geograficos...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-brand-leaf/20 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
              Nenhum registro geografico encontrado com os filtros atuais.
            </div>
          ) : (
            filtered.map((item) => {
              const hidden = records.hiddenIds.includes(item.id);
              const Icon = item.geometryType === "point" ? MapPin : item.geometryType === "line" ? Route : Shapes;
              return (
                <article key={item.id} className="rounded-xl border border-brand-leaf/15 bg-card p-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-brand-leaf/10 p-2 text-brand-leaf">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium text-brand-forest">{item.name}</div>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{recordTypeLabel(item.geometryType)}</span>
                        <span className="rounded-full bg-brand-leaf/10 px-2 py-0.5 text-[10px] text-brand-leaf">
                          {item.source === "diary_geometry" ? "Diario de Campo" : "Ponto legado"}
                        </span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px]", hidden ? "bg-muted text-muted-foreground" : "bg-emerald-100 text-emerald-800")}>
                          {hidden ? "Oculto no mapa" : "Visivel no mapa"}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        Registro: {entryTitle(item)} · {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        {item.coordinatesSummary && <span>{item.coordinatesSummary}</span>}
                        {item.accuracy != null && <span>±{Math.round(item.accuracy)}m</span>}
                        {item.lengthM != null && <span>{formatLength(item.lengthM)}</span>}
                        {item.areaM2 != null && <span>{formatArea(item.areaM2)}</span>}
                        {item.entry?.area_id && <span>Area vinculada</span>}
                        {item.entry?.cycle_id && <span>Ciclo vinculado</span>}
                        {item.entry?.responsavel_id && <span>Responsavel vinculado</span>}
                      </div>
                      {item.description && <p className="mt-1 text-xs text-foreground/80 line-clamp-2">{item.description}</p>}
                    </div>
                    <div className="grid shrink-0 grid-cols-3 gap-1 sm:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => records.setVisibility.mutate({ id: item.id, visible: hidden })}
                        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted"
                        title={hidden ? "Mostrar no mapa" : "Ocultar do mapa"}
                      >
                        {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onFocusItem(item.id)}
                        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted"
                        title="Centralizar no mapa"
                      >
                        <Focus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport(item)}
                        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted"
                        title="Exportar KML"
                      >
                        {exportingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      </button>
                      <a
                        href="/diario"
                        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted"
                        title="Abrir Diario"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Excluir ${item.name}?`)) records.removeRecord.mutate(item);
                        }}
                        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar registro geografico</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-[11px]">Nome</Label>
              <Input value={formName} onChange={(event) => setFormName(event.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-[11px]">Descricao</Label>
              <Textarea value={formDescription} onChange={(event) => setFormDescription(event.target.value)} rows={3} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label className="text-[11px]">Area</Label>
                <Select value={formAreaId} onValueChange={setFormAreaId}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem vinculo</SelectItem>
                    {areas.map((area: any) => <SelectItem key={area.id} value={area.id}>{area.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px]">Ciclo</Label>
                <Select value={formCycleId} onValueChange={setFormCycleId}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem vinculo</SelectItem>
                    {cycles.map((cycle: any) => <SelectItem key={cycle.id} value={cycle.id}>{cycle.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px]">Responsavel</Label>
                <Select value={formResponsavelId} onValueChange={setFormResponsavelId}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem vinculo</SelectItem>
                    {responsaveis.map((responsavel) => (
                      <SelectItem key={responsavel.id} value={responsavel.id}>
                        {responsavel.apelido || responsavel.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={saveEdit} className="bg-brand-forest hover:bg-brand-forest/90" disabled={records.updateRecord.isPending}>
              {records.updateRecord.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
