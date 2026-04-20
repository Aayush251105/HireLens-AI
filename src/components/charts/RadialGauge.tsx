import { motion } from 'motion/react';

interface RadialGaugeProps {
  score: number; // 0–100
  label: string;
  size?: number;
  strokeWidth?: number;
  color: string;
  delay?: number;
}

export default function RadialGauge({
  score,
  label,
  size = 120,
  strokeWidth = 10,
  color,
  delay = 0,
}: RadialGaugeProps) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // Use 270° arc (from 135° to 405°, i.e. bottom-left to bottom-right)
  const startAngle = 135;
  const totalAngle = 270;
  const circumference = (totalAngle / 360) * 2 * Math.PI * r;

  function polarToCartesian(angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function describeArc(startDeg: number, endDeg: number) {
    const s = polarToCartesian(startDeg);
    const e = polarToCartesian(endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  const trackPath = describeArc(startAngle, startAngle + totalAngle);


  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {/* Track */}
          <path
            d={trackPath}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Fill — animated via stroke-dashoffset */}
          <motion.path
            d={trackPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
            transition={{ duration: 1.2, ease: 'easeOut' as const, delay }}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-heading font-bold leading-none"
            style={{ color, fontSize: size * 0.22 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.4 }}
          >
            {score}%
          </motion.span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center font-medium">{label}</span>
    </div>
  );
}
