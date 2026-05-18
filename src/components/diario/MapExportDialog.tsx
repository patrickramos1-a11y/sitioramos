import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PropertyMapLayer } from "@/lib/propertyLayers";
import { Loader2 } from "lucide-react";

export interface MapExportOptions {
  format: "kml" | "kmz";
  onlyVisible: boolean;
  includeDiary: boolean;
  selectedLayerIds: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layers: PropertyMapLayer[];
  onExport: (options: MapExportOptions) => Promise<void>;
}

export function MapExportDialog({ open, onOpenChange, layers, onExport }: Props) {
  const [format, setFormat] = useState<"kml" | "kmz">("kml");
  const [onlyVisible, setOnlyVisible] = useState(true);
  const [includeDiary, setIncludeDiary] = useState(true);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedLayerIds(layers.map((layer) => layer.id));
    }
  }, [open, layers]);

  const effectiveSelected = useMemo(() => {
    const base = layers.filter((layer) => selectedLayerIds.includes(layer.id));
    return onlyVisible ? base.filter((layer) => layer.visible) : base;
  }, [layers, onlyVisible, selectedLayerIds]);

  const toggleLayer = (layerId: string) => {
    setSelectedLayerIds((current) =>
      current.includes(layerId) ? current.filter((id) => id !== layerId) : [...current, layerId],
    );
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport({
        format,
        onlyVisible,
        includeDiary,
        selectedLayerIds: effectiveSelected.map((layer) => layer.id),
      });
      onOpenChange(false);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exportar mapa do Sitio Ramos</DialogTitle>
          <DialogDescription>
            Gere KML ou KMZ das camadas da propriedade e, opcionalmente, dos registros geograficos do Diario de Campo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[11px]">Formato</Label>
              <Select value={format} onValueChange={(value: "kml" | "kmz") => setFormat(value)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kml">KML</SelectItem>
                  <SelectItem value="kmz">KMZ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-brand-leaf/15 bg-muted/10 p-3 text-xs text-muted-foreground">
              <div className="font-medium text-brand-forest">Resumo</div>
              <div className="mt-1">
                {effectiveSelected.length} camada{effectiveSelected.length === 1 ? "" : "s"} selecionada{effectiveSelected.length === 1 ? "" : "s"}
              </div>
              <div>{includeDiary ? "Inclui registros do Diario" : "Somente camadas fixas"}</div>
            </div>
          </div>

          <div className="grid gap-2 rounded-xl border border-brand-leaf/15 bg-card p-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={onlyVisible} onCheckedChange={(checked) => setOnlyVisible(checked === true)} />
              <span>Exportar somente camadas visiveis</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={includeDiary} onCheckedChange={(checked) => setIncludeDiary(checked === true)} />
              <span>Incluir registros geograficos do Diario de Campo</span>
            </label>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-brand-forest">Camadas da Propriedade</div>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-brand-leaf/15 bg-card p-3">
              {layers.map((layer) => (
                <label key={layer.id} className="flex items-start gap-3 rounded-lg border border-brand-leaf/10 px-3 py-2">
                  <Checkbox
                    checked={selectedLayerIds.includes(layer.id)}
                    onCheckedChange={() => toggleLayer(layer.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-brand-forest">{layer.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {layer.type} · {layer.visible ? "visivel" : "oculta"}
                    </div>
                    {layer.description && (
                      <div className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{layer.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={exporting}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            className="bg-brand-forest hover:bg-brand-forest/90"
            disabled={exporting || (!effectiveSelected.length && !includeDiary)}
          >
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
