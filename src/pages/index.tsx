import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Lock, Loader2, RotateCcw, FileText, PenLine, CheckCircle2 } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import AnimatedGrid from '@/components/AnimatedGrid';
import PersonaCard, { type Persona } from '@/components/PersonaCard';
import InterviewChat, { type QA } from '@/components/InterviewChat';
import FinalReport from '@/components/FinalReport';
import PdfUploader from '@/components/PdfUploader';
import { useAuthFetch } from '@/lib/useAuthFetch';
import type { AnalysisResult } from '@/components/ResultsSection';
import type { FinalReportResult } from '@/server/api/interview/POST';

const heroWords = ['Get', 'evaluated', 'like', 'a', 'real', 'candidate'];

// Static decorative hero card
function HeroMockCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateY: -5 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' as const }}
      className="relative"
    >
      <div className="rounded-2xl border border-primary/30 bg-card/90 backdrop-blur-md p-6 shadow-[0_0_40px_rgba(108,99,255,0.2)] max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Sample Evaluation</span>
          <span className="px-2.5 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
            ✓ SHORTLISTED
          </span>
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Match Score</span>
            <span className="text-green-400 font-bold">87%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-green-500"
              initial={{ width: 0 }}
              animate={{ width: '87%' }}
              transition={{ duration: 1, delay: 1, ease: 'easeOut' as const }}
            />
          </div>
        </div>
        <div className="space-y-2">
          {['Strong system design experience at scale', 'Quantified impact across 3 major projects', 'Top-tier ML background with publications'].map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-foreground">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">Evaluated by <span className="text-primary">Big Tech Recruiter</span></p>
        </div>
      </div>
      {/* Floating glow */}
      <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl -z-10" />
    </motion.div>
  );
}

export default function HomePage() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const authFetch = useAuthFetch();

  const [selectedPersona, setSelectedPersona] = useState<Persona>('bigtech');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<AnalysisResult | null>(null);
  const [finalReport, setFinalReport] = useState<FinalReportResult | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeInputMode, setResumeInputMode] = useState<'paste' | 'upload'>('paste');
  const [profileResumeLoaded, setProfileResumeLoaded] = useState(false);

  // stage: 'input' | 'interview' | 'report'
  const [stage, setStage] = useState<'input' | 'interview' | 'report'>('input');

  const toolRef = useRef<HTMLDivElement>(null);

  // Auto-fill resume from saved profile when signed in
  useEffect(() => {
    if (!isSignedIn || profileResumeLoaded || resumeText) return;
    authFetch('/api/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((profile) => {
        if (profile?.savedResume) {
          setResumeText(profile.savedResume);
          setProfileResumeLoaded(true);
        }
      })
      .catch(() => {});
  }, [isSignedIn, authFetch, profileResumeLoaded, resumeText]);

  const scrollToTool = () => {
    toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim() || resumeText.trim().length < 50) {
      setError('Please paste your resume (at least 50 characters) before analyzing.');
      return;
    }
    setError(null);
    setResumeAnalysis(null);
    setFinalReport(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resumeText,
          jobDescription: jobDescription.trim() || undefined,
          persona: selectedPersona,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Analysis failed. Please try again.');
      }

      const data: AnalysisResult = await response.json();
      setResumeAnalysis(data);
      setStage('interview');
      setTimeout(() => toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterviewComplete = async (qas: QA[]) => {
    if (!resumeAnalysis) return;
    setIsGeneratingReport(true);

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resumeText,
          jobDescription: jobDescription.trim() || undefined,
          persona: selectedPersona,
          resumeAnalysis,
          questionsAndAnswers: qas,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Report generation failed.');
      }

      const report: FinalReportResult = await response.json();
      setFinalReport(report);
      setStage('report');
      setTimeout(() => toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

      // Save evaluation to history if signed in (fire-and-forget)
      if (isSignedIn) {
        authFetch('/api/evaluations', {
          method: 'POST',
          body: JSON.stringify({
            persona: selectedPersona,
            jobDescription: jobDescription.trim() || undefined,
            resumeSnippet: resumeText.slice(0, 500),
            report,
          }),
        }).catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report.');
      setStage('interview');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleReset = () => {
    setResumeAnalysis(null);
    setFinalReport(null);
    setError(null);
    // Keep resume if it came from profile
    if (!profileResumeLoaded) setResumeText('');
    setJobDescription('');
    setSelectedPersona('bigtech');
    setResumeInputMode('paste');
    setStage('input');
    toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <title>HireLens AI – Recruiter Simulator | Get Evaluated Like a Real Candidate</title>
      <meta name="description" content="Simulate how top recruiters screen your resume. Get brutally honest AI feedback from Big Tech, Startup, and HR personas in seconds." />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <AnimatedGrid />
        {/* Hero image overlay */}
        <div
          className="absolute inset-0 opacity-40 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{ backgroundImage: 'url(/bg.jpg)' }}
        />
        {/* Darkening gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs text-primary font-medium mb-6"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                AI-Powered Recruiter Simulator
              </motion.div>

              <h1 className="font-heading font-bold text-5xl lg:text-6xl xl:text-7xl text-foreground leading-tight mb-4">
                {heroWords.map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease: 'easeOut' as const }}
                    className={`inline-block mr-3 ${word === 'real' ? 'text-primary' : ''}`}
                  >
                    {word}
                  </motion.span>
                ))}
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg"
              >
                Simulate how top recruiters screen your resume. Get brutally honest AI feedback in seconds.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="flex flex-wrap gap-3"
              >
                <button
                  onClick={scrollToTool}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-heading font-bold text-sm hover:bg-primary/90 transition-all duration-200 shadow-[0_0_20px_rgba(108,99,255,0.4)] hover:shadow-[0_0_30px_rgba(108,99,255,0.6)]"
                >
                  Analyze My Resume
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border text-xs text-muted-foreground">
                  <Lock className="w-3.5 h-3.5" />
                  No account required
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="flex gap-8 mt-10"
              >
                {[
                  { label: 'Recruiter Personas', value: '3' },
                  { label: 'Evaluation Criteria', value: '7' },
                  { label: 'Avg. Analysis Time', value: '<10s' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="font-heading font-bold text-2xl text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Mock card */}
            <div className="hidden lg:flex justify-center items-center">
              <HeroMockCard />
            </div>
          </div>
        </div>
      </section>

      {/* TOOL SECTION */}
      <section ref={toolRef} className="relative py-16">
        <div className="max-w-5xl mx-auto px-6">

          {/* Section header */}
          <div className="text-center mb-10">
            <h2 className="font-heading font-bold text-3xl text-foreground mb-2">Start Your Evaluation</h2>
            <p className="text-muted-foreground text-sm">Choose a recruiter persona, paste your resume, and get instant AI feedback.</p>
          </div>

          {/* ── STAGE: INPUT ── */}
          {stage === 'input' && (
            <>
              {/* Persona Selector */}
              <div className="mb-8">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4 font-medium">
                  Step 1 — Select Recruiter Persona
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['bigtech', 'startup', 'hr'] as Persona[]).map((p) => (
                    <PersonaCard
                      key={p}
                      persona={p}
                      selected={selectedPersona === p}
                      onClick={() => setSelectedPersona(p)}
                    />
                  ))}
                </div>
              </div>

              {/* Input Section */}
              <div className="mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4 font-medium">
                  Step 2 — Paste Your Resume & Job Description
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Resume */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="block text-sm font-medium text-foreground">
                          Your Resume <span className="text-red-400">*</span>
                        </label>
                        {profileResumeLoaded && (
                          <span className="flex items-center gap-1 text-xs text-green-400 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Auto-filled from profile
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted border border-border">
                        <button
                          onClick={() => setResumeInputMode('paste')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                            resumeInputMode === 'paste'
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <PenLine className="w-3 h-3" />
                          Paste
                        </button>
                        <button
                          onClick={() => setResumeInputMode('upload')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                            resumeInputMode === 'upload'
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <FileText className="w-3 h-3" />
                          PDF
                        </button>
                      </div>
                    </div>

                    {resumeInputMode === 'paste' ? (
                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste your full resume here...&#10;&#10;Example:&#10;John Doe | Software Engineer&#10;Experience: 5 years at Google, Meta&#10;Skills: Python, React, System Design..."
                        className="w-full min-h-[220px] rounded-xl border border-border bg-card text-foreground text-sm p-4 placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 resize-y transition-colors"
                      />
                    ) : (
                      <div className="space-y-3">
                        <PdfUploader
                          onTextExtracted={(text) => {
                            setResumeText(text);
                            if (text) setError(null);
                          }}
                        />
                        {resumeText && resumeInputMode === 'upload' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="rounded-xl border border-border bg-card/50 p-3"
                          >
                            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Extracted text preview:</p>
                            <p className="text-xs text-foreground/70 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                              {resumeText.slice(0, 400)}{resumeText.length > 400 ? '...' : ''}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Job Description */}
                  <div>
                    <div className="flex items-center justify-between mb-2 h-8">
                      <label className="block text-sm font-medium text-foreground">
                        Paste Job Description{' '}
                        <span className="text-muted-foreground text-xs font-normal">(Optional — improves accuracy)</span>
                      </label>
                    </div>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here...&#10;&#10;Example:&#10;Senior Software Engineer at Acme Corp&#10;Requirements: 5+ years experience, React, Node.js&#10;Responsibilities: Lead frontend architecture..."
                      className="w-full min-h-[220px] rounded-xl border border-border bg-card text-foreground text-sm p-4 placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 resize-y transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Analyze Button */}
              <div className="mb-3">
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl font-heading font-bold text-base text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #6C63FF 0%, #8B5CF6 100%)',
                    boxShadow: '0 0 25px rgba(108,99,255,0.4)',
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing Resume...
                    </>
                  ) : (
                    <>
                      Start Interview Simulation
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Your data is processed securely and never stored
                  {!isSignedIn && (
                    <span className="ml-2 text-primary cursor-pointer hover:underline" onClick={() => navigate('/profile')}>
                      · Sign in to save your resume
                    </span>
                  )}
                </p>
              </div>
            </>
          )}

          {/* ── STAGE: INTERVIEW ── */}
          {stage === 'interview' && resumeAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-6 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Resume screened — now for the interview</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Answer all 3 questions to generate your full evaluation report</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                    resumeAnalysis.shortlisted
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}>
                    Resume: {resumeAnalysis.matchScore}% match
                  </span>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <InterviewChat
                questions={resumeAnalysis.interviewQuestions}
                persona={selectedPersona}
                onComplete={handleInterviewComplete}
              />
            </motion.div>
          )}

          {/* ── STAGE: REPORT ── */}
          {stage === 'report' && finalReport && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <FinalReport report={finalReport} persona={selectedPersona} />
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {isSignedIn && (
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex-1 py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #8B5CF6 100%)', boxShadow: '0 0 15px rgba(108,99,255,0.3)' }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Saved to Profile — View History
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-xl border border-border text-muted-foreground text-sm font-medium flex items-center justify-center gap-2 hover:border-primary/40 hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Start a New Evaluation
                </button>
              </div>
            </motion.div>
          )}

          {/* Generating report overlay */}
          {isGeneratingReport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 rounded-xl border border-primary/30 bg-card/80 p-10 text-center"
            >
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
              <p className="font-heading font-bold text-lg text-foreground">Generating your full report...</p>
              <p className="text-sm text-muted-foreground mt-1">Analyzing your interview answers alongside your resume</p>
            </motion.div>
          )}

        </div>
      </section>
    </>
  );
}
