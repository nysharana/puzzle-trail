import { DESTINATIONS, Destination, pointAt } from './routes';
import { Puzzle, PictureId, createPuzzle, registerStop, tapTile, isComplete } from './puzzle';

export type Phase = 'plan' | 'nav' | 'arrived';
export type SignalState = 'red' | 'green';

export const CRUISE = 120;      // simulated px per second
const ACCEL = 70;
const BRAKE = 160;
export const STOP_OFFSET = 16;  // stop line distance before the signal

export interface JourneyState {
  phase: Phase;
  dest: Destination;
  pos: number;
  speed: number;
  driving: boolean;
  trafficStopAt: number | null;
  signals: SignalState[];
  counted: boolean[];
  safe: boolean;
  puzzle: Puzzle;
  picture: PictureId;
  savedPuzzle: Puzzle | null;
  navStartedAt: number;
  auto: boolean;
  autoSolve: boolean;
  lastTapAt: number;
  redFor: number;
}

export type Action =
  | { type: 'select'; dest: Destination }
  | { type: 'start' }
  | { type: 'drive' }
  | { type: 'approachRed' }
  | { type: 'confirmSafe' }
  | { type: 'green' }
  | { type: 'continue' }
  | { type: 'trafficStop' }
  | { type: 'skip' }
  | { type: 'end' }
  | { type: 'done' }
  | { type: 'reset' }
  | { type: 'picture'; id: PictureId }
  | { type: 'tap'; index: number }
  | { type: 'tick'; dt: number }
  | { type: 'auto'; on: boolean }
  | { type: 'autoSolve'; on: boolean };

export function initialState(): JourneyState {
  const dest = DESTINATIONS[1];
  return {
    phase: 'plan', dest, pos: 0, speed: 0, driving: false, trafficStopAt: null,
    signals: dest.lights.map(() => 'green'), counted: dest.lights.map(() => false),
    safe: false, puzzle: createPuzzle(dest.expectedStops, 'flower'), picture: 'flower', savedPuzzle: null,
    navStartedAt: 0, auto: false, autoSolve: true, lastTapAt: 0, redFor: 0,
  };
}

// ---------- derived state ----------
export function nextLightIndex(s: JourneyState): number {
  return s.dest.lights.findIndex(l => l.at > s.pos + 0.5);
}

export function atLightIndex(s: JourneyState): number {
  const i = nextLightIndex(s);
  if (i < 0 || s.phase !== 'nav' || s.speed > 0.01) return -1;
  return s.dest.lights[i].at - s.pos <= STOP_OFFSET + 1 ? i : -1;
}

export function signalHere(s: JourneyState): SignalState | 'none' {
  const i = atLightIndex(s);
  return i < 0 ? 'none' : s.signals[i];
}

export function vehicleState(s: JourneyState): 'parked' | 'moving' | 'stopped' {
  if (s.phase !== 'nav') return 'parked';
  return s.speed > 0.01 ? 'moving' : 'stopped';
}

/** All three conditions must hold: stationary, red signal, safe stop confirmed. */
export function puzzleAvailable(s: JourneyState): boolean {
  return s.phase === 'nav' && s.speed <= 0.01 && signalHere(s) === 'red' && s.safe;
}

export function lightsAhead(s: JourneyState): number {
  return s.dest.lights.filter((l, i) => l.at > s.pos + 0.5 && !s.counted[i]).length;
}

// ---------- reducer ----------
function withStops(s: JourneyState): JourneyState {
  if (!puzzleAvailable(s)) return s;
  const i = atLightIndex(s);
  if (s.counted[i]) return s;
  const counted = s.counted.slice();
  counted[i] = true;
  return { ...s, counted, puzzle: registerStop(s.puzzle, s.dest.lights.length - i) };
}

function stopTarget(s: JourneyState): number | null {
  let t: number | null = null;
  if (s.trafficStopAt !== null && s.trafficStopAt >= s.pos - 0.01) t = s.trafficStopAt;
  const i = nextLightIndex(s);
  if (i >= 0 && s.signals[i] === 'red') {
    const line = s.dest.lights[i].at - STOP_OFFSET;
    if (line >= s.pos - 0.01) t = t === null ? line : Math.min(t, line);
  }
  return t;
}

function tick(s: JourneyState, dt: number): JourneyState {
  if (s.phase !== 'nav') return s;
  const target = stopTarget(s);
  let speed = s.speed, pos = s.pos;
  if (!s.driving) {
    speed = Math.max(0, speed - BRAKE * 1.6 * dt);
  } else {
    let vmax = CRUISE;
    if (target !== null) vmax = Math.min(vmax, Math.sqrt(2 * BRAKE * Math.max(0, target - pos)));
    speed = speed < vmax ? Math.min(vmax, speed + ACCEL * dt) : vmax;
  }
  pos += speed * dt;
  if (target !== null && pos >= target) { pos = target; speed = 0; }
  if (s.driving && target !== null && target - pos < 0.6 && speed < 3) { pos = target; speed = 0; }
  if (pos >= s.dest.route.len - 0.5) return arrive({ ...s, pos: s.dest.route.len, speed: 0 });
  // Simulated safe-stop check: after a short, steady stop at a red signal the system confirms it is safe.
  const atRed = speed <= 0.01 && signalHere({ ...s, pos, speed }) === 'red';
  const redFor = atRed ? s.redFor + dt : 0;
  const next: JourneyState = { ...s, pos, speed, redFor, safe: speed > 0.01 || !atRed ? false : (s.safe || redFor > 0.9) };
  return withStops(next);
}

function arrive(s: JourneyState): JourneyState {
  return { ...s, phase: 'arrived', speed: 0, driving: false, safe: false, trafficStopAt: null, pos: s.dest.route.len };
}

function freshJourney(s: JourneyState, dest: Destination): JourneyState {
  return {
    ...s, dest, pos: 0, speed: 0, driving: false, trafficStopAt: null, safe: false,
    signals: dest.lights.map(() => 'green'), counted: dest.lights.map(() => false),
  };
}

export function reducer(s: JourneyState, a: Action): JourneyState {
  switch (a.type) {
    case 'select': {
      if (s.phase !== 'plan') return s;
      const puzzle = s.savedPuzzle ? s.savedPuzzle : createPuzzle(a.dest.expectedStops, s.picture);
      return { ...freshJourney(s, a.dest), puzzle };
    }
    case 'start': {
      if (s.phase !== 'plan') return s;
      const base = freshJourney(s, s.dest);
      const puzzle = s.savedPuzzle
        ? { ...s.savedPuzzle, planned: s.savedPuzzle.stopsUsed + s.dest.expectedStops }
        : createPuzzle(s.dest.expectedStops, s.picture);
      return { ...base, phase: 'nav', puzzle, navStartedAt: performance.now() };
    }
    case 'drive':
      return s.phase === 'nav' ? { ...s, driving: true, trafficStopAt: null } : s;
    case 'approachRed': {
      if (s.phase !== 'nav') return s;
      let i = nextLightIndex(s);
      if (i >= 0 && atLightIndex(s) === i && s.signals[i] === 'green') i = i + 1 < s.dest.lights.length ? i + 1 : -1;
      if (i < 0) return s;
      const signals = s.signals.slice();
      signals[i] = 'red';
      return { ...s, signals, driving: true, trafficStopAt: null };
    }
    case 'confirmSafe':
      if (s.phase !== 'nav' || s.speed > 0.01 || signalHere(s) !== 'red') return s;
      return withStops({ ...s, safe: true });
    case 'green': {
      if (s.phase !== 'nav') return s;
      const i = nextLightIndex(s);
      if (i < 0 || s.signals[i] !== 'red') return s;
      const signals = s.signals.slice();
      signals[i] = 'green';
      return { ...s, signals, safe: false, driving: s.speed > 0.01 ? s.driving : false };
    }
    case 'continue':
      return s.phase === 'nav' ? { ...s, driving: true, trafficStopAt: null } : s;
    case 'trafficStop': {
      if (s.phase !== 'nav') return s;
      const brakeDist = (s.speed * s.speed) / (2 * BRAKE);
      return { ...s, driving: true, trafficStopAt: s.pos + Math.max(45, brakeDist + 10) };
    }
    case 'skip': {
      if (s.phase !== 'nav') return s;
      let i = nextLightIndex(s);
      if (i >= 0 && atLightIndex(s) === i) i = i + 1 < s.dest.lights.length ? i + 1 : -1;
      const to = i >= 0 ? s.dest.lights[i].at - 150 : s.dest.route.len - 110;
      if (to <= s.pos) return s;
      return { ...s, pos: to, safe: false, trafficStopAt: null };
    }
    case 'end':
      return s.phase === 'nav' ? arrive(s) : s;
    case 'done': {
      const keep = isComplete(s.puzzle) ? null : s.puzzle;
      const base = initialState();
      return { ...base, dest: s.dest, signals: s.dest.lights.map(() => 'green'), counted: s.dest.lights.map(() => false),
        savedPuzzle: keep, picture: s.picture, puzzle: keep ?? createPuzzle(s.dest.expectedStops, s.picture), autoSolve: s.autoSolve };
    }
    case 'reset': {
      const base = initialState();
      return { ...base, picture: s.picture, puzzle: createPuzzle(base.dest.expectedStops, s.picture), autoSolve: s.autoSolve };
    }
    case 'picture':
      if (s.phase !== 'plan') return s;
      return { ...s, picture: a.id, savedPuzzle: null, puzzle: createPuzzle(s.dest.expectedStops, a.id) };
    case 'tap':
      if (!puzzleAvailable(s)) return s;  // never interactive unless all safety conditions hold
      return { ...s, puzzle: tapTile(s.puzzle, a.index), lastTapAt: performance.now() };
    case 'tick':
      return tick(s, a.dt);
    case 'auto':
      return { ...s, auto: a.on };
    case 'autoSolve':
      return { ...s, autoSolve: a.on };
  }
}

export function vehiclePose(s: JourneyState) {
  return pointAt(s.dest.route, s.pos);
}
