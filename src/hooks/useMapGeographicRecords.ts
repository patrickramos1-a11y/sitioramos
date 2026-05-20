import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { JournalEntry } from "@/hooks/useJournalEntries";
import type { JournalPoint } from "@/hooks/useJournalPoints";
import type { DiaryGeometry } from "@/hooks/useDiaryGeometries";

export type GeographicRecordSource = "diary_geometry" | "journal_point";
export type GeographicRecordType = "point" | "line" | "polygon";

export interface GeographicRecordItem {
  id: string;
  source: GeographicRecordSource;
  geometryType: GeographicRecordType;
  name: string;
  description: string | null;
  entry: JournalEntry | null;
  entryId: string | null;
  createdAt: string;
  updatedAt: string;
  coordinatesSummary: string | null;
  lengthM: number | null;
  areaM2: number | null;
  accuracy: number | null;
  precisionQuality: string | null;
  geojson: any;
  rawPoint?: JournalPoint;
  rawGeometry?: DiaryGeometry;
}

const HIDDEN_KEY = "sitio-ramos-hidden-geographic-records";

function readHiddenIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HIDDEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHiddenIds(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids));
}

function isSameLegacyPoint(point: JournalPoint, geometry: DiaryGeometry) {
  if (geometry.geometry_type !== "point" || !Array.isArray(geometry.geojson?.coordinates)) return false;
  const [lng, lat] = geometry.geojson.coordinates;
  return Math.abs(lat - point.latitude) < 0.000001 && Math.abs(lng - point.longitude) < 0.000001;
}

function formatCoordinatesSummary(geojson: any, geometryType: GeographicRecordType) {
  if (geometryType === "point" && Array.isArray(geojson?.coordinates)) {
    const [lng, lat] = geojson.coordinates;
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
  return null;
}

export function useMapGeographicRecords() {
  const qc = useQueryClient();

  const dataQuery = useQuery({
    queryKey: ["map_geographic_records"],
    queryFn: async () => {
      const [entriesRes, pointsRes, geometriesRes] = await Promise.all([
        supabase
          .from("journal_entries" as any)
          .select("*, journal_attachments(*)")
          .order("created_at", { ascending: false }),
        supabase.from("journal_points" as any).select("*").order("captured_at", { ascending: false }),
        supabase.from("diary_geometries" as any).select("*").order("created_at", { ascending: false }),
      ]);

      if (entriesRes.error) throw entriesRes.error;
      if (pointsRes.error) throw pointsRes.error;
      if (geometriesRes.error) throw geometriesRes.error;

      const entries = (entriesRes.data || []) as unknown as JournalEntry[];
      const points = (pointsRes.data || []) as unknown as JournalPoint[];
      const geometries = (geometriesRes.data || []) as unknown as DiaryGeometry[];
      return { entries, points, geometries };
    },
  });

  const hiddenQuery = useQuery({
    queryKey: ["map_geographic_record_visibility"],
    queryFn: async () => readHiddenIds(),
    initialData: [],
  });

  const items = useMemo(() => {
    const entries = dataQuery.data?.entries || [];
    const points = dataQuery.data?.points || [];
    const geometries = dataQuery.data?.geometries || [];
    const entryMap = new Map(entries.map((entry) => [entry.id, entry]));

    const geometryItems: GeographicRecordItem[] = geometries.map((geometry) => {
      const props = geometry.geojson?.properties || {};
      return {
        id: `geometry:${geometry.id}`,
        source: "diary_geometry",
        geometryType: geometry.geometry_type,
        name:
          geometry.name ||
          (geometry.geometry_type === "polygon" ? "Poligono" : geometry.geometry_type === "line" ? "Linha" : "Ponto"),
        description: geometry.description,
        entry: entryMap.get(geometry.entry_id) || null,
        entryId: geometry.entry_id,
        createdAt: geometry.created_at,
        updatedAt: geometry.updated_at,
        coordinatesSummary: formatCoordinatesSummary(geometry.geojson, geometry.geometry_type),
        lengthM: geometry.length_m,
        areaM2: geometry.area_m2,
        accuracy: props.accuracy ?? null,
        precisionQuality: props.precision_quality ?? null,
        geojson: geometry.geojson,
        rawGeometry: geometry,
      };
    });

    const legacyPointItems: GeographicRecordItem[] = points
      .filter((point) => !geometries.some((geometry) => geometry.entry_id === point.entry_id && isSameLegacyPoint(point, geometry)))
      .map((point) => ({
        id: `point:${point.id}`,
        source: "journal_point",
        geometryType: "point",
        name: point.nome,
        description: point.observacao,
        entry: entryMap.get(point.entry_id) || null,
        entryId: point.entry_id,
        createdAt: point.created_at,
        updatedAt: point.updated_at,
        coordinatesSummary: `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`,
        lengthM: null,
        areaM2: null,
        accuracy: point.accuracy,
        precisionQuality: point.precision_quality,
        geojson: {
          type: "Point",
          coordinates: [point.longitude, point.latitude],
          properties: {
            accuracy: point.accuracy,
            precision_quality: point.precision_quality,
            captured_at: point.captured_at,
            best_accuracy: point.best_accuracy,
            readings_count: point.readings_count,
            capture_duration_seconds: point.capture_duration_seconds,
          },
        },
        rawPoint: point,
      }));

    return [...geometryItems, ...legacyPointItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [dataQuery.data]);

  const hiddenIds = hiddenQuery.data || [];

  const setVisibility = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const current = new Set(readHiddenIds());
      if (visible) current.delete(id);
      else current.add(id);
      writeHiddenIds(Array.from(current));
      return Array.from(current);
    },
    onSuccess: (ids) => qc.setQueryData(["map_geographic_record_visibility"], ids),
  });

  const updateRecord = useMutation({
    mutationFn: async ({
      item,
      name,
      description,
      areaId,
      cycleId,
      responsavelId,
    }: {
      item: GeographicRecordItem;
      name: string;
      description: string | null;
      areaId?: string | null;
      cycleId?: string | null;
      responsavelId?: string | null;
    }) => {
      if (item.source === "diary_geometry" && item.rawGeometry) {
        const { error } = await supabase
          .from("diary_geometries" as any)
          .update({ name, description } as any)
          .eq("id", item.rawGeometry.id);
        if (error) throw error;
      } else if (item.source === "journal_point" && item.rawPoint) {
        const { error } = await supabase
          .from("journal_points" as any)
          .update({ nome: name, observacao: description } as any)
          .eq("id", item.rawPoint.id);
        if (error) throw error;
      }

      if (item.entryId) {
        const patch: Record<string, string | null> = {};
        if (areaId !== undefined) patch.area_id = areaId;
        if (cycleId !== undefined) patch.cycle_id = cycleId;
        if (responsavelId !== undefined) patch.responsavel_id = responsavelId;
        if (Object.keys(patch).length) {
          const { error } = await supabase.from("journal_entries" as any).update(patch as any).eq("id", item.entryId);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["map_geographic_records"] });
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      toast.success("Registro geografico atualizado.");
    },
    onError: (error: any) => toast.error(error?.message || "Falha ao atualizar registro geografico."),
  });

  const removeRecord = useMutation({
    mutationFn: async (item: GeographicRecordItem) => {
      if (item.source === "diary_geometry" && item.rawGeometry) {
        const { error } = await supabase.from("diary_geometries" as any).delete().eq("id", item.rawGeometry.id);
        if (error) throw error;
      } else if (item.source === "journal_point" && item.rawPoint) {
        const { error } = await supabase.from("journal_points" as any).delete().eq("id", item.rawPoint.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["map_geographic_records"] });
      toast.success("Registro geografico removido.");
    },
    onError: (error: any) => toast.error(error?.message || "Falha ao remover registro geografico."),
  });

  const removeEntry = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.from("journal_entries" as any).delete().eq("id", entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["map_geographic_records"] });
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      toast.success("Registro do Diario removido.");
    },
    onError: (error: any) => toast.error(error?.message || "Falha ao remover registro do Diario."),
  });

  return {
    ...dataQuery,
    items,
    hiddenIds,
    visibleItems: items.filter((item) => !hiddenIds.includes(item.id)),
    setVisibility,
    updateRecord,
    removeRecord,
    removeEntry,
  };
}
