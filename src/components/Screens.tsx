import { useState } from 'react';
import { DESTINATIONS, Destination, destinationFor, formatDistance, etaMinutes } from '../sim/routes';
import { Puzzle, isComplete, solvedCount } from '../sim/puzzle';
import { JigsawBoard, pictureName } from './Puzzle';
import { LogoMark } from './Logo';

function PinIcon({ color = '#5F6368' }: { color?: string }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22c-1-4-7-7.5-7-13a7 7 0 1 1 14 0c0 5.5-6 9-7 13Z" fill={color} /><circle cx="12" cy="9" r="2.6" fill="#fff" /></svg>;
}

export function DestinationSearch({ selected, onSelect }: { selected: Destination; onSelect: (d: Destination) => void }) {
  const [q, setQ] = useState('');
  const list = q.trim() ? DESTINATIONS.filter(d => (d.name + d.area).toLowerCase().includes(q.trim().toLowerCase())) : DESTINATIONS;
  return (
    <div className="absolute left-6 top-6 z-20 w-[400px] bg-white rounded-[22px] shadow-[0_4px_16px_rgba(0,0,0,.18)] overflow-hidden">
      <form className="flex items-center gap-3 px-5 h-[64px] border-b border-hair"
        onSubmit={e => { e.preventDefault(); if (q.trim()) onSelect(destinationFor(q)); }}>
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#5F6368" strokeWidth="2.2" /><path d="M15.5 15.5L21 21" stroke="#5F6368" strokeWidth="2.2" strokeLinecap="round" /></svg>
        <input id="dest-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Where to?"
          className="flex-1 min-w-0 text-[19px] text-ink placeholder:text-mute outline-none bg-transparent" aria-label="Search for a destination" />
      </form>
      <ul className="m-0 p-0 list-none">
        {list.map(d => (
          <li key={d.id}>
            <button type="button" onClick={() => onSelect(d)}
              className={`w-full text-left flex items-center gap-4 px-5 py-3.5 hover:bg-soft focus-visible:bg-soft outline-none ${selected.name === d.name ? 'bg-[#E8F0FE]' : ''}`}>
              <PinIcon color={selected.name === d.name ? '#EA4335' : '#5F6368'} />
              <span className="min-w-0">
                <span className="block text-[17px] text-ink font-medium truncate">{d.name}</span>
                <span className="block text-[14px] text-mute truncate">{d.area}</span>
              </span>
            </button>
          </li>
        ))}
        {list.length === 0 && (
          <li className="px-5 py-4 text-[15px] text-mute">Press Enter to plan a simulated route to “{q.trim()}”.</li>
        )}
      </ul>
    </div>
  );
}

export function RoutePreview({ dest, saved, onStart }: { dest: Destination; saved: Puzzle | null; onStart: () => void }) {
  const mins = etaMinutes(dest.route.len, dest.lights.length);
  return (
    <div className="absolute left-6 bottom-6 z-20 w-[460px] bg-white rounded-[22px] px-6 py-5 shadow-[0_4px_16px_rgba(0,0,0,.18)]">
      <div className="text-[22px] font-semibold text-ink truncate">{dest.name}</div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-[24px] font-semibold text-navgreen tabular-nums">{mins} min</span>
        <span className="text-[17px] text-mute tabular-nums">({formatDistance(dest.route.len)})</span>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-soft border border-hair px-3 py-1.5 text-[14px] text-ink">
          <svg width="10" height="20" viewBox="0 0 10 20" aria-hidden="true"><rect width="10" height="20" rx="4" fill="#3C4043" /><circle cx="5" cy="5" r="2.4" fill="#EA4335" /><circle cx="5" cy="10" r="2.4" fill="#6B6F74" /><circle cx="5" cy="15" r="2.4" fill="#34A853" /></svg>
          {dest.lights.length} traffic lights
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-soft border border-hair px-3 py-1.5 text-[14px] text-ink">
          <LogoMark size={18} />
          {saved ? `Continues your picture, ${solvedCount(saved)} of ${saved.tiles.length} pieces in` : `${dest.expectedStops <= 5 ? 9 : 16}-piece picture, a few pieces per red light`}
        </span>
      </div>
      <div className="flex justify-end mt-4">
        <button type="button" onClick={onStart}
          className="inline-flex items-center gap-2 rounded-full bg-[#1A73E8] hover:bg-[#1765CC] text-white text-[18px] font-medium h-[52px] px-7 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-gyellow">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 19-8-4-8 4z" fill="#fff" /></svg>
          Start
        </button>
      </div>
    </div>
  );
}

export function ArrivalScreen({ dest, puzzle, onDone }: { dest: Destination; puzzle: Puzzle; onDone: () => void }) {
  const complete = isComplete(puzzle);
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/55 backdrop-blur-[2px] fade-in">
      <section className="bg-white rounded-[28px] shadow-[0_10px_40px_rgba(0,0,0,.25)] px-9 pt-7 pb-7 flex flex-col items-center gap-5 card-in" aria-label="Journey complete">
        <div className="flex flex-col items-center gap-1">
          <span className="inline-flex items-center gap-2 text-[16px] font-medium text-navgreen">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#188038" /><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            You've arrived. Parked.
          </span>
          <h2 className="m-0 text-[28px] font-semibold text-ink tracking-tight">{dest.name}</h2>
        </div>
        <JigsawBoard puzzle={puzzle} size={340} interactive={false} reveal uid="arrive" />
        <div className="text-center">
          <p className="m-0 text-[20px] font-medium text-ink">{complete ? 'Every piece tells a story.' : 'Your picture is saved.'}</p>
          <p className="m-0 mt-1 text-[16px] text-mute">
            {complete ? `${pictureName(puzzle)}, built across ${puzzle.stopsUsed} red ${puzzle.stopsUsed === 1 ? 'light' : 'lights'}.`
              : `${solvedCount(puzzle)} of ${puzzle.tiles.length} pieces in. It continues on your next trip.`}
          </p>
        </div>
        <button type="button" onClick={onDone}
          className="rounded-full bg-[#1A73E8] hover:bg-[#1765CC] text-white text-[18px] font-medium h-[52px] px-10 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-gyellow">
          Done
        </button>
      </section>
    </div>
  );
}
