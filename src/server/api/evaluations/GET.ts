import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { evaluations } from '../../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getUserIdFromRequest } from '../../lib/clerkAuth.js';

export default async function handler(req: Request, res: Response) {
  try {
    const userId = await getUserIdFromRequest(req.headers.authorization);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const rows = await db
      .select()
      .from(evaluations)
      .where(eq(evaluations.clerkUserId, userId))
      .orderBy(desc(evaluations.createdAt))
      .limit(50);

    return res.json(rows);
  } catch (err) {
    console.error('GET /api/evaluations error:', err);
    return res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
}
