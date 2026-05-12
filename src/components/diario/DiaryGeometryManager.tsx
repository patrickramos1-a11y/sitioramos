import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MapPin,
  Plus,
  Trash2,
  Pencil,
  Download,
  CheckCircle2,
  X,
  Spline,
  Hexagon,
  Loader2,
  ChevronDown,
  ChevronUp,
  Map as MapIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useDiaryGeometries,
  type DiaryGeometry,
  type GeometryType,
} from "@/hooks/useDiaryGeometries";
import { DiaryMapView, type DraftVertex } from "./DiaryMapView";
import { GpsCaptureDialog, type CapturedGpsPoint } from "./GpsCaptureDialog";
import { polygonAreaMeters, lineLengthMeters, formatArea, formatLength } from "@/lib/geoMath";
import {
  exportEntryKml,
  exportSingleGeometry,
  type KmlEntryMeta,
} from "@/lib/kmlExport";

export interface DraftDiaryGeometry {
  id: string;
  geometry_type: GeometryType;
  name: string | null;
  description: string | null;
  geojson: any;
  area_m2: number | null;
  length_m: number | null;
  ordem: number;
}

interface Props {
  entryId?: string;
  entryMeta?: KmlEntryMeta;
  draftGeometries?: DraftDiaryGeometry[];
  onDraftGeometriesChange?: (g: DraftDiaryGeometry[]) => void;
}

const MODES: { value: GeometryType; label: string; icon: typeof MapPin }[] = [
  { value: "point", label: "Ponto", icon: MapPin },
  { value: "line", label: "Linha", icon: Spline },
  { value: "polygon", label: "Polígono", icon: Hexagon },
];

export function DiaryGeometryManager({
  entryId,
  entryMeta,
  draftGeometries,
  onDraftGeometriesChange,
}: Props) {
  const isDraft = !entryId;
  const remote = useDiaryGeometries(entryId);

  const geometries: (DiaryGeometry | (DraftDiaryGeometry & { entry_id: string; responsavel_id: null; created_at: string; updated_at: string }))[] = isDraft
    ? (draftGeometries || []).map((d) => ({
        ...d,
        entry_id: "",
        responsavel_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    : remote.data || [];

  const addGeometry = async (g: Omit<DraftDiaryGeometry, "id">) => {
    if (isDraft) {
      const newOne: DraftDiaryGeometry = { ...g, id: crypto.randomUUID() };
      onDraftGeometriesChange?.([...(draftGeometries || []), newOne]);
      return;
    }
    await remote.add.mutateAsync({
      entry_id: entryId!,
      geometry_type: g.geometry_type,
      name: g.name,
      description: g.description,
      geojson: g.geojson,
      area_m2: g.area_m2,
      length_m: g.length_m,
      responsavel_id: null,
      ordem: g.ordem,
    });
  };

  const updateGeometry = async (id: string, patch: Partial<DraftDiaryGeometry>) => {
    if (isDraft) {
      onDraftGeometriesChange?.((draftGeometries || []).map((d) => (d.id === id ? { ...d, ...patch } : d)));
      return;
    }
    await remote.update.mutateAsync({ id, ...patch } as any);
  };

  const removeGeometry = async (id: string) => {
    if (isDraft) {
      onDraftGeometriesChange?.((draftGeometries || []).filter((d) => d.id !== id));
      return;
    }
    await remote.remove.mutateAsync(id);
  };

  const [mode, setMode] = useState<GeometryType>("point");
  const [draft, setDraft] = useState<DraftVertex[]>([]);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const [namingOpen, setNamingOpen] = useState(false);
  const [namingForm, setNamingForm] = useState({ name: "", description: "" });
  const [editing, setEditing] = useState<DiaryGeometry | null>(null);
  const [exporting, setExporting] = useState(false);

  const pointCount = geometries.filter((g) => g.geometry_type === "point").length;
  const lineCount = geometries.filter((g) => g.geometry_type === "line").length;
  const polyCount = geometries.filter((g) => g.geometry_type === "polygon").length;

  // Próximo número de ponto continua sequencial dentro do registro
  const nextPointSeq = pointCount + 1;
  const nextLineSeq = lineCount + 1;
  const nextPolySeq = polyCount + 1;

  const draftPreview = useMemo(
    () => ({ mode, vertices: draft }),
    [mode, draft],
  );

  const handleAddCurrent = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocalização não suportada neste dispositivo");
      return;
    }
    setCaptureOpen(true);
  };

  const handleCaptured = async (cp: CapturedGpsPoint) => {
    if (mode === "point") {
      // Cria geometria ponto imediatamente
      const seq = pointCount + 1;
      try {
        await addGeometry({
          geometry_type: "point",
          name: `P${seq}`,
          description: null,
          geojson: { type: "Point", coordinates: [cp.longitude, cp.latitude] },
          area_m2: null,
          length_m: null,
          ordem: geometries.length,
        });
        toast.success(`P${seq} salvo`);
      } catch (e: any) {
        toast.error(e.message || "Falha ao salvar ponto");
      }
      return;
    }
    // line / polygon: adiciona ao rascunho
    setDraft((prev) => [
      ...prev,
      { lat: cp.latitude, lng: cp.longitude, number: prev.length + 1 },
    ]);
    toast.success(`P${draft.length + 1} adicionado ao rascunho`);
  };

  const removeDraftVertex = (n: number) => {
    setDraft((prev) =>
      prev.filter((v) => v.number !== n).map((v, i) => ({ ...v, number: i + 1 })),
    );
  };

  const cancelDraft = () => setDraft([]);

  const openClose = () => {
    if (mode === "polygon" && draft.length < 3) {
      toast.error("Para fechar um polígono, adicione pelo menos 3 pontos.");
      return;
    }
    if (mode === "line" && draft.length < 2) {
      toast.error("Adicione pelo menos 2 pontos para criar uma linha.");
      return;
    }
    const defaultName =
      mode === "polygon" ? `Polígono ${nextPolySeq}` : `Linha ${nextLineSeq}`;
    setNamingForm({ name: defaultName, description: "" });
    setNamingOpen(true);
  };

  const commitDraft = async () => {
    if (!draft.length) return;
    const coords: [number, number][] = draft.map((v) => [v.lng, v.lat]);
    let geojson: any;
    let area_m2: number | null = null;
    let length_m: number | null = null;

    if (mode === "polygon") {
      const ring = [...coords, coords[0]];
      geojson = { type: "Polygon", coordinates: [ring] };
      area_m2 = polygonAreaMeters(coords);
      length_m = lineLengthMeters(ring);
    } else {
      geojson = { type: "LineString", coordinates: coords };
      length_m = lineLengthMeters(coords);
    }

    try {
      await addGeometry({
        geometry_type: mode,
        name: namingForm.name.trim() || (mode === "polygon" ? `Polígono ${nextPolySeq}` : `Linha ${nextLineSeq}`),
        description: namingForm.description.trim() || null,
        geojson,
        area_m2,
        length_m,
        ordem: geometries.length,
      });
      toast.success(mode === "polygon" ? "Polígono salvo" : "Linha salva");
      setDraft([]);
      setNamingOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const startEdit = (g: DiaryGeometry) => {
    setEditing(g);
    setNamingForm({ name: g.name || "", description: g.description || "" });
  };

  const saveEdit = async () => {
    if (!editing) return;
    await updateGeometry(editing.id, {
      name: namingForm.name.trim() || null,
      description: namingForm.description.trim() || null,
    });
    setEditing(null);
  };

  const handleExportAll = async () => {
    if (!entryMeta) return;
    if (!geometries.length) {
      toast.error("Nada para exportar");
      return;
    }
    setExporting(true);
    try {
      await exportEntryKml(entryMeta, [], geometries);
      toast.success("KML exportado");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  };

  const groups = {
    point: geometries.filter((g) => g.geometry_type === "point"),
    line: geometries.filter((g) => g.geometry_type === "line"),
    polygon: geometries.filter((g) => g.geometry_type === "polygon"),
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-brand-forest/70">
          Mapa / GPS
        </span>
        {entryMeta && geometries.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            onClick={handleExportAll}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Download className="h-3 w-3 mr-1" />
            )}
            KML
          </Button>
        )}
      </div>

      {/* Seletor de modo */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => {
                if (draft.length && m.value !== mode) {
                  if (!confirm("Descartar pontos do rascunho atual?")) return;
                  setDraft([]);
                }
                setMode(m.value);
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors",
                active
                  ? "bg-brand-forest text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-background",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        onClick={handleAddCurrent}
        className="w-full h-12 bg-brand-leaf hover:bg-brand-leaf/90 text-primary-foreground font-display"
      >
        <Plus className="h-4 w-4 mr-2" />
        {mode === "point"
          ? `Adicionar P${nextPointSeq}`
          : `Adicionar P${draft.length + 1}`}
      </Button>

      {(mode === "polygon" || mode === "line") && draft.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-amber-900">
              Rascunho · {draft.length} ponto{draft.length > 1 ? "s" : ""}
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-[11px]"
                onClick={cancelDraft}
              >
                <X className="h-3 w-3 mr-1" /> Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 text-[11px] bg-brand-forest hover:bg-brand-forest/90"
                onClick={openClose}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {mode === "polygon" ? "Fechar polígono" : "Salvar linha"}
              </Button>
            </div>
          </div>
          <ul className="text-[11px] space-y-0.5">
            {draft.map((v) => (
              <li key={v.number} className="flex items-center justify-between font-mono">
                <span>
                  P{v.number} · {v.lat.toFixed(5)}, {v.lng.toFixed(5)}
                </span>
                <button
                  type="button"
                  onClick={() => removeDraftVertex(v.number)}
                  className="text-amber-700 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
          {mode === "polygon" && draft.length < 3 && (
            <p className="text-[10px] text-amber-800">
              Adicione pelo menos 3 pontos para fechar o polígono.
            </p>
          )}
        </div>
      )}

      {/* Mapa minimizável */}
      <div className="rounded-lg border border-brand-leaf/20 bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setMapOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-brand-forest hover:bg-muted/40"
        >
          <span className="flex items-center gap-1.5">
            <MapIcon className="h-3.5 w-3.5" />
            Mapa de visualização
            {(geometries.length > 0 || draft.length > 0) && (
              <span className="text-muted-foreground font-normal">
                · {geometries.length + (draft.length > 0 ? 1 : 0)} elemento
                {geometries.length + (draft.length > 0 ? 1 : 0) > 1 ? "s" : ""}
              </span>
            )}
          </span>
          {mapOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {mapOpen && (
          <div className="p-2 pt-0">
            <DiaryMapView geometries={geometries} draft={draftPreview} height={280} />
            <p className="text-[10px] text-muted-foreground mt-1 italic text-center">
              Tiles do mapa precisam de internet. Coordenadas são salvas e funcionam offline.
            </p>
          </div>
        )}
      </div>

      {/* Listagem por grupo */}
      {(["point", "line", "polygon"] as GeometryType[]).map((t) => {
        const list = groups[t];
        if (!list.length) return null;
        const title = t === "point" ? "Pontos" : t === "line" ? "Linhas" : "Polígonos";
        return (
          <div key={t} className="space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-brand-forest/70">
              {title} · {list.length}
            </div>
            <ul className="space-y-1.5">
              {list.map((g) => (
                <li
                  key={g.id}
                  className="rounded-lg border border-brand-leaf/20 bg-card p-2 text-xs"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-brand-forest truncate">
                        {g.name || (t === "polygon" ? "Polígono" : t === "line" ? "Linha" : "Ponto")}
                      </div>
                      {g.description && (
                        <p className="text-[11px] text-foreground/80 line-clamp-2">{g.description}</p>
                      )}
                      <div className="text-[10px] text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                        {g.area_m2 != null && <span>{formatArea(g.area_m2)}</span>}
                        {g.length_m != null && <span>{formatLength(g.length_m)}</span>}
                        {t === "point" && g.geojson?.coordinates && (
                          <span className="font-mono">
                            {g.geojson.coordinates[1].toFixed(5)},{" "}
                            {g.geojson.coordinates[0].toFixed(5)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 shrink-0">
                      {entryMeta && (
                        <button
                          type="button"
                          onClick={() => exportSingleGeometry(entryMeta, g)}
                          className="h-6 w-6 rounded flex items-center justify-center text-brand-leaf hover:bg-brand-leaf/10"
                          title="Exportar KML"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => startEdit(g)}
                        className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted"
                        title="Editar"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Excluir ${g.name || t}?`)) removeGeometry(g.id);
                        }}
                        className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <GpsCaptureDialog
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        onSave={handleCaptured}
      />

      {/* Naming dialog for line/polygon close */}
      <Dialog open={namingOpen} onOpenChange={setNamingOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {mode === "polygon" ? "Fechar polígono" : "Salvar linha"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium">Nome</label>
              <Input
                value={namingForm.name}
                onChange={(e) =>
                  setNamingForm((f) => ({ ...f, name: e.target.value }))
                }
                className="h-9"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium">Descrição</label>
              <Textarea
                value={namingForm.description}
                onChange={(e) =>
                  setNamingForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
              />
            </div>
            {mode === "polygon" && draft.length >= 3 && (
              <div className="text-xs text-muted-foreground">
                Área estimada:{" "}
                {formatArea(polygonAreaMeters(draft.map((v) => [v.lng, v.lat])))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNamingOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={commitDraft} className="bg-brand-forest hover:bg-brand-forest/90">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar geometria</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium">Nome</label>
              <Input
                value={namingForm.name}
                onChange={(e) =>
                  setNamingForm((f) => ({ ...f, name: e.target.value }))
                }
                className="h-9"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium">Descrição</label>
              <Textarea
                value={namingForm.description}
                onChange={(e) =>
                  setNamingForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveEdit} className="bg-brand-forest hover:bg-brand-forest/90">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
