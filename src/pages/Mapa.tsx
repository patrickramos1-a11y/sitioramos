import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DiaryMapView } from "@/components/diario/DiaryMapView";
import { PropertyLayersPanel } from "@/components/diario/PropertyLayersPanel";
import { usePropertyMapLayers } from "@/hooks/usePropertyMapLayers";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Layers3, Focus, Import, RefreshCw, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";

export default function Mapa() {
  const isMobile = useIsMobile();
  const propertyLayers = usePropertyMapLayers();
  const [focusRequest, setFocusRequest] = useState<{ layerId: string; nonce: number } | null>(null);
  const [importNonce, setImportNonce] = useState(0);
  const [mobileLayersOpen, setMobileLayersOpen] = useState(false);

  const layers = propertyLayers.data || [];
  const limitLayer = useMemo(
    () => layers.find((layer) => layer.type === "limite_imovel") ?? null,
    [layers],
  );
  const visibleLayers = layers.filter((layer) => layer.visible);

  const focusLayer = (layerId: string) => {
    setFocusRequest({ layerId, nonce: Date.now() });
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
    setTimeout(() => setImportNonce((value) => value + 1), 30);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-2xl border border-brand-leaf/15 bg-[linear-gradient(180deg,hsl(44_40%_98%),hsl(40_30%_94%))] p-4 lg:p-5 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <h1 className="font-display text-2xl lg:text-4xl font-semibold text-brand-forest">
                Mapa do Sitio Ramos
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Camadas, limites, areas e registros geograficos permanentes da propriedade.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-brand-leaf/25"
                onClick={openImport}
              >
                <Import className="h-4 w-4 mr-2" />
                Importar KML/KMZ
              </Button>
              <Button
                type="button"
                className="bg-brand-forest hover:bg-brand-forest/90"
                onClick={centerOnSitio}
              >
                <Focus className="h-4 w-4 mr-2" />
                Centralizar no Sitio Ramos
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-brand-leaf/25"
                onClick={() => propertyLayers.refetch()}
                disabled={propertyLayers.isRefetching}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${propertyLayers.isRefetching ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              {isMobile && (
                <Sheet open={mobileLayersOpen} onOpenChange={setMobileLayersOpen}>
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline" className="border-brand-leaf/25">
                      <Layers3 className="h-4 w-4 mr-2" />
                      Camadas
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-safe max-h-[85vh] overflow-y-auto">
                    <SheetHeader className="px-4">
                      <SheetTitle>Camadas da Propriedade</SheetTitle>
                    </SheetHeader>
                    <div className="px-4 pb-4 pt-3">
                      <PropertyLayersPanel
                        onFocusLayer={(layerId) => {
                          focusLayer(layerId);
                          setMobileLayersOpen(false);
                        }}
                        mode="manage"
                        showToolbar={false}
                        externalImportNonce={importNonce}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-2xl border border-brand-leaf/15 bg-card p-3 shadow-soft">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-brand-forest">Mapa principal da propriedade</h2>
                <p className="text-xs text-muted-foreground">
                  Visualizacao consolidada das camadas permanentes do Sitio Ramos.
                </p>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {visibleLayers.length} camada{visibleLayers.length === 1 ? "" : "s"} visivel
              </div>
            </div>

            {layers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-leaf/25 bg-muted/15 p-8 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-leaf/10 text-brand-leaf">
                  <MapIcon className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-semibold text-brand-forest">
                    Nenhuma camada importada ainda.
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Importe o KML/KMZ do limite do imovel para iniciar o mapa do Sitio Ramos.
                  </p>
                </div>
                <Button type="button" className="bg-brand-forest hover:bg-brand-forest/90" onClick={openImport}>
                  <Import className="h-4 w-4 mr-2" />
                  Importar KML/KMZ
                </Button>
              </div>
            ) : (
              <DiaryMapView
                geometries={[]}
                propertyLayers={layers}
                height={isMobile ? "65vh" : 680}
                focusRequest={focusRequest}
              />
            )}
          </section>

          {!isMobile && (
            <aside className="space-y-4">
              <PropertyLayersPanel
                onFocusLayer={focusLayer}
                mode="manage"
                showToolbar={false}
                externalImportNonce={importNonce}
              />

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
                  <div className="rounded-xl border border-brand-leaf/15 bg-muted/10 px-3 py-3">
                    <div className="text-muted-foreground text-xs uppercase tracking-[0.16em]">Registros operacionais</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pontos, linhas e poligonos do Diario continuam no Diario de Campo e podem usar estas camadas como referencia.
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
