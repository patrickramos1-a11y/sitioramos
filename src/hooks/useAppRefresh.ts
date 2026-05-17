import { useSyncExternalStore, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { syncQueue } from "@/lib/offlineQueue";
import {
  applyAppUpdate,
  checkForAppUpdate,
  getVersionState,
  subscribeVersionState,
} from "@/lib/versionCheck";

const IMPORTANT_QUERY_KEYS = [
  ["journal_entries"],
  ["journal_points"],
  ["diary_geometries"],
  ["property_map_layers"],
  ["areas"],
  ["cycles"],
  ["responsaveis"],
  ["contatos"],
];

export function useAppRefresh() {
  const queryClient = useQueryClient();
  const versionState = useSyncExternalStore(subscribeVersionState, getVersionState, getVersionState);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (!navigator.onLine) {
        toast.info("Offline — usando dados salvos localmente.");
        return;
      }

      const syncResult = await syncQueue();
      if (syncResult.synced > 0) {
        toast.success(`${syncResult.synced} registro(s) sincronizado(s)`);
      }
      if (syncResult.failed > 0) {
        toast.error(`${syncResult.failed} registro(s) falharam ao sincronizar`);
      }

      await Promise.all(
        IMPORTANT_QUERY_KEYS.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }).then(() =>
            queryClient.refetchQueries({ queryKey, type: "active" }),
          ),
        ),
      );

      await checkForAppUpdate();

      if (getVersionState().updateAvailable) {
        toast.info("Aplicando atualizacao do app...");
        await applyAppUpdate();
        return;
      }

      toast.success("Dados atualizados.");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao atualizar dados.");
    } finally {
      setRefreshing(false);
    }
  };

  return {
    refreshing,
    refresh,
    updateAvailable: versionState.updateAvailable,
    checkingVersion: versionState.checking,
    versionError: versionState.error,
    lastCheckedAt: versionState.lastCheckedAt,
  };
}
