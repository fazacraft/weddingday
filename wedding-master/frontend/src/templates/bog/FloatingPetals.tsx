const PETALS = [
  { id: 0,  left: 5,  fallDur: 9,    swayDur: 5.5, delay: 0,    size: 14, color: '#e8c4c0', sway: 35  },
  { id: 1,  left: 12, fallDur: 11,   swayDur: 4.8, delay: 2.5,  size: 10, color: '#f0d5d0', sway: -28 },
  { id: 2,  left: 22, fallDur: 8,    swayDur: 6.0, delay: 5,    size: 18, color: '#d4a8a2', sway: 55  },
  { id: 3,  left: 33, fallDur: 12,   swayDur: 5.2, delay: 1,    size: 12, color: '#e8c4c0', sway: -45 },
  { id: 4,  left: 45, fallDur: 9.5,  swayDur: 4.5, delay: 7,    size: 16, color: '#f5e0de', sway: 30  },
  { id: 5,  left: 55, fallDur: 10,   swayDur: 5.8, delay: 3,    size: 11, color: '#d4a8a2', sway: -38 },
  { id: 6,  left: 65, fallDur: 8.5,  swayDur: 6.2, delay: 8,    size: 20, color: '#e8c4c0', sway: 50  },
  { id: 7,  left: 75, fallDur: 11.5, swayDur: 4.9, delay: 1.5,  size: 13, color: '#f0d5d0', sway: -55 },
  { id: 8,  left: 83, fallDur: 9,    swayDur: 5.4, delay: 4,    size: 15, color: '#c98f88', sway: 40  },
  { id: 9,  left: 92, fallDur: 10.5, swayDur: 6.1, delay: 6.5,  size: 11, color: '#e8c4c0', sway: -32 },
  { id: 10, left: 18, fallDur: 8,    swayDur: 5.7, delay: 9.5,  size: 17, color: '#f5e0de', sway: 48  },
  { id: 11, left: 38, fallDur: 12,   swayDur: 4.6, delay: 11,   size: 12, color: '#d4a8a2', sway: -42 },
  { id: 12, left: 58, fallDur: 9,    swayDur: 5.3, delay: 4.5,  size: 19, color: '#e8c4c0', sway: 25  },
  { id: 13, left: 78, fallDur: 11,   swayDur: 5.9, delay: 2,    size: 14, color: '#f0d5d0', sway: -50 },
  { id: 14, left: 28, fallDur: 10,   swayDur: 4.7, delay: 13,   size: 16, color: '#c98f88', sway: 60  },
  { id: 15, left: 48, fallDur: 8.5,  swayDur: 6.3, delay: 0.5,  size: 20, color: '#e8c4c0', sway: -35 },
  { id: 16, left: 68, fallDur: 11,   swayDur: 5.0, delay: 3.5,  size: 13, color: '#f5e0de', sway: 44  },
  { id: 17, left: 88, fallDur: 9.5,  swayDur: 5.6, delay: 7.5,  size: 11, color: '#d4a8a2', sway: -28 },
];

const keyframeCSS = `
@keyframes petalFall {
  0%   { transform: translateY(-10vh) rotate(0deg);   opacity: 0;    }
  7%   { opacity: 0.9; }
  93%  { opacity: 0.65; }
  100% { transform: translateY(110vh) rotate(600deg); opacity: 0;    }
}
${PETALS.map(p => `
@keyframes sway${p.id} {
  0%, 100% { transform: translateX(0px); }
  50%       { transform: translateX(${p.sway}px); }
}
`).join('')}
`;

function PetalSVG({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.45)}
      viewBox="0 0 20 29"
      fill="none"
      aria-hidden="true"
    >
      <path d="M10 2 C16 8 18 18 10 27 C2 18 4 8 10 2Z" fill={color} opacity="0.88" />
      <path
        d="M10 4 C13 10 13 19 10 25"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FloatingPetals() {
  return (
    <>
      <style>{keyframeCSS}</style>
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 18 }}
        aria-hidden="true"
      >
        {PETALS.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.left}%`,
              top: 0,
              animation: `petalFall ${p.fallDur}s ${p.delay}s linear infinite`,
            }}
          >
            <div
              style={{
                animation: `sway${p.id} ${p.swayDur}s ${p.delay}s ease-in-out infinite`,
              }}
            >
              <PetalSVG size={p.size} color={p.color} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
