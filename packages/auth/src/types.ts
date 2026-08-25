import { Role } from '@prisma/client';

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
