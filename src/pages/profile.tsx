import { useState, useEffect, useCallback } from 'react';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, FileText, Clock, Trophy, ThumbsUp, Minus, ThumbsDown,
  Save, Trash2, ChevronDown, ChevronUp, BarChart2, Loader2,
  CheckCircle2, AlertCircle, PenLine, Upload,
} from 'lucide-react';
import { useAuthFetch } from '@/lib/useAuthFetch';
import PdfUploader from '@/components/PdfUploader';
import type { FinalReportResult } from '@/server/api/interview/POST';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: number;
  clerkUserId: string;
  displayName: string | null;
  email: string | null;
  savedResume: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EvaluationRow {
  id: number;
  persona: string;
  jobDescription: string | null;
  resumeSnippet: string | null;
  reportJson: FinalReportResult;
  hiringDecision: string;
  matchScore: number;
  interviewScore: number;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const personaLabels: Record<string, string> = {
  bigtech: 'Big Tech Recruiter',
  startup: 'Startup Founder',
  hr: 'HR Manager',
};

const decisionConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  strong_yes: { label: 'Strong Hire', color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30', icon: Trophy },
  yes: { label: 'Hire', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: ThumbsUp },
  maybe: { label: 'Maybe', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: Minus },
  no: { label: 'No Hire', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: ThumbsDown },
};

function ScorePill({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-heading font-bold text-lg" style={{ color }}>{score}%</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function EvaluationCard({ ev, index }: { ev: EvaluationRow; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const dc = decisionConfig[ev.hiringDecision] ?? decisionConfig.maybe;
  const DecisionIcon = dc.icon;
  const resumeColor = ev.matchScore >= 70 ? '#22c55e' : ev.matchScore >= 45 ? '#f59e0b' : '#ef4444';
  const interviewColor = ev.interviewScore >= 70 ? '#22c55e' : ev.interviewScore >= 45 ? '#f59e0b' : '#ef4444';
  const composite = Math.round(ev.matchScore * 0.4 + ev.interviewScore * 0.6);
  const compositeColor = composite >= 70 ? '#22c55e' : composite >= 45 ? '#f59e0b' : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden"
    >
      {/* Card header */}
      <div className="flex items-center gap-4 px-5 py-4 flex-wrap">
        {/* Decision badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${dc.bg} ${dc.color}`}>
          <DecisionIcon className="w-3.5 h-3.5" />
          {dc.label}
        </div>

        {/* Scores */}
        <div className="flex items-center gap-4 divide-x divide-border/40">
          <ScorePill label="Resume" score={ev.matchScore} color={resumeColor} />
          <div className="pl-4"><ScorePill label="Interview" score={ev.interviewScore} color={interviewColor} /></div>
          <div className="pl-4"><ScorePill label="Overall" score={composite} color={compositeColor} /></div>
        </div>

        {/* Meta */}
        <div className="ml-auto flex flex-col items-end gap-0.5">
          <span className="text-xs text-muted-foreground">{personaLabels[ev.persona] ?? ev.persona}</span>
          <span className="text-[10px] text-muted-foreground/60">
            {new Date(ev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border/40"
          >
            <div className="px-5 py-4 space-y-4">
              {/* Overall verdict */}
              {ev.reportJson.overallVerdict && (
                <p className="text-sm text-muted-foreground italic">"{ev.reportJson.overallVerdict}"</p>
              )}

              {/* Hiring rationale */}
              <p className="text-sm text-foreground/80 leading-relaxed">{ev.reportJson.hiringRationale}</p>

              {/* Answer scores */}
              {ev.reportJson.answerEvaluations?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <BarChart2 className="w-3 h-3 text-primary" /> Answer Scores
                  </p>
                  <div className="space-y-2">
                    {ev.reportJson.answerEvaluations.map((ae, i) => {
                      const barColor = ae.verdict === 'strong' ? '#22c55e' : ae.verdict === 'acceptable' ? '#f59e0b' : '#ef4444';
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="shrink-0 w-5 h-5 rounded bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                            Q{i + 1}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${(ae.score / 10) * 100}%`, backgroundColor: barColor }}
                            />
                          </div>
                          <span className="text-xs font-bold" style={{ color: barColor }}>{ae.score}/10</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Job description snippet */}
              {ev.jobDescription && (
                <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest">Job Description</p>
                  <p className="text-xs text-foreground/70 line-clamp-2">{ev.jobDescription}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Profile Page ─────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const authFetch = useAuthFetch();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [evaluationHistory, setEvaluationHistory] = useState<EvaluationRow[]>([]);
  const [resumeText, setResumeText] = useState('');
  const [resumeInputMode, setResumeInputMode] = useState<'paste' | 'upload'>('paste');
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'resume' | 'history'>('resume');

  // Load profile + evaluations
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [profileRes, evalsRes] = await Promise.all([
        authFetch('/api/profile'),
        authFetch('/api/evaluations'),
      ]);
      if (profileRes.ok) {
        const p: UserProfile | null = await profileRes.json();
        setProfile(p);
        setResumeText(p?.savedResume ?? '');
      }
      if (evalsRes.ok) {
        const rows: EvaluationRow[] = await evalsRes.json();
        setEvaluationHistory(rows);
      }
    } catch (err) {
      console.error('Failed to load profile data', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (isSignedIn) loadData();
  }, [isSignedIn, loadData]);

  const handleSaveResume = async () => {
    setIsSavingResume(true);
    setSaveStatus('idle');
    try {
      const res = await authFetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          displayName: user?.fullName ?? undefined,
          email: user?.emailAddresses[0]?.emailAddress ?? undefined,
          savedResume: resumeText,
        }),
      });
      if (res.ok) {
        const updated: UserProfile = await res.json();
        setProfile(updated);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSavingResume(false);
    }
  };

  const handleClearResume = () => {
    setResumeText('');
    setSaveStatus('idle');
  };

  // ── Not loaded yet ──
  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // ── Not signed in ──
  if (!isSignedIn) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground mb-2">Sign in to access your profile</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Save your resume once, track all your evaluations, and see your progress over time.
          </p>
        </div>
        <SignInButton mode="redirect" forceRedirectUrl="/profile">
          <button className="px-6 py-3 rounded-xl font-heading font-bold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #8B5CF6 100%)', boxShadow: '0 0 20px rgba(108,99,255,0.35)' }}>
            Sign In with Google
          </button>
        </SignInButton>
      </div>
    );
  }

  const glassCard = 'rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm';

  return (
    <>
      <title>My Profile — HireLens AI</title>
      <meta name="description" content="Manage your saved resume and view your evaluation history on HireLens AI." />

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* ── Profile Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`${glassCard} p-6 mb-6 flex items-center gap-5 flex-wrap`}
        >
          {user.imageUrl ? (
            <img src={user.imageUrl} alt={user.fullName ?? ''} className="w-16 h-16 rounded-2xl object-cover border border-border/60" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl font-bold text-primary">
              {user.firstName?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-2xl text-foreground truncate">{user.fullName ?? 'Candidate'}</h1>
            <p className="text-sm text-muted-foreground">{user.emailAddresses[0]?.emailAddress}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-muted/60 border border-border/40">
                {evaluationHistory.length} evaluation{evaluationHistory.length !== 1 ? 's' : ''} completed
              </span>
              {profile?.savedResume && (
                <span className="text-xs text-green-400 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Resume saved
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #8B5CF6 100%)', boxShadow: '0 0 15px rgba(108,99,255,0.3)' }}
          >
            New Evaluation
          </button>
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border/40 mb-6">
          {[
            { key: 'resume', label: 'Saved Resume', icon: FileText },
            { key: 'history', label: `History (${evaluationHistory.length})`, icon: Clock },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as 'resume' | 'history')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === key
                  ? 'bg-card text-foreground shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Loading ── */}
        {isLoadingData ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* ── Resume Tab ── */}
            {activeTab === 'resume' && (
              <motion.div
                key="resume"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`${glassCard} p-6`}
              >
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <h2 className="font-heading font-semibold text-lg text-foreground flex items-center gap-2">
                      <PenLine className="w-4 h-4 text-primary" /> Your Saved Resume
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This will auto-fill on every new evaluation — no more re-pasting.
                    </p>
                  </div>
                  {profile?.updatedAt && (
                    <span className="text-[10px] text-muted-foreground">
                      Last saved: {new Date(profile.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>

                {/* Paste / Upload toggle */}
                <div className="flex gap-1 p-1 rounded-lg bg-muted/40 border border-border/40 mb-4 w-fit">
                  {[
                    { key: 'paste', label: 'Paste Text', icon: PenLine },
                    { key: 'upload', label: 'Upload PDF', icon: Upload },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setResumeInputMode(key as 'paste' | 'upload')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                        resumeInputMode === key
                          ? 'bg-card text-foreground shadow-sm border border-border/40'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Input area */}
                <AnimatePresence mode="wait">
                  {resumeInputMode === 'paste' ? (
                    <motion.div
                      key="paste"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                    >
                      <textarea
                        value={resumeText}
                        onChange={(e) => { setResumeText(e.target.value); setSaveStatus('idle'); }}
                        placeholder="Paste your full resume here...&#10;&#10;It will be saved to your profile and auto-filled every time you start a new evaluation."
                        rows={14}
                        className="w-full rounded-xl border border-border bg-muted/30 text-foreground text-sm p-4 placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 resize-y transition-colors"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-3"
                    >
                      <PdfUploader
                        onTextExtracted={(text) => {
                          if (text) {
                            setResumeText(text);
                            setSaveStatus('idle');
                          }
                        }}
                      />
                      {/* Preview extracted text */}
                      {resumeText && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="rounded-xl border border-border/60 bg-muted/20 p-4"
                        >
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-primary" /> Extracted Text Preview
                          </p>
                          <p className="text-xs text-foreground/70 leading-relaxed line-clamp-6 whitespace-pre-wrap">
                            {resumeText}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-2">{resumeText.length.toLocaleString()} characters extracted</p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    {saveStatus === 'saved' && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Saved successfully
                      </motion.span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Failed to save
                      </span>
                    )}
                    {resumeText && resumeInputMode === 'paste' && (
                      <span className="text-xs text-muted-foreground">{resumeText.length.toLocaleString()} characters</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {resumeText && (
                      <button
                        onClick={handleClearResume}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-red-400 hover:border-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                      </button>
                    )}
                    <button
                      onClick={handleSaveResume}
                      disabled={isSavingResume || !resumeText.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #8B5CF6 100%)' }}
                    >
                      {isSavingResume ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {isSavingResume ? 'Saving...' : 'Save Resume'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── History Tab ── */}
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {evaluationHistory.length === 0 ? (
                  <div className={`${glassCard} p-12 text-center`}>
                    <Clock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-heading font-semibold text-foreground mb-1">No evaluations yet</p>
                    <p className="text-sm text-muted-foreground mb-5">Complete your first interview simulation to see results here.</p>
                    <button
                      onClick={() => navigate('/')}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                      style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #8B5CF6 100%)' }}
                    >
                      Start Evaluation
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {evaluationHistory.map((ev, i) => (
                      <EvaluationCard key={ev.id} ev={ev} index={i} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>
    </>
  );
}
