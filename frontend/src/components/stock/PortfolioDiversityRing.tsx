'use client';

interface PortfolioDiversityRingProps {
  percentage: number; // 0-100
  size?: number;
}

/**
 * SVG donut chart showing position's percentage of the total portfolio.
 */
export function PortfolioDiversityRing({ percentage, size = 64 }: PortfolioDiversityRingProps) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(Math.max(percentage, 0), 100);
  const offset = circumference - (filled / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-background-tertiary)"
          strokeWidth={strokeWidth}
        />
        {/* Filled arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {/* Center text */}
      <span className="absolute text-[10px] font-mono font-semibold text-foreground">
        {filled.toFixed(1)}%
      </span>
    </div>
  );
}
