import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { userProfiles } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { getUserIdFromRequest } from '../../lib/clerkAuth.js';

export default async function handler(req: Request, res: Response) {
  try {
    const userId = await getUserIdFromRequest(req.headers.authorization);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { displayName, email, savedResume } = req.body as {
      displayName?: string;
      email?: string;
      savedResume?: string;
    };

    const [existing] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.clerkUserId, userId))
      .limit(1);

    if (existing) {
      await db
        .update(userProfiles)
        .set({
          ...(displayName !== undefined && { displayName }),
          ...(email !== undefined && { email }),
          ...(savedResume !== undefined && { savedResume }),
        })
        .where(eq(userProfiles.clerkUserId, userId));
    } else {
      await db.insert(userProfiles).values({
        clerkUserId: userId,
        displayName: displayName ?? null,
        email: email ?? null,
        savedResume: savedResume ?? null,
      });
    }

    const [updated] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.clerkUserId, userId))
      .limit(1);

    return res.json(updated);
  } catch (err) {
    console.error('POST /api/profile error:', err);
    return res.status(500).json({ error: 'Failed to save profile', details: String(err) });
  }
}
