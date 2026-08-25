/**
 * Auth Package - Shared authentication and authorization for hotel platform
 * 
 * This package provides:
 * - Supabase authentication integration
 * - Staff user authentication services
 * - Role-based access control utilities
 * - Hierarchical role permissions
 */

// Export Supabase clients
export { supabaseClient, getSupabaseServerClient } from './supabase';

// Export authentication service
export type { StaffAuthResult, AuthService } from './staff-auth';
export { signIn, signOut, getCurrentStaff, verifyActive } from './staff-auth';

// Export server-side authentication (for API routes)
export type { ServerStaffAuthResult } from './server-auth';
export { getServerStaff } from './server-auth';

// Export API client with auto-auth
export type { AuthenticatedFetchOptions } from './api-client';
export { authenticatedFetch } from './api-client';

// Export React context provider
export { StaffProvider, useStaff } from './staff-provider';
export type { StaffContext } from './staff-provider';

// Export role hierarchy utilities
export {
  ROLE_RANK,
  ROUTE_MIN_ROLE,
  ROUTE_EXACT_ROLES,
  getRoleRank,
  hasMinimumRole,
  hasAnyMinimumRole,
  canAccessRoute,
  getAccessibleRoutes,
} from './role-hierarchy';
