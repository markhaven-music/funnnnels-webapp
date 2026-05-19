type Props = {
  palette: [string, string];
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

export function FunnelThumb({ palette }: Props) {
  const id = hash(palette.join("|"));
  return (
    <svg viewBox="0 0 280 130" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette[0]} stopOpacity="0.25" />
          <stop offset="100%" stopColor={palette[1]} stopOpacity="0.05" />
        </linearGradient>
        <pattern
          id={`grid-${id}`}
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M12 0H0V12"
            stroke="oklch(0.3 0.01 270)"
            strokeWidth="0.4"
            fill="none"
          />
        </pattern>
      </defs>
      <rect width="280" height="130" fill="var(--bg-2)" />
      <rect width="280" height="130" fill={`url(#grid-${id})`} opacity="0.5" />
      <rect width="280" height="130" fill={`url(#bg-${id})`} />

      <rect
        x="12"
        y="10"
        width="256"
        height="110"
        rx="6"
        fill="oklch(0.13 0.008 270)"
        stroke="oklch(0.3 0.012 270)"
      />

      <rect x="20" y="18" width="42" height="6" rx="3" fill="oklch(0.5 0.02 270)" />
      <rect x="220" y="18" width="40" height="10" rx="5" fill={palette[0]} />

      <rect x="20" y="36" width="120" height="8" rx="2" fill="oklch(0.85 0.02 270)" />
      <rect x="20" y="48" width="160" height="5" rx="2" fill="oklch(0.55 0.015 270)" />
      <rect x="20" y="57" width="140" height="5" rx="2" fill="oklch(0.55 0.015 270)" />
      <rect x="20" y="70" width="60" height="14" rx="7" fill={palette[0]} opacity="0.9" />
      <rect
        x="86"
        y="70"
        width="40"
        height="14"
        rx="7"
        fill="oklch(0.25 0.012 270)"
        stroke="oklch(0.4 0.015 270)"
      />

      <rect x="190" y="36" width="70" height="48" rx="4" fill={palette[1]} opacity="0.55" />
      <circle cx="225" cy="60" r="10" fill={palette[0]} opacity="0.8" />

      <rect x="20" y="94" width="80" height="4" rx="2" fill="oklch(0.4 0.012 270)" />
      <rect x="20" y="102" width="50" height="4" rx="2" fill="oklch(0.4 0.012 270)" />
      <rect
        x="200"
        y="98"
        width="60"
        height="10"
        rx="5"
        fill="oklch(0.25 0.012 270)"
        stroke="oklch(0.4 0.015 270)"
      />
    </svg>
  );
}
