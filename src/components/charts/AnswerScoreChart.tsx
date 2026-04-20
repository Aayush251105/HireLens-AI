import { motion } from 'motion/react';

interface AnswerBar {
  label: string;
  score: number; // 0–10
  verdict: 'strong' | 'acceptable' | 'weak';
}

interface AnswerScoreChartProps {
  answers: AnswerBar[];
}

const verdictColor: Record<string, string> = {
  strong: '#22c55e',
  acceptable: '#f59e0b',
  weak: '#ef4444',
};

export default function AnswerScoreChart({ answers }: AnswerScoreChartProps) {
  return (
    <div className="space-y-3">
      {answers.map((a, i) => {
        const color = verdictColor[a.verdict];
        const pct = (a.score / 10) * 100;
        return (
          <div key={i} className="flex items-center gap-3">
            {/* Q label */}
            <span className="shrink-0 w-6 h-6 rounded-md bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
              Q{i + 1}
            </span>

            {/* Bar track */}
            <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden relative">
              <motion.div
                className="h-full rounded-full flex items-center justify-end pr-2"
                style={{ backgroundColor: color, minWidth: '2rem' }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' as const, delay: 0.2 + i * 0.12 }}
              >
                <motion.span
                  className="text-[10px] font-bold text-white leading-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.12 }}
                >
                  {a.score}/10
                </motion.span>
              </motion.div>
            </div>

            {/* Verdict badge */}
            <span
              className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border capitalize"
              style={{ color, borderColor: `${color}50`, backgroundColor: `${color}15` }}
            >
              {a.verdict}
            </span>
          </div>
        );
      })}
    </div>
  );
}
