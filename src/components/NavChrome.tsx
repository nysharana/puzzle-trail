import { Destination, formatDistance, etaMinutes, clockIn, pointAt } from '../sim/routes';
import type { SignalState } from '../sim/journey';

type Turn = 'left' | 'right' | 'straight' | 'arrive';

function TurnIcon({ turn, size = 46 }: { turn: Turn; size?: number }) {
  const common = { fill: 'none', stroke: '#fff', strokeWidth: 4.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      {turn === 'right' && <g {...common}><path d="M16 42V24a6 6 0 0 1 6-6h16" /><path d="M31 11l7 7-7 7" /></g>}
      {turn === 'left' && <g {...common}><path d="M32 42V24a6 6 0 0 0-6-6H10" /><path d="M17 11l-7 7 7 7" /></g>}
      {turn === 'straight' && <g {...common}><path d="M24 42V8" /><path d="M17 15l7-7 7 7" /></g>}
      {turn === 'arrive' && <g><path d="M24 44C21 34 10 28 10 18a14 14 0 1 1 28 0c0 10-11 16-14 26Z" fill="#fff" /><circle cx="24" cy="18" r="5" fill="#188038" /></g>}
    </svg>
  );
}

function turnBetween(a: { a: { x: number; y: number }; b: { x: number; y: number } }, b: typeof a): Turn {
  const cross = (a.b.x - a.a.x) * (b.b.y - b.a.y) - (a.b.y - a.a.y) * (b.b.x - b.a.x);
  return cross > 0 ? 'right' : cross < 0 ? 'left' : 'straight';
}

export function NavBanner({ dest, pos }: { dest: Destination; pos: number }) {
  const { seg } = pointAt(dest.route, pos);
  const segs = dest.route.segs;
  const cur = segs[seg];
  const nextSeg = segs[seg + 1];
  const dist = cur.start + cur.len - pos;
  const turn: Turn = nextSeg ? turnBetween(cur, nextSeg) : 'arrive';
  const title = nextSeg ? nextSeg.name : dest.name;
  const thenSeg = nextSeg ? segs[seg + 2] : undefined;
  const thenTurn: Turn | null = nextSeg ? (thenSeg ? turnBetween(nextSeg, thenSeg) : 'arrive') : null;
  return (
    <div className="absolute left-6 top-6 w-[440px] z-20 rounded-[22px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,.22)]">
      <div className="bg-navgreen text-white flex items-center gap-4 px-5 py-4">
        <TurnIcon turn={turn} size={52} />
        <div className="min-w-0">
          <div className="text-[30px] font-semibold leading-none tabular-nums">{formatDistance(dist)}</div>
          <div className="text-[21px] font-medium mt-1.5 truncate">{nextSeg ? `${turn === 'right' ? 'Turn right' : turn === 'left' ? 'Turn left' : 'Continue'} onto ${title}` : `Arrive at ${title}`}</div>
        </div>
      </div>
      {thenTurn && (
        <div className="bg-[#0D652D] text-white/95 flex items-center gap-2 px-5 py-2 text-[16px]">
          <span>Then</span><TurnIcon turn={thenTurn} size={24} />
        </div>
      )}
    </div>
  );
}

function MiniSignal({ state }: { state: SignalState | 'unknown' }) {
  return (
    <svg width="16" height="34" viewBox="0 0 16 34" aria-hidden="true">
      <rect width="16" height="34" rx="6" fill="#3C4043" />
      <circle cx="8" cy="8" r="4" fill={state === 'red' ? '#EA4335' : '#6B6F74'} />
      <circle cx="8" cy="17" r="4" fill="#6B6F74" />
      <circle cx="8" cy="26" r="4" fill={state === 'green' ? '#34A853' : '#6B6F74'} />
    </svg>
  );
}

export function SignalIndicator({ dest, pos, nextIdx, atLight, signal }: {
  dest: Destination; pos: number; nextIdx: number; atLight: boolean; signal: SignalState | null;
}) {
  if (nextIdx < 0) return null;
  const l = dest.lights[nextIdx];
  const text = atLight ? (signal === 'red' ? 'Red light' : 'Green light') : `Traffic light in ${formatDistance(l.at - pos)}`;
  return (
    <div className="absolute left-6 top-[170px] z-20 flex items-center gap-3 bg-white rounded-full pl-3 pr-5 py-2 shadow-[0_2px_8px_rgba(0,0,0,.18)]">
      <MiniSignal state={signal ?? 'unknown'} />
      <div className="leading-tight">
        <div className="text-[17px] font-medium text-ink">{text}</div>
        <div className="text-[13px] text-mute tabular-nums">Light {nextIdx + 1} of {dest.lights.length}</div>
      </div>
    </div>
  );
}

export function RouteProgress({ dest, pos, signals }: { dest: Destination; pos: number; signals: SignalState[] }) {
  const pct = (v: number) => `${(v / dest.route.len) * 100}%`;
  return (
    <div className="relative h-6 mx-1" aria-label="Route progress">
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[6px] rounded-full bg-[#E8EAED]" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[6px] rounded-full bg-[#4285F4]" style={{ width: pct(pos) }} />
      {dest.lights.map((l, i) => (
        <div key={i} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[10px] h-[10px] rounded-full border-2 border-white"
          style={{ left: pct(l.at), background: l.at < pos ? '#9AA0A6' : signals[i] === 'red' ? '#EA4335' : '#3C4043' }} />
      ))}
      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[18px] h-[18px] rounded-full bg-white shadow flex items-center justify-center" style={{ left: pct(pos) }}>
        <div className="w-[10px] h-[10px] rounded-full bg-[#1A73E8]" />
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-[12px] h-[12px] rounded-full bg-[#EA4335] border-2 border-white" />
    </div>
  );
}

export function TripSheet({ dest, pos, signals, lightsAhead }: { dest: Destination; pos: number; signals: SignalState[]; lightsAhead: number }) {
  const remaining = dest.route.len - pos;
  const mins = etaMinutes(remaining, lightsAhead);
  return (
    <div className="absolute left-6 bottom-6 w-[420px] z-20 bg-white rounded-[22px] px-6 pt-4 pb-5 shadow-[0_4px_16px_rgba(0,0,0,.18)]">
      <div className="flex items-baseline gap-3">
        <span className="text-[30px] font-semibold text-navgreen tabular-nums">{mins} min</span>
        <span className="text-[18px] text-mute tabular-nums">{formatDistance(remaining)} · {clockIn(mins)}</span>
      </div>
      <div className="text-[15px] text-mute mb-3 truncate">To {dest.name}</div>
      <RouteProgress dest={dest} pos={pos} signals={signals} />
    </div>
  );
}

export function SpeedBubble({ kmh }: { kmh: number }) {
  return (
    <div className="absolute left-6 bottom-[178px] z-20 w-[76px] h-[76px] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,.2)] flex flex-col items-center justify-center leading-none">
      <span className="text-[28px] font-semibold text-ink tabular-nums">{kmh}</span>
      <span className="text-[12px] text-mute mt-1">km/h</span>
    </div>
  );
}
