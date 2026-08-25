/**
 * API Client with Authentication
 * 
 * Wraps fetch to automatically include Bearer token from Supabase session.
 */

import { supabaseClient } from './supabase';



export interface AuthenticatedFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Fetch wrapper that automatically includes authentication
 * Reads current Supabase session and adds Authorization Bearer token
 */
export async function authenticatedFetch(
  url: string,
  options: AuthenticatedFetchOptions = {}
): Promise<Response> {
  const { skipAuth, headers, ...fetchOptions } = options;

  // Get current session
  const { data: { session } } = await supabaseClient.auth.getSession();

  // Build headers
  // Use Record<string, string> (not HeadersInit) so we can assign by string index.
  const authHeaders: Record<string, string> = {};
  if (headers instanceof Headers) {
    headers.forEach((value, key) => { authHeaders[key] = value; });
  } else if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => { authHeaders[key] = value; });
  } else if (headers) {
    Object.assign(authHeaders, headers);
  }

  // Add Authorization Bearer token if session exists and not skipped
  if (!skipAuth && session?.access_token) {
    authHeaders['Authorization'] = `Bearer ${session.access_token}`;
  }

  return fetch(url, {
    ...fetchOptions,
    headers: authHeaders,
  });
}
