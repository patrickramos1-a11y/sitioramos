import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { useResponsaveis } from "@/hooks/useResponsaveis";
import { useMapGeographicRecords, type GeographicRecordItem, type GeographicRecordType } from "@/hooks/useMapGeographicRecords";
import { exportDiaryRecordsKml, exportDiaryRecordsKmz, exportEntryKml, exportSingleGeometry, type DiaryExportRecord } from "@/lib/kmlExport";
import { formatArea, formatLength } from "@/lib/geoMath";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Focus,
  Link2,
  Loader2,
  MapPin,
  Pencil,
  Route,
  Search,
  Shapes,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

const NONE = "__none__";
const KEEP = "__keep__";

interface Props {
  onFocusItem: (itemId: string) => void;
  onBusyChange?: (busy: boolean) => void;
}

type GroupedRecord = {
  groupId: string;
  entryId: string | null;
  title: string;
  dateLabel: string;
  areaId: string | null;
  cycleId: string | null;
  responsavelId: string | null;
  entryDescription: string | null;
  items: GeographicRecordItem[];
  mediaCount: number;
};

function recordTypeLabel(type: GeographicRecordType) {
  return type === "point" ? "Ponto" : type === "line" ? "Linha" : "Poligono";
}

function itemTypeIcon(type: GeographicRecordType) {
  if (type === "point") return MapPin;
  if (type === "line") return Route;
  return Shapes;
}

function buildDiaryExportRecord(group: GroupedRecord): DiaryExportRecord | null {
  const entry = group.items[0]?.entry;
  if (!entry || !group.entryId) return null;
  return {
    entry: {
      id: entry.id,
      title: entry.title,
      description: entry.description,
      entry_date: entry.entry_date,
      area_id: entry.area_id,
      cycle_id: entry.cycle_id,
      responsavel_id: entry.responsavel_id,
      status: entry.status,
    },
    points: group.items.flatMap((item) => (item.rawPoint ? [item.rawPoint] : [])),
    geometries: group.items.flatMap((item) => (item.rawGeometry ? [item.rawGeometry] : [])),
  };
}

export function GeographicRecordsPanel({ onFocusItem, onBusyChange }: Props) {
  const { areas = [] } = useAreas() as any;
  const { cycles = [] } = useCycles() as any;
  const { data: responsaveis = [] } = useResponsaveis(true);
  const records = useMapGeographicRecords();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<GeographicRecordType | "all">("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [responsavelFilter, setResponsavelFilter] = useState("all");
  const [linkFilter, setLinkFilter] = useState<"all" | "with" | "without">("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editItem, setEditItem] = useState<GeographicRecordItem | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<GroupedRecord | null>(null);
  const [batchLinkOpen, setBatchLinkOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAreaId, setFormAreaId] = useState(NONE);
  const [formCycleId, setFormCycleId] = useState(NONE);
  const [formResponsavelId, setFormResponsavelId] = useState(NONE);
  const [batchAreaId, setBatchAreaId] = useState(KEEP);
  const [batchCycleId, setBatchCycleId] = useState(KEEP);
  const [batchResponsavelId, setBatchResponsavelId] = useState(KEEP);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);

  const grouped = useMemo(() => {
    const byEntry = new Map<string, GroupedRecord>();
    records.items.forEach((item) => {
      const entry = item.entry;
      const groupId = item.entryId || `orphan:${item.id}`;
      const existing = byEntry.get(groupId);
      if (existing) {
        existing.items.push(item);
        return;
      }
      byEntry.set(groupId, {
        groupId,
        entryId: item.entryId,
        title: entry?.title || (entry?.entry_date ? `Diario ${entry.entry_date}` : item.name),
        dateLabel: entry?.entry_date ? new Date(entry.entry_date).toLocaleDateString("pt-BR") : new Date(item.createdAt).toLocaleDateString("pt-BR"),
        areaId: entry?.area_id || null,
        cycleId: entry?.cycle_id || null,
        responsavelId: entry?.responsavel_id || null,
        entryDescription: entry?.description || item.description || null,
        items: [item],
        mediaCount: entry?.attachments?.length || 0,
      });
    });
    return Array.from(byEntry.values()).sort((a, b) => {
      const aDate = a.items[0]?.createdAt || "";
      const bDate = b.items[0]?.createdAt || "";
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  }, [records.items]);

  const filteredGroups = useMemo(() => {
    return grouped.filter((group) => {
      const q = search.trim().toLowerCase();
      const groupSearch = `${group.title} ${group.entryDescription || ""} ${group.items.map((item) => `${item.name} ${item.description || ""}`).join(" ")}`.toLowerCase();
      const hasLink = Boolean(group.areaId || group.cycleId || group.responsavelId);
      const groupVisible = group.items.some((item) => !records.hiddenIds.includes(item.id));
      const groupDate = group.items[0]?.entry?.entry_date || group.items[0]?.createdAt || "";
      const passDateFrom = !dateFrom || groupDate.slice(0, 10) >= dateFrom;
      const passDateTo = !dateTo || groupDate.slice(0, 10) <= dateTo;
      const passType = typeFilter === "all" || group.items.some((item) => item.geometryType === typeFilter);

      return (
        (!q || groupSearch.includes(q)) &&
        passType &&
        (areaFilter === "all" || group.areaId === areaFilter) &&
        (cycleFilter === "all" || group.cycleId === cycleFilter) &&
        (responsavelFilter === "all" || group.responsavelId === responsavelFilter) &&
        (linkFilter === "all" || (linkFilter === "with" ? hasLink : !hasLink)) &&
        (visibilityFilter === "all" || (visibilityFilter === "visible" ? groupVisible : !groupVisible)) &&
        passDateFrom &&
        passDateTo
      );
    });
  }, [grouped, search, typeFilter, areaFilter, cycleFilter, responsavelFilter, linkFilter, visibilityFilter, dateFrom, dateTo, records.hiddenIds]);

  const allFilteredItemIds = filteredGroups.flatMap((group) => group.items.map((item) => item.id));
  const selectedItems = records.items.filter((item) => selectedIds.includes(item.id));
  const selectedVisibleCount = selectedItems.filter((item) => !records.hiddenIds.includes(item.id)).length;

  const summary = useMemo(() => {
    const allItems = filteredGroups.flatMap((group) => group.items);
    return {
      totalGroups: filteredGroups.length,
      points: allItems.filter((item) => item.geometryType === "point").length,
      lines: allItems.filter((item) => item.geometryType === "line").length,
      polygons: allItems.filter((item) => item.geometryType === "polygon").length,
      media: filteredGroups.reduce((acc, group) => acc + group.mediaCount, 0),
      visible: allItems.filter((item) => !records.hiddenIds.includes(item.id)).length,
      unlinked: filteredGroups.filter((group) => !group.areaId && !group.cycleId && !group.responsavelId).length,
    };
  }, [filteredGroups, records.hiddenIds]);

  const busy =
    Boolean(editItem || deleteGroup || batchLinkOpen) ||
    records.updateRecord.isPending ||
    records.removeRecord.isPending ||
    records.removeEntry.isPending ||
    batchBusy;

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  const toggleExpand = (groupId: string) => {
    setExpandedGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
  };

  const toggleSelectItem = (itemId: string, checked: boolean) => {
    setSelectedIds((current) => (checked ? [...new Set([...current, itemId])] : current.filter((id) => id !== itemId)));
  };

  const toggleSelectGroup = (group: GroupedRecord, checked: boolean) => {
    const ids = group.items.map((item) => item.id);
    setSelectedIds((current) =>
      checked ? [...new Set([...current, ...ids])] : current.filter((id) => !ids.includes(id)),
    );
  };

  const toggleSelectAllFiltered = (checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, ...allFilteredItemIds])] : current.filter((id) => !allFilteredItemIds.includes(id)),
    );
  };

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

  const handleExportItem = async (item: GeographicRecordItem) => {
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

  const handleExportGroup = async (group: GroupedRecord, format: "kml" | "kmz" = "kml") => {
    const record = buildDiaryExportRecord(group);
    if (!record) {
      toast.error("Registro sem dados exportaveis.");
      return;
    }
    if (format === "kmz") {
      await exportDiaryRecordsKmz({
        documentName: group.title,
        diaryRecords: [record],
        filename: `sitio-ramos-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.kmz`,
      });
    } else {
      await exportDiaryRecordsKml({
        documentName: group.title,
        diaryRecords: [record],
        filename: `sitio-ramos-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.kml`,
      });
    }
    toast.success(`Exportacao ${format.toUpperCase()} iniciada.`);
  };

  const handleBatchVisibility = async (visible: boolean) => {
    setBatchBusy(true);
    try {
      await Promise.all(
        selectedItems.map((item) =>
          records.setVisibility.mutateAsync({
            id: item.id,
            visible,
          }),
        ),
      );
      toast.success(visible ? "Itens selecionados exibidos no mapa." : "Itens selecionados ocultados do mapa.");
    } finally {
      setBatchBusy(false);
    }
  };

  const handleBatchExport = async (format: "kml" | "kmz") => {
    const groupedSelection = new Map<string, GroupedRecord>();
    filteredGroups.forEach((group) => {
      const selected = group.items.filter((item) => selectedIds.includes(item.id));
      if (!selected.length) return;
      groupedSelection.set(group.groupId, { ...group, items: selected });
    });
    const diaryRecords = Array.from(groupedSelection.values())
      .map(buildDiaryExportRecord)
      .filter((item): item is DiaryExportRecord => Boolean(item));
    if (!diaryRecords.length) {
      toast.error("Selecione ao menos um item geografico para exportar.");
      return;
    }
    if (format === "kmz") {
      await exportDiaryRecordsKmz({ diaryRecords });
    } else {
      await exportDiaryRecordsKml({ diaryRecords });
    }
    toast.success(`Exportacao ${format.toUpperCase()} iniciada.`);
  };

  const handleBatchDelete = async () => {
    if (!selectedItems.length) return;
    if (!confirm(`Voce esta prestes a excluir ${selectedItems.length} item(ns) geograficos. Esta acao nao podera ser desfeita. Deseja continuar?`)) {
      return;
    }
    setBatchBusy(true);
    try {
      await Promise.all(selectedItems.map((item) => records.removeRecord.mutateAsync(item)));
      setSelectedIds([]);
      toast.success("Itens geograficos selecionados removidos.");
    } finally {
      setBatchBusy(false);
    }
  };

  const applyBatchLinks = async () => {
    if (!selectedItems.length) return;
    setBatchBusy(true);
    try {
      await Promise.all(
        selectedItems.map((item) =>
          records.updateRecord.mutateAsync({
            item,
            name: item.name,
            description: item.description,
            areaId: batchAreaId === KEEP ? undefined : batchAreaId === NONE ? null : batchAreaId,
            cycleId: batchCycleId === KEEP ? undefined : batchCycleId === NONE ? null : batchCycleId,
            responsavelId:
              batchResponsavelId === KEEP ? undefined : batchResponsavelId === NONE ? null : batchResponsavelId,
          }),
        ),
      );
      setBatchLinkOpen(false);
      toast.success("Vinculos aplicados aos itens selecionados.");
    } finally {
      setBatchBusy(false);
    }
  };

  const deleteGroupGeometries = async () => {
    if (!deleteGroup) return;
    setBatchBusy(true);
    try {
      await Promise.all(deleteGroup.items.map((item) => records.removeRecord.mutateAsync(item)));
      toast.success("Itens geograficos do registro removidos.");
      setDeleteGroup(null);
    } finally {
      setBatchBusy(false);
    }
  };

  const deleteGroupEntry = async () => {
    if (!deleteGroup?.entryId) return;
    setBatchBusy(true);
    try {
      await records.removeEntry.mutateAsync(deleteGroup.entryId);
      toast.success("Registro completo do Diario removido.");
      setDeleteGroup(null);
    } finally {
      setBatchBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Registros com geografia", summary.totalGroups],
          ["Pontos", summary.points],
          ["Linhas", summary.lines],
          ["Poligonos", summary.polygons],
          ["Midias georreferenciadas", summary.media],
          ["Itens visiveis no mapa", summary.visible],
          ["Itens sem vinculo", summary.unlinked],
          ["Selecionados", selectedIds.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-brand-leaf/15 bg-card p-4 shadow-soft">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
            <div className="mt-1 font-display text-2xl font-semibold text-brand-forest">{value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-brand-leaf/15 bg-card p-4 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-brand-forest">Registros Geograficos</h3>
            <p className="text-xs text-muted-foreground">
              Central de gestao dos registros geograficos do Diario de Campo, agrupados por registro.
            </p>
          </div>
          {!!selectedIds.length && (
            <div className="rounded-xl border border-brand-leaf/20 bg-muted/20 p-3">
              <div className="mb-2 text-xs font-medium text-brand-forest">{selectedIds.length} item(ns) selecionado(s)</div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => handleBatchVisibility(false)}>
                  <EyeOff className="mr-1 h-3.5 w-3.5" /> Ocultar
                </Button>
                <Button type="button" size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => handleBatchVisibility(true)}>
                  <Eye className="mr-1 h-3.5 w-3.5" /> Mostrar
                </Button>
                <Button type="button" size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => void handleBatchExport("kml")}>
                  <Download className="mr-1 h-3.5 w-3.5" /> KML
                </Button>
                <Button type="button" size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => void handleBatchExport("kmz")}>
                  <Download className="mr-1 h-3.5 w-3.5" /> KMZ
                </Button>
                <Button type="button" size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => setBatchLinkOpen(true)}>
                  <Link2 className="mr-1 h-3.5 w-3.5" /> Vincular
                </Button>
                <Button type="button" size="sm" variant="destructive" className="h-8 text-[11px]" onClick={() => void handleBatchDelete()}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                </Button>
                <Button type="button" size="sm" variant="ghost" className="h-8 text-[11px]" onClick={() => setSelectedIds([])}>
                  <X className="mr-1 h-3.5 w-3.5" /> Limpar
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Label className="text-[11px]">Buscar</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 pl-8" placeholder="Titulo do diario, nome, descricao..." />
            </div>
          </div>
          <div>
            <Label className="text-[11px]">Tipo</Label>
            <Select value={typeFilter} onValueChange={(value: GeographicRecordType | "all") => setTypeFilter(value)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="point">Ponto</SelectItem>
                <SelectItem value="line">Linha</SelectItem>
                <SelectItem value="polygon">Poligono</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px]">Vinculo</Label>
            <Select value={linkFilter} onValueChange={(value: "all" | "with" | "without") => setLinkFilter(value)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with">Com vinculo</SelectItem>
                <SelectItem value="without">Sem vinculo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-6">
          <div>
            <Label className="text-[11px]">Area</Label>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {areas.map((area: any) => <SelectItem key={area.id} value={area.id}>{area.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px]">Ciclo</Label>
            <Select value={cycleFilter} onValueChange={setCycleFilter}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {cycles.map((cycle: any) => <SelectItem key={cycle.id} value={cycle.id}>{cycle.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px]">Responsavel</Label>
            <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {responsaveis.map((responsavel) => <SelectItem key={responsavel.id} value={responsavel.id}>{responsavel.apelido || responsavel.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px]">Visibilidade</Label>
            <Select value={visibilityFilter} onValueChange={(value: "all" | "visible" | "hidden") => setVisibilityFilter(value)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="visible">Visiveis</SelectItem>
                <SelectItem value="hidden">Ocultos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px]">De</Label>
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-[11px]">Ate</Label>
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-9" />
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-brand-leaf/15">
          <div className="hidden grid-cols-[40px_40px_120px_minmax(180px,1fr)_120px_120px_120px_100px_120px] gap-2 bg-muted/30 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground lg:grid">
            <div><Checkbox checked={allFilteredItemIds.length > 0 && allFilteredItemIds.every((id) => selectedIds.includes(id))} onCheckedChange={(checked) => toggleSelectAllFiltered(checked === true)} /></div>
            <div />
            <div>Data</div>
            <div>Registro do Diario</div>
            <div>Area</div>
            <div>Ciclo</div>
            <div>Responsavel</div>
            <div>Visibilidade</div>
            <div>Acoes</div>
          </div>

          {records.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Carregando registros geograficos...</div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Nenhum registro geografico encontrado com os filtros atuais.</div>
          ) : (
            <div className="divide-y divide-brand-leaf/10">
              {filteredGroups.map((group) => {
                const areaLabel = areas.find((area: any) => area.id === group.areaId)?.nome || "—";
                const cycleLabel = cycles.find((cycle: any) => cycle.id === group.cycleId)?.nome || "—";
                const responsavelLabel =
                  responsaveis.find((responsavel) => responsavel.id === group.responsavelId)?.apelido ||
                  responsaveis.find((responsavel) => responsavel.id === group.responsavelId)?.nome ||
                  "—";
                const visibleItems = group.items.filter((item) => !records.hiddenIds.includes(item.id)).length;
                const allSelected = group.items.every((item) => selectedIds.includes(item.id));
                const someSelected = group.items.some((item) => selectedIds.includes(item.id));
                const pointCount = group.items.filter((item) => item.geometryType === "point").length;
                const lineCount = group.items.filter((item) => item.geometryType === "line").length;
                const polygonCount = group.items.filter((item) => item.geometryType === "polygon").length;
                const expanded = Boolean(expandedGroups[group.groupId]);
                return (
                  <div key={group.groupId} className="bg-card">
                    <div className="grid gap-3 px-3 py-3 lg:grid-cols-[40px_40px_120px_minmax(180px,1fr)_120px_120px_120px_100px_120px] lg:items-center">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={allSelected ? true : someSelected ? "indeterminate" : false}
                          onCheckedChange={(checked) => toggleSelectGroup(group, checked === true)}
                        />
                      </div>
                      <button type="button" onClick={() => toggleExpand(group.groupId)} className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted">
                        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <div className="text-sm text-muted-foreground">{group.dateLabel}</div>
                      <div className="min-w-0">
                        <div className="font-medium text-brand-forest">{group.title}</div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          <span>{pointCount} ponto(s)</span>
                          <span>{lineCount} linha(s)</span>
                          <span>{polygonCount} poligono(s)</span>
                          <span>{group.mediaCount} midia(s)</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{areaLabel}</div>
                      <div className="text-sm text-muted-foreground">{cycleLabel}</div>
                      <div className="text-sm text-muted-foreground">{responsavelLabel}</div>
                      <div>
                        <span className={cn("rounded-full px-2 py-1 text-[11px]", visibleItems > 0 ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground")}>
                          {visibleItems > 0 ? `${visibleItems} visivel` : "Oculto"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.items[0] && (
                          <button type="button" onClick={() => onFocusItem(group.items[0].id)} className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted" title="Centralizar grupo">
                            <Focus className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button type="button" onClick={() => void handleExportGroup(group, "kml")} className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted" title="Exportar grupo em KML">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => setDeleteGroup(group)} className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Excluir">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="border-t border-brand-leaf/10 bg-muted/10 px-3 py-3">
                        <div className="space-y-2">
                          {group.items.map((item) => {
                            const hidden = records.hiddenIds.includes(item.id);
                            const Icon = itemTypeIcon(item.geometryType);
                            return (
                              <div key={item.id} className="rounded-xl border border-brand-leaf/15 bg-card px-3 py-2">
                                <div className="flex items-start gap-3">
                                  <div className="flex items-center justify-center pt-1">
                                    <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={(checked) => toggleSelectItem(item.id, checked === true)} />
                                  </div>
                                  <div className="rounded-lg bg-brand-leaf/10 p-2 text-brand-leaf">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="font-medium text-brand-forest">{item.name}</div>
                                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{recordTypeLabel(item.geometryType)}</span>
                                      <span className={cn("rounded-full px-2 py-0.5 text-[10px]", hidden ? "bg-muted text-muted-foreground" : "bg-emerald-100 text-emerald-800")}>
                                        {hidden ? "Oculto" : "Visivel"}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                      {item.coordinatesSummary && <span>{item.coordinatesSummary}</span>}
                                      {item.accuracy != null && <span>±{Math.round(item.accuracy)}m</span>}
                                      {item.lengthM != null && <span>{formatLength(item.lengthM)}</span>}
                                      {item.areaM2 != null && <span>{formatArea(item.areaM2)}</span>}
                                    </div>
                                    {item.description && <p className="mt-1 text-xs text-foreground/80">{item.description}</p>}
                                  </div>
                                  <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
                                    <button type="button" onClick={() => records.setVisibility.mutate({ id: item.id, visible: hidden })} className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted" title={hidden ? "Mostrar no mapa" : "Ocultar do mapa"}>
                                      {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </button>
                                    <button type="button" onClick={() => onFocusItem(item.id)} className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted" title="Centralizar">
                                      <Focus className="h-3.5 w-3.5" />
                                    </button>
                                    <button type="button" onClick={() => startEdit(item)} className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted" title="Editar">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button type="button" onClick={() => void handleExportItem(item)} className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted" title="Exportar KML">
                                      {exportingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                    </button>
                                    <a href="/diario" className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted" title="Abrir Diario">
                                      <Link2 className="h-3.5 w-3.5" />
                                    </a>
                                    <button type="button" onClick={() => records.removeRecord.mutate(item)} className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Excluir item">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {group.mediaCount > 0 && (
                            <div className="rounded-xl border border-dashed border-brand-leaf/15 bg-card px-3 py-2 text-xs text-muted-foreground">
                              Este registro possui {group.mediaCount} midia(s) vinculada(s) ao Diario. A listagem detalhada de midias georreferenciadas pode ser expandida numa proxima etapa.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar item geografico</DialogTitle>
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

      <Dialog open={batchLinkOpen} onOpenChange={setBatchLinkOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vincular selecionados</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="text-sm text-muted-foreground">
              Aplique area, ciclo e responsavel aos {selectedIds.length} item(ns) selecionado(s). Use "Manter atual" para nao alterar um campo.
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label className="text-[11px]">Area</Label>
                <Select value={batchAreaId} onValueChange={setBatchAreaId}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={KEEP}>Manter atual</SelectItem>
                    <SelectItem value={NONE}>Sem vinculo</SelectItem>
                    {areas.map((area: any) => <SelectItem key={area.id} value={area.id}>{area.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px]">Ciclo</Label>
                <Select value={batchCycleId} onValueChange={setBatchCycleId}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={KEEP}>Manter atual</SelectItem>
                    <SelectItem value={NONE}>Sem vinculo</SelectItem>
                    {cycles.map((cycle: any) => <SelectItem key={cycle.id} value={cycle.id}>{cycle.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px]">Responsavel</Label>
                <Select value={batchResponsavelId} onValueChange={setBatchResponsavelId}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={KEEP}>Manter atual</SelectItem>
                    <SelectItem value={NONE}>Sem vinculo</SelectItem>
                    {responsaveis.map((responsavel) => <SelectItem key={responsavel.id} value={responsavel.id}>{responsavel.apelido || responsavel.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBatchLinkOpen(false)}>Cancelar</Button>
            <Button onClick={() => void applyBatchLinks()} className="bg-brand-forest hover:bg-brand-forest/90" disabled={batchBusy}>
              {batchBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteGroup} onOpenChange={(open) => !open && setDeleteGroup(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Excluir registro georeferenciado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Deseja excluir apenas os itens geograficos deste registro ou o registro completo do Diario?
            </p>
            <p className="rounded-lg border border-brand-leaf/15 bg-muted/10 px-3 py-2">
              {deleteGroup?.title}
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteGroup(null)}>Cancelar</Button>
            <Button variant="outline" onClick={() => void deleteGroupGeometries()} disabled={batchBusy}>
              Apenas itens geograficos
            </Button>
            <Button variant="destructive" onClick={() => void deleteGroupEntry()} disabled={batchBusy || !deleteGroup?.entryId}>
              Registro completo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
