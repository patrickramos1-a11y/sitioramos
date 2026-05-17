import type { PropertyMapLayer } from "@/lib/propertyLayers";

type LngLat = [number, number];

function collectGeometryPoints(geometry: any): LngLat[] {
  if (!geometry) return [];
  if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
    return [[geometry.coordinates[0], geometry.coordinates[1]]];
  }
  if (geometry.type === "LineString" && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates.map((coord: number[]) => [coord[0], coord[1]]);
  }
  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates?.[0])) {
    return geometry.coordinates[0].map((coord: number[]) => [coord[0], coord[1]]);
  }
  if (geometry.type === "GeometryCollection" && Array.isArray(geometry.geometries)) {
    return geometry.geometries.flatMap((item: any) => collectGeometryPoints(item));
  }
  return [];
}

function closedRingFromGeometry(geometry: any): LngLat[] | null {
  if (!geometry) return null;
  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates?.[0])) {
    return geometry.coordinates[0].map((coord: number[]) => [coord[0], coord[1]]);
  }
  if (geometry.type === "LineString" && Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 4) {
    const coords = geometry.coordinates.map((coord: number[]) => [coord[0], coord[1]] as LngLat);
    const [firstLng, firstLat] = coords[0];
    const [lastLng, lastLat] = coords[coords.length - 1];
    const closeEnough = Math.abs(firstLng - lastLng) < 0.00001 && Math.abs(firstLat - lastLat) < 0.00001;
    return closeEnough ? coords : null;
  }
  return null;
}

function pointInRing(point: LngLat, ring: LngLat[]) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distanceMeters(a: LngLat, b: LngLat) {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
}

function isInsideLayer(points: LngLat[], layer: PropertyMapLayer) {
  const rings = layer.geojson.features
    .map((feature) => closedRingFromGeometry(feature.geometry))
    .filter((ring): ring is LngLat[] => !!ring);

  if (!rings.length || !points.length) return null;
  return points.every((point) => rings.some((ring) => pointInRing(point, ring)));
}

function isNearLayer(points: LngLat[], layer: PropertyMapLayer, maxDistanceMeters = 30) {
  if (!points.length) return false;
  const layerPoints = layer.geojson.features.flatMap((feature) => collectGeometryPoints(feature.geometry));
  return points.some((point) =>
    layerPoints.some((layerPoint) => distanceMeters(point, layerPoint) <= maxDistanceMeters),
  );
}

export function validateGeometryAgainstPropertyLayers(
  geometry: any,
  propertyLayers: PropertyMapLayer[],
): string[] {
  const points = collectGeometryPoints(geometry);
  if (!points.length) return [];

  const warnings: string[] = [];
  const limitLayer = propertyLayers.find((layer) => layer.type === "limite_imovel" && layer.visible);
  const manejoLayer = propertyLayers.find((layer) => layer.type === "area_manejo" && layer.visible);
  const riverLayers = propertyLayers.filter((layer) => layer.type === "rio_igarape" && layer.visible);

  if (limitLayer) {
    const inside = isInsideLayer(points, limitLayer);
    if (inside === false) warnings.push("Este item parece estar fora do limite do imovel.");
  }

  if (manejoLayer) {
    const inside = isInsideLayer(points, manejoLayer);
    if (inside === false) warnings.push("Este item parece estar fora da area de manejo cadastrada.");
  }

  if (riverLayers.some((layer) => isNearLayer(points, layer))) {
    warnings.push("Este item esta proximo de uma camada classificada como rio/igarape.");
  }

  return warnings;
}
