import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getQueueCount, subscribeQueue, syncQueue } from "@/lib/offlineQueue";

export function useOfflineSync() {
  const qc = useQueryClient();
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const refresh = async () => setPending(await getQueueCount());
    refresh();
    const unsub = subscribeQueue(refresh);

    const onOnline = async () => {
      setOnline(true);
      const before = await getQueueCount();
      if (before > 0) {
        const r = await syncQueue();
        if (r.synced > 0) {
          toast.success(`${r.synced} registro(s) sincronizado(s)`);
          qc.invalidateQueries({ queryKey: ["journal_entries"] });
        }
        if (r.failed > 0) toast.error(`${r.failed} falharam ao sincronizar`);
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

  return { online, pending };
}
