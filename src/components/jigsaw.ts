// Classic jigsaw outline: a square whose sides carry a knob (+1), a socket (-1) or stay flat (0).
const K = [[0.43, 0, 0.42, 0.045, 0.41, 0.07], [0.33, 0.14, 0.38, 0.22, 0.5, 0.22], [0.62, 0.22, 0.67, 0.14, 0.59, 0.07], [0.58, 0.045, 0.57, 0, 0.62, 0]];

function edge(ax: number, ay: number, bx: number, by: number, s: number, L: number, A: number) {
  if (!s) return `L${bx} ${by}`;
  const ux = (bx - ax) / L, uy = (by - ay) / L, nx = uy, ny = -ux;
  const P = (u: number, v: number) => `${(ax + u * L * ux + s * v * A * L * nx).toFixed(1)} ${(ay + u * L * uy + s * v * A * L * ny).toFixed(1)}`;
  let d = `L${P(0.38, 0)}`;
  K.forEach(k => { d += `C${P(k[0], k[1])} ${P(k[2], k[3])} ${P(k[4], k[5])}`; });
  return d + `L${bx} ${by}`;
}

export function jigsawPath(x: number, y: number, L: number, e: { t: number; r: number; b: number; l: number }, A = 1) {
  return `M${x} ${y}` + edge(x, y, x + L, y, e.t, L, A) + edge(x + L, y, x + L, y + L, e.r, L, A)
    + edge(x + L, y + L, x, y + L, e.b, L, A) + edge(x, y + L, x, y, e.l, L, A) + 'Z';
}
