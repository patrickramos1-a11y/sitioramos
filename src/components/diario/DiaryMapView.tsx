import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import type { DiaryGeometry } from "@/hooks/useDiaryGeometries";
import type { PropertyMapLayer, GeoJsonGeometry } from "@/lib/propertyLayers";

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
  propertyLayers?: PropertyMapLayer[];
  draft?: { mode: "point" | "line" | "polygon"; vertices: DraftVertex[] };
  height?: number | string;
  className?: string;
  focusRequest?: { layerId: string; nonce: number } | null;
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

function collectLatLngsFromGeometry(geometry: GeoJsonGeometry): Array<[number, number]> {
  if (geometry.type === "Point") {
    return [[geometry.coordinates[1], geometry.coordinates[0]]];
  }
  if (geometry.type === "LineString") {
    return geometry.coordinates.map((coord) => [coord[1], coord[0]]);
  }
  if (geometry.type === "Polygon") {
    return geometry.coordinates.flat().map((coord) => [coord[1], coord[0]]);
  }
  return geometry.geometries.flatMap((item) => collectLatLngsFromGeometry(item));
}

function addPropertyGeometryToMap(
  group: L.LayerGroup,
  geometry: GeoJsonGeometry,
  style: PropertyMapLayer["style"],
  popupHtml: string,
) {
  if (geometry.type === "Point") {
    const [lng, lat] = geometry.coordinates;
    L.circleMarker([lat, lng], {
      radius: 6,
      color: style.color,
      fillColor: style.fillColor || style.color,
      fillOpacity: style.fillOpacity ?? 0.25,
      weight: style.weight,
    }).bindPopup(popupHtml).addTo(group);
    return;
  }

  if (geometry.type === "LineString") {
    const positions = geometry.coordinates.map((coord) => [coord[1], coord[0]]) as [number, number][];
    L.polyline(positions, {
      color: style.color,
      weight: style.weight,
      dashArray: style.dashArray,
    }).bindPopup(popupHtml).addTo(group);
    return;
  }

  if (geometry.type === "Polygon") {
    const positions = geometry.coordinates[0].map((coord) => [coord[1], coord[0]]) as [number, number][];
    L.polygon(positions, {
      color: style.color,
      weight: style.weight,
      dashArray: style.dashArray,
      fillColor: style.fillColor || style.color,
      fillOpacity: style.fillOpacity ?? 0.08,
    }).bindPopup(popupHtml).addTo(group);
    return;
  }

  geometry.geometries.forEach((item) => addPropertyGeometryToMap(group, item, style, popupHtml));
}

export function DiaryMapView({
  geometries,
  propertyLayers = [],
  draft,
  height = 320,
  className,
  focusRequest,
}: Props) {
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
        p: propertyLayers.map((layerItem) => [layerItem.id, layerItem.visible, layerItem.type, layerItem.geojson]),
        d: draft,
      }),
    [geometries, propertyLayers, draft],
  );

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;
    group.clearLayers();
    const allPts: L.LatLngExpression[] = [];

    propertyLayers
      .filter((layerItem) => layerItem.visible)
      .forEach((layerItem) => {
        const { style } = layerItem;
        layerItem.geojson.features.forEach((feature) => {
          const geometry = feature.geometry;
          const name = String(feature.properties.name || layerItem.name || "Camada");
          const description = String(feature.properties.description || layerItem.description || "");
          const popupHtml = `<div style="font-size:12px"><b>${name}</b>${description ? `<br/>${description}` : ""}</div>`;
          addPropertyGeometryToMap(group, geometry, style, popupHtml);
          collectLatLngsFromGeometry(geometry).forEach((point) => allPts.push(point));
        });
      });

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

    const focusLayer = focusRequest?.layerId
      ? propertyLayers.find((layerItem) => layerItem.id === focusRequest.layerId)
      : null;

    const focusPoints = focusLayer
      ? focusLayer.geojson.features.flatMap((feature) => collectLatLngsFromGeometry(feature.geometry))
      : [];

    const targetPoints = focusPoints.length ? focusPoints : allPts;

    if (targetPoints.length) {
      const bounds = L.latLngBounds(targetPoints);
      const apply = () => {
        map.invalidateSize();
        if (bounds.isValid()) {
          if (targetPoints.length === 1) {
            map.setView(targetPoints[0] as L.LatLngExpression, 17, { animate: false });
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
  }, [dataKey, focusRequest]);

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
