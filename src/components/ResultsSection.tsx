import { motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, MessageSquare, ArrowRight, TrendingUp } from 'lucide-react';
import type { Persona } from './PersonaCard';

export interface AnalysisResult {
  shortlisted: boolean;
  matchScore: number;
  strengths: string[];
  weaknesses: string[];
  rejectionReasons: string[];
  interviewQuestions: string[];
  suggestions: string[];
}

interface ResultsSectionProps {
  results: AnalysisResult;
  persona: Persona;
}

const personaNames: Record<Persona, string> = {
  bigtech: 'Big Tech Recruiter',
  startup: 'Startup Founder',
  hr: 'HR Manager',
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease: 'easeOut' as const },
  }),
};

function MatchScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444';
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
        <span>0%</span>
        <span>100%</span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' as const, delay: 0.3 }}
        />
      </div>
    </div>
  );
}

export default function ResultsSection({ results, persona }: ResultsSectionProps) {
  const glassCard = 'rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-5';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Analysis Complete</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Card 1: Shortlist Decision */}
      <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" className={glassCard}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Shortlist Decision</p>
            <p className="text-sm text-muted-foreground">Evaluated by {personaNames[persona]}</p>
          </div>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
            className={`px-6 py-3 rounded-xl font-heading font-bold text-lg tracking-wide ${
              results.shortlisted
                ? 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                : 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
            }`}
          >
            {results.shortlisted ? '✓ SHORTLISTED' : '✗ NOT SHORTLISTED'}
          </motion.div>
        </div>
      </motion.div>

      {/* Card 2: Match Score */}
      <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible" className={glassCard}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Match Score</p>
            <p className="text-xs text-muted-foreground">Resume vs. Role Alignment</p>
          </div>
          <span className={`font-heading font-bold text-4xl ${
            results.matchScore >= 70 ? 'text-green-400' : results.matchScore >= 45 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {results.matchScore}%
          </span>
        </div>
        <MatchScoreBar score={results.matchScore} />
      </motion.div>

      {/* Card 3: Strengths */}
      <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible" className={glassCard}>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Strengths
        </p>
        <ul className="space-y-2.5">
          {results.strengths.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Card 4: Weaknesses */}
      <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible" className={glassCard}>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" /> Weaknesses
        </p>
        <ul className="space-y-2.5">
          {results.weaknesses.map((w, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Card 5: Rejection Reasons (conditional) */}
      {!results.shortlisted && results.rejectionReasons.length > 0 && (
        <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible"
          className="rounded-xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm p-5">
          <p className="text-xs text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5" /> Rejection Reasons
          </p>
          <ul className="space-y-2.5">
            {results.rejectionReasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-red-300">
                <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Card 6: Interview Questions */}
      <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible" className={glassCard}>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-primary" /> Interview Questions
        </p>
        <ol className="space-y-3">
          {results.interviewQuestions.map((q, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-foreground">
              <span className="shrink-0 w-6 h-6 rounded-md bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="border-l-2 border-primary/40 pl-3 leading-relaxed">{q}</span>
            </li>
          ))}
        </ol>
      </motion.div>

      {/* Card 7: Suggestions */}
      <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible" className={glassCard}>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-primary" /> Suggestions for Improvement
        </p>
        <ul className="space-y-2.5">
          {results.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
              <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
