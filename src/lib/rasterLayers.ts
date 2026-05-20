import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface RasterMapLayer {
  id: string;
  name: string;
  description: string | null;
  category: "Imagem Georreferenciada";
  sourceFileName: string;
  imageDataUrl: string;
  visible: boolean;
  opacity: number;
  bounds: [[number, number], [number, number]];
  importedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface RasterLayersDB extends DBSchema {
  raster_layers: {
    key: string;
    value: RasterMapLayer;
  };
}

const DB_NAME = "sitio-ramos-raster-layers";
const STORE_NAME = "raster_layers";
let dbPromise: Promise<IDBPDatabase<RasterLayersDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<RasterLayersDB>(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function listRasterLayers() {
  const db = await getDb();
  const rows = await db.getAll(STORE_NAME);
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function saveRasterLayer(
  input: Omit<RasterMapLayer, "id" | "createdAt" | "updatedAt"> & { id?: string },
) {
  const db = await getDb();
  const now = new Date().toISOString();
  const existing = input.id ? await db.get(STORE_NAME, input.id) : null;
  const layer: RasterMapLayer = {
    ...input,
    id: input.id || crypto.randomUUID(),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await db.put(STORE_NAME, layer);
  return layer;
}

export async function deleteRasterLayer(id: string) {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}

export async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Falha ao ler a imagem."));
    reader.readAsDataURL(file);
  });
}
