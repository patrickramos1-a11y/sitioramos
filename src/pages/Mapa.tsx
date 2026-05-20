import { useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GeographicRecordsPanel } from "@/components/diario/GeographicRecordsPanel";
import { DiaryMapView } from "@/components/diario/DiaryMapView";
import { MapExportDialog, type MapExportOptions } from "@/components/diario/MapExportDialog";
import { PropertyLayersPanel } from "@/components/diario/PropertyLayersPanel";
import { useMapGeographicRecords } from "@/hooks/useMapGeographicRecords";
import { usePropertyMapLayers } from "@/hooks/usePropertyMapLayers";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { exportMapKml, exportMapKmz, loadDiaryExportRecords } from "@/lib/kmlExport";
import { Download, Focus, Import, Layers3, Map as MapIcon, MapPin, Maximize2, Minimize2, Route, Shapes } from "lucide-react";
import { toast } from "sonner";

type FocusRequest = { target: "property" | "geometry"; id: string; nonce: number } | null;
type SectionTab = "mapa" | "camadas" | "registros";

export default function Mapa() {
  const isMobile = useIsMobile();
  const propertyLayers = usePropertyMapLayers();
  const records = useMapGeographicRecords();
  const [focusRequest, setFocusRequest] = useState<FocusRequest>(null);
  const [importNonce, setImportNonce] = useState(0);
  const [mobileLayersOpen, setMobileLayersOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(!isMobile);
  const [panelBusy, setPanelBusy] = useState(false);
  const [recordsBusy, setRecordsBusy] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionTab>("mapa");
  const previousExpanded = useRef(mapExpanded);

  const layers = propertyLayers.data || [];
  const limitLayer = useMemo(() => layers.find((layer) => layer.type === "limite_imovel") ?? null, [layers]);
  const visibleLayers = layers.filter((layer) => layer.visible);

  const mapGeometries = useMemo(
    () =>
      records.visibleItems.map((item) => ({
        id: item.id,
        entry_id: item.entryId || "",
        geometry_type: item.geometryType,
        name: item.name,
        description: item.description,
        geojson: item.geojson,
        area_m2: item.areaM2,
        length_m: item.lengthM,
        responsavel_id: item.entry?.responsavel_id || null,
        ordem: 0,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      })),
    [records.visibleItems],
  );

  const pointCount = records.items.filter((item) => item.geometryType === "point").length;
  const lineCount = records.items.filter((item) => item.geometryType === "line").length;
  const polygonCount = records.items.filter((item) => item.geometryType === "polygon").length;
  const unlinkedCount = records.items.filter((item) => !item.entry?.area_id && !item.entry?.cycle_id).length;
  const visibleRecordCount = records.visibleItems.length;
  const mapBusy = panelBusy || recordsBusy || exportOpen || mobileLayersOpen;

  const focusLayer = (layerId: string) => {
    setFocusRequest({ target: "property", id: layerId, nonce: Date.now() });
    setActiveSection("mapa");
  };

  const focusRecord = (recordId: string) => {
    setFocusRequest({ target: "geometry", id: recordId, nonce: Date.now() });
    setActiveSection("mapa");
  };

  const centerOnSitio = () => {
    if (!limitLayer) {
      toast.error("Importe o limite do imovel para centralizar no Sitio Ramos.");
      return;
    }
    focusLayer(limitLayer.id);
  };

  const openImport = () => {
    if (isMobile) setMobileLayersOpen(true);
    else setActiveSection("camadas");
    setMapExpanded(false);
    setTimeout(() => setImportNonce((value) => value + 1), 30);
  };

  const handleExport = async (options: MapExportOptions) => {
    const selectedLayers = layers.filter((layer) => options.selectedLayerIds.includes(layer.id));
    const diaryRecords = options.includeDiary ? await loadDiaryExportRecords() : [];

    if (!selectedLayers.length && !diaryRecords.length) {
      toast.error("Nao ha dados geograficos disponiveis para exportar.");
      return;
    }

    if (options.format === "kmz") {
      await exportMapKmz({
        documentName: "Mapa do Sitio Ramos",
        propertyLayers: selectedLayers,
        diaryRecords,
      });
    } else {
      await exportMapKml({
        documentName: "Mapa do Sitio Ramos",
        propertyLayers: selectedLayers,
        diaryRecords,
      });
    }

    toast.success(options.format === "kmz" ? "KMZ gerado com sucesso." : "KML gerado com sucesso.");
  };

  useEffect(() => {
    if (mapBusy) {
      previousExpanded.current = mapExpanded;
      setMapExpanded(false);
    } else if (previousExpanded.current) {
      setMapExpanded(true);
    }
  }, [mapBusy]);

  const tabs: Array<{ id: SectionTab; label: string }> = [
    { id: "mapa", label: "Mapa" },
    { id: "camadas", label: "Camadas" },
    { id: "registros", label: "Registros" },
  ];

  const sidebarContent = (
    <div className="space-y-4">
      <section className="rounded-2xl border border-brand-leaf/15 bg-card p-3 shadow-soft">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={
                activeSection === tab.id
                  ? "rounded-md bg-brand-forest px-2 py-2 text-xs font-medium text-primary-foreground"
                  : "rounded-md px-2 py-2 text-xs font-medium text-muted-foreground hover:bg-background"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeSection === "camadas" && (
        <PropertyLayersPanel
          onFocusLayer={focusLayer}
          mode="manage"
          showToolbar={!isMobile}
          externalImportNonce={importNonce}
          onInteractionChange={setPanelBusy}
        />
      )}

      {activeSection === "registros" && (
        <GeographicRecordsPanel onFocusItem={focusRecord} onBusyChange={setRecordsBusy} />
      )}

      <section className="rounded-2xl border border-brand-leaf/15 bg-card p-4 shadow-soft">
        <h3 className="font-display text-lg font-semibold text-brand-forest">Resumo cartografico</h3>
        <div className="mt-3 space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-xl border border-brand-leaf/15 bg-muted/10 px-3 py-2">
            <span className="text-muted-foreground">Camadas da propriedade</span>
            <span className="font-semibold text-brand-forest">{layers.length}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-brand-leaf/15 bg-muted/10 px-3 py-2">
            <span className="text-muted-foreground">Camadas visiveis</span>
            <span className="font-semibold text-brand-forest">{visibleLayers.length}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-brand-leaf/15 bg-muted/10 px-3 py-2">
            <span className="inline-flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Pontos do Diario</span>
            <span className="font-semibold text-brand-forest">{pointCount}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-brand-leaf/15 bg-muted/10 px-3 py-2">
            <span className="inline-flex items-center gap-2 text-muted-foreground"><Route className="h-3.5 w-3.5" /> Linhas</span>
            <span className="font-semibold text-brand-forest">{lineCount}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-brand-leaf/15 bg-muted/10 px-3 py-2">
            <span className="inline-flex items-center gap-2 text-muted-foreground"><Shapes className="h-3.5 w-3.5" /> Poligonos</span>
            <span className="font-semibold text-brand-forest">{polygonCount}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-brand-leaf/15 bg-muted/10 px-3 py-2">
            <span className="text-muted-foreground">Registros sem vinculo</span>
            <span className="font-semibold text-brand-forest">{unlinkedCount}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-brand-leaf/15 bg-muted/10 px-3 py-2">
            <span className="text-muted-foreground">Geometrias visiveis no mapa</span>
            <span className="font-semibold text-brand-forest">{visibleRecordCount}</span>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-2xl border border-brand-leaf/15 bg-[linear-gradient(180deg,hsl(44_40%_98%),hsl(40_30%_94%))] p-4 lg:p-5 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <h1 className="font-display text-2xl lg:text-4xl font-semibold text-brand-forest">Mapa do Sitio Ramos</h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Camadas, limites, areas e registros geograficos permanentes da propriedade.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="border-brand-leaf/25" onClick={openImport}>
                <Import className="h-4 w-4 mr-2" />
                Importar KML/KMZ
              </Button>
              <Button type="button" className="bg-brand-forest hover:bg-brand-forest/90" onClick={centerOnSitio}>
                <Focus className="h-4 w-4 mr-2" />
                Centralizar no Sitio Ramos
              </Button>
              <Button type="button" variant="outline" className="border-brand-leaf/25" onClick={() => setExportOpen(true)}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button type="button" variant="outline" className="border-brand-leaf/25" onClick={() => setMapExpanded((value) => !value)}>
                {mapExpanded ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
                {mapExpanded ? "Minimizar mapa" : "Expandir mapa"}
              </Button>
              {isMobile && (
                <Sheet open={mobileLayersOpen} onOpenChange={setMobileLayersOpen}>
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline" className="border-brand-leaf/25">
                      <Layers3 className="h-4 w-4 mr-2" />
                      Paineis
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-safe max-h-[85vh] overflow-y-auto">
                    <SheetHeader className="px-4">
                      <SheetTitle>Mapa do Sitio Ramos</SheetTitle>
                    </SheetHeader>
                    <div className="px-4 pb-4 pt-3">{sidebarContent}</div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-2xl border border-brand-leaf/15 bg-card p-3 shadow-soft">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-brand-forest">Mapa principal da propriedade</h2>
                <p className="text-xs text-muted-foreground">Visualizacao consolidada das camadas fixas e dos registros geograficos do Diario.</p>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {visibleLayers.length} camada{visibleLayers.length === 1 ? "" : "s"} visivel · {visibleRecordCount} registro{visibleRecordCount === 1 ? "" : "s"} no mapa
              </div>
            </div>

            {mapBusy && (
              <div className="mb-3 rounded-xl border border-brand-sun/25 bg-brand-sun/10 px-3 py-2 text-xs text-[hsl(38_95%_28%)]">
                Formulario ativo — o mapa foi reduzido e protegido para nao competir com o modal.
              </div>
            )}

            {layers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-leaf/25 bg-muted/15 p-8 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-leaf/10 text-brand-leaf">
                  <MapIcon className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-semibold text-brand-forest">Nenhuma camada importada ainda.</h3>
                  <p className="text-sm text-muted-foreground">Importe o KML/KMZ do limite do imovel para iniciar o mapa do Sitio Ramos.</p>
                </div>
                <Button type="button" className="bg-brand-forest hover:bg-brand-forest/90" onClick={openImport}>
                  <Import className="h-4 w-4 mr-2" />
                  Importar KML/KMZ
                </Button>
              </div>
            ) : (
              <DiaryMapView
                geometries={mapGeometries as any}
                propertyLayers={layers}
                height={mapExpanded ? (isMobile ? "65vh" : 700) : isMobile ? 220 : 340}
                focusRequest={focusRequest}
                inactive={mapBusy}
              />
            )}
          </section>

          {!isMobile && <aside className="space-y-4">{sidebarContent}</aside>}
        </div>
      </div>

      <MapExportDialog open={exportOpen} onOpenChange={setExportOpen} layers={layers} onExport={handleExport} />
    </AppLayout>
  );
}
