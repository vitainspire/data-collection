export interface GeoPoint {
  latitude: number;
  longitude: number;
  timestamp?: number;
}

const EARTH_RADIUS_M = 6378137;

export function toMeters(p: GeoPoint, origin: GeoPoint): { x: number; y: number } {
  const latRad = (origin.latitude * Math.PI) / 180;
  const x = ((p.longitude - origin.longitude) * Math.PI) / 180 * EARTH_RADIUS_M * Math.cos(latRad);
  const y = ((p.latitude - origin.latitude) * Math.PI) / 180 * EARTH_RADIUS_M;
  return { x, y };
}

export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function trackDistanceMeters(points: GeoPoint[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += haversineMeters(points[i - 1], points[i]);
  return d;
}

export function polygonAreaSqMeters(points: GeoPoint[]): number {
  if (points.length < 3) return 0;
  const origin = points[0];
  const xy = points.map((p) => toMeters(p, origin));
  let area = 0;
  for (let i = 0; i < xy.length; i++) {
    const j = (i + 1) % xy.length;
    area += xy[i].x * xy[j].y - xy[j].x * xy[i].y;
  }
  return Math.abs(area / 2);
}

export const SQ_M_PER_ACRE = 4046.8564224;

export function sqMetersToAcres(m2: number): number {
  return m2 / SQ_M_PER_ACRE;
}

export function projectToCanvas(
  points: GeoPoint[],
  width: number,
  height: number,
  padding = 24
): { x: number; y: number }[] {
  if (points.length === 0) return [];
  const origin = points[0];
  const xy = points.map((p) => toMeters(p, origin));
  const xs = xy.map((p) => p.x);
  const ys = xy.map((p) => p.y);
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 0);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 0);
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
  const offX = (width - spanX * scale) / 2;
  const offY = (height - spanY * scale) / 2;
  return xy.map((p) => ({
    x: offX + (p.x - minX) * scale,
    y: height - (offY + (p.y - minY) * scale),
  }));
}
