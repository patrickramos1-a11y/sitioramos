import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Polygon,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import type { DiaryGeometry } from "@/hooks/useDiaryGeometries";

// Fix default marker icons (vite + leaflet)
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

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

function FitBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 18 });
    }
  }, [bounds, map]);
  return null;
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

export function DiaryMapView({ geometries, draft, height = 360, className }: Props) {
  const [layer, setLayer] = useState<keyof typeof LAYERS>("osm");

  const { bounds, fallbackCenter } = useMemo(() => {
    const pts: [number, number][] = [];
    geometries.forEach((g) => {
      if (g.geometry_type === "point" && g.geojson?.coordinates) {
        const [lng, lat] = g.geojson.coordinates;
        pts.push([lat, lng]);
      } else if (
        (g.geometry_type === "line" || g.geometry_type === "polygon") &&
        Array.isArray(g.geojson?.coordinates)
      ) {
        const coords =
          g.geometry_type === "polygon" ? g.geojson.coordinates[0] : g.geojson.coordinates;
        coords?.forEach(([lng, lat]: number[]) => pts.push([lat, lng]));
      }
    });
    draft?.vertices.forEach((v) => pts.push([v.lat, v.lng]));
    if (!pts.length) return { bounds: null, fallbackCenter: [-15.78, -47.93] as [number, number] };
    return { bounds: L.latLngBounds(pts), fallbackCenter: pts[0] };
  }, [geometries, draft]);

  const cfg = LAYERS[layer];

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
      <MapContainer
        center={fallbackCenter}
        zoom={15}
        style={{ height, width: "100%", borderRadius: 8 }}
        scrollWheelZoom
      >
        <TileLayer key={layer} url={cfg.url} attribution={cfg.attribution} maxZoom={19} />
        <FitBounds bounds={bounds} />

        {geometries.map((g) => {
          if (g.geometry_type === "point" && g.geojson?.coordinates) {
            const [lng, lat] = g.geojson.coordinates;
            return (
              <Marker key={g.id} position={[lat, lng]}>
                <Popup>
                  <div className="text-xs space-y-0.5">
                    <div className="font-semibold">{g.name || "Ponto"}</div>
                    {g.description && <div>{g.description}</div>}
                    <div className="text-muted-foreground font-mono">
                      {lat.toFixed(6)}, {lng.toFixed(6)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          }
          if (g.geometry_type === "line" && Array.isArray(g.geojson?.coordinates)) {
            const positions = g.geojson.coordinates.map(([lng, lat]: number[]) => [lat, lng]) as [number, number][];
            return (
              <Polyline key={g.id} positions={positions} pathOptions={{ color: "#15803d", weight: 4 }}>
                <Popup>
                  <div className="text-xs">
                    <div className="font-semibold">{g.name || "Linha"}</div>
                    {g.description && <div>{g.description}</div>}
                    {g.length_m != null && <div>{Math.round(g.length_m)} m</div>}
                  </div>
                </Popup>
              </Polyline>
            );
          }
          if (g.geometry_type === "polygon" && Array.isArray(g.geojson?.coordinates?.[0])) {
            const positions = g.geojson.coordinates[0].map(([lng, lat]: number[]) => [lat, lng]) as [number, number][];
            return (
              <Polygon
                key={g.id}
                positions={positions}
                pathOptions={{ color: "#166534", weight: 2, fillColor: "#22c55e", fillOpacity: 0.25 }}
              >
                <Popup>
                  <div className="text-xs space-y-0.5">
                    <div className="font-semibold">{g.name || "Polígono"}</div>
                    {g.description && <div>{g.description}</div>}
                    {g.area_m2 != null && (
                      <div>
                        {Math.round(g.area_m2)} m² ({(g.area_m2 / 10000).toFixed(3)} ha)
                      </div>
                    )}
                  </div>
                </Popup>
                {positions.map((p, i) => (
                  <CircleMarker
                    key={i}
                    center={p}
                    radius={4}
                    pathOptions={{ color: "#166534", fillColor: "#fff", fillOpacity: 1, weight: 2 }}
                  />
                ))}
              </Polygon>
            );
          }
          return null;
        })}

        {/* Rascunho em construção */}
        {draft && draft.vertices.length > 0 && (
          <>
            {(draft.mode === "polygon" || draft.mode === "line") && draft.vertices.length >= 2 && (
              <Polyline
                positions={draft.vertices.map((v) => [v.lat, v.lng] as [number, number])}
                pathOptions={{ color: "#f59e0b", weight: 3, dashArray: "6 6" }}
              />
            )}
            {draft.vertices.map((v) => (
              <CircleMarker
                key={v.number}
                center={[v.lat, v.lng]}
                radius={6}
                pathOptions={{ color: "#b45309", fillColor: "#fbbf24", fillOpacity: 1, weight: 2 }}
              >
                <Popup>P{v.number}</Popup>
              </CircleMarker>
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
}
