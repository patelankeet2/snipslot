import type { CSSProperties, ReactNode } from 'react';

// Decorative background for the login screen: two spinning barber poles,
// slow moving pole stripes and barber tools drifting around.
// Purely visual, so it is hidden from screen readers and ignores clicks.

function BarberPole({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`pole pole-${side}`}>
      <span className="pole-cap" />
      <span className="pole-tube">
        <span className="pole-stripes" />
      </span>
      <span className="pole-cap" />
    </div>
  );
}

// simple outline drawings on a 24x24 grid
const TOOL_SHAPES: Record<string, ReactNode> = {
  scissors: (
    <>
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M8.1 15.9 19 4M15.9 15.9 5 4" />
    </>
  ),
  comb: (
    <>
      <rect x="2" y="6" width="20" height="4" rx="1" />
      <path d="M4 10v8M7 10v8M10 10v8M13 10v8M16 10v8M19 10v8" />
    </>
  ),
  // straight razor: blade plus folding handle
  razor: (
    <>
      <path d="M3 9h12l3 3H3z" />
      <path d="M15 9l4-4M18 12l3 6M19 5l2 2" />
    </>
  ),
  // hair clipper / trimmer with a toothed head and power switch
  clipper: (
    <>
      <path d="M8 7h8l-1 14H9z" />
      <path d="M7 3h10v4H7z" />
      <path d="M8.5 3V1.5M11 3V1.5M13 3V1.5M15.5 3V1.5" />
      <rect x="11" y="10" width="2" height="4" rx="1" />
      <path d="M12 21v2" />
    </>
  ),
  dryer: (
    <>
      <path d="M3 6h11a4 4 0 0 1 0 8H3z" />
      <path d="M14 10h.01" />
      <path d="M8 14l-1 8h4l1-8" />
      <path d="M18 8.5h3M18 11.5h3" />
    </>
  ),
  spray: (
    <>
      <path d="M8 9h7v13H8z" />
      <path d="M9 9V6h5v3" />
      <path d="M10 6V3h4l2 2" />
      <path d="M18 3h.01M20 5h.01M20 1.5h.01" />
    </>
  ),
  brush: (
    <>
      <rect x="4" y="3" width="10" height="7" rx="2" />
      <path d="M5.5 10v3M8 10v3M10.5 10v3M13 10v3" />
      <path d="M9 3V1.5" />
      <path d="M14 6.5h4a2 2 0 0 1 2 2v12" />
    </>
  ),
};

type Tool = {
  shape: keyof typeof TOOL_SHAPES;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: number;
  rot: number;
  dur: number;
  delay?: number;
  red?: boolean;
};

// spread around the edges, away from the card in the middle
const TOOLS: Tool[] = [
  { shape: 'scissors', top: '6%', left: '9%', size: 72, rot: -20, dur: 13 },
  { shape: 'clipper', top: '10%', left: '30%', size: 58, rot: 18, dur: 15, delay: -3 },
  { shape: 'comb', top: '16%', right: '12%', size: 64, rot: 25, dur: 16, delay: -4 },
  { shape: 'dryer', top: '5%', right: '30%', size: 60, rot: -12, dur: 17, delay: -8, red: true },
  { shape: 'spray', top: '30%', left: '18%', size: 50, rot: 10, dur: 14, delay: -6 },
  { shape: 'razor', top: '34%', right: '20%', size: 56, rot: -28, dur: 15, delay: -2 },
  { shape: 'brush', top: '50%', left: '6%', size: 48, rot: -35, dur: 18, delay: -9 },
  { shape: 'clipper', top: '55%', right: '7%', size: 54, rot: -15, dur: 13, delay: -5, red: true },
  {
    shape: 'scissors',
    bottom: '26%',
    left: '22%',
    size: 46,
    rot: 40,
    dur: 16,
    delay: -7,
    red: true,
  },
  { shape: 'comb', bottom: '30%', right: '24%', size: 44, rot: -40, dur: 14, delay: -1 },
  { shape: 'razor', bottom: '12%', left: '12%', size: 64, rot: 15, dur: 15, delay: -7 },
  { shape: 'dryer', bottom: '8%', left: '34%', size: 52, rot: 8, dur: 18, delay: -10 },
  { shape: 'spray', bottom: '6%', right: '32%', size: 50, rot: -8, dur: 16, delay: -3, red: true },
  { shape: 'brush', bottom: '14%', right: '10%', size: 58, rot: 30, dur: 13, delay: -6 },
  { shape: 'scissors', bottom: '42%', right: '36%', size: 38, rot: 60, dur: 19, delay: -11 },
  { shape: 'clipper', top: '42%', left: '33%', size: 40, rot: -25, dur: 17, delay: -12 },
];

export function BarberBackdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop-stripes" />

      {TOOLS.map((tool, i) => {
        const style = {
          top: tool.top,
          bottom: tool.bottom,
          left: tool.left,
          right: tool.right,
          '--size': `${tool.size}px`,
          '--rot': `${tool.rot}deg`,
          '--dur': `${tool.dur}s`,
          '--delay': `${tool.delay ?? 0}s`,
        } as CSSProperties;

        return (
          <span key={i} className={`float-tool${tool.red ? ' float-tool-red' : ''}`} style={style}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {TOOL_SHAPES[tool.shape]}
            </svg>
          </span>
        );
      })}

      <BarberPole side="left" />
      <BarberPole side="right" />
    </div>
  );
}
