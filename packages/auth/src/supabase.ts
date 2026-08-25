/**
 * Supabase Client Configuration
 * 
 * Provides configured Supabase clients for authentication operations.
 * - supabaseClient: For client-side operations
 * - getSupabaseServerClient: For server-side operations with elevated privileges
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client-side Supabase client (safe for browser)
export const supabaseClient: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Get server-side Supabase client with service role key
 * Only use this on the server side (API routes, server components, middleware)
 * DO NOT call this from client components
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseServerClient() should only be called on the server side');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

