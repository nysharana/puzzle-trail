// Puzzle pictures, drawn on a 600 x 600 canvas. Each has a clear "this way up"
// (sky at the top, ground or cone at the bottom) so a turned piece reads as wrong at a glance.

const PETALS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#4285F4', '#EA4335', '#FBBC05', '#34A853'];

function Flower() {
  return (
    <g id="pic-flower">
      <rect width="600" height="600" fill="url(#sky-soft)" />
      <circle cx="515" cy="85" r="62" fill="#FEEFC3" />
      <circle cx="515" cy="85" r="44" fill="#FBBC05" />
      <g fill="#FFFFFF"><ellipse cx="95" cy="100" rx="58" ry="26" /><ellipse cx="135" cy="82" rx="40" ry="30" /><ellipse cx="70" cy="88" rx="30" ry="22" /></g>
      <path d="M0 455 Q150 410 300 445 T600 430 V600 H0Z" fill="#A8DAB5" />
      <path d="M0 525 Q220 485 600 515 V600 H0Z" fill="#34A853" />
      <g fill="#FFFFFF"><circle cx="80" cy="500" r="7" /><circle cx="520" cy="490" r="7" /><circle cx="140" cy="560" r="6" /><circle cx="470" cy="565" r="6" /></g>
      <g fill="#FBBC05"><circle cx="80" cy="500" r="3" /><circle cx="520" cy="490" r="3" /><circle cx="140" cy="560" r="2.5" /><circle cx="470" cy="565" r="2.5" /></g>
      <path d="M300 300 C292 380 312 450 300 575" fill="none" stroke="#188038" strokeWidth="18" strokeLinecap="round" />
      <path d="M298 455 C250 420 205 430 185 465 C230 480 270 475 298 455Z" fill="#34A853" />
      <path d="M305 405 C350 365 400 370 420 400 C380 420 340 425 305 405Z" fill="#34A853" />
      {PETALS.map((c, k) => (
        <ellipse key={k} cx="300" cy="138" rx="50" ry="86" fill={c} transform={`rotate(${k * 45} 300 230)`} />
      ))}
      <circle cx="300" cy="230" r="62" fill="#FFF8E1" stroke="#F9AB00" strokeWidth="8" />
      <g fill="#202124"><ellipse cx="278" cy="218" rx="7" ry="11" /><ellipse cx="322" cy="218" rx="7" ry="11" /></g>
      <path d="M272 245 Q300 270 328 245" fill="none" stroke="#202124" strokeWidth="7" strokeLinecap="round" />
    </g>
  );
}

function Smiley() {
  return (
    <g id="pic-smiley">
      <rect width="600" height="600" fill="url(#sky-blue)" />
      <g fill="#FFFFFF" opacity="0.9"><ellipse cx="80" cy="70" rx="50" ry="22" /><ellipse cx="112" cy="55" rx="32" ry="24" /><ellipse cx="520" cy="560" rx="54" ry="20" /></g>
      <circle cx="300" cy="315" r="245" fill="#FBBC05" stroke="#F29900" strokeWidth="10" />
      <ellipse cx="195" cy="165" rx="70" ry="32" fill="#FFFFFF" opacity="0.45" transform="rotate(-32 195 165)" />
      <g fill="#202124"><ellipse cx="225" cy="255" rx="30" ry="48" /><ellipse cx="375" cy="255" rx="30" ry="48" /></g>
      <g fill="#FFFFFF"><circle cx="234" cy="236" r="9" /><circle cx="384" cy="236" r="9" /></g>
      <g fill="#F28B82" opacity="0.8"><circle cx="150" cy="380" r="36" /><circle cx="450" cy="380" r="36" /></g>
      <path d="M180 380 Q300 520 420 380" fill="none" stroke="#202124" strokeWidth="24" strokeLinecap="round" />
    </g>
  );
}

function IceCream() {
  const sprinkles: [number, number, number, string][] = [
    [255, 200, 30, '#FFFFFF'], [330, 185, -40, '#FBBC05'], [290, 250, 70, '#FFFFFF'], [350, 245, 10, '#4285F4'],
    [240, 330, -20, '#FFFFFF'], [320, 315, 50, '#EA4335'], [370, 350, -60, '#FFFFFF'], [270, 380, 15, '#FBBC05'],
    [270, 110, 40, '#FFFFFF'], [325, 135, -25, '#FBBC05'],
  ];
  return (
    <g id="pic-icecream">
      <rect width="600" height="600" fill="url(#pink)" />
      <g fill="#FFFFFF" opacity="0.6">
        <circle cx="70" cy="80" r="14" /><circle cx="150" cy="40" r="9" /><circle cx="520" cy="120" r="14" /><circle cx="470" cy="50" r="9" />
        <circle cx="60" cy="300" r="10" /><circle cx="545" cy="300" r="11" /><circle cx="90" cy="520" r="14" /><circle cx="510" cy="520" r="14" />
      </g>
      <path d="M195 380 L405 380 L300 590 Z" fill="#F9AB00" />
      <g stroke="#E37400" strokeWidth="6" strokeLinecap="round">
        <path d="M230 380 L330 535" /><path d="M290 380 L360 490" /><path d="M350 380 L385 435" />
        <path d="M370 380 L270 535" /><path d="M310 380 L240 490" /><path d="M250 380 L215 435" />
      </g>
      <circle cx="300" cy="345" r="120" fill="#81C995" />
      <path d="M190 360 Q200 410 220 395 Q235 425 255 400 Q275 430 300 405 Q325 432 345 402 Q368 428 382 396 Q402 412 410 360Z" fill="#81C995" />
      <circle cx="300" cy="235" r="102" fill="#F28B82" />
      <circle cx="300" cy="140" r="82" fill="#8AB4F8" />
      <path d="M362 40 Q352 70 332 82" fill="none" stroke="#188038" strokeWidth="7" strokeLinecap="round" />
      <circle cx="330" cy="92" r="26" fill="#EA4335" />
      <circle cx="322" cy="84" r="7" fill="#FFFFFF" opacity="0.7" />
      {sprinkles.map(([x, y, a, c], k) => <rect key={k} x={x - 10} y={y - 3.5} width="20" height="7" rx="3.5" fill={c} transform={`rotate(${a} ${x} ${y})`} />)}
    </g>
  );
}

export function PictureDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="sky-soft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#AECBFA" /><stop offset="0.75" stopColor="#E8F0FE" /></linearGradient>
        <linearGradient id="sky-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#669DF6" /><stop offset="1" stopColor="#D2E3FC" /></linearGradient>
        <linearGradient id="pink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FCE8E6" /><stop offset="1" stopColor="#F6AEA9" /></linearGradient>
        <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.55" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
        <Flower /><Smiley /><IceCream />
      </defs>
    </svg>
  );
}
