import { toast } from "sonner";

const BUILD_ID = (import.meta.env.VITE_BUILD_ID as string | undefined) ?? "dev";
let notified = false;
let intervalId: number | undefined;

async function fetchRemoteBuild(): Promise<string | null> {
  try {
    const res = await fetch(`/version.json?_=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { build?: string };
    return data.build ?? null;
  } catch {
    return null;
  }
}

async function check() {
  if (notified) return;
  if (!navigator.onLine) return;
  const remote = await fetchRemoteBuild();
  if (!remote || remote === BUILD_ID || BUILD_ID === "dev") return;
  notified = true;
  toast("Nova versão disponível", {
    description: "Toque em Atualizar para carregar a versão mais recente.",
    duration: Infinity,
    action: {
      label: "Atualizar",
      onClick: () => hardReload(),
    },
  });
}

export async function hardReload() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
  } catch {
    // ignore
  }
  const url = new URL(window.location.href);
  url.searchParams.set("_r", Date.now().toString());
  window.location.replace(url.toString());
}

export function startVersionCheck() {
  if (typeof window === "undefined") return;
  // Check imediato
  void check();
  // Ao voltar para a aba
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void check();
  });
  window.addEventListener("focus", () => void check());
  window.addEventListener("online", () => void check());
  // Polling leve a cada 5 minutos
  if (intervalId) window.clearInterval(intervalId);
  intervalId = window.setInterval(() => void check(), 5 * 60 * 1000);
}
