import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { evaluations } from '../../db/schema.js';
import type { FinalReportResult } from '../interview/POST.js';
import { getUserIdFromRequest } from '../../lib/clerkAuth.js';

export default async function handler(req: Request, res: Response) {
  try {
    const userId = await getUserIdFromRequest(req.headers.authorization);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { persona, jobDescription, resumeSnippet, report } = req.body as {
      persona: string;
      jobDescription?: string;
      resumeSnippet?: string;
      report: FinalReportResult;
    };

    const [inserted] = await db.insert(evaluations).values({
      clerkUserId: userId,
      persona,
      jobDescription: jobDescription ?? null,
      resumeSnippet: resumeSnippet ? resumeSnippet.slice(0, 500) : null,
      reportJson: report as unknown as Record<string, unknown>,
      hiringDecision: report.hiringDecision,
      matchScore: report.matchScore,
      interviewScore: report.interviewScore,
    });

    return res.json({ success: true, id: (inserted as any)?.insertId });
  } catch (err) {
    console.error('POST /api/evaluations error:', err);
    return res.status(500).json({ error: 'Failed to save evaluation' });
  }
}
