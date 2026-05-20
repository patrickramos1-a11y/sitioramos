type MapPreferences = {
  baseLayer: "osm" | "sat";
  lastCenter: [number, number] | null;
  lastZoom: number | null;
};

const KEY = "sitio-ramos-map-preferences";

export function readMapPreferences(): MapPreferences {
  if (typeof window === "undefined") {
    return { baseLayer: "osm", lastCenter: null, lastZoom: null };
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      baseLayer: parsed.baseLayer === "sat" ? "sat" : "osm",
      lastCenter: Array.isArray(parsed.lastCenter) ? parsed.lastCenter : null,
      lastZoom: typeof parsed.lastZoom === "number" ? parsed.lastZoom : null,
    };
  } catch {
    return { baseLayer: "osm", lastCenter: null, lastZoom: null };
  }
}

export function writeMapPreferences(patch: Partial<MapPreferences>) {
  if (typeof window === "undefined") return;
  const current = readMapPreferences();
  window.localStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }));
}
