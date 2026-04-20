import { motion } from 'motion/react';
import {
  CheckCircle2, AlertTriangle, XCircle, TrendingUp, ArrowRight,
  Star, MessageSquare, Trophy, ThumbsUp, ThumbsDown, Minus, BarChart2,
} from 'lucide-react';
import type { Persona } from './PersonaCard';
import type { FinalReportResult } from '../server/api/interview/POST';
import RadialGauge from './charts/RadialGauge';
import RadarChart from './charts/RadarChart';
import AnswerScoreChart from './charts/AnswerScoreChart';

interface FinalReportProps {
  report: FinalReportResult;
  persona: Persona;
}

const personaNames: Record<Persona, string> = {
  bigtech: 'Big Tech Recruiter',
  startup: 'Startup Founder',
  hr: 'HR Manager',
};

const hiringDecisionConfig = {
  strong_yes: { label: 'Strong Hire', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/40', shadow: 'shadow-[0_0_20px_rgba(34,197,94,0.25)]', icon: Trophy },
  yes: { label: 'Hire', color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30', shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.15)]', icon: ThumbsUp },
  maybe: { label: 'Maybe', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', shadow: 'shadow-[0_0_15px_rgba(234,179,8,0.15)]', icon: Minus },
  no: { label: 'No Hire', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]', icon: ThumbsDown },
};

const verdictConfig = {
  strong: { label: 'Strong', color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30' },
  acceptable: { label: 'Acceptable', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  weak: { label: 'Weak', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' as const },
  }),
};

function scoreColor(s: number, max = 100) {
  const pct = (s / max) * 100;
  return pct >= 70 ? '#22c55e' : pct >= 45 ? '#f59e0b' : '#ef4444';
}

export default function FinalReport({ report, persona }: FinalReportProps) {
  const glassCard = 'rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-5';
  const decision = hiringDecisionConfig[report.hiringDecision];
  const DecisionIcon = decision.icon;

  const resumeColor = scoreColor(report.matchScore);
  const interviewColor = scoreColor(report.interviewScore);

  // Overall composite score (weighted 40% resume, 60% interview)
  const compositeScore = Math.round(report.matchScore * 0.4 + report.interviewScore * 0.6);
  const compositeColor = scoreColor(compositeScore);

  // Radar axes from answer scores + resume/interview
  const radarAxes = [
    { label: 'Resume Match', value: Math.round(report.matchScore / 10) },
    { label: 'Interview', value: Math.round(report.interviewScore / 10) },
    ...report.answerEvaluations.map((ev, i) => ({
      label: `Q${i + 1} Answer`,
      value: ev.score,
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Divider */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Final Evaluation Report</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Card 1: Hiring Decision */}
      <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible"
        className={`rounded-xl border p-5 ${decision.bg} ${decision.shadow}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Final Hiring Decision</p>
            <p className="text-sm text-muted-foreground">Evaluated by {personaNames[persona]}</p>
          </div>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl border font-heading font-bold text-xl tracking-wide ${decision.bg} ${decision.color}`}
          >
            <DecisionIcon className="w-5 h-5" />
            {decision.label.toUpperCase()}
          </motion.div>
        </div>
        <p className="mt-4 text-sm text-foreground/80 leading-relaxed border-t border-border/40 pt-4">
          {report.hiringRationale}
        </p>
      </motion.div>

      {/* Card 2: Score Dashboard — Radial Gauges */}
      <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible" className={glassCard}>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-5 flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-primary" /> Score Dashboard
        </p>
        <div className="flex items-center justify-around flex-wrap gap-6">
          <RadialGauge score={report.matchScore} label="Resume Match" color={resumeColor} delay={0.1} size={130} />
          <div className="flex flex-col items-center gap-2">
            <RadialGauge score={compositeScore} label="Overall Score" color={compositeColor} delay={0.2} size={160} strokeWidth={12} />
            <span className="text-[10px] text-muted-foreground">40% resume · 60% interview</span>
          </div>
          <RadialGauge score={report.interviewScore} label="Interview Score" color={interviewColor} delay={0.3} size={130} />
        </div>
        {report.overallVerdict && (
          <p className="mt-5 text-sm text-muted-foreground italic border-t border-border/40 pt-4 leading-relaxed text-center">
            "{report.overallVerdict}"
          </p>
        )}
      </motion.div>

      {/* Card 3: Radar Chart — Performance Profile */}
      <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible" className={glassCard}>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-primary" /> Performance Profile
        </p>
        <div className="flex justify-center">
          <RadarChart axes={radarAxes} color="#6C63FF" size={240} />
        </div>
      </motion.div>

      {/* Card 4: Answer Score Chart */}
      <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible" className={glassCard}>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-primary" /> Interview Answer Scores
        </p>
        <AnswerScoreChart
          answers={report.answerEvaluations.map((ev) => ({
            label: ev.question,
            score: ev.score,
            verdict: ev.verdict,
          }))}
        />
      </motion.div>

      {/* Card 5: Answer Evaluations (detailed) */}
      <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible" className={glassCard}>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-primary" /> Answer Breakdown
        </p>
        <div className="space-y-5">
          {report.answerEvaluations.map((ev, i) => {
            const vc = verdictConfig[ev.verdict];
            const barColor = ev.verdict === 'strong' ? '#22c55e' : ev.verdict === 'acceptable' ? '#f59e0b' : '#ef4444';
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                className="rounded-xl border border-border/50 bg-muted/20 p-4"
              >
                {/* Question */}
                <div className="flex items-start gap-2 mb-3">
                  <span className="shrink-0 w-6 h-6 rounded-md bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium text-foreground leading-relaxed">{ev.question}</p>
                </div>

                {/* Answer */}
                <div className="ml-8 mb-3 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">Your answer:</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{ev.answer}</p>
                </div>

                {/* Score bar + Verdict */}
                <div className="ml-8 flex items-center justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Answer quality</span>
                      <span className="font-bold" style={{ color: barColor }}>{ev.score}/10</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: barColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(ev.score / 10) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' as const, delay: 0.4 + i * 0.1 }}
                      />
                    </div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold ${vc.bg} ${vc.color}`}>
                    {vc.label}
                  </span>
                </div>

                {/* Feedback */}
                <div className="ml-8 flex items-start gap-2 mt-3">
                  <Star className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{ev.feedback}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Card 6: Strengths */}
      <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible" className={glassCard}>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Resume Strengths
        </p>
        <ul className="space-y-2.5">
          {report.strengths.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Card 7: Weaknesses */}
      <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible" className={glassCard}>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" /> Resume Weaknesses
        </p>
        <ul className="space-y-2.5">
          {report.weaknesses.map((w, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Card 8: Rejection Reasons (conditional) */}
      {!report.shortlisted && report.rejectionReasons.length > 0 && (
        <motion.div custom={7} variants={cardVariants} initial="hidden" animate="visible"
          className="rounded-xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm p-5">
          <p className="text-xs text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5" /> Rejection Reasons
          </p>
          <ul className="space-y-2.5">
            {report.rejectionReasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-red-300">
                <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Card 9: Suggestions */}
      <motion.div custom={8} variants={cardVariants} initial="hidden" animate="visible" className={glassCard}>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-primary" /> Suggestions for Improvement
        </p>
        <ul className="space-y-2.5">
          {report.suggestions.map((s, i) => (
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
