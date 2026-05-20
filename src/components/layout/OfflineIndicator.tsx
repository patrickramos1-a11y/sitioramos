import { Wifi, WifiOff, CloudUpload, RefreshCw, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useAppRefresh } from "@/hooks/useAppRefresh";

export function OfflineIndicator({ compact = false }: { compact?: boolean }) {
  const { online, pending, syncingQueue, failed, lastError } = useOfflineSync();
  const { refresh, refreshing, updateAvailable } = useAppRefresh();
  const isBusy = refreshing || syncingQueue;

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full",
          online
            ? "bg-brand-leaf/10 text-brand-leaf"
            : "bg-[hsl(15_55%_45%)]/15 text-[hsl(15_55%_45%)]",
        )}
        title={online ? "Conectado" : "Offline — usando dados salvos"}
      >
        {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {!compact && (online ? "Online" : "Offline")}
      </span>

      {pending > 0 && (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-sun/15 text-[hsl(38_95%_38%)]"
          title="Pendencias locais aguardando sincronizacao"
        >
          <CloudUpload className="h-3 w-3" />
          {pending}
        </span>
      )}

      {failed > 0 && (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive"
          title={lastError || "Existem pendencias com erro aguardando nova tentativa"}
        >
          {failed} erro{failed === 1 ? "" : "s"}
        </span>
      )}

      <button
        type="button"
        onClick={() => void refresh()}
        disabled={isBusy}
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors disabled:opacity-60",
          updateAvailable
            ? "bg-sky-100 text-sky-700 hover:bg-sky-200"
            : "bg-muted text-foreground/70 hover:bg-muted/80",
        )}
        title={updateAvailable ? "Atualizacao disponivel" : "Atualizar dados e sincronizar"}
      >
        {isBusy ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}
        {!compact && (updateAvailable ? "Atualizar" : "Sincronizar")}
      </button>
    </div>
  );
}
