import type { Request, Response } from 'express';
import Groq from 'groq-sdk';
import { getSecret } from '#airo/secrets';

const personaPrompts: Record<string, string> = {
  bigtech: `You are a senior technical recruiter at a FAANG company. You evaluate candidates with extremely high standards. You look for quantifiable impact, technical depth, and clarity of thought. Be critical but fair.`,
  startup: `You are a Series A startup founder hiring for a key role. You value scrappiness, clarity, and real-world execution. You want someone who can move fast and think independently.`,
  hr: `You are an experienced HR manager. You evaluate communication skills, cultural fit, and role alignment. You look for professionalism, self-awareness, and clear motivation.`,
};

const personaNames: Record<string, string> = {
  bigtech: 'Big Tech Recruiter',
  startup: 'Startup Founder',
  hr: 'HR Manager',
};

export interface AnswerEvaluation {
  question: string;
  answer: string;
  score: number; // 0-10
  feedback: string;
  verdict: 'strong' | 'acceptable' | 'weak';
}

export interface FinalReportResult {
  // Resume analysis (carried over)
  shortlisted: boolean;
  matchScore: number;
  strengths: string[];
  weaknesses: string[];
  rejectionReasons: string[];
  suggestions: string[];
  // Interview analysis
  answerEvaluations: AnswerEvaluation[];
  interviewScore: number; // 0-100
  overallVerdict: string;
  hiringDecision: 'strong_yes' | 'yes' | 'maybe' | 'no';
  hiringRationale: string;
}

export default async function handler(req: Request, res: Response) {
  try {
    const { resume, jobDescription, persona, resumeAnalysis, questionsAndAnswers } = req.body as {
      resume: string;
      jobDescription?: string;
      persona: string;
      resumeAnalysis: {
        shortlisted: boolean;
        matchScore: number;
        strengths: string[];
        weaknesses: string[];
        rejectionReasons: string[];
        suggestions: string[];
      };
      questionsAndAnswers: Array<{ question: string; answer: string }>;
    };

    if (!questionsAndAnswers || questionsAndAnswers.length === 0) {
      return res.status(400).json({ error: 'No answers provided.' });
    }

    const apiKey = getSecret('GROQ_API_KEY');
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(500).json({ error: 'Groq API key is not configured.' });
    }

    const groq = new Groq({ apiKey });

    const qaBlock = questionsAndAnswers
      .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
      .join('\n\n');

    const prompt = `You are evaluating a candidate's interview answers as ${personaNames[persona]}.

RESUME SUMMARY:
${resume.slice(0, 1500)}

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}\n\n` : ''}INTERVIEW Q&A:
${qaBlock}

RESUME ANALYSIS ALREADY DONE:
- Match Score: ${resumeAnalysis.matchScore}%
- Shortlisted: ${resumeAnalysis.shortlisted}
- Strengths: ${resumeAnalysis.strengths.join(', ')}
- Weaknesses: ${resumeAnalysis.weaknesses.join(', ')}

Now evaluate each answer and produce a final hiring report. Be realistic and specific. Score answers honestly.

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "answerEvaluations": [
    {
      "question": "exact question text",
      "answer": "exact answer text",
      "score": number (0-10),
      "feedback": "2-3 sentence specific feedback on this answer",
      "verdict": "strong" | "acceptable" | "weak"
    }
  ],
  "interviewScore": number (0-100, weighted average of answer quality),
  "overallVerdict": "1-2 sentence overall impression of the candidate after resume + interview",
  "hiringDecision": "strong_yes" | "yes" | "maybe" | "no",
  "hiringRationale": "2-3 sentences explaining the final hiring decision considering both resume and interview performance"
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: personaPrompts[persona] },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const text = completion.choices[0]?.message?.content ?? '';
    
    // Robust JSON extraction & Repair
    let jsonContent = text.trim();
    const firstBrace = jsonContent.indexOf('{');
    let lastBrace = jsonContent.lastIndexOf('}');
    
    // If we have a start but no end, or end is before start, try to extract what we have
    if (firstBrace !== -1) {
      if (lastBrace === -1 || lastBrace < firstBrace) {
        // AI likely cut off. Try to close it.
        jsonContent = jsonContent.substring(firstBrace) + '\n}';
      } else {
        jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
      }
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (e) {
      // Final attempt at repair if it's just missing a quote or brace
      try {
        parsed = JSON.parse(jsonContent + '"}');
      } catch {
        console.error('Raw AI response:', text);
        throw new Error('Failed to parse AI response as JSON. The model may have returned malformed or incomplete content.');
      }
    }

    // Merge resume analysis + interview analysis into final report
    const finalReport: FinalReportResult = {
      ...resumeAnalysis,
      answerEvaluations: parsed.answerEvaluations,
      interviewScore: parsed.interviewScore,
      overallVerdict: parsed.overallVerdict,
      hiringDecision: parsed.hiringDecision,
      hiringRationale: parsed.hiringRationale,
    };

    return res.json(finalReport);
  } catch (error) {
    console.error('Interview error:', error);
    return res.status(500).json({
      error: 'Interview evaluation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
