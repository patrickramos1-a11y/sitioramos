import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { JournalEntry, JournalAttachment } from "@/hooks/useJournalEntries";

const TIPO_LABEL: Record<string, string> = {
  observacao: "Registro geral",
  plantio: "Plantio",
  limpeza: "Limpeza / manejo",
  colheita: "Colheita",
  manutencao: "Manutenção",
  ocorrencia: "Ocorrência",
  clima: "Clima",
  ambiental: "Ambiental",
};

interface MetaLookup {
  areaName?: (id: string | null) => string;
  cycleName?: (id: string | null) => string;
  responsavelName?: (id: string | null) => string;
}

function csvEscape(v: any): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/\r?\n/g, " ").replace(/"/g, '""');
  return `"${s}"`;
}

export function entriesToCSV(entries: JournalEntry[], lookup: MetaLookup = {}): string {
  const headers = [
    "id",
    "data",
    "tipo",
    "titulo",
    "descricao",
    "area",
    "ciclo",
    "responsavel",
    "status",
    "importante",
    "revisado",
    "tags",
    "clima",
    "latitude",
    "longitude",
    "qtd_fotos",
    "qtd_videos",
    "qtd_audios",
    "midias_urls",
    "criado_em",
  ];
  const lines = [headers.join(",")];
  for (const e of entries) {
    const photos = (e.attachments || []).filter((a) => a.kind === "photo");
    const videos = (e.attachments || []).filter((a) => a.kind === "video");
    const audios = (e.attachments || []).filter((a) => a.kind === "audio");
    const urls = (e.attachments || []).map((a) => a.url).filter(Boolean).join(" | ");
    lines.push(
      [
        e.id,
        e.entry_date,
        TIPO_LABEL[e.entry_type] || e.entry_type,
        e.title || "",
        e.description || "",
        lookup.areaName?.(e.area_id) || "",
        lookup.cycleName?.(e.cycle_id) || "",
        lookup.responsavelName?.(e.responsavel_id) || "",
        e.status,
        e.is_important ? "sim" : "",
        e.reviewed ? "sim" : "",
        (e.tags || []).join(" | "),
        e.weather || "",
        e.latitude ?? "",
        e.longitude ?? "",
        photos.length,
        videos.length,
        audios.length,
        urls,
        e.created_at,
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return "\uFEFF" + lines.join("\n");
}

export function downloadCSV(entries: JournalEntry[], lookup: MetaLookup = {}, filename = "diario.csv") {
  const csv = entriesToCSV(entries, lookup);
  saveAs(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename);
}

async function fetchAsBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

function attExt(a: JournalAttachment): string {
  const fromPath = a.storage_path.split(".").pop();
  if (fromPath && fromPath.length <= 5) return fromPath;
  const mt = (a.mime_type || "").split("/")[1]?.split(";")[0];
  return mt || "bin";
}

function safeName(s: string | null | undefined): string {
  return (s || "registro").replace(/[^\w\-\u00C0-\u017F ]+/g, "").trim().slice(0, 60) || "registro";
}

export async function downloadEntryZip(entry: JournalEntry, lookup: MetaLookup = {}) {
  const zip = new JSZip();
  const folderName = `${entry.entry_date}_${safeName(entry.title)}`;
  const folder = zip.folder(folderName)!;

  const meta = {
    id: entry.id,
    data: entry.entry_date,
    tipo: entry.entry_type,
    titulo: entry.title,
    descricao: entry.description,
    notas: entry.notes,
    area: lookup.areaName?.(entry.area_id) || null,
    ciclo: lookup.cycleName?.(entry.cycle_id) || null,
    responsavel: lookup.responsavelName?.(entry.responsavel_id) || null,
    status: entry.status,
    importante: entry.is_important,
    revisado: entry.reviewed,
    tags: entry.tags,
    clima: entry.weather,
    latitude: entry.latitude,
    longitude: entry.longitude,
    criado_em: entry.created_at,
    atualizado_em: entry.updated_at,
  };
  folder.file("registro.json", JSON.stringify(meta, null, 2));

  const atts = entry.attachments || [];
  let i = 0;
  for (const a of atts) {
    if (!a.url) continue;
    const blob = await fetchAsBlob(a.url);
    if (!blob) continue;
    const ext = attExt(a);
    folder.file(`${a.kind}_${++i}.${ext}`, blob);
  }

  const out = await zip.generateAsync({ type: "blob" });
  saveAs(out, `${folderName}.zip`);
}

export async function downloadEntriesZip(entries: JournalEntry[], lookup: MetaLookup = {}, filename = "diario.zip") {
  const zip = new JSZip();
  zip.file("index.csv", entriesToCSV(entries, lookup));
  for (const entry of entries) {
    const folderName = `${entry.entry_date}_${safeName(entry.title)}_${entry.id.slice(0, 6)}`;
    const folder = zip.folder(folderName)!;
    folder.file(
      "registro.json",
      JSON.stringify(
        {
          id: entry.id,
          data: entry.entry_date,
          tipo: entry.entry_type,
          titulo: entry.title,
          descricao: entry.description,
          notas: entry.notes,
          status: entry.status,
          tags: entry.tags,
          area: lookup.areaName?.(entry.area_id) || null,
          ciclo: lookup.cycleName?.(entry.cycle_id) || null,
          responsavel: lookup.responsavelName?.(entry.responsavel_id) || null,
          latitude: entry.latitude,
          longitude: entry.longitude,
        },
        null,
        2,
      ),
    );
    let i = 0;
    for (const a of entry.attachments || []) {
      if (!a.url) continue;
      const blob = await fetchAsBlob(a.url);
      if (!blob) continue;
      folder.file(`${a.kind}_${++i}.${attExt(a)}`, blob);
    }
  }
  const out = await zip.generateAsync({ type: "blob" });
  saveAs(out, filename);
}
