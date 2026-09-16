import { generateBookingReference, calculateBookingTotal } from '../bookingUtils';
import {
  prisma,
  cleanupDatabase,
  disconnectDatabase,
  createTestRoom,
  createTestGuest,
  createTestBooking,
} from './setup';

describe('Booking Utilities Unit Tests', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  describe('calculateBookingTotal', () => {
    it('should calculate total for a 3-night stay correctly', () => {
      const checkIn = new Date('2026-08-10T14:00:00Z');
      const checkOut = new Date('2026-08-13T10:00:00Z');
      const baseRate = 120.00;

      const total = calculateBookingTotal(checkIn, checkOut, baseRate);
      expect(total).toBe(360.00);
    });

    it('should handle string base rates correctly', () => {
      const checkIn = new Date('2026-08-10T14:00:00Z');
      const checkOut = new Date('2026-08-11T10:00:00Z');
      const baseRate = '150.50';

      const total = calculateBookingTotal(checkIn, checkOut, baseRate);
      expect(total).toBe(150.50);
    });

    it('should return 0 when checkIn is after or equal to checkOut', () => {
      const checkIn = new Date('2026-08-15T14:00:00Z');
      const checkOut = new Date('2026-08-10T10:00:00Z');

      const total = calculateBookingTotal(checkIn, checkOut, 100);
      expect(total).toBe(0);
    });
  });

  describe('generateBookingReference', () => {
    it('should generate TVL-YYYY-0001 when no prior bookings exist for current year', async () => {
      const year = new Date().getFullYear();
      const ref = await generateBookingReference(prisma);
      expect(ref).toBe(`TVL-${year}-0001`);
    });

    it('should increment reference sequence when prior booking exists', async () => {
      const year = new Date().getFullYear();
      const room = await createTestRoom();
      const guest = await createTestGuest();

      // Create a booking with sequence 0001
      await prisma.booking.create({
        data: {
          reference: `TVL-${year}-0001`,
          roomId: room.id,
          guestId: guest.id,
          checkIn: new Date('2026-09-01'),
          checkOut: new Date('2026-09-05'),
          status: 'CONFIRMED',
          source: 'STAFF',
          totalAmount: 480.00,
        },
      });

      const nextRef = await generateBookingReference(prisma);
      expect(nextRef).toBe(`TVL-${year}-0002`);
    });
  });
});
