import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { Puzzle, sectionDone, isComplete, solvedCount, PICTURES } from '../sim/puzzle';
import { jigsawPath } from './jigsaw';
import { LogoMark } from './Logo';

const IMG = 600;

interface BoardProps {
  puzzle: Puzzle;
  size: number;
  interactive: boolean;
  onTap?: (i: number) => void;
  reveal?: boolean;
  uid: string;
}

/** The picture jigsaw board. Empty slots show a faint guide of the picture. */
export function JigsawBoard({ puzzle, size, interactive, onTap, reveal, uid }: BoardProps) {
  const n = puzzle.n;
  const cell = IMG / n;
  const m = cell * 0.3;
  const pic = `#pic-${puzzle.picture}`;
  const complete = isComplete(puzzle);
  const [flash, setFlash] = useState<number | null>(null);
  const prev = useRef(puzzle.tiles.map(t => t.solved));
  useEffect(() => {
    const idx = puzzle.tiles.findIndex((t, i) => t.solved && !prev.current[i]);
    prev.current = puzzle.tiles.map(t => t.solved);
    if (idx >= 0) { setFlash(idx); const t = setTimeout(() => setFlash(null), 450); return () => clearTimeout(t); }
  }, [puzzle.tiles]);

  const paths = puzzle.tiles.map(t => jigsawPath(t.c * cell, t.r * cell, cell, t.edges));
  const key = (e: KeyboardEvent, i: number) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap?.(i); } };
  const active = puzzle.tiles.map((t, i) => i < puzzle.unlocked && !t.solved);

  return (
    <svg viewBox={`${-m} ${-m} ${IMG + 2 * m} ${IMG + 2 * m}`} width={size} height={size} className="block max-w-full overflow-visible"
      role="group" aria-label={`Picture puzzle, ${solvedCount(puzzle)} of ${puzzle.tiles.length} pieces in place`}>
      <defs>
        {paths.map((d, i) => <clipPath key={i} id={`${uid}-c${i}`}><path d={d} /></clipPath>)}
        <clipPath id={`${uid}-board`}><rect width={IMG} height={IMG} rx={18} /></clipPath>
      </defs>
      {/* tray and faint guide */}
      <rect x={-6} y={-6} width={IMG + 12} height={IMG + 12} rx={22} fill="#F1F3F4" />
      <g clipPath={`url(#${uid}-board)`} opacity={0.2} pointerEvents="none"><use href={pic} /></g>
      {/* empty slots */}
      {puzzle.tiles.map((t, i) => !t.solved && (
        <path key={`s${i}`} d={paths[i]} fill="none" pointerEvents="none" stroke={active[i] ? '#4285F4' : '#BDC1C6'}
          strokeWidth={active[i] ? 3 : 2} strokeDasharray={active[i] ? '10 8' : '6 8'} />
      ))}
      {/* placed pieces */}
      {puzzle.tiles.map((t, i) => t.solved && (
        <g key={`p${i}`} className={flash === i ? 'piece-ok' : undefined} pointerEvents="none"
          style={{ transformBox: 'view-box', transformOrigin: `${(t.c + 0.5) * cell}px ${(t.r + 0.5) * cell}px` }}>
          <g clipPath={`url(#${uid}-c${i})`}><use href={pic} /></g>
          <path d={paths[i]} fill="none" stroke="#FFFFFF" strokeOpacity={complete ? 0 : 0.85} strokeWidth={3}
            style={{ transition: 'stroke-opacity 900ms ease 400ms' }} />
        </g>
      ))}
      {/* pieces waiting to be turned */}
      {puzzle.tiles.map((t, i) => {
        if (!active[i]) return null;
        const can = interactive;
        return (
          <g key={`a${i}`}
            role={can ? 'button' : undefined} tabIndex={can ? 0 : undefined}
            aria-label={can ? `Turn piece ${i + 1}` : undefined}
            onClick={can ? () => onTap?.(i) : undefined}
            onKeyDown={can ? e => key(e, i) : undefined}
            className={can ? 'cursor-pointer outline-none piece-btn' : undefined}>
            <g style={{ transform: `rotate(${t.turns * 90}deg)`, transformBox: 'view-box', transformOrigin: `${(t.c + 0.5) * cell}px ${(t.r + 0.5) * cell}px`, transition: 'transform 200ms ease-out' }}>
              <g style={{ filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.28))' }}>
                <g clipPath={`url(#${uid}-c${i})`}><use href={pic} /></g>
                <path d={paths[i]} fill="none" stroke="#FFFFFF" strokeWidth={5} className="piece-edge" />
              </g>
            </g>
          </g>
        );
      })}
      {reveal && complete && (
        <g clipPath={`url(#${uid}-board)`} pointerEvents="none">
          <use href={pic} className="seal" />
          <rect x={-IMG} y={0} width={IMG * 0.6} height={IMG} fill="url(#shine)" className="shine" />
        </g>
      )}
    </svg>
  );
}

function Dots({ done, total }: { done: number; total: number }) {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="block h-1.5 rounded-full transition-all" style={{ width: i < done ? (total > 5 ? 10 : 14) : 6, background: i < done ? '#4285F4' : '#DADCE0' }} />
      ))}
    </div>
  );
}

export function pictureName(p: Puzzle) { return PICTURES.find(x => x.id === p.picture)?.name ?? 'Picture'; }

export function PuzzlePanel({ puzzle, total, onTap }: { puzzle: Puzzle; total: number; onTap: (i: number) => void }) {
  const done = sectionDone(puzzle);
  const complete = isComplete(puzzle);
  return (
    <section aria-label="The Puzzle Trail"
      className="panel-in absolute right-6 bottom-6 z-30 bg-white rounded-[26px] shadow-[0_6px_24px_rgba(0,0,0,.22)] px-5 pt-4 pb-4 flex flex-col gap-3 w-[372px]">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="text-[17px] font-semibold text-ink tracking-tight whitespace-nowrap">The Puzzle Trail</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Dots done={done ? puzzle.sections : puzzle.sections - 1} total={total} />
          <span className="text-[14px] text-mute tabular-nums">{Math.max(1, puzzle.sections)} of {total}</span>
        </div>
      </header>
      <div className="flex justify-center">
        <JigsawBoard puzzle={puzzle} size={322} interactive={!done} onTap={onTap} uid="panel" />
      </div>
      <p className="m-0 flex items-center gap-2 text-[16px] text-mute min-h-[24px]" aria-live="polite">
        {complete ? (<><Check /> All pieces in. See it when you arrive.</>)
          : done ? (<><Check /> Nice. More pieces at the next red light.</>)
          : (<><RotateIcon /> Tap a piece to turn it</>)}
      </p>
    </section>
  );
}

function Check() {
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#34A853" /><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function RotateIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 8a8 8 0 1 0 1 6" fill="none" stroke="#4285F4" strokeWidth="2.4" strokeLinecap="round" /><path d="M20 3v5h-5" fill="none" stroke="#4285F4" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
