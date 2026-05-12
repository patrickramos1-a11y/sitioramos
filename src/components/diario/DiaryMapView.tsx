import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import type { DiaryGeometry } from "@/hooks/useDiaryGeometries";

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface DraftVertex {
  lat: number;
  lng: number;
  number: number;
}

interface Props {
  geometries: DiaryGeometry[];
  draft?: { mode: "point" | "line" | "polygon"; vertices: DraftVertex[] };
  height?: number | string;
  className?: string;
}

const LAYERS = {
  osm: {
    label: "Mapa",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap",
  },
  sat: {
    label: "Satélite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles © Esri",
  },
} as const;

export function DiaryMapView({ geometries, draft, height = 320, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [layer, setLayer] = useState<keyof typeof LAYERS>("osm");

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [-15.78, -47.93],
      zoom: 15,
      scrollWheelZoom: true,
    });
    const cfg = LAYERS.osm;
    tileRef.current = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: 19 }).addTo(map);
    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    // Ensure proper sizing after mount/animations
    setTimeout(() => map.invalidateSize(), 50);
    return () => {
      map.remove();
      mapRef.current = null;
      tileRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Switch layer
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileRef.current) tileRef.current.remove();
    const cfg = LAYERS[layer];
    tileRef.current = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: 19 }).addTo(
      mapRef.current,
    );
  }, [layer]);

  // Re-render geometries
  const dataKey = useMemo(
    () =>
      JSON.stringify({
        g: geometries.map((g) => [g.id, g.geometry_type, g.geojson]),
        d: draft,
      }),
    [geometries, draft],
  );

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;
    group.clearLayers();
    const allPts: L.LatLngExpression[] = [];

    geometries.forEach((g) => {
      if (g.geometry_type === "point" && g.geojson?.coordinates) {
        const [lng, lat] = g.geojson.coordinates;
        L.marker([lat, lng])
          .bindPopup(
            `<div style="font-size:12px"><b>${g.name || "Ponto"}</b><br/><span style="font-family:monospace">${lat.toFixed(6)}, ${lng.toFixed(6)}</span></div>`,
          )
          .addTo(group);
        allPts.push([lat, lng]);
      } else if (g.geometry_type === "line" && Array.isArray(g.geojson?.coordinates)) {
        const positions = g.geojson.coordinates.map(([lng, lat]: number[]) => [lat, lng]) as [number, number][];
        L.polyline(positions, { color: "#15803d", weight: 4 })
          .bindPopup(
            `<div style="font-size:12px"><b>${g.name || "Linha"}</b>${g.length_m != null ? `<br/>${Math.round(g.length_m)} m` : ""}</div>`,
          )
          .addTo(group);
        positions.forEach((p) => allPts.push(p));
      } else if (g.geometry_type === "polygon" && Array.isArray(g.geojson?.coordinates?.[0])) {
        const positions = g.geojson.coordinates[0].map(([lng, lat]: number[]) => [lat, lng]) as [number, number][];
        L.polygon(positions, {
          color: "#166534",
          weight: 2,
          fillColor: "#22c55e",
          fillOpacity: 0.25,
        })
          .bindPopup(
            `<div style="font-size:12px"><b>${g.name || "Polígono"}</b>${g.area_m2 != null ? `<br/>${Math.round(g.area_m2)} m² (${(g.area_m2 / 10000).toFixed(3)} ha)` : ""}</div>`,
          )
          .addTo(group);
        positions.forEach((p) => allPts.push(p));
      }
    });

    if (draft && draft.vertices.length > 0) {
      const positions = draft.vertices.map((v) => [v.lat, v.lng]) as [number, number][];
      if ((draft.mode === "polygon" || draft.mode === "line") && positions.length >= 2) {
        L.polyline(positions, { color: "#f59e0b", weight: 3, dashArray: "6 6" }).addTo(group);
      }
      draft.vertices.forEach((v) => {
        L.circleMarker([v.lat, v.lng], {
          radius: 6,
          color: "#b45309",
          fillColor: "#fbbf24",
          fillOpacity: 1,
          weight: 2,
        })
          .bindPopup(`P${v.number}`)
          .addTo(group);
        allPts.push([v.lat, v.lng]);
      });
    }

    if (allPts.length) {
      const bounds = L.latLngBounds(allPts);
      const apply = () => {
        map.invalidateSize();
        if (bounds.isValid()) {
          if (allPts.length === 1) {
            map.setView(allPts[0] as L.LatLngExpression, 17, { animate: false });
          } else {
            map.fitBounds(bounds, { padding: [30, 30], maxZoom: 18, animate: false });
          }
        }
      };
      // Run now and after layout settles (collapsible/animation)
      apply();
      setTimeout(apply, 80);
      setTimeout(apply, 250);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey]);

  // Recalculate size when height changes (collapse/expand)
  useEffect(() => {
    const id = setTimeout(() => mapRef.current?.invalidateSize(), 60);
    return () => clearTimeout(id);
  }, [height]);

  return (
    <div className={className} style={{ position: "relative" }}>
      <div className="absolute z-[1000] top-2 right-2 bg-card/90 backdrop-blur rounded-md border border-border shadow-sm flex text-xs overflow-hidden">
        {(Object.keys(LAYERS) as (keyof typeof LAYERS)[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setLayer(k)}
            className={
              "px-2 py-1 transition-colors " +
              (layer === k
                ? "bg-brand-forest text-primary-foreground"
                : "text-foreground hover:bg-muted")
            }
          >
            {LAYERS[k].label}
          </button>
        ))}
      </div>
      <div
        ref={containerRef}
        style={{ height, width: "100%", borderRadius: 8 }}
        className="border border-border"
      />
    </div>
  );
}
