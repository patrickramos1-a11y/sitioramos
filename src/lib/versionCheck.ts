import { toast } from "sonner";

type VersionState = {
  updateAvailable: boolean;
  checking: boolean;
  lastCheckedAt: number | null;
  error: string | null;
  serviceWorkerUpdateReady: boolean;
};

const RELOAD_GUARD_KEY = "sitio-ramos-last-manual-reload";
const listeners = new Set<() => void>();
const state: VersionState = {
  updateAvailable: false,
  checking: false,
  lastCheckedAt: null,
  error: null,
  serviceWorkerUpdateReady: false,
};

let started = false;
let intervalId: number | undefined;
let notified = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<VersionState>) {
  Object.assign(state, patch);
  emit();
}

function currentAssetSignature() {
  return (window as any).__APP_BUILD_ASSET__ || "";
}

async function fetchRemoteAssetSignature(): Promise<string | null> {
  try {
    const res = await fetch(`/?_=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/\/assets\/index-[^"]+\.js/);
    return match?.[0] ?? null;
  } catch {
    return null;
  }
}

async function checkRemoteVersion() {
  if (!navigator.onLine || state.checking) return;
  setState({ checking: true, error: null });
  try {
    const localSig = currentAssetSignature();
    const remoteSig = await fetchRemoteAssetSignature();
    const updateAvailable = !!localSig && !!remoteSig && localSig !== remoteSig;
    setState({
      updateAvailable,
      checking: false,
      lastCheckedAt: Date.now(),
      error: null,
    });
    if (updateAvailable && !notified) {
      notified = true;
      toast.info("Atualizacao disponivel", {
        description: "Use o botao de atualizar no topo para carregar a versao mais recente.",
      });
    }
  } catch (error: any) {
    setState({
      checking: false,
      lastCheckedAt: Date.now(),
      error: error?.message || "Falha ao verificar atualizacao.",
    });
  }
}

export function subscribeVersionState(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVersionState() {
  return state;
}

export async function applyAppUpdate() {
  const now = Date.now();
  const previous = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || "0");
  if (now - previous < 15000) return;
  sessionStorage.setItem(RELOAD_GUARD_KEY, String(now));
  const registration = window.__APP_SW_REGISTRATION__;
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }
  const url = new URL(window.location.href);
  url.searchParams.set("_r", String(now));
  window.location.replace(url.toString());
}

export async function checkForAppUpdate() {
  await checkRemoteVersion();
}

export function startVersionCheck() {
  if (typeof window === "undefined" || started) return;
  started = true;
  window.addEventListener("sitio-ramos:sw-update-found", () => {
    setState({ updateAvailable: true, serviceWorkerUpdateReady: true });
    if (!notified) {
      notified = true;
      toast.info("Atualizacao disponivel", {
        description: "Use o botao de atualizar no topo para aplicar a nova versao.",
      });
    }
  });
  void checkRemoteVersion();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void checkRemoteVersion();
  });
  window.addEventListener("focus", () => void checkRemoteVersion());
  window.addEventListener("online", () => void checkRemoteVersion());
  intervalId = window.setInterval(() => void checkRemoteVersion(), 5 * 60 * 1000);
}

export function stopVersionCheck() {
  if (intervalId) window.clearInterval(intervalId);
  intervalId = undefined;
  started = false;
}
