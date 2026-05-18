import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import type { JournalPoint } from "@/hooks/useJournalPoints";
import type { DiaryGeometry } from "@/hooks/useDiaryGeometries";
import type {
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  GeoJsonGeometry,
  PropertyLayerType,
  PropertyMapLayer,
} from "@/lib/propertyLayers";

const BUCKET = "journal-media";

const QUALITY_LABEL: Record<string, string> = {
  excelente: "Excelente",
  boa: "Boa",
  aceitavel: "Aceitavel",
  baixa: "Baixa",
};

const PROPERTY_LAYER_LABEL: Record<PropertyLayerType, string> = {
  limite_imovel: "Limite do Imovel",
  area_manejo: "Area de Manejo",
  talhao: "Talhao",
  area_produtiva: "Area Produtiva",
  rio_igarape: "Rio / Igarape",
  app: "APP",
  reserva_legal: "Reserva Legal",
  ponto_referencia: "Ponto de Referencia",
  outro: "Outro",
};

const PROPERTY_STYLE_ID: Record<PropertyLayerType, string> = {
  limite_imovel: "style-limite-imovel",
  area_manejo: "style-area-manejo",
  talhao: "style-talhao",
  area_produtiva: "style-area-produtiva",
  rio_igarape: "style-rio-igarape",
  app: "style-app",
  reserva_legal: "style-reserva-legal",
  ponto_referencia: "style-ponto-referencia",
  outro: "style-outro",
};

export interface KmlEntryMeta {
  id: string;
  title?: string | null;
  description?: string | null;
  entry_date?: string | null;
  area_name?: string | null;
  cycle_name?: string | null;
  responsible_name?: string | null;
  area_id?: string | null;
  cycle_id?: string | null;
  responsavel_id?: string | null;
  status?: string | null;
}

export interface DiaryExportRecord {
  entry: KmlEntryMeta;
  points: JournalPoint[];
  geometries: DiaryGeometry[];
}

interface KmlPointLike {
  nome: string;
  observacao?: string | null;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  captured_at?: string | null;
  precision_quality?: string | null;
  capture_duration_seconds?: number | null;
  readings_count?: number | null;
  best_accuracy?: number | null;
  responsible_name?: string | null;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
}

interface BuildMapKmlOptions {
  documentName?: string;
  propertyLayers?: PropertyMapLayer[];
  diaryRecords?: DiaryExportRecord[];
}

interface ExportMapOptions extends BuildMapKmlOptions {
  filename?: string;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function fileDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function hexToKmlColor(hex: string, alpha = 1) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return "ff2f5233";
  const r = normalized.slice(0, 2);
  const g = normalized.slice(2, 4);
  const b = normalized.slice(4, 6);
  const a = Math.max(0, Math.min(255, Math.round(alpha * 255)))
    .toString(16)
    .padStart(2, "0");
  return `${a}${b}${g}${r}`;
}

function folderXml(name: string, children: string[], description?: string | null) {
  if (!children.length) return "";
  return `    <Folder>
      <name>${escapeXml(name)}</name>
      ${description ? `<description>${escapeXml(description)}</description>` : ""}
${children.join("\n")}
    </Folder>`;
}

function formatDateTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR");
}

function buildDescription(lines: Array<[string, string | number | null | undefined]>) {
  const filtered = lines
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([label, value]) => `${label}: ${value}`);
  return filtered.length ? escapeXml(filtered.join("\n")) : "";
}

function coordToKml(coord: number[]) {
  const [lng, lat, alt] = coord;
  return `${lng},${lat},${alt ?? 0}`;
}

function ensureClosedRing(ring: number[][]) {
  if (!ring.length) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

function geometryXml(geometry: GeoJsonGeometry): string {
  if (geometry.type === "Point") {
    return `<Point><coordinates>${coordToKml(geometry.coordinates)}</coordinates></Point>`;
  }
  if (geometry.type === "LineString") {
    return `<LineString><coordinates>${geometry.coordinates.map(coordToKml).join(" ")}</coordinates></LineString>`;
  }
  if (geometry.type === "Polygon") {
    const outerRing = ensureClosedRing(geometry.coordinates[0] || []);
    const innerRings = geometry.coordinates.slice(1).map((ring) => ensureClosedRing(ring));
    const outerXml = `<outerBoundaryIs><LinearRing><coordinates>${outerRing
      .map(coordToKml)
      .join(" ")}</coordinates></LinearRing></outerBoundaryIs>`;
    const innerXml = innerRings
      .map(
        (ring) =>
          `<innerBoundaryIs><LinearRing><coordinates>${ring
            .map(coordToKml)
            .join(" ")}</coordinates></LinearRing></innerBoundaryIs>`,
      )
      .join("");
    return `<Polygon>${outerXml}${innerXml}</Polygon>`;
  }
  return `<MultiGeometry>${geometry.geometries.map(geometryXml).join("")}</MultiGeometry>`;
}

function baseStylesXml() {
  const makeStyle = (
    id: string,
    lineHex: string,
    polyHex?: string,
    lineWidth = 3,
    lineAlpha = 1,
    polyAlpha = 0.18,
    iconHref?: string,
  ) => `    <Style id="${id}">
      <LineStyle>
        <color>${hexToKmlColor(lineHex, lineAlpha)}</color>
        <width>${lineWidth}</width>
      </LineStyle>
      <PolyStyle>
        <color>${hexToKmlColor(polyHex || lineHex, polyAlpha)}</color>
        <fill>${polyHex ? 1 : 0}</fill>
        <outline>1</outline>
      </PolyStyle>
      ${
        iconHref
          ? `<IconStyle><scale>1.1</scale><Icon><href>${iconHref}</href></Icon></IconStyle>`
          : ""
      }
    </Style>`;

  return [
    makeStyle("style-limite-imovel", "#14532d", "#14532d", 4, 1, 0.03),
    makeStyle("style-area-manejo", "#16a34a", "#4ade80", 3, 1, 0.12),
    makeStyle("style-talhao", "#ca8a04", "#fde047", 3, 1, 0.12),
    makeStyle("style-area-produtiva", "#15803d", "#22c55e", 3, 1, 0.12),
    makeStyle("style-rio-igarape", "#2563eb", "#60a5fa", 3, 1, 0.08),
    makeStyle("style-app", "#15803d", "#86efac", 3, 1, 0.15),
    makeStyle("style-reserva-legal", "#166534", "#4ade80", 3, 1, 0.18),
    makeStyle("style-ponto-referencia", "#92400e", "#f59e0b", 3, 1, 0.24),
    makeStyle("style-outro", "#475569", "#94a3b8", 3, 1, 0.12),
    makeStyle(
      "style-diary-point",
      "#0f766e",
      "#14b8a6",
      3,
      1,
      0.24,
      "http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png",
    ),
    makeStyle("style-diary-line", "#15803d", "#22c55e", 4, 1, 0.05),
    makeStyle("style-diary-polygon", "#166534", "#22c55e", 3, 1, 0.18),
  ].join("\n");
}

function pointFromLegacy(p: JournalPoint): KmlPointLike {
  return {
    nome: p.nome,
    observacao: p.observacao,
    latitude: p.latitude,
    longitude: p.longitude,
    accuracy: p.accuracy,
    captured_at: p.captured_at,
    precision_quality: p.precision_quality,
    capture_duration_seconds: p.capture_duration_seconds,
    readings_count: p.readings_count,
    best_accuracy: p.best_accuracy,
    altitude: p.altitude,
    heading: p.heading,
    speed: p.speed,
  };
}

function buildEntryDescription(entry: KmlEntryMeta, extra: Array<[string, string | number | null | undefined]> = []) {
  return buildDescription([
    ["Registro", entry.title || `Diario ${entry.entry_date || ""}`.trim()],
    ["Data/Hora", formatDateTime(entry.entry_date)],
    ["Responsavel", entry.responsible_name || entry.responsavel_id],
    ["Area", entry.area_name || entry.area_id],
    ["Ciclo", entry.cycle_name || entry.cycle_id],
    ["Status", entry.status],
    ["Descricao", entry.description],
    ...extra,
  ]);
}

function pointPlacemarkXml(point: KmlPointLike, entry?: KmlEntryMeta, nameOverride?: string) {
  const description = buildDescription([
    ["Nome", nameOverride || point.nome || "Ponto"],
    ["Tipo", "Ponto GPS"],
    ["Registro", entry?.title || entry?.entry_date],
    ["Responsavel", entry?.responsible_name || point.responsible_name || entry?.responsavel_id],
    ["Area", entry?.area_name || entry?.area_id],
    ["Ciclo", entry?.cycle_name || entry?.cycle_id],
    ["Precisao GPS", point.accuracy != null ? `${Math.round(point.accuracy)} m` : null],
    ["Qualidade", point.precision_quality ? QUALITY_LABEL[point.precision_quality] || point.precision_quality : null],
    ["Melhor precisao", point.best_accuracy != null ? `${Math.round(point.best_accuracy)} m` : null],
    ["Altitude", point.altitude != null ? `${point.altitude.toFixed(1)} m` : null],
    ["Heading", point.heading != null ? `${Math.round(point.heading)}°` : null],
    ["Velocidade", point.speed != null ? `${point.speed.toFixed(2)} m/s` : null],
    ["Leituras", point.readings_count],
    ["Tempo de captura", point.capture_duration_seconds != null ? `${Math.round(point.capture_duration_seconds)} s` : null],
    ["Capturado em", formatDateTime(point.captured_at)],
    ["Observacoes", point.observacao],
  ]);

  return `      <Placemark>
        <name>${escapeXml(nameOverride || point.nome || "Ponto")}</name>
        <styleUrl>#style-diary-point</styleUrl>
        ${description ? `<description>${description}</description>` : ""}
        <Point><coordinates>${point.longitude},${point.latitude},0</coordinates></Point>
      </Placemark>`;
}

function geometryPlacemarkXml(g: DiaryGeometry, entry?: KmlEntryMeta) {
  const props = g.geojson?.properties || {};
  const kind = g.geometry_type === "polygon" ? "Poligono" : g.geometry_type === "line" ? "Linha" : "Ponto";
  const description = buildEntryDescription(entry || { id: g.entry_id }, [
    ["Nome", g.name || kind],
    ["Tipo", kind],
    ["Comprimento", g.length_m != null ? `${Math.round(g.length_m)} m` : null],
    ["Area m2", g.area_m2 != null ? Math.round(g.area_m2) : null],
    ["Area ha", g.area_m2 != null ? (g.area_m2 / 10000).toFixed(4) : null],
    ["Precisao GPS", props.accuracy != null ? `${Math.round(props.accuracy)} m` : null],
    ["Qualidade", props.precision_quality ? QUALITY_LABEL[props.precision_quality] || props.precision_quality : null],
    ["Melhor precisao", props.best_accuracy != null ? `${Math.round(props.best_accuracy)} m` : null],
    ["Altitude", props.altitude != null ? `${props.altitude} m` : null],
    ["Heading", props.heading != null ? `${Math.round(props.heading)}°` : null],
    ["Velocidade", props.speed != null ? `${props.speed} m/s` : null],
    ["Leituras", props.readings_count],
    ["Tempo de captura", props.capture_duration_seconds != null ? `${Math.round(props.capture_duration_seconds)} s` : null],
    ["Capturado em", formatDateTime(props.captured_at)],
    ["Descricao", g.description],
  ]);

  const styleUrl =
    g.geometry_type === "polygon"
      ? "#style-diary-polygon"
      : g.geometry_type === "line"
        ? "#style-diary-line"
        : "#style-diary-point";

  return `      <Placemark>
        <name>${escapeXml(g.name || kind)}</name>
        <styleUrl>${styleUrl}</styleUrl>
        ${description ? `<description>${description}</description>` : ""}
        ${geometryXml(g.geojson)}
      </Placemark>`;
}

function propertyFeaturePlacemarkXml(layer: PropertyMapLayer, feature: GeoJsonFeature, featureIndex: number) {
  const placemarkName =
    String(feature.properties.name || feature.properties.titulo || layer.name || `${PROPERTY_LAYER_LABEL[layer.type]} ${featureIndex + 1}`);
  const description = buildDescription([
    ["Nome", placemarkName],
    ["Tipo da camada", PROPERTY_LAYER_LABEL[layer.type]],
    ["Categoria", layer.category],
    ["Descricao", String(feature.properties.description || layer.description || "") || null],
    ["Arquivo de origem", layer.sourceFileName],
    ["Origem", layer.sourceOrigin],
    ["Importada em", formatDateTime(layer.importedAt)],
  ]);

  return `      <Placemark>
        <name>${escapeXml(placemarkName)}</name>
        <styleUrl>#${PROPERTY_STYLE_ID[layer.type]}</styleUrl>
        ${description ? `<description>${description}</description>` : ""}
        ${geometryXml(feature.geometry)}
      </Placemark>`;
}

function propertyLayerFolderXml(layer: PropertyMapLayer) {
  const features = layer.geojson.features.map((feature, index) => propertyFeaturePlacemarkXml(layer, feature, index));
  return folderXml(
    layer.name,
    features,
    `Tipo: ${PROPERTY_LAYER_LABEL[layer.type]}${layer.sourceFileName ? ` | Arquivo: ${layer.sourceFileName}` : ""}`,
  );
}

function isSamePoint(geometry: DiaryGeometry, point: JournalPoint) {
  if (geometry.geometry_type !== "point" || !Array.isArray(geometry.geojson?.coordinates)) return false;
  const [lng, lat] = geometry.geojson.coordinates;
  return Math.abs(lat - point.latitude) < 0.000001 && Math.abs(lng - point.longitude) < 0.000001;
}

function dedupeLegacyPoints(points: JournalPoint[], geometries: DiaryGeometry[]) {
  return points.filter((point) => !geometries.some((geometry) => isSamePoint(geometry, point)));
}

function buildDiaryEntryFolder(record: DiaryExportRecord) {
  const points = dedupeLegacyPoints(record.points, record.geometries);
  const pointFolder = folderXml(
    "Pontos",
    [
      ...points.map((point) => pointPlacemarkXml(pointFromLegacy(point), record.entry)),
      ...record.geometries.filter((g) => g.geometry_type === "point").map((g) => geometryPlacemarkXml(g, record.entry)),
    ],
  );

  const lineFolder = folderXml(
    "Linhas",
    record.geometries.filter((g) => g.geometry_type === "line").map((g) => geometryPlacemarkXml(g, record.entry)),
  );

  const polygonFolder = folderXml(
    "Poligonos",
    record.geometries.filter((g) => g.geometry_type === "polygon").map((g) => geometryPlacemarkXml(g, record.entry)),
  );

  return folderXml(
    record.entry.title || `Diario ${record.entry.entry_date || record.entry.id}`,
    [pointFolder, lineFolder, polygonFolder].filter(Boolean),
    buildEntryDescription(record.entry)
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'"),
  );
}

function documentXml(name: string, folders: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(name)}</name>
${baseStylesXml()}
${folders.join("\n")}
  </Document>
</kml>`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildKml(entry: KmlEntryMeta, points: KmlPointLike[], geometries: DiaryGeometry[] = []) {
  return buildMapKml({
    documentName: entry.title || `Diario ${entry.entry_date || ""}`.trim() || "Pontos do Diario",
    diaryRecords: [
      {
        entry,
        points: points.map((point, index) => ({
          id: `legacy-${index}`,
          entry_id: entry.id,
          nome: point.nome,
          observacao: point.observacao || null,
          latitude: point.latitude,
          longitude: point.longitude,
          accuracy: point.accuracy ?? null,
          captured_at: point.captured_at || new Date().toISOString(),
          ordem: index,
          manual: false,
          geometry_type: "point",
          coordinates: null,
          attachment_id: null,
          altitude: point.altitude ?? null,
          altitude_accuracy: null,
          heading: point.heading ?? null,
          speed: point.speed ?? null,
          capture_duration_seconds: point.capture_duration_seconds ?? null,
          readings_count: point.readings_count ?? null,
          best_accuracy: point.best_accuracy ?? null,
          capture_method: null,
          precision_quality: (point.precision_quality as JournalPoint["precision_quality"]) ?? null,
          created_at: point.captured_at || new Date().toISOString(),
          updated_at: point.captured_at || new Date().toISOString(),
        })),
        geometries,
      },
    ],
  });
}

export function buildMapKml({
  documentName = "Sitio Ramos",
  propertyLayers = [],
  diaryRecords = [],
}: BuildMapKmlOptions) {
  const propertyFolders = propertyLayers.map(propertyLayerFolderXml);
  const diaryFolders = diaryRecords.map(buildDiaryEntryFolder);

  const folders = [
    propertyFolders.length ? folderXml("Camadas da Propriedade", propertyFolders) : "",
    diaryFolders.length ? folderXml("Diario de Campo", diaryFolders) : "",
  ].filter(Boolean);

  return documentXml(documentName, folders);
}

export async function exportEntryKml(
  entry: KmlEntryMeta,
  points: JournalPoint[],
  geometries: DiaryGeometry[] = [],
): Promise<string> {
  const kml = buildKml(entry, points.map(pointFromLegacy), geometries);
  const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
  const filename = `sitio-ramos-diario-${entry.entry_date ? entry.entry_date.slice(0, 10) : entry.id}.kml`;
  const path = `kml/${entry.id}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "application/vnd.google-earth.kml+xml", upsert: true });
  if (error) throw error;

  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  triggerDownload(blob, filename);
  return url;
}

export async function exportEntryKmz(
  entry: KmlEntryMeta,
  points: JournalPoint[],
  geometries: DiaryGeometry[] = [],
) {
  const kml = buildKml(entry, points.map(pointFromLegacy), geometries);
  const zip = new JSZip();
  const baseName = `sitio-ramos-diario-${entry.entry_date ? entry.entry_date.slice(0, 10) : slugify(entry.id)}`;
  zip.file(`${baseName}.kml`, kml);
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, `${baseName}.kmz`);
}

export function exportSingleGeometry(entry: KmlEntryMeta, g: DiaryGeometry) {
  const kml = buildKml(entry, [], [g]);
  const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
  const safeName = slugify(g.name || g.geometry_type);
  triggerDownload(blob, `sitio-ramos-${safeName || g.geometry_type}-${g.id.slice(0, 8)}.kml`);
}

export function exportPropertyLayerKml(layer: PropertyMapLayer) {
  const baseName = slugify(layer.name || PROPERTY_LAYER_LABEL[layer.type] || "camada");
  const kml = buildMapKml({
    documentName: layer.name,
    propertyLayers: [layer],
  });
  const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
  triggerDownload(blob, `sitio-ramos-${baseName}.kml`);
}

export async function exportPropertyLayerKmz(layer: PropertyMapLayer) {
  const baseName = slugify(layer.name || PROPERTY_LAYER_LABEL[layer.type] || "camada");
  const kml = buildMapKml({
    documentName: layer.name,
    propertyLayers: [layer],
  });
  const zip = new JSZip();
  zip.file(`sitio-ramos-${baseName}.kml`, kml);
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, `sitio-ramos-${baseName}.kmz`);
}

export async function exportMapKml({
  documentName = "Mapa do Sitio Ramos",
  propertyLayers = [],
  diaryRecords = [],
  filename = `sitio-ramos-mapa-completo-${fileDate()}.kml`,
}: ExportMapOptions) {
  const kml = buildMapKml({ documentName, propertyLayers, diaryRecords });
  const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
  triggerDownload(blob, filename);
}

export async function exportMapKmz({
  documentName = "Mapa do Sitio Ramos",
  propertyLayers = [],
  diaryRecords = [],
  filename = `sitio-ramos-mapa-completo-${fileDate()}.kmz`,
}: ExportMapOptions) {
  const kml = buildMapKml({ documentName, propertyLayers, diaryRecords });
  const zip = new JSZip();
  zip.file(filename.replace(/\.kmz$/i, ".kml"), kml);
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, filename);
}

export async function loadDiaryExportRecords(): Promise<DiaryExportRecord[]> {
  const [{ data: pointRows, error: pointsError }, { data: geometryRows, error: geometryError }] =
    await Promise.all([
      supabase.from("journal_points" as any).select("*").order("captured_at", { ascending: true }),
      supabase.from("diary_geometries" as any).select("*").order("created_at", { ascending: true }),
    ]);

  if (pointsError) throw pointsError;
  if (geometryError) throw geometryError;

  const points = (pointRows || []) as unknown as JournalPoint[];
  const geometries = (geometryRows || []) as unknown as DiaryGeometry[];
  const entryIds = Array.from(
    new Set([
      ...points.map((point) => point.entry_id).filter(Boolean),
      ...geometries.map((geometry) => geometry.entry_id).filter(Boolean),
    ]),
  );

  if (!entryIds.length) return [];

  const { data: entryRows, error: entryError } = await supabase
    .from("journal_entries" as any)
    .select("id, title, description, entry_date, area_id, cycle_id, responsavel_id, status")
    .in("id", entryIds);

  if (entryError) throw entryError;

  const entries = ((entryRows || []) as any[]).map<KmlEntryMeta>((entry) => ({
    id: entry.id,
    title: entry.title,
    description: entry.description,
    entry_date: entry.entry_date,
    area_id: entry.area_id,
    cycle_id: entry.cycle_id,
    responsavel_id: entry.responsavel_id,
    status: entry.status,
  }));

  const entryMap = new Map(entries.map((entry) => [entry.id, entry]));
  return entryIds.map((entryId) => ({
    entry: entryMap.get(entryId) || { id: entryId, title: `Registro ${entryId}` },
    points: points.filter((point) => point.entry_id === entryId),
    geometries: geometries.filter((geometry) => geometry.entry_id === entryId),
  }));
}
