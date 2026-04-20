import type { Request, Response } from 'express';
import Groq from 'groq-sdk';
import { getSecret } from '#airo/secrets';

const personaPrompts: Record<string, string> = {
  bigtech: `You are a senior technical recruiter at a FAANG company (Google, Meta, Amazon, Apple, Netflix). You evaluate candidates with extremely high standards. You look for quantifiable impact, scale of work, top-tier education or companies, and technical depth. You raise the bar aggressively. You are skeptical of vague claims and demand specificity. You compare every candidate against the best engineers you've ever hired.`,
  startup: `You are a Series A startup founder hiring for a key role. You value scrappiness, versatility, speed of execution, and passion. You care less about pedigree and more about what they've actually shipped and their growth mindset. You want someone who can wear multiple hats, move fast, and thrive in ambiguity. You're excited by side projects, unconventional paths, and demonstrated hustle.`,
  hr: `You are an experienced HR manager at a mid-size company. You evaluate cultural fit, communication skills, role alignment, and career progression. You look for stability, clear motivation, and professional presentation. You care about how well the candidate's background aligns with the role requirements, their soft skills, and whether they seem like a reliable long-term hire.`,
};

const personaNames: Record<string, string> = {
  bigtech: 'Big Tech Recruiter',
  startup: 'Startup Founder',
  hr: 'HR Manager',
};

export default async function handler(req: Request, res: Response) {
  try {
    const { resume, jobDescription, persona } = req.body as {
      resume: string;
      jobDescription?: string;
      persona: 'bigtech' | 'startup' | 'hr';
    };

    if (!resume || resume.trim().length < 50) {
      return res.status(400).json({ error: 'Resume is too short or missing.' });
    }

    if (!persona || !personaPrompts[persona]) {
      return res.status(400).json({ error: 'Invalid persona selected.' });
    }

    const apiKey = getSecret('GROQ_API_KEY');
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(500).json({ error: 'Groq API key is not configured.' });
    }

    const groq = new Groq({ apiKey });

    const prompt = `You are evaluating a job candidate's resume. ${jobDescription ? 'A job description has been provided — align your evaluation STRONGLY with it.' : 'No job description was provided — evaluate the resume on general merit for the type of role this candidate seems to be targeting.'}

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}\n\n` : ''}RESUME:\n${resume}

Evaluate this candidate as ${personaNames[persona]}. Be realistic, slightly critical, and specific. Avoid generic advice. Focus on measurable impact and relevance.

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, no explanation — raw JSON only):
{
  "shortlisted": boolean,
  "matchScore": number (0-100, integer),
  "strengths": [string, string, string],
  "weaknesses": [string, string, string],
  "rejectionReasons": [string] (empty array if shortlisted, otherwise 2-3 specific reasons),
  "interviewQuestions": [string, string, string],
  "suggestions": [string, string, string]
}

Rules:
- matchScore should reflect genuine fit (be honest, not generous)
- strengths/weaknesses must be specific to THIS resume and role, not generic
- interviewQuestions must be highly personalized based on the actual resume content
- suggestions must be actionable and specific to improving chances for this exact role
- If shortlisted is false, rejectionReasons must be specific and realistic
- Output ONLY the JSON object, nothing else`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: personaPrompts[persona] },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const text = completion.choices[0]?.message?.content ?? '';

    // Robust JSON extraction & Repair
    let jsonContent = text.trim();
    const firstBrace = jsonContent.indexOf('{');
    let lastBrace = jsonContent.lastIndexOf('}');
    
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
      // Final attempt at repair
      try {
        parsed = JSON.parse(jsonContent + '"}');
      } catch {
        console.error('Raw AI response:', text);
        throw new Error('Failed to parse AI response as JSON. The model may have returned malformed or incomplete content.');
      }
    }

    // Validate structure
    if (
      typeof parsed.shortlisted !== 'boolean' ||
      typeof parsed.matchScore !== 'number' ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.weaknesses) ||
      !Array.isArray(parsed.rejectionReasons) ||
      !Array.isArray(parsed.interviewQuestions) ||
      !Array.isArray(parsed.suggestions)
    ) {
      throw new Error('AI response missing required fields');
    }

    return res.json(parsed);
  } catch (error) {
    console.error('Analyze error:', error);
    return res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
