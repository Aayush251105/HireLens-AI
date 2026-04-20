import { motion } from 'motion/react';

interface RadarAxis {
  label: string;
  value: number; // 0–10
}

interface RadarChartProps {
  axes: RadarAxis[];
  color?: string;
  size?: number;
}

export default function RadarChart({ axes, color = '#6C63FF', size = 220 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const levels = 4;
  const n = axes.length;

  function angleFor(i: number) {
    return (i / n) * 2 * Math.PI - Math.PI / 2;
  }

  function point(r: number, i: number) {
    const a = angleFor(i);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function toPath(pts: { x: number; y: number }[]) {
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + ' Z';
  }

  // Grid rings
  const rings = Array.from({ length: levels }, (_, i) => {
    const r = (maxR * (i + 1)) / levels;
    const pts = axes.map((_, j) => point(r, j));
    return toPath(pts);
  });

  // Spokes
  const spokes = axes.map((_, i) => {
    const outer = point(maxR, i);
    return { x1: cx, y1: cy, x2: outer.x, y2: outer.y };
  });

  // Data polygon (full size for animation reference)
  const dataPoints = axes.map((ax, i) => point((ax.value / 10) * maxR, i));
  const dataPath = toPath(dataPoints);

  // Label positions (slightly outside maxR)
  const labelPts = axes.map((ax, i) => {
    const p = point(maxR * 1.22, i);
    return { ...p, label: ax.label, value: ax.value };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size}>
        {/* Grid rings */}
        {rings.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="hsl(var(--border))" strokeWidth={0.8} opacity={0.6} />
        ))}

        {/* Spokes */}
        {spokes.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="hsl(var(--border))" strokeWidth={0.8} opacity={0.5} />
        ))}

        {/* Data fill */}
        <motion.path
          d={dataPath}
          fill={color}
          fillOpacity={0.15}
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' as const, delay: 0.3 }}
          style={{ transformOrigin: `${cx}px ${cy}px`, filter: `drop-shadow(0 0 8px ${color}60)` }}
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={color}
            stroke="hsl(var(--background))"
            strokeWidth={1.5}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.8 + i * 0.06 }}
          />
        ))}

        {/* Labels */}
        {labelPts.map((lp, i) => {
          const textAnchor = lp.x < cx - 5 ? 'end' : lp.x > cx + 5 ? 'start' : 'middle';
          return (
            <g key={i}>
              <text
                x={lp.x}
                y={lp.y - 6}
                textAnchor={textAnchor}
                fontSize={9.5}
                fill="hsl(var(--muted-foreground))"
                fontFamily="var(--font-sans)"
              >
                {lp.label}
              </text>
              <text
                x={lp.x}
                y={lp.y + 7}
                textAnchor={textAnchor}
                fontSize={10}
                fontWeight="bold"
                fill={color}
                fontFamily="var(--font-heading)"
              >
                {lp.value}/10
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
