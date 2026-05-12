import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type GeometryType = "point" | "line" | "polygon";

export interface DiaryGeometry {
  id: string;
  entry_id: string;
  geometry_type: GeometryType;
  name: string | null;
  description: string | null;
  geojson: any;
  area_m2: number | null;
  length_m: number | null;
  responsavel_id: string | null;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export function useDiaryGeometries(entryId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["diary_geometries", entryId],
    enabled: !!entryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diary_geometries" as any)
        .select("*")
        .eq("entry_id", entryId)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as DiaryGeometry[];
    },
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["diary_geometries", entryId] });

  const add = useMutation({
    mutationFn: async (
      g: Omit<DiaryGeometry, "id" | "created_at" | "updated_at">,
    ) => {
      const { data, error } = await supabase
        .from("diary_geometries" as any)
        .insert(g as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as DiaryGeometry;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message || "Falha ao salvar geometria"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<DiaryGeometry>) => {
      const { error } = await supabase
        .from("diary_geometries" as any)
        .update(patch as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("diary_geometries" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message),
  });

  return { ...query, add, update, remove };
}
