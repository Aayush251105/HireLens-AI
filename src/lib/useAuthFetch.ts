/**
 * Returns a fetch wrapper that automatically attaches the Clerk Bearer token.
 */
import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

export function useAuthFetch() {
  const { getToken } = useAuth();

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const token = await getToken();
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    },
    [getToken]
  );

  return authFetch;
}
