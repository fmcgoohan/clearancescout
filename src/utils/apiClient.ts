/**
 * Demo Access Token Client Utilities
 */

const DEMO_TOKEN_STORAGE_KEY = 'clearancescout_demo_token';

export function getDemoToken(): string | null {
  try {
    return localStorage.getItem(DEMO_TOKEN_STORAGE_KEY) || sessionStorage.getItem(DEMO_TOKEN_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function setDemoToken(token: string | null): void {
  try {
    if (token && token.trim()) {
      localStorage.setItem(DEMO_TOKEN_STORAGE_KEY, token.trim());
      sessionStorage.setItem(DEMO_TOKEN_STORAGE_KEY, token.trim());
    } else {
      localStorage.removeItem(DEMO_TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(DEMO_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota or access errors
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getDemoToken();
  if (token) {
    return {
      'x-demo-token': token,
      'Authorization': `Bearer ${token}`,
    };
  }
  return {};
}

/**
 * Authenticated Fetch wrapper that automatically injects demo access token headers
 * and dispatches a global auth required event on HTTP 401 responses.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getDemoToken();
  const headers = new Headers(init?.headers);
  if (token) {
    if (!headers.has('x-demo-token')) {
      headers.set('x-demo-token', token);
    }
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('clearancescout:auth_required'));
    } catch {
      // Ignore event dispatch errors
    }
  }

  return response;
}
