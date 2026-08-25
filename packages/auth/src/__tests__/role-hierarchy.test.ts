import {
  canAccessRoute,
  getAccessibleRoutes,
  hasMinimumRole,
} from '../role-hierarchy';

describe('Role Hierarchy & Route Access Controls', () => {
  describe('canAccessRoute', () => {
    it('should deny OWNER access to /bookings, /check-in, /check-out, /payments', () => {
      expect(canAccessRoute('OWNER', '/bookings')).toBe(false);
      expect(canAccessRoute('OWNER', '/check-in')).toBe(false);
      expect(canAccessRoute('OWNER', '/check-out')).toBe(false);
      expect(canAccessRoute('OWNER', '/payments')).toBe(false);
    });

    it('should allow RECEPTIONIST and MANAGER to access /bookings, /check-in, /check-out, /payments', () => {
      ['/bookings', '/check-in', '/check-out', '/payments'].forEach((route) => {
        expect(canAccessRoute('RECEPTIONIST', route)).toBe(true);
        expect(canAccessRoute('MANAGER', route)).toBe(true);
      });
    });

    it('should allow OWNER to access /dashboard, /reports, /rooms, /rates', () => {
      expect(canAccessRoute('OWNER', '/dashboard')).toBe(true);
      expect(canAccessRoute('OWNER', '/reports')).toBe(true);
      expect(canAccessRoute('OWNER', '/rooms')).toBe(true);
      expect(canAccessRoute('OWNER', '/rates')).toBe(true);
    });

    it('should deny RECEPTIONIST access to MANAGER and OWNER routes', () => {
      expect(canAccessRoute('RECEPTIONIST', '/dashboard')).toBe(false);
      expect(canAccessRoute('RECEPTIONIST', '/reports')).toBe(false);
      expect(canAccessRoute('RECEPTIONIST', '/rooms')).toBe(false);
      expect(canAccessRoute('RECEPTIONIST', '/rates')).toBe(false);
    });
  });

  describe('getAccessibleRoutes', () => {
    it('should not include /bookings in OWNER accessible routes', () => {
      const ownerRoutes = getAccessibleRoutes('OWNER');
      expect(ownerRoutes).not.toContain('/bookings');
      expect(ownerRoutes).not.toContain('/check-in');
      expect(ownerRoutes).not.toContain('/check-out');
      expect(ownerRoutes).not.toContain('/payments');
      expect(ownerRoutes).toEqual(expect.arrayContaining(['/dashboard', '/reports', '/rooms', '/rates']));
    });

    it('should include /bookings in RECEPTIONIST and MANAGER accessible routes', () => {
      const receptionistRoutes = getAccessibleRoutes('RECEPTIONIST');
      expect(receptionistRoutes).toEqual(
        expect.arrayContaining(['/bookings', '/check-in', '/check-out', '/payments'])
      );

      const managerRoutes = getAccessibleRoutes('MANAGER');
      expect(managerRoutes).toEqual(
        expect.arrayContaining(['/bookings', '/check-in', '/check-out', '/payments', '/reports', '/rooms', '/rates'])
      );
    });
  });
});
