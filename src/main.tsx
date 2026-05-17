import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

declare global {
  interface Window {
    __APP_BUILD_ASSET__?: string;
  }
}

window.__APP_BUILD_ASSET__ = new URL(import.meta.url).pathname;

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  (window.location.hostname.includes("lovable.app") &&
    window.location.hostname.includes("id-preview--"));

if (import.meta.env.PROD && "serviceWorker" in navigator && !isInIframe && !isPreviewHost) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
