// Decorative background for the login screen: two spinning barber poles,
// slow moving pole stripes and a few tools drifting around.
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

const Scissors = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="18" r="3" />
    <path d="M8.1 15.9 19 4M15.9 15.9 5 4" />
  </svg>
);

const Comb = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="2" y="6" width="20" height="4" rx="1" />
    <path d="M4 10v8M7 10v8M10 10v8M13 10v8M16 10v8M19 10v8" />
  </svg>
);

const Razor = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M3 9h12l3 3H3z" />
    <path d="M15 9l4-4M18 12l3 6M19 5l2 2" />
  </svg>
);

// position, size and timing for each floating tool
const TOOLS = [
  { Shape: Scissors, className: 'tool-1' },
  { Shape: Comb, className: 'tool-2' },
  { Shape: Razor, className: 'tool-3' },
  { Shape: Scissors, className: 'tool-4' },
  { Shape: Comb, className: 'tool-5' },
  { Shape: Razor, className: 'tool-6' },
];

export function BarberBackdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop-stripes" />
      {TOOLS.map(({ Shape, className }) => (
        <span key={className} className={`float-tool ${className}`}>
          <Shape />
        </span>
      ))}
      <BarberPole side="left" />
      <BarberPole side="right" />
    </div>
  );
}
