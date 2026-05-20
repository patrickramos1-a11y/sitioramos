import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteRasterLayer,
  listRasterLayers,
  saveRasterLayer,
  type RasterMapLayer,
} from "@/lib/rasterLayers";

export function useRasterMapLayers() {
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: ["raster_map_layers"] });

  const query = useQuery({
    queryKey: ["raster_map_layers"],
    queryFn: listRasterLayers,
  });

  const save = useMutation({
    mutationFn: saveRasterLayer,
    onSuccess: invalidate,
    onError: (error: any) => toast.error(error?.message || "Falha ao salvar imagem georreferenciada."),
  });

  const remove = useMutation({
    mutationFn: deleteRasterLayer,
    onSuccess: invalidate,
    onError: (error: any) => toast.error(error?.message || "Falha ao excluir imagem georreferenciada."),
  });

  const toggleVisibility = useMutation({
    mutationFn: async (layer: RasterMapLayer) =>
      saveRasterLayer({
        ...layer,
        visible: !layer.visible,
      }),
    onSuccess: invalidate,
    onError: (error: any) => toast.error(error?.message || "Falha ao atualizar visibilidade da imagem."),
  });

  return {
    ...query,
    save,
    remove,
    toggleVisibility,
  };
}
