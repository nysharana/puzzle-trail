import { memo } from 'react';
import { WORLD, STREET_LABELS, Destination } from '../sim/routes';
import type { SignalState } from '../sim/journey';

const ARTERIAL_X = [300, 1100, 1700];
const ARTERIAL_Y = [500, 1100];
const PARKS = [
  { x: 1300, y: 700, w: 400, h: 400 }, { x: 500, y: 1300, w: 200, h: 200 },
  { x: 100, y: 300, w: 400, h: 200 }, { x: 1900, y: 1300, w: 400, h: 400 },
];
const WATER = 'M2000 -50 L2450 -50 L2450 1250 C2300 1120 2230 930 2290 800 C2350 660 2160 560 2010 490 C1880 420 1950 180 2000 -50Z';

/** Static base map: land, blocks, parks, roads, water, labels. */
const BaseMap = memo(function BaseMap() {
  const lines: number[] = [];
  for (let v = WORLD.offset; v < Math.max(WORLD.w, WORLD.h); v += WORLD.grid) lines.push(v);
  const blocks: JSX.Element[] = [];
  for (let x = WORLD.offset; x < WORLD.w; x += WORLD.grid)
    for (let y = WORLD.offset; y < WORLD.h; y += WORLD.grid)
      blocks.push(<rect key={`${x}-${y}`} x={x + 24} y={y + 24} width={WORLD.grid - 48} height={WORLD.grid - 48} rx={8} fill="#E4E7EB" />);
  return (
    <g>
      <rect x={-400} y={-400} width={WORLD.w + 800} height={WORLD.h + 800} fill="#EDEFF2" />
      {blocks}
      {PARKS.map((p, i) => <rect key={i} x={p.x + 16} y={p.y + 16} width={p.w - 32} height={p.h - 32} rx={14} fill="#CEEAD6" />)}
      <g stroke="#D3D7DC" strokeLinecap="square">
        {lines.filter(v => v < WORLD.w).map(x => <line key={`vx${x}`} x1={x} y1={-400} x2={x} y2={WORLD.h + 400} strokeWidth={ARTERIAL_X.includes(x) ? 40 : 28} />)}
        {lines.filter(v => v < WORLD.h).map(y => <line key={`hy${y}`} x1={-400} y1={y} x2={WORLD.w + 400} y2={y} strokeWidth={ARTERIAL_Y.includes(y) ? 40 : 28} />)}
      </g>
      <g stroke="#FFFFFF" strokeLinecap="square">
        {lines.filter(v => v < WORLD.w).map(x => <line key={`vf${x}`} x1={x} y1={-400} x2={x} y2={WORLD.h + 400} strokeWidth={ARTERIAL_X.includes(x) ? 34 : 22} />)}
        {lines.filter(v => v < WORLD.h).map(y => <line key={`hf${y}`} x1={-400} y1={y} x2={WORLD.w + 400} y2={y} strokeWidth={ARTERIAL_Y.includes(y) ? 34 : 22} />)}
      </g>
      <path d={WATER} fill="#AECBFA" />
      <text x={2230} y={300} fill="#4A78C2" fontSize={26} fontStyle="italic" textAnchor="middle">Harbour</text>
      <text x={1500} y={915} fill="#2E7D4F" fontSize={20} textAnchor="middle">Mill Park</text>
      {STREET_LABELS.map(l => (
        <text key={l.name} x={l.x} y={l.y} fill="#6B7076" fontSize={15} fontWeight={500} textAnchor="middle"
          dominantBaseline="central" transform={l.vertical ? `rotate(-90 ${l.x} ${l.y})` : undefined}
          stroke="#FFFFFF" strokeWidth={4} paintOrder="stroke">{l.name}</text>
      ))}
    </g>
  );
});

function TrafficLightMarker({ x, y, state, dim }: { x: number; y: number; state: SignalState; dim: boolean }) {
  const off = '#5F6368';
  return (
    <g transform={`translate(${x} ${y})`} opacity={dim ? 0.55 : 1}>
      <rect x={-11} y={-25} width={22} height={50} rx={8} fill="#3C4043" stroke="#FFFFFF" strokeWidth={3} />
      <circle cy={-13} r={5.5} fill={state === 'red' ? '#EA4335' : off} />
      <circle cy={0} r={5.5} fill={off} />
      <circle cy={13} r={5.5} fill={state === 'green' ? '#34A853' : off} />
    </g>
  );
}

interface Props {
  dest: Destination;
  pos: number;
  showRoute: boolean;
  signals: SignalState[];
  car: { x: number; y: number; angle: number } | null;
  camera: { tx: number; ty: number; s: number };
  animateCamera: boolean;
}

export function MapView({ dest, pos, showRoute, signals, car, camera, animateCamera }: Props) {
  const d = 'M' + dest.route.points.map(p => `${p.x} ${p.y}`).join(' L');
  const len = dest.route.len;
  const end = dest.route.points[dest.route.points.length - 1];
  const start = dest.route.points[0];
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1280 720" aria-hidden="true">
      <g style={{
        transform: `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.s})`,
        transformOrigin: '0 0',
        transition: animateCamera ? 'transform 900ms cubic-bezier(.3,.7,.2,1)' : 'none',
      }}>
        <BaseMap />
        {showRoute && (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={d} stroke="#1A5BC4" strokeWidth={24} strokeDasharray={`0 ${pos} ${len + 10}`} />
            <path d={d} stroke="#4285F4" strokeWidth={17} strokeDasharray={`0 ${pos} ${len + 10}`} />
          </g>
        )}
        {showRoute && dest.lights.map((l, i) => {
          if (l.at < pos - 1) return null;
          const seg = dest.route.segs.find(sg => l.at <= sg.start + sg.len + 0.01)!;
          const ux = (seg.b.x - seg.a.x) / seg.len, uy = (seg.b.y - seg.a.y) / seg.len;
          return <TrafficLightMarker key={i} x={l.p.x - uy * 38} y={l.p.y + ux * 38} state={signals[i]} dim={false} />;
        })}
        {showRoute && pos < 1 && <circle cx={start.x} cy={start.y} r={11} fill="#FFFFFF" stroke="#4285F4" strokeWidth={6} />}
        {showRoute && (
          <g transform={`translate(${end.x} ${end.y})`}>
            <path d="M0 0C-4-14-20-22-20-38a20 20 0 1 1 40 0C20-22 4-14 0 0Z" fill="#EA4335" stroke="#B3261E" strokeWidth={2} />
            <circle cy={-38} r={7} fill="#7A1A12" />
          </g>
        )}
        {car && (
          <g transform={`translate(${car.x} ${car.y}) rotate(${car.angle + 90})`}>
            <circle r={25} fill="#4285F4" opacity={0.16} />
            <circle r={19} fill="#FFFFFF" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.3))' }} />
            <path d="M0 -12 L10 10 L0 5 L-10 10Z" fill="#1A73E8" />
          </g>
        )}
      </g>
    </svg>
  );
}
