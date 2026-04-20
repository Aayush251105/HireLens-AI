import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { userProfiles } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { getUserIdFromRequest } from '../../lib/clerkAuth.js';

export default async function handler(req: Request, res: Response) {
  try {
    const userId = await getUserIdFromRequest(req.headers.authorization);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.clerkUserId, userId))
      .limit(1);

    return res.json(profile ?? null);
  } catch (err) {
    console.error('GET /api/profile error:', err);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}
