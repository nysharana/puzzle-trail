import { useEffect, useRef } from 'react';
import { JourneyState, Action, atLightIndex, nextLightIndex, puzzleAvailable, signalHere } from './sim/journey';
import { sectionDone, isComplete } from './sim/puzzle';

/** Drives the presentation demo: one full journey, hands-free. */
export function useAutoDemo(s: JourneyState, dispatch: (a: Action) => void) {
  const ref = useRef(s);
  ref.current = s;
  const since = useRef({ key: '', t: 0 });

  useEffect(() => {
    if (!s.auto) return;
    const id = window.setInterval(() => {
      const st = ref.current;
      const now = performance.now();
      const available = puzzleAvailable(st);
      const at = atLightIndex(st);
      const sig = signalHere(st);
      const key = [st.phase, at, sig, st.safe, st.speed <= 0.01, st.driving, st.trafficStopAt !== null, st.puzzle.tiles.reduce((n, t) => n + t.turns, 0), st.puzzle.unlocked].join('|');
      if (key !== since.current.key) since.current = { key, t: now };
      const waited = now - since.current.t;

      if (st.phase === 'plan') { if (waited > 1400) dispatch({ type: 'start' }); return; }
      if (st.phase === 'arrived') { dispatch({ type: 'auto', on: false }); return; }

      const ni = nextLightIndex(st);
      // As the car nears a light planned to be red, the signal changes.
      if (st.driving && st.speed > 0 && ni >= 0 && !st.counted[ni] && st.signals[ni] === 'green'
        && st.dest.lights[ni].demo === 'red' && st.dest.lights[ni].at - st.pos < 230) {
        dispatch({ type: 'approachRed' });
        return;
      }
      if (available) {
        if (!sectionDone(st.puzzle) && st.autoSolve && waited > 700) {
          const i = st.puzzle.tiles.findIndex((t, k) => k < st.puzzle.unlocked && !t.solved);
          if (i >= 0) dispatch({ type: 'tap', index: i });
        } else if (sectionDone(st.puzzle) && waited > (isComplete(st.puzzle) ? 2600 : 1900)) {
          dispatch({ type: 'green' });
        } else if (waited > 20000) {
          dispatch({ type: 'green' });
        }
        return;
      }
      if (st.speed <= 0.01) {
        if (sig === 'red' && !st.safe && waited > 1100) dispatch({ type: 'confirmSafe' });
        else if (sig !== 'red' && waited > 900) dispatch({ type: 'continue' });
      }
    }, 150);
    return () => window.clearInterval(id);
  }, [s.auto, dispatch]);
}
