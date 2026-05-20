import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRasterMapLayers } from "@/hooks/useRasterMapLayers";
import { fileToDataUrl, type RasterMapLayer } from "@/lib/rasterLayers";
import { Focus, Image as ImageIcon, Import, Loader2, Eye, EyeOff, Trash2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onFocusLayer: (layerId: string) => void;
  onInteractionChange?: (busy: boolean) => void;
}

const EMPTY_BOUNDS = {
  south: "-0.9685593751",
  west: "-47.7825900008",
  north: "-0.9410537433",
  east: "-47.7743637921",
};

export function RasterLayersPanel({ onFocusLayer, onInteractionChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const rasterLayers = useRasterMapLayers();
  const [importing, setImporting] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ fileName: string; dataUrl: string } | null>(null);
  const [editingLayer, setEditingLayer] = useState<RasterMapLayer | null>(null);
  const [name, setName] = useState("Imagem georreferenciada — Sitio Ramos");
  const [description, setDescription] = useState("");
  const [opacity, setOpacity] = useState([85]);
  const [bounds, setBounds] = useState(EMPTY_BOUNDS);

  const layers = rasterLayers.data || [];

  const openImport = () => fileInputRef.current?.click();

  const resetForm = () => {
    setName("Imagem georreferenciada — Sitio Ramos");
    setDescription("");
    setOpacity([85]);
    setBounds(EMPTY_BOUNDS);
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setImporting(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setPendingImage({ fileName: file.name, dataUrl });
      setName(file.name.replace(/\.(png|jpg|jpeg|webp)$/i, ""));
      setDescription("Imagem raster georreferenciada da area do Sitio Ramos.");
    } catch (error: any) {
      toast.error(error?.message || "Falha ao ler imagem.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveLayer = async () => {
    const current = editingLayer || (pendingImage ? { imageDataUrl: pendingImage.dataUrl, sourceFileName: pendingImage.fileName } : null);
    if (!current) return;

    await rasterLayers.save.mutateAsync({
      id: editingLayer?.id,
      name: name.trim() || "Imagem georreferenciada — Sitio Ramos",
      description: description.trim() || null,
      category: "Imagem Georreferenciada",
      sourceFileName: current.sourceFileName,
      imageDataUrl: current.imageDataUrl,
      visible: editingLayer?.visible ?? true,
      opacity: opacity[0] / 100,
      bounds: [
        [Number(bounds.south), Number(bounds.west)],
        [Number(bounds.north), Number(bounds.east)],
      ],
      importedAt: editingLayer?.importedAt || new Date().toISOString(),
    });

    toast.success(editingLayer ? "Imagem atualizada." : "Imagem georreferenciada salva.");
    setPendingImage(null);
    setEditingLayer(null);
    resetForm();
  };

  const startEdit = (layer: RasterMapLayer) => {
    setEditingLayer(layer);
    setName(layer.name);
    setDescription(layer.description || "");
    setOpacity([Math.round(layer.opacity * 100)]);
    setBounds({
      south: String(layer.bounds[0][0]),
      west: String(layer.bounds[0][1]),
      north: String(layer.bounds[1][0]),
      east: String(layer.bounds[1][1]),
    });
  };

  const dialogOpen = Boolean(pendingImage || editingLayer);

  useEffect(() => {
    onInteractionChange?.(dialogOpen);
  }, [dialogOpen, onInteractionChange]);

  return (
    <section className="rounded-2xl border border-brand-leaf/15 bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-brand-forest">Imagem georreferenciada</h3>
          <p className="text-xs text-muted-foreground">
            Camada raster fixa da propriedade. Use uma imagem da area com bounds geograficos conhecidos.
          </p>
        </div>
        <Button type="button" variant="outline" className="border-brand-leaf/25" onClick={openImport} disabled={importing}>
          {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Import className="mr-2 h-4 w-4" />}
          Importar imagem
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
      </div>

      <div className="mt-4 space-y-2">
        {layers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-leaf/20 bg-muted/10 p-5 text-sm text-muted-foreground">
            Nenhuma imagem georreferenciada configurada ainda. Quando voce tiver a imagem atual da area, importe aqui com os limites geograficos.
          </div>
        ) : (
          layers.map((layer) => (
            <article key={layer.id} className="rounded-xl border border-brand-leaf/15 bg-card p-3">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-brand-leaf/10 p-2 text-brand-leaf">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-brand-forest">{layer.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {layer.sourceFileName} · opacidade {Math.round(layer.opacity * 100)}%
                  </div>
                  {layer.description && <p className="mt-1 text-xs text-foreground/80 line-clamp-2">{layer.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => rasterLayers.toggleVisibility.mutate(layer)}
                    className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted"
                    title={layer.visible ? "Ocultar imagem" : "Mostrar imagem"}
                  >
                    {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onFocusLayer(layer.id)}
                    className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted"
                    title="Centralizar na imagem"
                  >
                    <Focus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(layer)}
                    className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted"
                    title="Editar imagem"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => rasterLayers.remove.mutate(layer.id)}
                    className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Excluir imagem"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && (setPendingImage(null), setEditingLayer(null), resetForm())}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingLayer ? "Editar imagem georreferenciada" : "Importar imagem georreferenciada"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-[11px]">Nome</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-[11px]">Descricao</Label>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
            </div>
            <div>
              <Label className="text-[11px]">Opacidade</Label>
              <Slider value={opacity} onValueChange={setOpacity} max={100} min={10} step={5} className="mt-3" />
              <div className="mt-1 text-[11px] text-muted-foreground">{opacity[0]}%</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-[11px]">Sul</Label>
                <Input value={bounds.south} onChange={(event) => setBounds((prev) => ({ ...prev, south: event.target.value }))} className="h-9" />
              </div>
              <div>
                <Label className="text-[11px]">Oeste</Label>
                <Input value={bounds.west} onChange={(event) => setBounds((prev) => ({ ...prev, west: event.target.value }))} className="h-9" />
              </div>
              <div>
                <Label className="text-[11px]">Norte</Label>
                <Input value={bounds.north} onChange={(event) => setBounds((prev) => ({ ...prev, north: event.target.value }))} className="h-9" />
              </div>
              <div>
                <Label className="text-[11px]">Leste</Label>
                <Input value={bounds.east} onChange={(event) => setBounds((prev) => ({ ...prev, east: event.target.value }))} className="h-9" />
              </div>
            </div>
            <div className="rounded-lg border border-brand-leaf/15 bg-muted/10 px-3 py-2 text-[11px] text-muted-foreground">
              Use uma imagem da area em PNG/JPG/WEBP e informe os limites geograficos da imagem. Para a imagem oficial mais atual, o ideal e partir de um GeoTIFF ou exportar do QGIS/Copernicus com bounds conhecidos.
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => (setPendingImage(null), setEditingLayer(null), resetForm())}>Cancelar</Button>
            <Button onClick={() => void saveLayer()} className="bg-brand-forest hover:bg-brand-forest/90">
              Salvar imagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
