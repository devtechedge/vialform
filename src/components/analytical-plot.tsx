function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOTE = "Synthetic illustrative data - not a test result.";

export function SyntheticChromatogram({ seed, label }: { seed: string; label: string }) {
  const rand = mulberry32(hashSeed(seed));
  const width = 560;
  const height = 180;
  const baseline = height - 28;
  const peaks = Array.from({ length: 4 }, () => ({ center: 60 + rand() * (width - 120), height: 30 + rand() * 90, spread: 6 + rand() * 10 }));
  const points: string[] = [];
  for (let x = 0; x <= width; x += 2) {
    let y = baseline - rand() * 2;
    for (const peak of peaks) {
      y -= peak.height * Math.exp(-((x - peak.center) ** 2) / (2 * peak.spread ** 2));
    }
    points.push(`${x},${y.toFixed(1)}`);
  }
  return (
    <figure className="rounded-lg border border-border bg-bg p-4">
      <figcaption className="mono mb-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-muted">
        <span>{label}</span>
        <span className="text-warn">Demo</span>
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`${label}: ${NOTE}`}>
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line key={fraction} x1={0} x2={width} y1={baseline * fraction} y2={baseline * fraction} stroke="var(--border)" strokeWidth={1} />
        ))}
        <line x1={0} x2={width} y1={baseline} y2={baseline} stroke="var(--border-strong)" strokeWidth={1} />
        <polyline points={points.join(" ")} fill="none" stroke="var(--cobalt)" strokeWidth={1.5} />
      </svg>
      <p className="mt-2 text-[12px] text-warn">{NOTE}</p>
    </figure>
  );
}

export function SyntheticSpectrum({ seed, label }: { seed: string; label: string }) {
  const rand = mulberry32(hashSeed(`${seed}-ms`));
  const width = 560;
  const height = 180;
  const baseline = height - 28;
  const bars = Array.from({ length: 18 }, (_, index) => ({ x: 30 + index * ((width - 60) / 18), height: 10 + rand() * 110 }));
  const basePeak = bars.reduce((max, bar) => (bar.height > max.height ? bar : max), bars[0]!);
  return (
    <figure className="rounded-lg border border-border bg-bg p-4">
      <figcaption className="mono mb-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-muted">
        <span>{label}</span>
        <span className="text-warn">Demo</span>
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`${label}: ${NOTE}`}>
        <line x1={0} x2={width} y1={baseline} y2={baseline} stroke="var(--border-strong)" strokeWidth={1} />
        {bars.map((bar, index) => (
          <line key={index} x1={bar.x} x2={bar.x} y1={baseline} y2={baseline - bar.height} stroke={bar === basePeak ? "var(--lime)" : "var(--cobalt)"} strokeWidth={2} />
        ))}
      </svg>
      <p className="mt-2 text-[12px] text-warn">{NOTE}</p>
    </figure>
  );
}