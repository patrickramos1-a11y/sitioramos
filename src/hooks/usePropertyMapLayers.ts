import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deletePropertyLayer,
  listPropertyLayers,
  savePropertyLayer,
  upsertOfficialSeedLayer,
  type PropertyMapLayer,
} from "@/lib/propertyLayers";

export function usePropertyMapLayers() {
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: ["property_map_layers"] });

  const query = useQuery({
    queryKey: ["property_map_layers"],
    queryFn: async () => {
      await upsertOfficialSeedLayer();
      return listPropertyLayers();
    },
  });

  const save = useMutation({
    mutationFn: savePropertyLayer,
    onSuccess: () => invalidate(),
    onError: (error: any) => toast.error(error?.message || "Falha ao salvar camada."),
  });

  const remove = useMutation({
    mutationFn: deletePropertyLayer,
    onSuccess: () => invalidate(),
    onError: (error: any) => toast.error(error?.message || "Falha ao excluir camada."),
  });

  const toggleVisibility = useMutation({
    mutationFn: async (layer: PropertyMapLayer) =>
      savePropertyLayer({
        ...layer,
        visible: !layer.visible,
      }),
    onSuccess: () => invalidate(),
    onError: (error: any) => toast.error(error?.message || "Falha ao atualizar visibilidade."),
  });

  return {
    ...query,
    save,
    remove,
    toggleVisibility,
  };
}
