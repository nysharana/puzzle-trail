// Simulated map world, routes and destinations. No real map or signal data is used.

export interface Pt { x: number; y: number }
export interface Seg { a: Pt; b: Pt; len: number; start: number; name: string }
export interface Route { points: Pt[]; segs: Seg[]; len: number }
export type DemoSignal = 'red' | 'green';
export interface Light { at: number; p: Pt; demo: DemoSignal }

export interface Destination {
  id: string;
  name: string;
  area: string;
  route: Route;
  lights: Light[];
  expectedStops: number; // planning estimate of eligible red-light stops
}

export const WORLD = { w: 2400, h: 1800, grid: 200, offset: 100 };
export const METERS_PER_PX = 2.5;

function buildRoute(points: Pt[], names: string[]): Route {
  const segs: Seg[] = [];
  let start = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push({ a, b, len, start, name: names[i] ?? '' });
    start += len;
  }
  return { points, segs, len: start };
}

export function pointAt(route: Route, d: number): { x: number; y: number; angle: number; seg: number } {
  const dd = Math.max(0, Math.min(route.len, d));
  let i = route.segs.findIndex(s => dd <= s.start + s.len + 1e-6);
  if (i < 0) i = route.segs.length - 1;
  const s = route.segs[i];
  const t = s.len ? (dd - s.start) / s.len : 0;
  return {
    x: s.a.x + (s.b.x - s.a.x) * t,
    y: s.a.y + (s.b.y - s.a.y) * t,
    angle: (Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x) * 180) / Math.PI,
    seg: i,
  };
}

function project(route: Route, p: Pt): number {
  for (const s of route.segs) {
    const onX = Math.min(s.a.x, s.b.x) - 0.1 <= p.x && p.x <= Math.max(s.a.x, s.b.x) + 0.1;
    const onY = Math.min(s.a.y, s.b.y) - 0.1 <= p.y && p.y <= Math.max(s.a.y, s.b.y) + 0.1;
    if (onX && onY) return s.start + Math.hypot(p.x - s.a.x, p.y - s.a.y);
  }
  throw new Error('Light not on route');
}

function makeDest(
  id: string, name: string, area: string,
  pts: [number, number][], names: string[],
  lights: [number, number, DemoSignal][], expectedStops: number,
): Destination {
  const route = buildRoute(pts.map(([x, y]) => ({ x, y })), names);
  return {
    id, name, area, route, expectedStops,
    lights: lights
      .map(([x, y, demo]) => ({ at: project(route, { x, y }), p: { x, y }, demo }))
      .sort((a, b) => a.at - b.at),
  };
}

export const DESTINATIONS: Destination[] = [
  makeDest('library', 'Central Library', 'Library Lane, Old Town',
    [[300, 1500], [300, 1100], [900, 1100], [900, 700]],
    ['Station Road', 'Park Avenue', 'Library Lane'],
    [[300, 1300, 'red'], [700, 1100, 'red'], [900, 900, 'red']], 3),
  makeDest('market', 'Riverside Market', 'Riverside Drive, Mill District',
    [[300, 1500], [300, 1100], [1100, 1100], [1100, 500], [1500, 500]],
    ['Station Road', 'Park Avenue', 'Mill Street', 'Riverside Drive'],
    [[300, 1300, 'red'], [700, 1100, 'red'], [1100, 900, 'red'], [1100, 700, 'red'], [1300, 500, 'red']], 5),
  makeDest('harbour', 'Harbour Station', 'Dock Lane, Harbourside',
    [[300, 1500], [300, 900], [900, 900], [900, 300], [1700, 300], [1700, 700], [2100, 700]],
    ['Station Road', 'Canal Road', 'Market Street', 'Harbour Road', 'Pier Street', 'Dock Lane'],
    [[300, 1300, 'red'], [300, 1100, 'red'], [500, 900, 'red'], [900, 700, 'red'], [900, 500, 'green'],
     [1100, 300, 'red'], [1500, 300, 'red'], [1700, 500, 'red'], [1900, 700, 'red']], 8),
];

export function destinationFor(query: string): Destination {
  const q = query.trim().toLowerCase();
  const hit = DESTINATIONS.find(d => d.name.toLowerCase().includes(q) || d.area.toLowerCase().includes(q));
  if (hit) return hit;
  const base = DESTINATIONS[query.trim().length % DESTINATIONS.length];
  return { ...base, id: 'custom', name: query.trim(), area: 'Simulated route' };
}

// Street labels drawn on the map (grid line, orientation, name, label position)
export const STREET_LABELS: { x: number; y: number; vertical: boolean; name: string }[] = [
  { x: 300, y: 1000, vertical: true, name: 'Station Road' },
  { x: 500, y: 1100, vertical: false, name: 'Park Avenue' },
  { x: 1100, y: 1300, vertical: true, name: 'Mill Street' },
  { x: 1300, y: 300, vertical: false, name: 'Harbour Road' },
  { x: 1700, y: 1100, vertical: true, name: 'Pier Street' },
  { x: 1500, y: 500, vertical: false, name: 'Riverside Drive' },
  { x: 900, y: 500, vertical: true, name: 'Market Street' },
  { x: 700, y: 1500, vertical: false, name: 'Canal Road' },
];

export function formatDistance(px: number): string {
  const m = Math.max(0, px * METERS_PER_PX);
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  if (m >= 100) return `${Math.round(m / 50) * 50} m`;
  return `${Math.max(10, Math.round(m / 10) * 10)} m`;
}

export function etaMinutes(remainingPx: number, lightsAhead: number): number {
  const m = remainingPx * METERS_PER_PX;
  return Math.max(1, Math.round(m / 420 + lightsAhead * 0.4));
}

export function clockIn(minutes: number): string {
  const d = new Date(Date.now() + minutes * 60000);
  let h = d.getHours();
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`;
}
