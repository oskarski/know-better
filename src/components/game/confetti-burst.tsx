"use client";

const pieces = [
  ["-118px", "150px", "180deg", "#f5c84b"],
  ["-82px", "120px", "260deg", "#72e4c3"],
  ["-48px", "170px", "120deg", "#ffffff"],
  ["-18px", "135px", "300deg", "#f59e0b"],
  ["22px", "160px", "210deg", "#93c5fd"],
  ["54px", "118px", "80deg", "#f5c84b"],
  ["88px", "152px", "240deg", "#72e4c3"],
  ["120px", "130px", "160deg", "#fca5a5"],
] as const;

type ConfettiBurstProps = {
  run: number;
};

export function ConfettiBurst({ run }: ConfettiBurstProps) {
  if (run === 0) {
    return null;
  }

  return (
    <div key={run} className="pointer-events-none fixed left-1/2 top-24 z-50 h-4 w-4 -translate-x-1/2">
      {pieces.map(([x, y, rotation, color], index) => (
        <span
          key={`${run}-${index}`}
          className="confetti-piece absolute block h-2.5 w-1.5 rounded-sm"
          style={
            {
              backgroundColor: color,
              "--x": x,
              "--y": y,
              "--r": rotation,
              animationDelay: `${index * 34}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
