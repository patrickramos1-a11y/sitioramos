import { supabase } from "@/integrations/supabase/client";
import type { JournalPoint } from "@/hooks/useJournalPoints";

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
}

/**
 * Build a KML 2.2 document. Currently emits Placemarks for `point` geometries.
 * Architecture supports `line` (LineString) and `polygon` (Polygon) — emit-stubs
 * will be filled when those features are implemented.
 */
export function buildKml(entry: KmlEntryMeta, points: KmlPointLike[]): string {
  const docName = escapeXml(
    entry.title ||
      `Diário ${entry.entry_date || ""}`.trim() ||
      "Pontos do Diário",
  );

  const placemarks = points
    .map((p) => {
      const name = escapeXml(p.nome || "Ponto");
      const descParts: string[] = [];
      if (p.observacao) descParts.push(p.observacao);
      if (p.captured_at) descParts.push(`Capturado em: ${new Date(p.captured_at).toLocaleString("pt-BR")}`);
      if (p.accuracy != null) descParts.push(`Precisão: ~${Math.round(p.accuracy)} m`);
      const desc = escapeXml(descParts.join("\n"));

      const geomType = p.geometry_type || "point";
      let geomXml = "";
      if (geomType === "point") {
        geomXml = `<Point><coordinates>${p.longitude},${p.latitude},0</coordinates></Point>`;
      } else if (geomType === "line" && Array.isArray(p.coordinates)) {
        // Reservado para futuro: array de [lng,lat]
        const coords = p.coordinates.map((c: any) => `${c[0]},${c[1]},0`).join(" ");
        geomXml = `<LineString><coordinates>${coords}</coordinates></LineString>`;
      } else if (geomType === "polygon" && Array.isArray(p.coordinates)) {
        const coords = p.coordinates.map((c: any) => `${c[0]},${c[1]},0`).join(" ");
        geomXml = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
      } else {
        geomXml = `<Point><coordinates>${p.longitude},${p.latitude},0</coordinates></Point>`;
      }

      return `    <Placemark>
      <name>${name}</name>
      <description>${desc}</description>
      ${geomXml}
    </Placemark>`;
    })
    .join("\n");

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

/**
 * Generate KML, save it to storage and trigger download in the browser.
 * Returns the public URL of the saved file.
 */
export async function exportEntryKml(
  entry: KmlEntryMeta,
  points: JournalPoint[],
): Promise<string> {
  const kml = buildKml(entry, points);
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
