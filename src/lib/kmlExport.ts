import { supabase } from "@/integrations/supabase/client";
import type { JournalPoint } from "@/hooks/useJournalPoints";
import type { DiaryGeometry } from "@/hooks/useDiaryGeometries";

const BUCKET = "journal-media";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface KmlEntryMeta {
  id: string;
  title?: string | null;
  description?: string | null;
  entry_date?: string | null;
}

interface KmlPointLike {
  nome: string;
  observacao?: string | null;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  captured_at?: string;
  geometry_type?: "point" | "line" | "polygon";
  coordinates?: any;
  precision_quality?: string | null;
  capture_duration_seconds?: number | null;
  readings_count?: number | null;
  responsible_name?: string | null;
}

const QUALITY_LABEL: Record<string, string> = {
  excelente: "Excelente",
  boa: "Boa",
  aceitavel: "Aceitável",
  baixa: "Baixa",
};

function pointPlacemarkXml(p: KmlPointLike): string {
  const name = escapeXml(p.nome || "Ponto");
  const descParts: string[] = [];
  if (p.observacao) descParts.push(p.observacao);
  if (p.accuracy != null) descParts.push(`Precisão estimada: ~${Math.round(p.accuracy)} m`);
  if (p.precision_quality)
    descParts.push(`Qualidade: ${QUALITY_LABEL[p.precision_quality] || p.precision_quality}`);
  if (p.captured_at) descParts.push(`Capturado em: ${new Date(p.captured_at).toLocaleString("pt-BR")}`);
  if (p.capture_duration_seconds != null)
    descParts.push(`Tempo de estabilização: ${Math.round(p.capture_duration_seconds)}s`);
  if (p.readings_count != null) descParts.push(`Leituras: ${p.readings_count}`);
  if (p.responsible_name) descParts.push(`Responsável: ${p.responsible_name}`);
  const desc = escapeXml(descParts.join("\n"));
  return `    <Placemark>
      <name>${name}</name>
      <description>${desc}</description>
      <Point><coordinates>${p.longitude},${p.latitude},0</coordinates></Point>
    </Placemark>`;
}

function geometryPlacemarkXml(g: DiaryGeometry): string {
  const name = escapeXml(g.name || (g.geometry_type === "polygon" ? "Polígono" : g.geometry_type === "line" ? "Linha" : "Ponto"));
  const descParts: string[] = [];
  if (g.description) descParts.push(g.description);
  if (g.area_m2 != null) descParts.push(`Área: ${Math.round(g.area_m2)} m² (${(g.area_m2 / 10000).toFixed(3)} ha)`);
  if (g.length_m != null) descParts.push(`Comprimento: ${Math.round(g.length_m)} m`);
  const desc = escapeXml(descParts.join("\n"));

  let geomXml = "";
  if (g.geometry_type === "point" && Array.isArray(g.geojson?.coordinates)) {
    const [lng, lat] = g.geojson.coordinates;
    geomXml = `<Point><coordinates>${lng},${lat},0</coordinates></Point>`;
  } else if (g.geometry_type === "line" && Array.isArray(g.geojson?.coordinates)) {
    const coords = g.geojson.coordinates.map((c: number[]) => `${c[0]},${c[1]},0`).join(" ");
    geomXml = `<LineString><coordinates>${coords}</coordinates></LineString>`;
  } else if (g.geometry_type === "polygon" && Array.isArray(g.geojson?.coordinates?.[0])) {
    const ring = g.geojson.coordinates[0];
    const closed = ring.length > 0 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])
      ? [...ring, ring[0]]
      : ring;
    const coords = closed.map((c: number[]) => `${c[0]},${c[1]},0`).join(" ");
    geomXml = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
  }

  return `    <Placemark>
      <name>${name}</name>
      <description>${desc}</description>
      ${geomXml}
    </Placemark>`;
}

/**
 * KML 2.2 com pontos legados (journal_points sem geometria) e geometrias do diary_geometries.
 */
export function buildKml(
  entry: KmlEntryMeta,
  points: KmlPointLike[],
  geometries: DiaryGeometry[] = [],
): string {
  const docName = escapeXml(
    entry.title || `Diário ${entry.entry_date || ""}`.trim() || "Pontos do Diário",
  );

  const placemarks = [
    ...points.map(pointPlacemarkXml),
    ...geometries.map(geometryPlacemarkXml),
  ].join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${docName}</name>
${placemarks}
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

export async function exportEntryKml(
  entry: KmlEntryMeta,
  points: JournalPoint[],
  geometries: DiaryGeometry[] = [],
): Promise<string> {
  const kml = buildKml(entry, points, geometries);
  const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
  const filename = `diario-${entry.id}-${Date.now()}.kml`;
  const path = `kml/${entry.id}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "application/vnd.google-earth.kml+xml", upsert: true });
  if (error) throw error;

  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  triggerDownload(blob, filename);
  return url;
}

/** Exporta uma única geometria como KML (download direto, sem upload). */
export function exportSingleGeometry(entry: KmlEntryMeta, g: DiaryGeometry) {
  const kml = buildKml(entry, [], [g]);
  const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
  const safeName = (g.name || g.geometry_type).replace(/[^a-z0-9-_]+/gi, "_");
  triggerDownload(blob, `${safeName}-${g.id.slice(0, 8)}.kml`);
}
