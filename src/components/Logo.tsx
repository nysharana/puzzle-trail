// Four interlocking puzzle pieces in Google colours with a navigation arrow.
const K = [[0.43, 0, 0.42, 0.045, 0.41, 0.07], [0.33, 0.14, 0.38, 0.22, 0.5, 0.22], [0.62, 0.22, 0.67, 0.14, 0.59, 0.07], [0.58, 0.045, 0.57, 0, 0.62, 0]];

function edge(ax: number, ay: number, bx: number, by: number, s: number, L: number, A: number) {
  if (!s) return `L${bx} ${by}`;
  const ux = (bx - ax) / L, uy = (by - ay) / L, nx = uy, ny = -ux;
  const P = (u: number, v: number) => `${(ax + u * L * ux + s * v * A * L * nx).toFixed(1)} ${(ay + u * L * uy + s * v * A * L * ny).toFixed(1)}`;
  let d = `L${P(0.38, 0)}`;
  K.forEach(k => { d += `C${P(k[0], k[1])} ${P(k[2], k[3])} ${P(k[4], k[5])}`; });
  return d + `L${bx} ${by}`;
}
function piece(x: number, y: number, e: { t: number; r: number; b: number; l: number }) {
  const L = 100, A = 1.2;
  return `M${x} ${y}` + edge(x, y, x + L, y, e.t, L, A) + edge(x + L, y, x + L, y + L, e.r, L, A)
    + edge(x + L, y + L, x, y + L, e.b, L, A) + edge(x, y + L, x, y, e.l, L, A) + 'Z';
}
const PIECES: [string, number, number, { t: number; r: number; b: number; l: number }][] = [
  ['#34A853', 0, 0, { t: 0, r: 1, b: 1, l: 0 }],
  ['#4285F4', 100, 0, { t: 0, r: 0, b: -1, l: -1 }],
  ['#FBBC05', 0, 100, { t: -1, r: 1, b: 0, l: 0 }],
  ['#EA4335', 100, 100, { t: 1, r: 0, b: 0, l: -1 }],
];

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true" className="flex-none">
      <defs><clipPath id="logo-clip"><rect width="200" height="200" rx="46" /></clipPath></defs>
      <g clipPath="url(#logo-clip)">
        <rect width="200" height="200" fill="#34A853" />
        {PIECES.map(([c, x, y, e]) => <path key={c} d={piece(x, y, e)} fill={c} />)}
      </g>
    </svg>
  );
}

export function Logo({ subtitle = true, size = 44 }: { subtitle?: boolean; size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={size} />
      <div className="leading-tight">
        <div className="font-bold tracking-tight text-[22px] text-[var(--ink)]">The Puzzle Trail</div>
        {subtitle && <div className="text-[15px] text-[var(--mute)]">A Google Maps-inspired concept experience</div>}
      </div>
    </div>
  );
}
