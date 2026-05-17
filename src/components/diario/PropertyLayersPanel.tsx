import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PROPERTY_LAYER_TYPE_OPTIONS,
  defaultStyleForLayerType,
  parseKmlOrKmzFile,
  type ParsedImportLayer,
  type PropertyLayerType,
} from "@/lib/propertyLayers";
import { usePropertyMapLayers } from "@/hooks/usePropertyMapLayers";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Focus,
  Import,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  onFocusLayer: (layerId: string) => void;
}

export function PropertyLayersPanel({ onFocusLayer }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(true);
  const [importing, setImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<ParsedImportLayer | null>(null);
  const [editLayerId, setEditLayerId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<PropertyLayerType>("limite_imovel");
  const { data: layers = [], save, remove, toggleVisibility, isLoading } = usePropertyMapLayers();

  const editLayer = useMemo(
    () => layers.find((layer) => layer.id === editLayerId) ?? null,
    [editLayerId, layers],
  );

  const activeLimitLayer = layers.find((layer) => layer.type === "limite_imovel");

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setImporting(true);
    try {
      const parsed = await parseKmlOrKmzFile(file);
      setPendingImport(parsed);
      setFormName(parsed.name || file.name.replace(/\.(kml|kmz)$/i, ""));
      setFormDescription(parsed.description || "");
      setFormType("limite_imovel");
    } catch (error: any) {
      toast.error(error?.message || "Falha ao importar arquivo.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingImport) return;
    await save.mutateAsync({
      name: formName.trim() || pendingImport.name,
      type: formType,
      category: "Camada da Propriedade",
      description: formDescription.trim() || null,
      geojson: pendingImport.geojson,
      sourceFormat: pendingImport.sourceFormat,
      sourceOrigin: "imported",
      sourceFileName: pendingImport.sourceFileName,
      sourcePath: null,
      visible: true,
      style: defaultStyleForLayerType(formType),
      importedAt: new Date().toISOString(),
    });
    toast.success("Camada importada.");
    setPendingImport(null);
  };

  const startEdit = () => {
    if (!editLayer) return;
    setFormName(editLayer.name);
    setFormDescription(editLayer.description || "");
    setFormType(editLayer.type);
  };

  const handleSaveEdit = async () => {
    if (!editLayer) return;
    await save.mutateAsync({
      ...editLayer,
      name: formName.trim() || editLayer.name,
      description: formDescription.trim() || null,
      type: formType,
      style: defaultStyleForLayerType(formType),
    });
    toast.success("Camada atualizada.");
    setEditLayerId(null);
  };

  return (
    <div className="rounded-lg border border-brand-leaf/20 bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-brand-forest hover:bg-muted/40"
      >
        <span className="flex items-center gap-1.5">
          Camadas da Propriedade
          <span className="text-muted-foreground font-normal">· {layers.length}</span>
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="space-y-3 p-3 pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-[11px]"
              onClick={handlePickFile}
              disabled={importing}
            >
              {importing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Import className="h-3.5 w-3.5 mr-1" />}
              Importar KML/KMZ
            </Button>
            {activeLimitLayer && (
              <Button
                type="button"
                size="sm"
                className="h-8 text-[11px] bg-brand-forest hover:bg-brand-forest/90"
                onClick={() => onFocusLayer(activeLimitLayer.id)}
              >
                <Focus className="h-3.5 w-3.5 mr-1" />
                Centralizar no Sitio Ramos
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".kml,.kmz"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
            />
          </div>

          <div className="text-[11px] text-muted-foreground">
            Dados fixos da propriedade: limite do imovel, talhoes, areas de manejo e outras camadas permanentes.
          </div>

          {isLoading ? (
            <div className="text-xs text-muted-foreground">Carregando camadas...</div>
          ) : (
            <ul className="space-y-2">
              {layers.map((layer) => (
                <li key={layer.id} className="rounded-lg border border-brand-leaf/15 bg-card p-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs text-brand-forest truncate">{layer.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {PROPERTY_LAYER_TYPE_OPTIONS.find((item) => item.value === layer.type)?.label} · {layer.sourceFileName}
                      </div>
                      {layer.description && (
                        <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{layer.description}</div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => toggleVisibility.mutate(layer)}
                        className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:bg-muted"
                        title={layer.visible ? "Ocultar camada" : "Mostrar camada"}
                      >
                        {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onFocusLayer(layer.id)}
                        className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:bg-muted"
                        title="Centralizar nesta camada"
                      >
                        <Focus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditLayerId(layer.id);
                          setFormName(layer.name);
                          setFormDescription(layer.description || "");
                          setFormType(layer.type);
                        }}
                        className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:bg-muted"
                        title="Editar camada"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove.mutate(layer.id)}
                        className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Excluir camada"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Dialog open={!!pendingImport} onOpenChange={(value) => !value && setPendingImport(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar camada da propriedade</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[11px]">Nome da camada</Label>
              <Input value={formName} onChange={(event) => setFormName(event.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-[11px]">Tipo da camada</Label>
              <Select value={formType} onValueChange={(value: PropertyLayerType) => setFormType(value)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_LAYER_TYPE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px]">Descricao</Label>
              <Textarea value={formDescription} onChange={(event) => setFormDescription(event.target.value)} rows={3} />
            </div>
            <div className="text-[11px] text-muted-foreground">
              Arquivo: {pendingImport?.sourceFileName}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingImport(null)}>Cancelar</Button>
            <Button onClick={handleConfirmImport} className="bg-brand-forest hover:bg-brand-forest/90">Salvar camada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editLayer} onOpenChange={(value) => !value && setEditLayerId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar camada da propriedade</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[11px]">Nome da camada</Label>
              <Input value={formName} onChange={(event) => setFormName(event.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-[11px]">Tipo da camada</Label>
              <Select value={formType} onValueChange={(value: PropertyLayerType) => setFormType(value)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_LAYER_TYPE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px]">Descricao</Label>
              <Textarea value={formDescription} onChange={(event) => setFormDescription(event.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditLayerId(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} className="bg-brand-forest hover:bg-brand-forest/90">Salvar alteracoes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
