import { useEffect, useRef } from "react";
import { Mic, Square, Pause, Play, Trash2, Check, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { cn } from "@/lib/utils";

export interface RecordedAudio {
  blob: Blob;
  mime: string;
  duration: number;
  url: string;
}

interface Props {
  onConfirm: (audio: RecordedAudio) => void;
  onCancel: () => void;
}

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function friendlyMicError(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("denied") || m.includes("permission") || m.includes("notallowed"))
    return "Permissão de microfone negada. Habilite o microfone nas configurações do navegador.";
  if (m.includes("notfound") || m.includes("device"))
    return "Nenhum microfone encontrado neste dispositivo.";
  return "Não foi possível acessar o microfone.";
}

export function AudioRecorder({ onConfirm, onCancel }: Props) {
  const rec = useAudioRecorder();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      rec.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl border border-brand-leaf/30 bg-brand-leaf/5 p-4 space-y-3">
      {rec.error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive p-2 text-xs">
          <MicOff className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{friendlyMicError(rec.error)}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center",
              rec.status === "recording" ? "bg-destructive/15 text-destructive animate-pulse" : "bg-brand-leaf/15 text-brand-leaf",
            )}
          >
            <Mic className="h-4 w-4" />
          </span>
          <div>
            <div className="font-display text-sm font-semibold text-brand-forest">
              {rec.status === "recording" && "Gravando..."}
              {rec.status === "paused" && "Pausado"}
              {rec.status === "stopped" && "Pronto"}
              {rec.status === "idle" && "Áudio"}
            </div>
            <div className="text-xs tabular-nums text-muted-foreground">{fmt(rec.seconds)}</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {rec.status === "recording" && (
            <>
              <Button type="button" size="sm" variant="outline" onClick={rec.pause}>
                <Pause className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" size="sm" variant="default" onClick={rec.stop}>
                <Square className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {rec.status === "paused" && (
            <>
              <Button type="button" size="sm" variant="outline" onClick={rec.resume}>
                <Play className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" size="sm" variant="default" onClick={rec.stop}>
                <Square className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {rec.url && rec.status === "stopped" && (
        <audio controls src={rec.url} className="w-full" />
      )}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => { rec.reset(); onCancel(); }}>
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Cancelar
        </Button>
        {rec.blob && rec.status === "stopped" && (
          <Button
            type="button"
            size="sm"
            className="bg-brand-leaf hover:bg-brand-leaf/90"
            onClick={() =>
              onConfirm({
                blob: rec.blob!,
                mime: rec.blob!.type || "audio/webm",
                duration: rec.seconds,
                url: rec.url!,
              })
            }
          >
            <Check className="h-3.5 w-3.5 mr-1" /> Usar áudio
          </Button>
        )}
      </div>
    </div>
  );
}
