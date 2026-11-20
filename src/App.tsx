import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { reducer, initialState, Action, JourneyState, vehiclePose, nextLightIndex, atLightIndex, signalHere, puzzleAvailable, lightsAhead, CRUISE } from './sim/journey';
import { estimatedSections } from './sim/puzzle';
import { Destination } from './sim/routes';
import { MapView } from './components/MapView';
import { NavBanner, SignalIndicator, TripSheet, SpeedBubble } from './components/NavChrome';
import { PuzzlePanel } from './components/Puzzle';
import { DestinationSearch, RoutePreview, ArrivalScreen } from './components/Screens';
import { DemoControls } from './components/DemoControls';
import { Logo } from './components/Logo';
import { PictureDefs } from './components/Pictures';
import { useAutoDemo } from './useAutoDemo';

const STAGE_W = 1280, STAGE_H = 720;

function fitCamera(d: Destination, region: { x: number; y: number; w: number; h: number }) {
  const xs = d.route.points.map(p => p.x), ys = d.route.points.map(p => p.y);
  const pad = 110;
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad, minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
  const s = Math.min(region.w / (maxX - minX), region.h / (maxY - minY), 1.1);
  return { s, tx: region.x + region.w / 2 - ((minX + maxX) / 2) * s, ty: region.y + region.h / 2 - ((minY + maxY) / 2) * s };
}

function useStageScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, (el.clientWidth - 20) / STAGE_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, scale };
}

function Dashboard({ s, dispatch, total }: { s: JourneyState; dispatch: (a: Action, manual?: boolean) => void; total: number }) {
  const nav = s.phase === 'nav';
  const pose = vehiclePose(s);
  const camera = nav
    ? { s: 1.45, tx: 440 - pose.x * 1.45, ty: 400 - pose.y * 1.45 }
    : s.phase === 'plan'
      ? fitCamera(s.dest, { x: 450, y: 30, w: 800, h: 640 })
      : fitCamera(s.dest, { x: 40, y: 40, w: 1200, h: 640 });
  const animateCamera = !nav || performance.now() - s.navStartedAt < 1000;
  const ni = nextLightIndex(s);
  const at = atLightIndex(s);
  const available = puzzleAvailable(s);

  return (
    <div className="relative overflow-hidden bg-[#EDEFF2] font-sans select-none" style={{ width: STAGE_W, height: STAGE_H }}>
      <MapView dest={s.dest} pos={nav ? s.pos : 0} showRoute signals={s.signals}
        car={s.phase === 'plan' ? null : { x: pose.x, y: pose.y, angle: pose.angle }} camera={camera} animateCamera={animateCamera} />

      {s.phase === 'plan' && (
        <>
          <DestinationSearch selected={s.dest} onSelect={d => dispatch({ type: 'select', dest: d }, true)} />
          <RoutePreview dest={s.dest} saved={s.savedPuzzle} onStart={() => dispatch({ type: 'start' }, true)} />
        </>
      )}

      {nav && (
        <>
          <NavBanner dest={s.dest} pos={s.pos} />
          <SignalIndicator dest={s.dest} pos={s.pos} nextIdx={ni} atLight={at >= 0} signal={ni >= 0 ? (at >= 0 || s.signals[ni] === 'red' ? s.signals[ni] : null) : null} />
          <SpeedBubble kmh={Math.round((s.speed / CRUISE) * 40)} />
          <TripSheet dest={s.dest} pos={s.pos} signals={s.signals} lightsAhead={lightsAhead(s)} />
          {available && <PuzzlePanel puzzle={s.puzzle} total={total} onTap={i => dispatch({ type: 'tap', index: i })} />}
        </>
      )}

      {s.phase === 'arrived' && <ArrivalScreen dest={s.dest} puzzle={s.puzzle} onDone={() => dispatch({ type: 'done' }, true)} />}

      <div className="absolute right-6 top-6 z-10 flex items-center gap-2 bg-white/95 rounded-full px-3 py-1.5 shadow-[0_1px_4px_rgba(0,0,0,.15)] text-[13px] text-mute">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: signalHere(s) === 'red' ? '#EA4335' : s.phase === 'nav' && s.speed > 0.01 ? '#34A853' : '#9AA0A6' }} />
        Simulated drive
      </div>
    </div>
  );
}

export default function App() {
  const [s, rawDispatch] = useReducer(reducer, undefined, initialState);
  const dispatch = useCallback((a: Action, manual?: boolean) => {
    if (manual) rawDispatch({ type: 'auto', on: false });
    rawDispatch(a);
  }, []);
  useAutoDemo(s, rawDispatch);

  // Simulation clock
  useEffect(() => {
    let raf = 0, last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      rawDispatch({ type: 'tick', dt });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const total = estimatedSections(s.puzzle, lightsAhead(s));
  const { ref, scale } = useStageScale();

  return (
    <div className="min-h-full bg-[var(--page)] text-[var(--ink)] font-sans"
      style={{ paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(16px, env(safe-area-inset-right, 0px))' }}>
      <PictureDefs />
      <main className="max-w-[1280px] mx-auto py-6 flex flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Logo />
          <button type="button" onClick={() => { dispatch({ type: 'reset' }); rawDispatch({ type: 'auto', on: true }); }}
            className="h-11 px-5 rounded-full bg-[var(--accent)] text-[var(--on-accent)] text-[15px] font-medium inline-flex items-center gap-2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-gyellow">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="currentColor" /></svg>
            {s.auto ? 'Auto demo running' : 'Play auto demo'}
          </button>
        </header>

        <div ref={ref} className="w-full">
          <div className="rounded-[30px] bg-[#111] p-[10px] shadow-[0_12px_40px_rgba(0,0,0,.25)] mx-auto"
            style={{ width: STAGE_W * scale + 20 }}>
            <div className="overflow-hidden rounded-[22px]" style={{ width: STAGE_W * scale, height: STAGE_H * scale }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0', width: STAGE_W, height: STAGE_H }}>
                <Dashboard s={s} dispatch={dispatch} total={total} />
              </div>
            </div>
          </div>
        </div>

        <DemoControls s={s} dispatch={dispatch} total={total} />

        <p className="m-0 text-[13px] text-[var(--mute)] max-w-[80ch]">
          Research concept. Routes, traffic signals and vehicle states are simulated. This is not a Google product and not an approved in-vehicle feature; a real deployment would need automotive safety and platform approval.
        </p>
      </main>
    </div>
  );
}
