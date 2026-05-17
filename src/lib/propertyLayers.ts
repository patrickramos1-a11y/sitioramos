import JSZip from "jszip";
import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export interface GeoJsonFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: GeoJsonGeometry;
}

export type GeoJsonGeometry =
  | { type: "Point"; coordinates: number[] }
  | { type: "LineString"; coordinates: number[][] }
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "GeometryCollection"; geometries: GeoJsonGeometry[] };

export type PropertyLayerType =
  | "limite_imovel"
  | "area_manejo"
  | "talhao"
  | "area_produtiva"
  | "rio_igarape"
  | "app"
  | "reserva_legal"
  | "ponto_referencia"
  | "outro";

export interface PropertyLayerStyle {
  color: string;
  weight: number;
  fillColor?: string;
  fillOpacity?: number;
  dashArray?: string;
}

export interface PropertyMapLayer {
  id: string;
  name: string;
  type: PropertyLayerType;
  category: "Camada da Propriedade";
  description: string | null;
  geojson: GeoJsonFeatureCollection;
  sourceFormat: "kml" | "kmz" | "seed";
  sourceOrigin: "imported" | "bundled";
  sourceFileName: string;
  sourcePath: string | null;
  visible: boolean;
  style: PropertyLayerStyle;
  bounds: [number, number, number, number] | null;
  importedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedImportLayer {
  name: string;
  description: string | null;
  geojson: GeoJsonFeatureCollection;
  sourceFormat: "kml" | "kmz";
  sourceFileName: string;
}

const OFFICIAL_SITIO_RAMOS_LAYER: PropertyMapLayer = {
  id: "seed-limite-imovel-sitio-ramos",
  name: "Limite do Imovel — Sitio Ramos",
  type: "limite_imovel",
  category: "Camada da Propriedade",
  description: "Camada base permanente do limite oficial do imovel Sítio Ramos.",
  geojson: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name: "Caminho sem titulo",
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [-47.78259000080535, -0.9682329880296017],
            [-47.78011360271538, -0.9685593750884641],
            [-47.77436379211878, -0.9413339516103943],
            [-47.77485436540259, -0.9410537433426434],
            [-47.77748452641799, -0.9424002173701095],
            [-47.77954160089374, -0.9442843799244613],
            [-47.77989478738241, -0.9448489942956916],
            [-47.77976953433544, -0.9460595766991188],
            [-47.77913371620591, -0.947360034099601],
            [-47.77860074778067, -0.9481556437914292],
            [-47.77837785831776, -0.9489453277286353],
            [-47.77798259309054, -0.9492366892112014],
            [-47.77722514725716, -0.9495337037960433],
            [-47.77876193465193, -0.9517871810150452],
            [-47.78256161895332, -0.9682372977611666],
          ],
        },
      },
    ],
  },
  sourceFormat: "seed",
  sourceOrigin: "bundled",
  sourceFileName: "SITIO RAMOS - AREA TOTAL.kmz",
  sourcePath: "/property-layers/sitio-ramos-area-total.kmz",
  visible: true,
  style: {
    color: "#d32f2f",
    weight: 3,
    fillColor: "#ffffff",
    fillOpacity: 0.04,
  },
  bounds: [-47.78259000080535, -0.9685593750884641, -47.77436379211878, -0.9410537433426434],
  importedAt: "2026-05-17T00:00:00.000Z",
  createdAt: "2026-05-17T00:00:00.000Z",
  updatedAt: "2026-05-17T00:00:00.000Z",
};

interface PropertyLayersDB extends DBSchema {
  property_layers: {
    key: string;
    value: PropertyMapLayer;
  };
}

const DB_NAME = "sitio-ramos-property-layers";
const STORE_NAME = "property_layers";
let dbPromise: Promise<IDBPDatabase<PropertyLayersDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<PropertyLayersDB>(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export const PROPERTY_LAYER_TYPE_OPTIONS: Array<{ value: PropertyLayerType; label: string }> = [
  { value: "limite_imovel", label: "Limite do imovel" },
  { value: "area_manejo", label: "Area de manejo" },
  { value: "talhao", label: "Talhao" },
  { value: "area_produtiva", label: "Area produtiva" },
  { value: "rio_igarape", label: "Rio / igarape" },
  { value: "app", label: "APP" },
  { value: "reserva_legal", label: "Reserva legal" },
  { value: "ponto_referencia", label: "Ponto de referencia" },
  { value: "outro", label: "Outro" },
];

export function defaultStyleForLayerType(type: PropertyLayerType): PropertyLayerStyle {
  switch (type) {
    case "limite_imovel":
      return { color: "#d32f2f", weight: 3, fillColor: "#ffffff", fillOpacity: 0.04 };
    case "area_manejo":
      return { color: "#2e7d32", weight: 2, fillColor: "#66bb6a", fillOpacity: 0.14 };
    case "talhao":
      return { color: "#8d6e63", weight: 2, fillColor: "#bcaaa4", fillOpacity: 0.12 };
    case "area_produtiva":
      return { color: "#558b2f", weight: 2, fillColor: "#9ccc65", fillOpacity: 0.12 };
    case "rio_igarape":
      return { color: "#1976d2", weight: 3, fillColor: "#64b5f6", fillOpacity: 0.08 };
    case "app":
      return { color: "#7b1fa2", weight: 2, fillColor: "#ba68c8", fillOpacity: 0.1, dashArray: "6 4" };
    case "reserva_legal":
      return { color: "#00695c", weight: 2, fillColor: "#26a69a", fillOpacity: 0.1, dashArray: "4 4" };
    case "ponto_referencia":
      return { color: "#ef6c00", weight: 2, fillColor: "#ffb74d", fillOpacity: 0.14 };
    default:
      return { color: "#455a64", weight: 2, fillColor: "#90a4ae", fillOpacity: 0.1 };
  }
}

function parseCoordinateTuple(raw: string): number[] | null {
  const parts = raw.trim().split(",");
  if (parts.length < 2) return null;
  const lng = Number(parts[0]);
  const lat = Number(parts[1]);
  const alt = parts[2] != null ? Number(parts[2]) : undefined;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return alt != null && Number.isFinite(alt) ? [lng, lat, alt] : [lng, lat];
}

function parseCoordinateText(raw: string): number[][] {
  return raw
    .trim()
    .split(/\s+/)
    .map(parseCoordinateTuple)
    .filter((value): value is number[] => Array.isArray(value));
}

function nodeText(el: Element | null): string | null {
  const text = el?.textContent?.trim();
  return text ? text : null;
}

function directChildText(el: Element, localName: string): string | null {
  const child = Array.from(el.children).find((item) => item.localName === localName) ?? null;
  return nodeText(child);
}

function parseGeometryElement(el: Element): GeoJsonGeometry | null {
  const tag = el.localName;
  if (tag === "Point") {
    const coords = nodeText(el.querySelector("coordinates"));
    const parsed = coords ? parseCoordinateText(coords)[0] : null;
    return parsed ? { type: "Point", coordinates: parsed } : null;
  }
  if (tag === "LineString") {
    const coords = nodeText(el.querySelector("coordinates"));
    const parsed = coords ? parseCoordinateText(coords) : [];
    return parsed.length >= 2 ? { type: "LineString", coordinates: parsed } : null;
  }
  if (tag === "Polygon") {
    const rings = Array.from(el.querySelectorAll("outerBoundaryIs LinearRing, innerBoundaryIs LinearRing"))
      .map((ringEl) => nodeText(ringEl.querySelector("coordinates")))
      .filter((value): value is string => !!value)
      .map((value) => parseCoordinateText(value));
    return rings.length ? { type: "Polygon", coordinates: rings } : null;
  }
  if (tag === "MultiGeometry") {
    const geometries = Array.from(el.children)
      .map((child) => parseGeometryElement(child))
      .filter((value): value is GeoJSON.Geometry => !!value);
    return geometries.length
      ? { type: "GeometryCollection", geometries }
      : null;
  }
  return null;
}

function flattenGeometry(geometry: GeoJsonGeometry): GeoJsonGeometry[] {
  if (geometry.type !== "GeometryCollection") return [geometry];
  return geometry.geometries.flatMap((item) => flattenGeometry(item));
}

function collectCoordinates(value: unknown, out: Array<[number, number]>) {
  if (!Array.isArray(value)) return;
  if (typeof value[0] === "number" && typeof value[1] === "number") {
    out.push([value[0], value[1]]);
    return;
  }
  value.forEach((item) => collectCoordinates(item, out));
}

export function computeGeoJsonBounds(geojson: GeoJsonFeatureCollection): [number, number, number, number] | null {
  const points: Array<[number, number]> = [];
  geojson.features.forEach((feature) => {
    if ("coordinates" in feature.geometry) collectCoordinates(feature.geometry.coordinates, points);
    if (feature.geometry?.type === "GeometryCollection") {
      feature.geometry.geometries.forEach((g) => {
        if ("coordinates" in g) collectCoordinates(g.coordinates, points);
      });
    }
  });
  if (!points.length) return null;
  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

function buildFeatureCollectionFromKml(kmlText: string): { name: string; description: string | null; geojson: GeoJsonFeatureCollection } {
  const parser = new DOMParser();
  const xml = parser.parseFromString(kmlText, "application/xml");
  const placemarks = Array.from(xml.getElementsByTagName("Placemark"));
  const documentName = nodeText(xml.querySelector("Document > name")) ?? "Camada importada";
  const documentDescription = nodeText(xml.querySelector("Document > description"));

  const features: GeoJsonFeature[] = [];
  for (const placemark of placemarks) {
    const name = directChildText(placemark, "name") ?? documentName;
    const description = directChildText(placemark, "description");
    const geometryNodes = Array.from(placemark.children).filter((child) =>
      ["Point", "LineString", "Polygon", "MultiGeometry"].includes(child.localName),
    );
    geometryNodes.forEach((geometryNode) => {
      const geometry = parseGeometryElement(geometryNode);
      if (!geometry) return;
      flattenGeometry(geometry).forEach((flatGeometry) => {
        features.push({
          type: "Feature",
          properties: { name, description },
          geometry: flatGeometry,
        });
      });
    });
  }

  if (!features.length) {
    throw new Error("Nenhuma geometria válida foi encontrada no arquivo KML/KMZ.");
  }

  return {
    name: documentName,
    description: documentDescription,
    geojson: {
      type: "FeatureCollection",
      features,
    },
  };
}

export async function parseKmlOrKmzFile(file: File): Promise<ParsedImportLayer> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".kmz")) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const kmlEntry = Object.values(zip.files).find((entry) => entry.name.toLowerCase().endsWith(".kml"));
    if (!kmlEntry) {
      throw new Error("O KMZ não contém nenhum arquivo KML interno.");
    }
    const kmlText = await kmlEntry.async("string");
    const parsed = buildFeatureCollectionFromKml(kmlText);
    return { ...parsed, sourceFormat: "kmz", sourceFileName: file.name };
  }

  if (!lower.endsWith(".kml")) {
    throw new Error("Selecione um arquivo .kml ou .kmz.");
  }

  const parsed = buildFeatureCollectionFromKml(await file.text());
  return { ...parsed, sourceFormat: "kml", sourceFileName: file.name };
}

export async function listPropertyLayers(): Promise<PropertyMapLayer[]> {
  const db = await getDb();
  const layers = await db.getAll(STORE_NAME);
  if (!layers.some((layer) => layer.id === OFFICIAL_SITIO_RAMOS_LAYER.id)) {
    await db.put(STORE_NAME, OFFICIAL_SITIO_RAMOS_LAYER);
    return [OFFICIAL_SITIO_RAMOS_LAYER, ...layers].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  return layers.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function savePropertyLayer(input: Omit<PropertyMapLayer, "id" | "createdAt" | "updatedAt" | "bounds"> & { id?: string }) {
  const db = await getDb();
  const now = new Date().toISOString();
  const layer: PropertyMapLayer = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: input.id ? now : now,
    updatedAt: now,
    bounds: computeGeoJsonBounds(input.geojson),
  };
  const existing = input.id ? await db.get(STORE_NAME, input.id) : null;
  if (existing) {
    layer.createdAt = existing.createdAt;
  }
  await db.put(STORE_NAME, layer);
  return layer;
}

export async function deletePropertyLayer(id: string) {
  const db = await getDb();
  if (id === OFFICIAL_SITIO_RAMOS_LAYER.id) {
    const hiddenSeed = { ...OFFICIAL_SITIO_RAMOS_LAYER, visible: false, updatedAt: new Date().toISOString() };
    await db.put(STORE_NAME, hiddenSeed);
    return;
  }
  await db.delete(STORE_NAME, id);
}

export async function upsertOfficialSeedLayer() {
  const db = await getDb();
  const current = await db.get(STORE_NAME, OFFICIAL_SITIO_RAMOS_LAYER.id);
  if (!current) {
    await db.put(STORE_NAME, OFFICIAL_SITIO_RAMOS_LAYER);
  }
}
