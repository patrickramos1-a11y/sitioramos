import { Wifi, WifiOff, CloudUpload, RefreshCw, RotateCw } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { syncQueue } from "@/lib/offlineQueue";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { hardReload } from "@/lib/versionCheck";

export function OfflineIndicator({ compact = false }: { compact?: boolean }) {
  const { online, pending } = useOfflineSync();
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (!online) {
      toast.error("Sem internet");
      return;
    }
    setSyncing(true);
    try {
      const r = await syncQueue();
      if (r.synced > 0) {
        toast.success(`${r.synced} registro(s) sincronizado(s)`);
        qc.invalidateQueries({ queryKey: ["journal_entries"] });
        qc.invalidateQueries({ queryKey: ["journal_points"] });
      } else if (r.failed === 0) {
        toast.info("Nada para sincronizar");
      }
      if (r.failed > 0) toast.error(`${r.failed} falharam`);
    } finally {
      setSyncing(false);
    }
  };

  if (online && pending === 0) {
    if (compact) return null;
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-leaf/10 text-brand-leaf"
        title="Conectado"
      >
        <Wifi className="h-3 w-3" />
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full",
          online
            ? "bg-brand-leaf/10 text-brand-leaf"
            : "bg-[hsl(15_55%_45%)]/15 text-[hsl(15_55%_45%)]",
        )}
      >
        {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {online ? "Online" : "Offline"}
      </span>
      {pending > 0 && (
        <button
          type="button"
          onClick={handleSync}
          disabled={!online || syncing}
          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-sun/15 text-[hsl(38_95%_38%)] hover:bg-brand-sun/25 disabled:opacity-60"
          title="Sincronizar agora"
        >
          {syncing ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <CloudUpload className="h-3 w-3" />
          )}
          {pending}
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          toast.info("Atualizando app…");
          void hardReload();
        }}
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground/70 hover:bg-muted/80"
        title="Atualizar app (limpa cache e recarrega)"
      >
        <RotateCw className="h-3 w-3" />
      </button>
    </div>
  );
}
