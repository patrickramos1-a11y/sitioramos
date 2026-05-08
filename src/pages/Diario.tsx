import { useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResponsavelSelect } from "@/components/responsaveis/ResponsavelSelect";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import {
  useJournalEntries,
  PendingAttachment,
  JournalEntry,
} from "@/hooks/useJournalEntries";
import { AudioRecorder, RecordedAudio } from "@/components/diario/AudioRecorder";
import {
  Mic,
  Camera,
  Video,
  ChevronDown,
  ChevronRight,
  X,
  Star,
  Image as ImageIcon,
  PlayCircle,
  Save,
  NotebookPen,
  Clock,
  Tag,
  CheckCircle2,
  ListChecks,
  Receipt,
  Trash2,
  MapPin,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { enqueueJournalEntry } from "@/lib/offlineQueue";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Wifi, WifiOff, CloudUpload } from "lucide-react";

const NONE = "__none__";

const TIPOS = [
  { value: "observacao", label: "Registro geral" },
  { value: "plantio", label: "Plantio" },
  { value: "limpeza", label: "Limpeza / manejo" },
  { value: "colheita", label: "Colheita" },
  { value: "manutencao", label: "Manutenção" },
  { value: "ocorrencia", label: "Ocorrência" },
  { value: "clima", label: "Clima" },
  { value: "ambiental", label: "Ambiental" },
];

const STATUS = [
  { value: "informativo", label: "Informativo" },
  { value: "atencao", label: "Atenção" },
  { value: "pendente", label: "Pendente" },
  { value: "resolvido", label: "Resolvido" },
  { value: "importante", label: "Importante" },
];

interface PhotoItem {
  blob: Blob;
  url: string;
  width?: number;
  height?: number;
}
interface VideoItem {
  blob: Blob;
  url: string;
  duration?: number;
}

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function fmtDur(s?: number | null) {
  if (!s && s !== 0) return "";
  const m = Math.floor((s || 0) / 60);
  const sec = Math.floor((s || 0) % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function Diario() {
  const navigate = useNavigate();
  const [filterReviewed, setFilterReviewed] = useState<"all" | "todo" | "done">("all");
  const [filterType, setFilterType] = useState<string>("");
  const [filterAreaId, setFilterAreaId] = useState<string>("");
  const { data: entries = [], create, markReviewed, convertToTask, remove } = useJournalEntries(50, {
    type: filterType || undefined,
    areaId: filterAreaId || undefined,
    reviewed: filterReviewed === "all" ? undefined : filterReviewed === "done",
  });
  const { areas = [] } = useAreas() as any;
  const { cycles = [] } = useCycles() as any;

  const [text, setText] = useState("");
  const [audio, setAudio] = useState<RecordedAudio | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [video, setVideo] = useState<VideoItem | null>(null);
  const [recording, setRecording] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const [entryType, setEntryType] = useState("observacao");
  const [areaId, setAreaId] = useState("");
  const [cycleId, setCycleId] = useState("");
  const [status, setStatus] = useState("informativo");
  const [responsavelId, setResponsavelId] = useState("");
  const [notes, setNotes] = useState("");
  const [weather, setWeather] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [important, setImportant] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const photoInput = useRef<HTMLInputElement>(null);
  const photoLibInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const videoLibInput = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.url));
      if (video) URL.revokeObjectURL(video.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasContent =
    text.trim().length > 0 || !!audio || photos.length > 0 || !!video;

  const reset = () => {
    setText("");
    setAudio(null);
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    if (video) URL.revokeObjectURL(video.url);
    setVideo(null);
    setNotes("");
    setWeather("");
    setTagsText("");
    setImportant(false);
    setEntryType("observacao");
    setAreaId("");
    setCycleId("");
    setStatus("informativo");
    setResponsavelId("");
    setMoreOpen(false);
    setCoords(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const captureLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocalização não suportada neste dispositivo");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocating(false);
        toast.success("Localização capturada");
      },
      (err) => {
        setLocating(false);
        const msg =
          err.code === 1
            ? "Permissão de localização negada"
            : err.code === 3
            ? "Tempo esgotado ao buscar localização"
            : "Não foi possível obter a localização";
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const handlePhotoSelect = async (files: FileList | null) => {
    if (!files) return;
    const items: PhotoItem[] = [];
    for (const f of Array.from(files)) {
      const url = URL.createObjectURL(f);
      const dim = await new Promise<{ w: number; h: number }>((res) => {
        const img = new Image();
        img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => res({ w: 0, h: 0 });
        img.src = url;
      });
      items.push({ blob: f, url, width: dim.w, height: dim.h });
    }
    setPhotos((prev) => [...prev, ...items]);
  };

  const handleVideoSelect = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const f = files[0];
    const url = URL.createObjectURL(f);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    v.onloadedmetadata = () => {
      if (v.duration && v.duration > 60) {
        URL.revokeObjectURL(url);
        toast.error("Vídeo acima do limite de 60 segundos.");
        return;
      }
      setVideo({ blob: f, url, duration: v.duration });
    };
  };

  const removePhoto = (i: number) => {
    setPhotos((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(i, 1);
      URL.revokeObjectURL(removed.url);
      return copy;
    });
  };

  const handleSave = () => {
    if (!hasContent) return;
    const attachments: PendingAttachment[] = [];
    if (audio) {
      attachments.push({
        kind: "audio",
        blob: audio.blob,
        mime_type: audio.mime,
        duration_seconds: audio.duration,
      });
    }
    photos.forEach((p) =>
      attachments.push({
        kind: "photo",
        blob: p.blob,
        mime_type: p.blob.type || "image/jpeg",
        width: p.width,
        height: p.height,
      }),
    );
    if (video) {
      attachments.push({
        kind: "video",
        blob: video.blob,
        mime_type: video.blob.type || "video/mp4",
        duration_seconds: video.duration,
      });
    }

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const entryPayload = {
      entry_date: new Date().toISOString().split("T")[0],
      entry_type: entryType,
      description: text.trim() || null,
      area_id: areaId || null,
      cycle_id: cycleId || null,
      responsavel_id: responsavelId || null,
      status,
      notes: notes.trim() || null,
      weather: weather.trim() || null,
      tags,
      is_important: important,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      location_accuracy: coords?.accuracy ?? null,
      reviewed: !!(areaId || cycleId || entryType !== "observacao"),
    };

    if (!navigator.onLine) {
      enqueueJournalEntry(entryPayload, attachments).then(() => {
        toast.success("Salvo offline — sincroniza quando voltar a internet");
        reset();
      });
      return;
    }

    create.mutate(
      { entry: entryPayload, attachments },
      { onSuccess: reset },
    );
  };

  const handleConvertToExpense = (entry: JournalEntry) => {
    const params = new URLSearchParams({ new: "1" });
    if (entry.area_id) params.set("area_id", entry.area_id);
    if (entry.cycle_id) params.set("cycle_id", entry.cycle_id);
    if (entry.description) params.set("descricao", entry.description.slice(0, 80));
    params.set("from_journal", entry.id);
    navigate(`/lancamentos?${params.toString()}`);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl pb-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-6">
        <div className="space-y-4">
          {/* Header compacto */}
          <header className="flex items-start gap-3">
          <span className="h-10 w-10 rounded-xl bg-brand-leaf/15 text-brand-leaf flex items-center justify-center shrink-0">
            <NotebookPen className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold text-brand-forest">
              Diário de Campo
            </h1>
            <p className="text-xs text-muted-foreground">
              Registre o dia a dia do sítio.
            </p>
          </div>
        </header>

        {/* Card de captura */}
        <section
          className={cn(
            "relative rounded-2xl border border-brand-leaf/20 p-4 space-y-3",
            "bg-[linear-gradient(180deg,hsl(44_40%_98%),hsl(40_30%_94%))]",
            "shadow-[0_10px_28px_-18px_hsl(145_60%_12%/0.35)]",
          )}
        >
          <div className="font-display text-[15px] font-semibold text-brand-forest">
            O que aconteceu no campo hoje?
          </div>

          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva uma observação rápida..."
            rows={3}
            className="resize-none bg-card/80 border-brand-leaf/20 focus-visible:ring-brand-leaf/40"
          />

          {/* Áudio em gravação */}
          {recording && (
            <AudioRecorder
              onConfirm={(a) => {
                setAudio(a);
                setRecording(false);
              }}
              onCancel={() => setRecording(false)}
            />
          )}

          {/* Áudio confirmado */}
          {audio && !recording && (
            <div className="flex items-center gap-2 rounded-xl border bg-card p-2">
              <span className="h-8 w-8 rounded-lg bg-brand-leaf/15 text-brand-leaf flex items-center justify-center">
                <Mic className="h-4 w-4" />
              </span>
              <audio src={audio.url} controls className="flex-1 h-8" />
              <Button type="button" size="icon" variant="ghost" onClick={() => setAudio(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Fotos */}
          {photos.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                    aria-label="Remover"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Vídeo */}
          {video && (
            <div className="relative rounded-xl overflow-hidden border bg-black">
              <video src={video.url} controls className="w-full max-h-56" />
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(video.url);
                  setVideo(null);
                }}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center"
                aria-label="Remover vídeo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Botões de mídia */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-col gap-0.5 border-brand-leaf/30 text-brand-forest hover:bg-brand-leaf/10"
              onClick={() => setRecording(true)}
              disabled={recording || !!audio}
            >
              <Mic className="h-4 w-4" />
              <span className="text-[10px]">Áudio</span>
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-col gap-0.5 border-brand-leaf/30 text-brand-forest hover:bg-brand-leaf/10"
                >
                  <Camera className="h-4 w-4" />
                  <span className="text-[10px]">Foto</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-44 p-1">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
                  onClick={() => photoInput.current?.click()}
                >
                  <Camera className="h-4 w-4 text-brand-leaf" /> Tirar foto
                </button>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
                  onClick={() => photoLibInput.current?.click()}
                >
                  <ImageIcon className="h-4 w-4 text-brand-leaf" /> Da biblioteca
                </button>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-col gap-0.5 border-brand-leaf/30 text-brand-forest hover:bg-brand-leaf/10"
                  disabled={!!video}
                >
                  <Video className="h-4 w-4" />
                  <span className="text-[10px]">Vídeo</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-44 p-1">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
                  onClick={() => videoInput.current?.click()}
                >
                  <Video className="h-4 w-4 text-brand-leaf" /> Gravar vídeo
                </button>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
                  onClick={() => videoLibInput.current?.click()}
                >
                  <PlayCircle className="h-4 w-4 text-brand-leaf" /> Da biblioteca
                </button>
              </PopoverContent>
            </Popover>
          </div>

          {/* Localização GPS */}
          <div className="flex items-center gap-2">
            {coords ? (
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-brand-leaf/30 bg-brand-leaf/5 px-3 py-2">
                <MapPin className="h-4 w-4 text-brand-leaf shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-brand-forest truncate">
                    {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  </div>
                  {coords.accuracy != null && (
                    <div className="text-[10px] text-muted-foreground">
                      precisão ~{Math.round(coords.accuracy)} m
                    </div>
                  )}
                </div>
                <a
                  href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-7 w-7 rounded-md flex items-center justify-center text-brand-leaf hover:bg-brand-leaf/10"
                  aria-label="Abrir no mapa"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setCoords(null)}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted"
                  aria-label="Remover localização"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="h-9 flex-1 border-brand-leaf/30 text-brand-forest hover:bg-brand-leaf/10 text-xs"
                onClick={captureLocation}
                disabled={locating}
              >
                {locating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                {locating ? "Buscando localização..." : "Marcar minha localização"}
              </Button>
            )}
          </div>

          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => {
              handlePhotoSelect(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={photoLibInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handlePhotoSelect(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={videoInput}
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              handleVideoSelect(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={videoLibInput}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              handleVideoSelect(e.target.files);
              e.target.value = "";
            }}
          />

          {/* Adicionar detalhes */}
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between text-xs font-medium text-brand-leaf hover:text-brand-forest py-1"
              >
                <span className="flex items-center gap-1">
                  {detailsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  Adicionar detalhes
                </span>
                {!detailsOpen && (
                  <span className="text-[10px] text-muted-foreground">opcional</span>
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px]">Tipo</Label>
                  <Select value={entryType} onValueChange={setEntryType}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px]">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px]">Área</Label>
                  <Select value={areaId || NONE} onValueChange={(v) => setAreaId(v === NONE ? "" : v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— Nenhuma —</SelectItem>
                      {areas.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px]">Projeto / Ciclo</Label>
                  <Select value={cycleId || NONE} onValueChange={(v) => setCycleId(v === NONE ? "" : v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— Nenhum —</SelectItem>
                      {cycles.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.cultura || "Ciclo"}{c.areas?.nome ? ` · ${c.areas.nome}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-brand-forest"
                  >
                    {moreOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    Mais opções
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-3">
                  <ResponsavelSelect
                    label="Responsável"
                    value={responsavelId}
                    onChange={(id) => setResponsavelId(id || "")}
                  />
                  <div>
                    <Label className="text-[11px]">Clima</Label>
                    <Input
                      value={weather}
                      onChange={(e) => setWeather(e.target.value)}
                      placeholder="Ex.: ensolarado, chuva fraca"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] flex items-center gap-1"><Tag className="h-3 w-3" /> Tags</Label>
                    <Input
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                      placeholder="separadas por vírgula"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Observações</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Notas livres"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportant((v) => !v)}
                    className={cn(
                      "flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition w-full",
                      important
                        ? "bg-brand-sun/15 border-brand-sun text-brand-forest font-medium"
                        : "border-border text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    <Star className={cn("h-4 w-4", important && "fill-brand-sun text-brand-sun")} />
                    Marcar como importante
                  </button>
                </CollapsibleContent>
              </Collapsible>
            </CollapsibleContent>
          </Collapsible>

          {/* Salvar */}
          <Button
            type="button"
            disabled={!hasContent || create.isPending}
            onClick={handleSave}
            className="w-full h-12 bg-brand-forest hover:bg-brand-forest/90 text-brand-paper font-display"
          >
            <Save className="h-4 w-4 mr-2" />
            {create.isPending ? "Salvando..." : "Salvar Registro"}
          </Button>
          </section>
        </div>

        {/* Coluna direita — timeline com filtros */}
        <div className="mt-4 md:mt-0 space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <h2 className="text-[11px] uppercase tracking-[0.16em] font-semibold text-brand-forest/70">
              Registros recentes
            </h2>
            <span className="text-[10px] text-muted-foreground">{entries.length}</span>
          </div>

          {/* Filtros simples */}
          <div className="flex flex-wrap gap-1.5 px-1">
            {(["all", "todo", "done"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFilterReviewed(opt)}
                className={cn(
                  "text-[10px] px-2.5 py-1 rounded-full border transition",
                  filterReviewed === opt
                    ? "bg-brand-forest text-brand-paper border-brand-forest"
                    : "bg-card text-muted-foreground border-border hover:bg-muted/50",
                )}
              >
                {opt === "all" ? "Todos" : opt === "todo" ? "A revisar" : "Revisados"}
              </button>
            ))}
            <Select value={filterType || NONE} onValueChange={(v) => setFilterType(v === NONE ? "" : v)}>
              <SelectTrigger className="h-7 text-[10px] w-auto px-2 gap-1">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todos os tipos</SelectItem>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAreaId || NONE} onValueChange={(v) => setFilterAreaId(v === NONE ? "" : v)}>
              <SelectTrigger className="h-7 text-[10px] w-auto px-2 gap-1">
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todas as áreas</SelectItem>
                {areas.map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {entries.length === 0 && (
            <div className="text-xs text-muted-foreground px-1 py-6 text-center">
              Nenhum registro encontrado.
            </div>
          )}
          <div className="space-y-2">
            {entries.map((e) => (
              <EntryCard
                key={e.id}
                entry={e}
                onMarkReviewed={() => markReviewed.mutate({ id: e.id })}
                onConvertToTask={() => convertToTask.mutate(e)}
                onConvertToExpense={() => handleConvertToExpense(e)}
                onDelete={() => {
                  if (confirm("Excluir este registro?")) remove.mutate(e.id);
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

interface EntryCardProps {
  entry: JournalEntry;
  onMarkReviewed?: () => void;
  onConvertToTask?: () => void;
  onConvertToExpense?: () => void;
  onDelete?: () => void;
}

function EntryCard({ entry, onMarkReviewed, onConvertToTask, onConvertToExpense, onDelete }: EntryCardProps) {
  const photos = entry.attachments?.filter((a) => a.kind === "photo") || [];
  const audios = entry.attachments?.filter((a) => a.kind === "audio") || [];
  const videos = entry.attachments?.filter((a) => a.kind === "video") || [];
  const isUnreviewed =
    !entry.reviewed && !entry.area_id && !entry.cycle_id && entry.entry_type === "observacao";
  const tipo = TIPOS.find((t) => t.value === entry.entry_type)?.label;

  return (
    <article className="rounded-xl border border-border/60 bg-card p-3 space-y-2 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {relTime(entry.created_at)}
          {tipo && entry.entry_type !== "observacao" && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-brand-leaf/10 text-brand-leaf font-medium">
              {tipo}
            </span>
          )}
          {entry.is_important && <Star className="h-3 w-3 fill-brand-sun text-brand-sun" />}
        </div>
        {isUnreviewed && (
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-brand-sun/15 text-[hsl(38_95%_38%)] font-semibold">
            Não revisado
          </span>
        )}
      </div>

      {entry.description && (
        <p className="text-sm text-foreground leading-snug whitespace-pre-wrap line-clamp-4">
          {entry.description}
        </p>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-1">
          {photos.slice(0, 4).map((p) => (
            <div key={p.id} className="aspect-square rounded-md overflow-hidden bg-muted">
              <img src={p.url} alt="" loading="lazy" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {audios.map((a) => (
        <audio key={a.id} controls src={a.url} className="w-full h-8" />
      ))}

      {videos.map((v) => (
        <video key={v.id} controls src={v.url} className="w-full max-h-48 rounded-md bg-black" />
      ))}

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {audios.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Mic className="h-3 w-3" /> {fmtDur(audios[0].duration_seconds)}
            </span>
          )}
          {photos.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> {photos.length}
            </span>
          )}
          {videos.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <PlayCircle className="h-3 w-3" /> vídeo
            </span>
          )}
          {entry.latitude != null && entry.longitude != null && (
            <a
              href={`https://www.google.com/maps?q=${entry.latitude},${entry.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-brand-leaf hover:underline"
              title="Abrir no mapa"
            >
              <MapPin className="h-3 w-3" /> mapa
            </a>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {!entry.reviewed && onMarkReviewed && (
            <button
              type="button"
              onClick={onMarkReviewed}
              title="Marcar como revisado"
              className="h-7 w-7 rounded-md flex items-center justify-center text-brand-leaf hover:bg-brand-leaf/10"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          )}
          {onConvertToTask && (
            <button
              type="button"
              onClick={onConvertToTask}
              title="Converter em tarefa"
              className="h-7 w-7 rounded-md flex items-center justify-center text-brand-forest hover:bg-brand-forest/10"
            >
              <ListChecks className="h-3.5 w-3.5" />
            </button>
          )}
          {onConvertToExpense && (
            <button
              type="button"
              onClick={onConvertToExpense}
              title="Lançar como despesa"
              className="h-7 w-7 rounded-md flex items-center justify-center text-[hsl(15_55%_45%)] hover:bg-[hsl(15_55%_45%)]/10"
            >
              <Receipt className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="Excluir"
              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
