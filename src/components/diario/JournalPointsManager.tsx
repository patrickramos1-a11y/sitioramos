import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  MapPin,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Download,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useJournalPoints,
  type JournalPoint,
  type DraftPoint,
} from "@/hooks/useJournalPoints";
import { exportEntryKml, type KmlEntryMeta } from "@/lib/kmlExport";
import { GpsCaptureDialog, type CapturedGpsPoint } from "@/components/diario/GpsCaptureDialog";
import { QUALITY_LABEL, QUALITY_COLOR, type PrecisionQuality } from "@/hooks/useGpsCapture";

interface Props {
  /** Modo persistido: id do registro existente */
  entryId?: string;
  /** Modo rascunho: pontos em estado local */
  draftPoints?: DraftPoint[];
  onDraftChange?: (points: DraftPoint[]) => void;
  /** Meta para exportação KML (modo persistido) */
  entryMeta?: KmlEntryMeta;
  /** Compacto = sem export, mais enxuto */
  compact?: boolean;
}

function formatRel(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function JournalPointsManager({
  entryId,
  draftPoints,
  onDraftChange,
  entryMeta,
  compact,
}: Props) {
  const isDraft = !entryId;
  const remoteHook = useJournalPoints(entryId);

  const points: Array<JournalPoint | (DraftPoint & { id: string; entry_id: string })> = isDraft
    ? (draftPoints || []).map((d) => ({
        ...d,
        id: d.tempId,
        entry_id: "",
        created_at: d.captured_at,
        updated_at: d.captured_at,
      }))
    : remoteHook.data || [];

  const [captureOpen, setCaptureOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ lat: "", lng: "", nome: "", obs: "" });
  const [exporting, setExporting] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ nome: string; observacao: string }>({
    nome: "",
    observacao: "",
  });

  const nextName = () => `Ponto ${points.length + 1}`;

  const addDraft = (p: DraftPoint) => {
    onDraftChange?.([...(draftPoints || []), p]);
  };

  const updateDraft = (tempId: string, patch: Partial<DraftPoint>) => {
    onDraftChange?.(
      (draftPoints || []).map((d) => (d.tempId === tempId ? { ...d, ...patch } : d)),
    );
  };

  const removeDraft = (tempId: string) => {
    onDraftChange?.((draftPoints || []).filter((d) => d.tempId !== tempId));
  };

  const handleCaptured = (cp: CapturedGpsPoint) => {
    const newPoint = {
      nome: nextName(),
      observacao: null,
      latitude: cp.latitude,
      longitude: cp.longitude,
      accuracy: cp.accuracy,
      captured_at: cp.captured_at,
      ordem: points.length,
      manual: false,
      geometry_type: "point" as const,
      coordinates: null,
      attachment_id: null,
      altitude: cp.altitude,
      altitude_accuracy: cp.altitude_accuracy,
      heading: cp.heading,
      speed: cp.speed,
      capture_duration_seconds: cp.capture_duration_seconds,
      readings_count: cp.readings_count,
      best_accuracy: cp.best_accuracy,
      capture_method: cp.capture_method,
      precision_quality: cp.precision_quality,
    };
    if (isDraft) {
      addDraft({ ...newPoint, tempId: crypto.randomUUID() });
      toast.success(`Ponto capturado · ${QUALITY_LABEL[cp.precision_quality]}`);
    } else if (entryId) {
      remoteHook.add.mutate(
        { entry_id: entryId, ...newPoint },
        {
          onSuccess: () =>
            toast.success(`Ponto capturado · ${QUALITY_LABEL[cp.precision_quality]}`),
        },
      );
    }
  };

  const openCapture = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocalização não suportada — use entrada manual");
      setManualOpen(true);
      return;
    }
    setCaptureOpen(true);
  };

  const submitManual = () => {
    const lat = parseFloat(manual.lat.replace(",", "."));
    const lng = parseFloat(manual.lng.replace(",", "."));
    if (!isFinite(lat) || lat < -90 || lat > 90) {
      toast.error("Latitude inválida");
      return;
    }
    if (!isFinite(lng) || lng < -180 || lng > 180) {
      toast.error("Longitude inválida");
      return;
    }
    const newPoint = {
      nome: manual.nome.trim() || nextName(),
      observacao: manual.obs.trim() || null,
      latitude: lat,
      longitude: lng,
      accuracy: null,
      captured_at: new Date().toISOString(),
      ordem: points.length,
      manual: true,
      geometry_type: "point" as const,
      coordinates: null,
      attachment_id: null,
    };
    if (isDraft) {
      addDraft({ ...newPoint, tempId: crypto.randomUUID() });
    } else if (entryId) {
      remoteHook.add.mutate({ entry_id: entryId, ...newPoint });
    }
    setManual({ lat: "", lng: "", nome: "", obs: "" });
    setManualOpen(false);
    toast.success("Ponto adicionado");
  };

  const startEdit = (p: JournalPoint | (DraftPoint & { id: string })) => {
    setEditing(p.id);
    setEditForm({ nome: p.nome, observacao: p.observacao || "" });
  };

  const saveEdit = (id: string) => {
    const patch = {
      nome: editForm.nome.trim() || "Ponto",
      observacao: editForm.observacao.trim() || null,
    };
    if (isDraft) {
      updateDraft(id, patch);
    } else {
      remoteHook.update.mutate({ id, ...patch });
    }
    setEditing(null);
  };

  const removePoint = (id: string) => {
    if (isDraft) {
      removeDraft(id);
    } else {
      remoteHook.remove.mutate(id);
    }
  };

  const handleExport = async () => {
    if (!entryMeta || isDraft) return;
    if (!points.length) {
      toast.error("Adicione ao menos um ponto");
      return;
    }
    setExporting(true);
    try {
      await exportEntryKml(entryMeta, points as JournalPoint[]);
      toast.success("KML exportado");
    } catch (e: any) {
      toast.error(e.message || "Falha ao exportar");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-brand-forest/70">
          Pontos GPS {points.length > 0 && <span className="text-muted-foreground">· {points.length}</span>}
        </span>
        {!isDraft && entryMeta && points.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-[11px] border-brand-leaf/30 text-brand-forest"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            KML
          </Button>
        )}
      </div>

      <Button
        type="button"
        onClick={openCapture}
        className="w-full h-14 bg-brand-leaf hover:bg-brand-leaf/90 text-primary-foreground text-base font-display"
      >
        <MapPin className="h-5 w-5 mr-2" />
        Bater ponto GPS
      </Button>

      <GpsCaptureDialog
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        onSave={handleCaptured}
      />

      <button
        type="button"
        onClick={() => setManualOpen(true)}
        className="w-full text-[11px] text-muted-foreground hover:text-brand-forest flex items-center justify-center gap-1 py-1"
      >
        <Plus className="h-3 w-3" /> Lançar manualmente
      </button>

      {points.length > 0 && (
        <ul className="space-y-1.5">
          {points.map((p) => {
            const isEditing = editing === p.id;
            return (
              <li
                key={p.id}
                className="rounded-lg border border-brand-leaf/20 bg-card p-2 text-xs space-y-1"
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editForm.nome}
                      onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
                      className="h-8 text-xs"
                      placeholder="Nome do ponto"
                    />
                    <Textarea
                      value={editForm.observacao}
                      onChange={(e) => setEditForm((f) => ({ ...f, observacao: e.target.value }))}
                      placeholder="Observação"
                      rows={2}
                      className="text-xs"
                    />
                    <div className="flex gap-1 justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[11px]"
                        onClick={() => setEditing(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-[11px] bg-brand-forest hover:bg-brand-forest/90"
                        onClick={() => saveEdit(p.id)}
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-brand-leaf shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-brand-forest truncate">
                            {p.nome}
                          </span>
                          {p.manual && (
                            <span className="text-[9px] uppercase tracking-wider px-1 rounded bg-muted text-muted-foreground">
                              manual
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate">
                          {p.latitude.toFixed(6)}, {p.longitude.toFixed(6)}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap">
                          {p.accuracy != null && <span>±{Math.round(p.accuracy)}m</span>}
                          {(p as any).precision_quality && (
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded border text-[9px]",
                                QUALITY_COLOR[(p as any).precision_quality as PrecisionQuality],
                              )}
                            >
                              {QUALITY_LABEL[(p as any).precision_quality as PrecisionQuality]}
                            </span>
                          )}
                          <span>{formatRel(p.captured_at)}</span>
                          {(p as any).readings_count != null && (
                            <span>· {(p as any).readings_count} leituras</span>
                          )}
                          {(p as any).capture_duration_seconds != null && (
                            <span>
                              · {Math.round((p as any).capture_duration_seconds)}s
                            </span>
                          )}
                        </div>
                        {p.observacao && (
                          <p className="text-[11px] text-foreground/80 mt-0.5 line-clamp-2">
                            {p.observacao}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <a
                          href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="h-6 w-6 rounded flex items-center justify-center text-brand-leaf hover:bg-brand-leaf/10"
                          title="Abrir no mapa"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted"
                          title="Editar"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removePoint(p.id)}
                          className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Excluir"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Lançar ponto manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px]">Latitude</Label>
                <Input
                  value={manual.lat}
                  onChange={(e) => setManual((m) => ({ ...m, lat: e.target.value }))}
                  placeholder="-23.5505"
                  inputMode="decimal"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-[11px]">Longitude</Label>
                <Input
                  value={manual.lng}
                  onChange={(e) => setManual((m) => ({ ...m, lng: e.target.value }))}
                  placeholder="-46.6333"
                  inputMode="decimal"
                  className="h-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-[11px]">Nome</Label>
              <Input
                value={manual.nome}
                onChange={(e) => setManual((m) => ({ ...m, nome: e.target.value }))}
                placeholder={nextName()}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-[11px]">Observação</Label>
              <Textarea
                value={manual.obs}
                onChange={(e) => setManual((m) => ({ ...m, obs: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setManualOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitManual} className="bg-brand-forest hover:bg-brand-forest/90">
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CollapsibleProps {
  entryId: string;
  entryMeta: KmlEntryMeta;
}

/** Wrapper colapsável para usar dentro do EntryCard */
export function JournalPointsCollapsible({ entryId, entryMeta }: CollapsibleProps) {
  const [open, setOpen] = useState(false);
  const { data: points = [] } = useJournalPoints(entryId);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between text-[11px] font-medium text-brand-leaf hover:text-brand-forest py-1",
          )}
        >
          <span className="flex items-center gap-1">
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Pontos GPS
            {points.length > 0 && (
              <span className="text-muted-foreground">({points.length})</span>
            )}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <JournalPointsManager entryId={entryId} entryMeta={entryMeta} />
      </CollapsibleContent>
    </Collapsible>
  );
}
