import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, MessageSquare, User } from 'lucide-react';
import type { Persona } from './PersonaCard';

const personaNames: Record<Persona, string> = {
  bigtech: 'Big Tech Recruiter',
  startup: 'Startup Founder',
  hr: 'HR Manager',
};

const personaAvatars: Record<Persona, string> = {
  bigtech: '🏢',
  startup: '🚀',
  hr: '👔',
};

export interface QA {
  question: string;
  answer: string;
}

interface Message {
  role: 'recruiter' | 'candidate';
  text: string;
  isTyping?: boolean;
}

interface InterviewChatProps {
  questions: string[];
  persona: Persona;
  onComplete: (qas: QA[]) => void;
}

export default function InterviewChat({ questions, persona, onComplete }: InterviewChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [isRecruiterTyping, setIsRecruiterTyping] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Kick off with intro + first question
  useEffect(() => {
    const intro = `Hi! I'm your ${personaNames[persona]} for today's interview. I'll be asking you ${questions.length} questions based on your resume. Take your time and answer as thoroughly as you can.\n\nLet's begin!`;
    setIsRecruiterTyping(true);
    const t1 = setTimeout(() => {
      setMessages([{ role: 'recruiter', text: intro }]);
      setIsRecruiterTyping(false);

      // Ask first question after a short pause
      setTimeout(() => {
        setIsRecruiterTyping(true);
        setTimeout(() => {
          setMessages((prev) => [...prev, { role: 'recruiter', text: `Q1 of ${questions.length}: ${questions[0]}` }]);
          setIsRecruiterTyping(false);
        }, 900);
      }, 600);
    }, 1200);

    return () => clearTimeout(t1);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRecruiterTyping]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isRecruiterTyping || isDone) return;

    const newAnswers = [...answers, trimmed];
    setAnswers(newAnswers);
    setMessages((prev) => [...prev, { role: 'candidate', text: trimmed }]);
    setInputValue('');

    const nextQ = currentQuestion + 1;

    if (nextQ < questions.length) {
      // Ask next question
      setCurrentQuestion(nextQ);
      setIsRecruiterTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: 'recruiter', text: `Q${nextQ + 1} of ${questions.length}: ${questions[nextQ]}` },
        ]);
        setIsRecruiterTyping(false);
        inputRef.current?.focus();
      }, 1000 + Math.random() * 500);
    } else {
      // All answered
      setIsDone(true);
      setIsRecruiterTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'recruiter',
            text: "Thank you for your answers! I have everything I need. Let me now generate your complete evaluation report...",
          },
        ]);
        setIsRecruiterTyping(false);

        // Build QA pairs and call onComplete
        const qas: QA[] = questions.map((q, i) => ({
          question: q,
          answer: newAnswers[i] ?? '',
        }));

        setTimeout(() => onComplete(qas), 1200);
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-primary/30 bg-card/80 backdrop-blur-sm overflow-hidden shadow-[0_0_40px_rgba(108,99,255,0.15)]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60 bg-card/60">
        <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-lg">
          {personaAvatars[persona]}
        </div>
        <div>
          <p className="text-sm font-heading font-bold text-foreground">{personaNames[persona]}</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs text-muted-foreground">Live Interview Session</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{Math.min(currentQuestion + 1, questions.length)}/{questions.length} questions</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${(Math.min(answers.length, questions.length) / questions.length) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' as const }}
        />
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto px-5 py-4 space-y-4 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === 'candidate' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5 ${
                msg.role === 'recruiter'
                  ? 'bg-primary/20 border border-primary/30'
                  : 'bg-muted border border-border'
              }`}>
                {msg.role === 'recruiter' ? personaAvatars[persona] : <User className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'recruiter'
                  ? 'bg-muted/60 text-foreground rounded-tl-sm'
                  : 'bg-primary text-white rounded-tr-sm'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isRecruiterTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-sm shrink-0">
                {personaAvatars[persona]}
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted/60 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-border/60 bg-card/40">
        {isDone ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            Generating your final report...
          </div>
        ) : (
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
              disabled={isRecruiterTyping}
              rows={2}
              className="flex-1 rounded-xl border border-border bg-muted/40 text-foreground text-sm px-4 py-2.5 placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 resize-none transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isRecruiterTyping}
              className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Answer thoughtfully — your responses will be evaluated in the final report
        </p>
      </div>
    </motion.div>
  );
}
