import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type CycleAreaAllocation = Tables<"cycle_area_allocations">;
export type CycleAreaAllocationInsert = TablesInsert<"cycle_area_allocations">;
export type CycleAreaAllocationUpdate = TablesUpdate<"cycle_area_allocations">;

interface Filter {
  cycleId?: string;
  areaId?: string;
}

export function useCycleAreaAllocations(filter: Filter = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { cycleId, areaId } = filter;

  const { data: allocations = [], isLoading } = useQuery({
    queryKey: ["cycle_area_allocations", cycleId ?? null, areaId ?? null],
    queryFn: async () => {
      let q = supabase.from("cycle_area_allocations").select("*");
      if (cycleId) q = q.eq("cycle_id", cycleId);
      if (areaId) q = q.eq("area_id", areaId);
      const { data, error } = await q.order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["cycle_area_allocations"] });

  const create = useMutation({
    mutationFn: async (input: CycleAreaAllocationInsert) => {
      const { data, error } = await supabase
        .from("cycle_area_allocations")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Vínculo criado", description: "Alocação salva com sucesso." });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao criar vínculo", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: CycleAreaAllocationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("cycle_area_allocations")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Vínculo atualizado" });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cycle_area_allocations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Vínculo removido" });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
  });

  return { allocations, isLoading, create, update, remove };
}
