/**
 * Staff Authentication Service
 * 
 * Handles authentication operations and links Supabase auth to StaffUser records.
 * 
 * Supabase client runs in browser for auth operations.
 * StaffUser queries happen server-side via API routes (Prisma cannot run in browser).
 */

import type { Role } from './role-hierarchy';
import { supabaseClient } from './supabase';

/**
 * Result returned after successful staff authentication
 */
export interface StaffAuthResult {
  authId: string;
  staffUserId: string;
  role: Role;
  name: string;
  email: string;
  active: boolean;
}

/**
 * Authentication service interface
 */
export interface AuthService {
  signIn(email: string, password: string): Promise<StaffAuthResult>;
  signOut(): Promise<void>;
  getCurrentStaff(): Promise<StaffAuthResult | null>;
  verifyActive(authId: string): Promise<boolean>;
}

/**
 * Sign in a staff member with email and password
 * @param email - Staff member email
 * @param password - Staff member password
 * @returns Staff authentication result with role and permissions
 * @throws Error if credentials are invalid or account is inactive
 */
export async function signIn(email: string, password: string): Promise<StaffAuthResult> {
  // Authenticate with Supabase Auth (client-side is fine)
  const { data: authData, error: authError} = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    throw new Error('Invalid credentials');
  }

  const authId = authData.user.id;

  // Query StaffUser via server-side API route (Prisma runs server-side)
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authId }),
  });

  if (!response.ok) {
    const error = await response.json();
    // Sign out if StaffUser verification fails
    await supabaseClient.auth.signOut();
    throw new Error(error.error || 'Sign in failed');
  }

  const staffUser = await response.json();
  return staffUser as StaffAuthResult;
}

/**
 * Sign out the current staff member
 */
export async function signOut(): Promise<void> {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    throw new Error(`Sign out failed: ${error.message}`);
  }
}

/**
 * Get the currently authenticated staff member
 * @returns Current staff or null if not authenticated
 */
export async function getCurrentStaff(): Promise<StaffAuthResult | null> {
  // Get current session from Supabase (client-side is fine)
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const authId = session.user.id;

  // Query StaffUser via server-side API route (Prisma runs server-side)
  try {
    const response = await fetch('/api/auth/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authId }),
    });

    if (!response.ok) {
      return null;
    }

    const staffUser = await response.json();
    return staffUser as StaffAuthResult;
  } catch (error) {
    console.error('Failed to get current staff:', error);
    return null;
  }
}

/**
 * Verify if a staff member with the given authId is active
 * @param authId - Supabase auth user ID
 * @returns True if staff member exists and is active
 */
export async function verifyActive(authId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authId }),
    });

    if (!response.ok) {
      return false;
    }

    const staffUser = await response.json();
    return staffUser.active ?? false;
  } catch (error) {
    console.error('Failed to verify active status:', error);
    return false;
  }
}
