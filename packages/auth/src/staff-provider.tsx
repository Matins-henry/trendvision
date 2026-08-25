/**
 * Staff Authentication React Context Provider
 * 
 * Provides React context for accessing current staff information in components.
 */

'use client';

import * as React from 'react';
import type { Role } from './role-hierarchy';
import { StaffAuthResult, getCurrentStaff } from './staff-auth';

/**
 * Staff context interface providing authentication state and utilities
 */
export interface StaffContext {
  staff: StaffAuthResult | null;
  isLoading: boolean;
  hasRole: (roles: Role[]) => boolean;
}

/**
 * React context for staff authentication
 */
const StaffAuthContext = React.createContext<StaffContext | undefined>(undefined);

/**
 * Staff provider component that wraps the app to provide authentication context
 * @param children - Child components to wrap
 */
export function StaffProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [staff, setStaff] = React.useState<StaffAuthResult | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Fetch current staff on mount
  React.useEffect(() => {
    async function loadStaff() {
      try {
        console.log('[StaffProvider] Loading current staff...');
        const currentStaff = await getCurrentStaff();
        console.log('[StaffProvider] Staff loaded:', currentStaff ? `${currentStaff.name} (${currentStaff.role})` : 'null');
        setStaff(currentStaff);
      } catch (error) {
        console.error('[StaffProvider] Failed to load staff:', error);
        setStaff(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadStaff();
  }, []);

  // Helper function to check if current staff has one of the specified roles (exact match)
  const hasRole = React.useCallback(
    (roles: Role[]): boolean => {
      if (!staff) {
        return false;
      }
      return roles.includes(staff.role);
    },
    [staff]
  );

  const value: StaffContext = {
    staff,
    isLoading,
    hasRole,
  };

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
    </StaffAuthContext.Provider>
  );
}

/**
 * Hook to access staff authentication context
 * @returns Staff context with current staff, loading state, and role checking
 * @throws Error if used outside of StaffProvider
 */
export function useStaff(): StaffContext {
  const context = React.useContext(StaffAuthContext);
  
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  
  return context;
}
