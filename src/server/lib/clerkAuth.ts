import { verifyToken } from '@clerk/backend';
import { getSecret } from '#airo/secrets';

/**
 * Verifies a Clerk Bearer token and returns the userId, or null if invalid.
 */
export async function verifyClerkToken(token: string): Promise<string | null> {
  try {
    const payload = await verifyToken(token, {
      secretKey: getSecret('CLERK_SECRET_KEY') as string,
    });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the Bearer token from an Authorization header.
 * Returns userId or null.
 */
export async function getUserIdFromRequest(
  authHeader: string | undefined
): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return verifyClerkToken(token);
}
