import { ReactNode } from 'react';
import { JourneyState, Action, atLightIndex, nextLightIndex, puzzleAvailable, signalHere } from '../sim/journey';
import { PICTURES, sectionDone } from '../sim/puzzle';

type Step = 'start' | 'drive' | 'red' | 'green' | 'end' | 'reset';

function nextStep(s: JourneyState): Step {
  if (s.phase === 'plan') return 'start';
  if (s.phase === 'arrived') return 'reset';
  const stopped = s.speed <= 0.01;
  const sig = signalHere(s);
  if (sig === 'red') return 'green';
  if (stopped) return 'drive';
  const ni = nextLightIndex(s);
  if (ni >= 0 && s.signals[ni] !== 'red') return 'red';
  return ni < 0 ? 'end' : 'drive';
}

function status(s: JourneyState): string {
  if (s.phase === 'plan') return 'Pick a picture, then start the journey.';
  if (s.phase === 'arrived') return 'Arrived and parked. The finished picture is showing.';
  const sig = signalHere(s);
  if (puzzleAvailable(s)) return sectionDone(s.puzzle) ? 'Pieces done for this light. Turn the light green to drive on.' : 'Stopped at a red light. The puzzle is open.';
  if (sig === 'red') return 'Stopped at a red light. Checking the stop is safe…';
  if (s.speed > 0.01) {
    const ni = nextLightIndex(s);
    return ni >= 0 && s.signals[ni] === 'red' ? 'Slowing for a red light. Puzzle hidden.' : 'Driving. Puzzle hidden.';
  }
  return atLightIndex(s) >= 0 ? 'Light is green. Puzzle hidden.' : 'Ready to drive.';
}

function Btn({ children, onClick, disabled, next }: { children: ReactNode; onClick: () => void; disabled?: boolean; next?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`h-11 px-5 rounded-full text-[15px] font-medium border transition-colors disabled:opacity-35 disabled:cursor-not-allowed
        focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-gyellow
        ${next && !disabled ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--on-accent)]' : 'bg-[var(--panel)] border-[var(--line)] text-[var(--accent-ink)] enabled:hover:bg-[var(--chip)]'}`}>
      {children}
    </button>
  );
}

export function DemoControls({ s, dispatch }: { s: JourneyState; dispatch: (a: Action, manual?: boolean) => void; total: number }) {
  const nav = s.phase === 'nav';
  const step = nextStep(s);
  const sig = signalHere(s);
  const ni = nextLightIndex(s);
  const go = (a: Action) => () => dispatch(a, true);

  return (
    <section aria-label="Demo controls" className="rounded-[20px] border border-[var(--line)] bg-[var(--panel)] p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="m-0 text-[16px] font-semibold text-[var(--ink)]">Demo controls</h2>
        <p className="m-0 text-[14px] text-[var(--mute)]">Press the blue button to go to the next step.</p>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Btn next={step === 'start'} disabled={s.phase !== 'plan'} onClick={go({ type: 'start' })}>Start journey</Btn>
        <Btn next={step === 'drive'} disabled={!nav || sig === 'red' || (s.speed > 0.01 && s.driving)} onClick={go({ type: 'continue' })}>Drive</Btn>
        <Btn next={step === 'red'} disabled={!nav || sig === 'red' || ni < 0 || (s.signals[ni] === 'red')} onClick={go({ type: 'approachRed' })}>Stop at red light</Btn>
        <Btn next={step === 'green'} disabled={!nav || sig !== 'red'} onClick={go({ type: 'green' })}>Turn light green</Btn>
        <Btn next={step === 'end'} disabled={!nav} onClick={go({ type: 'end' })}>Arrive</Btn>
        <Btn next={step === 'reset'} onClick={go({ type: 'reset' })}>Reset</Btn>
      </div>

      <p className="m-0 text-[15px] text-[var(--ink)]" aria-live="polite">{status(s)}</p>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-4">
        <span className="text-[14px] text-[var(--mute)]">Picture</span>
        {PICTURES.map(p => (
          <button key={p.id} type="button" aria-pressed={s.picture === p.id} disabled={s.phase !== 'plan'}
            onClick={() => dispatch({ type: 'picture', id: p.id }, true)}
            className={`h-9 px-4 rounded-full text-[14px] font-medium border disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-gyellow ${s.picture === p.id ? 'bg-[var(--chip)] border-[var(--ink)] text-[var(--ink)]' : 'bg-[var(--panel)] border-[var(--line)] text-[var(--mute)]'}`}>
            {p.name}
          </button>
        ))}
        {s.phase !== 'plan' && <span className="text-[13px] text-[var(--mute)]">Change it before the journey starts.</span>}
      </div>
    </section>
  );
}
