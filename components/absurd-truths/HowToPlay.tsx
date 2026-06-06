export default function HowToPlay() {
  return (
    <div
      className="w-full rounded-2xl border py-4 px-3"
      style={{ background: '#fff', borderColor: '#e2e8f0' }}
    >
      <p className="font-caveat text-center text-sm mb-2" style={{ color: '#94a3b8' }}>
        how to play
      </p>
      <svg
        viewBox="0 0 340 200"
        style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}
        aria-label="Game rules: Judge, Truthsayer, and Bullshitter roles with scoring"
      >
        {/* ── JUDGE (centred x=57) ─────────────────────── */}
        <g stroke="#475569" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
          <circle cx="57" cy="35" r="13" />
          <path d="M 57 48 Q 58 64 57 79" />
          <path d="M 57 58 Q 43 62 36 70" />
          <path d="M 57 58 Q 71 54 79 51" />
          <path d="M 57 79 Q 49 94 43 108" />
          <path d="M 57 79 Q 65 94 70 108" />
        </g>
        {/* magnifying glass */}
        <circle cx="89" cy="45" r="9" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 95 51 Q 99 56 104 62" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />

        {/* ── TRUTHSAYER (centred x=170) ───────────────── */}
        {/* halo */}
        <path d="M 157 23 Q 163 14 170 13 Q 177 12 184 21" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" />
        <g stroke="#475569" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
          <circle cx="170" cy="35" r="13" />
          <path d="M 170 48 Q 171 64 170 79" />
          <path d="M 170 58 Q 156 62 149 70" />
          <path d="M 170 58 Q 184 62 191 70" />
          <path d="M 170 79 Q 162 94 156 108" />
          <path d="M 170 79 Q 178 94 183 108" />
        </g>

        {/* ── BULLSHITTER (centred x=283) ──────────────── */}
        {/* horns */}
        <path d="M 274 24 Q 270 13 274 7 Q 278 2 281 10" fill="none" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 292 24 Q 296 13 292 7 Q 288 2 285 10" fill="none" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" />
        <g stroke="#475569" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
          <circle cx="283" cy="35" r="13" />
          <path d="M 283 48 Q 284 64 283 79" />
          <path d="M 283 58 Q 269 62 262 70" />
          <path d="M 283 58 Q 297 62 304 70" />
          <path d="M 283 79 Q 275 94 269 108" />
          <path d="M 283 79 Q 291 94 296 108" />
        </g>

        {/* ── Role labels ──────────────────────────────── */}
        <text x="57"  y="123" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="14" fontWeight="700" fill="#2563eb">Judge</text>
        <text x="170" y="123" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="14" fontWeight="700" fill="#7c3aed">Truthsayer</text>
        <text x="283" y="123" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="14" fontWeight="700" fill="#ea580c">Bullshitter</text>

        {/* ── Wobbly divider ───────────────────────────── */}
        <path d="M 12 132 Q 86 129 170 132 Q 254 135 328 132" stroke="#e2e8f0" strokeWidth="1.2" fill="none" />

        {/* ── Scoring panels ───────────────────────────── */}
        {/* judge correct */}
        <rect x="8" y="140" width="152" height="54" rx="9" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1" />
        <text x="84" y="155" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="12" fontWeight="700" fill="#475569">judge correct ✓</text>
        <text x="84" y="170" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="13">
          <tspan fill="#16a34a" fontWeight="700">+1 </tspan><tspan fill="#2563eb">Judge</tspan>
        </text>
        <text x="84" y="184" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="13">
          <tspan fill="#16a34a" fontWeight="700">+1 </tspan><tspan fill="#7c3aed">Truthsayer</tspan>
        </text>

        {/* judge fooled */}
        <rect x="172" y="140" width="160" height="54" rx="9" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1" />
        <text x="252" y="155" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="12" fontWeight="700" fill="#475569">judge fooled ✗</text>
        <text x="252" y="174" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="13">
          <tspan fill="#ea580c" fontWeight="700">+2 </tspan><tspan fill="#ea580c">Bullshitter</tspan>
        </text>
      </svg>
    </div>
  )
}
