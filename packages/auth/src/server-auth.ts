/**
 * Server-Side Authentication Utilities
 * 
 * For use in Next.js API routes.
 * Verifies Bearer token with Supabase and fetches StaffUser.
 */

import { createClient } from '@supabase/supabase-js';
import { prisma } from '@hotel/db/src/availability';
import type { Role } from './role-hierarchy';

export interface ServerStaffAuthResult {
  authId: string;
  staffUserId: string;
  role: Role;
  name: string;
  email: string;
  active: boolean;
}

/**
 * Get currently authenticated staff from API route.
 * Accepts any Request-like object with a .headers.get() method
 * (compatible with Next.js NextRequest and standard Request).
 */
export async function getServerStaff(
  request: { headers: { get(name: string): string | null } }
): Promise<ServerStaffAuthResult | null> {
  const startTime = Date.now();
  
  // Extract Bearer token from Authorization header
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('getServerStaff: No Bearer token found in Authorization header');
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Create Supabase client to verify token
  const supabaseStart = Date.now();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  console.log(`[TIMING] getServerStaff: Supabase client created in ${Date.now() - supabaseStart}ms`);

  // Verify token with Supabase
  const tokenStart = Date.now();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  console.log(`[TIMING] getServerStaff: Token verification took ${Date.now() - tokenStart}ms`);

  if (error || !user) {
    console.log('getServerStaff: Token verification failed:', error?.message);
    return null;
  }

  const authId = user.id;

  // Query StaffUser from database using verified authId
  const dbStart = Date.now();
  const staffUser = await prisma.staffUser.findUnique({
    where: { authId },
  });
  console.log(`[TIMING] getServerStaff: Database query took ${Date.now() - dbStart}ms`);

  if (!staffUser || !staffUser.active) {
    console.log('getServerStaff: StaffUser not found or inactive for authId:', authId);
    return null;
  }

  console.log(`[TIMING] getServerStaff: TOTAL ${Date.now() - startTime}ms`);

  return {
    authId: staffUser.authId,
    staffUserId: staffUser.id,
    role: staffUser.role as Role,
    name: staffUser.name,
    email: staffUser.email,
    active: staffUser.active,
  };
}
