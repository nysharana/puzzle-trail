// Picture jigsaw: jigsaw-shaped pieces that build one picture over the journey.
// At each red light a few pieces arrive turned; one tap turns a piece a quarter turn.

export type PictureId = 'flower' | 'smiley' | 'icecream';
export const PICTURES: { id: PictureId; name: string }[] = [
  { id: 'flower', name: 'Flower' },
  { id: 'smiley', name: 'Smiley' },
  { id: 'icecream', name: 'Ice cream' },
];

export interface Edges { t: number; r: number; b: number; l: number }
export interface Tile { r: number; c: number; turns: number; solved: boolean; edges: Edges }

export interface Puzzle {
  picture: PictureId;
  n: number;          // n x n pieces
  tiles: Tile[];      // in the order they arrive
  unlocked: number;
  sections: number;
  stopsUsed: number;
  planned: number;
}

// Tab direction between neighbours: +1 tab out of the first piece, -1 slot.
const H = (r: number, c: number) => ((r * 3 + c) % 2 === 0 ? 1 : -1);
const V = (r: number, c: number) => ((r + c * 2) % 3 === 1 ? -1 : 1);

export function createPuzzle(planned: number, picture: PictureId): Puzzle {
  const n = planned <= 5 ? 3 : 4;
  const tiles: Tile[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const i = r * n + c;
      tiles.push({
        r, c, solved: false,
        turns: i % 3 === 2 ? 2 : 3, // most pieces need one tap, every third needs two
        edges: { t: r > 0 ? -V(r - 1, c) : 0, b: r < n - 1 ? V(r, c) : 0, l: c > 0 ? -H(r, c - 1) : 0, r: c < n - 1 ? H(r, c) : 0 },
      });
    }
  return { picture, n, tiles, unlocked: 0, sections: 0, stopsUsed: 0, planned };
}

export const solvedCount = (p: Puzzle) => p.tiles.filter(t => t.solved).length;
export const isComplete = (p: Puzzle) => p.tiles.every(t => t.solved);
export const sectionDone = (p: Puzzle) => p.tiles.slice(0, p.unlocked).every(t => t.solved);

/** Called once per eligible red-light stop. lightsFromHere counts this light and every light after it. */
export function registerStop(p: Puzzle, lightsFromHere: number): Puzzle {
  const before = p.stopsUsed;
  const next = { ...p, stopsUsed: before + 1 };
  if (!sectionDone(p) || p.unlocked >= p.tiles.length) return next;
  const left = p.tiles.length - p.unlocked;
  const expectedRemaining = Math.max(1, Math.min(p.planned - before, lightsFromHere));
  const chunk = Math.ceil(left / expectedRemaining);
  return { ...next, unlocked: p.unlocked + chunk, sections: p.sections + 1 };
}

export function estimatedSections(p: Puzzle, lightsAhead: number): number {
  const left = p.tiles.length - p.unlocked;
  if (left <= 0) return Math.max(1, p.sections);
  if (p.sections === 0 && p.stopsUsed === 0 && lightsAhead >= p.planned) return Math.min(p.planned, p.tiles.length);
  const future = lightsAhead === 0 ? 0 : Math.min(left, Math.max(1, Math.min(p.planned - p.stopsUsed, lightsAhead)));
  return Math.max(1, p.sections + future);
}

export function tapTile(p: Puzzle, i: number): Puzzle {
  const t = p.tiles[i];
  if (!t || t.solved || i >= p.unlocked) return p;
  const turns = t.turns + 1;
  const tiles = p.tiles.slice();
  tiles[i] = { ...t, turns, solved: turns % 4 === 0 };
  return { ...p, tiles };
}
