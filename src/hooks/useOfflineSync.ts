import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getQueueCount, getQueueState, retryErroredQueueItems, subscribeQueue, syncQueue } from "@/lib/offlineQueue";

export function useOfflineSync() {
  const qc = useQueryClient();
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pending, setPending] = useState(0);
  const [syncingQueue, setSyncingQueue] = useState(false);
  const [failed, setFailed] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = async () => {
      setPending(await getQueueCount());
      const state = await getQueueState();
      setFailed(state.failed);
      setLastError(state.lastError);
    };
    refresh();
    const unsub = subscribeQueue(refresh);

    const onOnline = async () => {
      setOnline(true);
      const before = await getQueueCount();
      if (before > 0) {
        setSyncingQueue(true);
        try {
          await retryErroredQueueItems();
          const r = await syncQueue();
          if (r.synced > 0) {
            toast.success(`${r.synced} registro(s) sincronizado(s)`);
            qc.invalidateQueries({ queryKey: ["journal_entries"] });
            qc.invalidateQueries({ queryKey: ["journal_points"] });
            qc.invalidateQueries({ queryKey: ["diary_geometries"] });
            qc.invalidateQueries({ queryKey: ["map_geographic_records"] });
          }
          if (r.failed > 0) toast.error(`${r.failed} falharam ao sincronizar`);
        } finally {
          setSyncingQueue(false);
        }
      }
      refresh();
    };
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    if (navigator.onLine) onOnline();

    return () => {
      unsub();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [qc]);

  return { online, pending, syncingQueue, failed, lastError };
}
