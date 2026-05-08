import { useEffect, useRef, useState } from "react";

export interface AudioRecorderState {
  status: "idle" | "recording" | "paused" | "stopped";
  seconds: number;
  blob: Blob | null;
  url: string | null;
  error: string | null;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    status: "idle",
    seconds: 0,
    blob: null,
    url: null,
    error: null,
  });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<number | null>(null);

  const stopTick = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopTick();
      cleanupStream();
      if (state.url) URL.revokeObjectURL(state.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        setState((s) => ({ ...s, status: "stopped", blob, url }));
        cleanupStream();
      };
      rec.start();
      recorderRef.current = rec;
      setState({ status: "recording", seconds: 0, blob: null, url: null, error: null });
      tickRef.current = window.setInterval(() => {
        setState((s) => ({ ...s, seconds: s.seconds + 1 }));
      }, 1000);
    } catch (e: any) {
      setState((s) => ({ ...s, error: e.message || "Não foi possível acessar o microfone" }));
    }
  };

  const pause = () => {
    recorderRef.current?.pause();
    stopTick();
    setState((s) => ({ ...s, status: "paused" }));
  };

  const resume = () => {
    recorderRef.current?.resume();
    setState((s) => ({ ...s, status: "recording" }));
    tickRef.current = window.setInterval(() => {
      setState((s) => ({ ...s, seconds: s.seconds + 1 }));
    }, 1000);
  };

  const stop = () => {
    stopTick();
    recorderRef.current?.stop();
  };

  const reset = () => {
    stopTick();
    cleanupStream();
    if (state.url) URL.revokeObjectURL(state.url);
    setState({ status: "idle", seconds: 0, blob: null, url: null, error: null });
  };

  return { ...state, start, pause, resume, stop, reset };
}
