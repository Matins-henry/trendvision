/**
 * Role Hierarchy System
 * 
 * Defines a hierarchical permission model where higher roles inherit
 * all permissions from lower roles.
 * 
 * Hierarchy: RECEPTIONIST (1) < MANAGER (2) < OWNER (3)
 */

export type Role = 'OWNER' | 'MANAGER' | 'RECEPTIONIST';

/**
 * Role rank - higher number = higher access level
 */
export const ROLE_RANK: Record<Role, number> = {
  RECEPTIONIST: 1,
  MANAGER: 2,
  OWNER: 3,
};

/**
 * Get the numeric rank for a role
 */
export function getRoleRank(role: Role): number {
  return ROLE_RANK[role];
}

/**
 * Check if a user's role has sufficient access for a required minimum role
 * Higher roles inherit access to everything lower roles can do.
 * 
 * @param userRole - The user's actual role
 * @param requiredRole - The minimum role required
 * @returns true if user has sufficient access
 */
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return getRoleRank(userRole) >= getRoleRank(requiredRole);
}

/**
 * Check if a user has access to any of the specified minimum roles
 * 
 * @param userRole - The user's actual role
 * @param requiredRoles - Array of acceptable minimum roles
 * @returns true if user meets any of the minimum role requirements
 */
export function hasAnyMinimumRole(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.some(requiredRole => hasMinimumRole(userRole, requiredRole));
}

/**
 * Route access configuration — Minimum required roles.
 * Higher roles automatically inherit access to lower routes.
 * OWNER (rank 3) inherits access to ALL routes (super-admin).
 */
export const ROUTE_MIN_ROLE: Record<string, Role> = {
  '/dashboard': 'MANAGER', // Owner & Manager can view executive dashboard
  '/reports': 'MANAGER',
  '/rooms': 'MANAGER',
  '/rates': 'OWNER', // Rates management restricted strictly to OWNER
  '/expenses': 'MANAGER',
  '/maintenance': 'RECEPTIONIST',
  '/bookings': 'RECEPTIONIST',
  '/check-in': 'RECEPTIONIST',
  '/check-out': 'RECEPTIONIST',
  '/payments': 'RECEPTIONIST',
};

/**
 * Explicit role allowlists — All operational routes now include OWNER as the super-admin.
 */
export const ROUTE_EXACT_ROLES: Record<string, Role[]> = {
  '/bookings': ['RECEPTIONIST', 'MANAGER', 'OWNER'],
  '/check-in': ['RECEPTIONIST', 'MANAGER', 'OWNER'],
  '/check-out': ['RECEPTIONIST', 'MANAGER', 'OWNER'],
  '/payments': ['RECEPTIONIST', 'MANAGER', 'OWNER'],
  '/rooms': ['MANAGER', 'OWNER'],
  '/rates': ['OWNER'], // Restricted strictly to OWNER
  '/reports': ['MANAGER', 'OWNER'],
  '/expenses': ['MANAGER', 'OWNER'],
};

/**
 * Check if a user can access a specific route.
 *
 * @param userRole - The user's role
 * @param pathname - The route pathname
 * @returns true if user can access the route
 */
export function canAccessRoute(userRole: Role, pathname: string): boolean {
  if (userRole === 'OWNER') return true; // Owner has full super-admin access to all routes

  const exactRoles = ROUTE_EXACT_ROLES[pathname];
  if (exactRoles) {
    return exactRoles.includes(userRole);
  }

  const minRole = ROUTE_MIN_ROLE[pathname];
  if (!minRole) {
    return true;
  }
  return hasMinimumRole(userRole, minRole);
}

/**
 * Get all routes accessible to a given role.
 *
 * @param userRole - The user's role
 * @returns Array of accessible route paths
 */
export function getAccessibleRoutes(userRole: Role): string[] {
  if (userRole === 'OWNER') {
    return ['/dashboard', '/bookings', '/check-in', '/check-out', '/rooms', '/rates', '/expenses', '/reports', '/maintenance'];
  }

  const exactAllowed = Object.entries(ROUTE_EXACT_ROLES)
    .filter(([, roles]) => roles.includes(userRole))
    .map(([path]) => path);

  const minRoleAllowed = Object.entries(ROUTE_MIN_ROLE)
    .filter(([, minRole]) => hasMinimumRole(userRole, minRole))
    .map(([path]) => path);

  return Array.from(new Set([...exactAllowed, ...minRoleAllowed]));
}
