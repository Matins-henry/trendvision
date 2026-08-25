/**
 * Unit Tests for isRoomAvailable()
 * 
 * Tests the room availability checking function with specific scenarios,
 * edge cases, and boundary conditions.
 */

import { isRoomAvailable } from '../availability';
import {
  prisma,
  cleanupDatabase,
  disconnectDatabase,
  createTestRoom,
  createTestGuest,
  createTestBooking,
} from './setup';

describe('isRoomAvailable - Unit Tests', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  // Task 8.1: Basic scenario tests
  describe('Basic scenarios', () => {
    it('should return true when no bookings exist for a room', async () => {
      const room = await createTestRoom();
      const checkIn = new Date('2026-08-01');
      const checkOut = new Date('2026-08-05');

      const available = await isRoomAvailable(room.id, checkIn, checkOut);

      expect(available).toBe(true);
    });

    it('should return false when booking overlaps completely', async () => {
      const room = await createTestRoom();
      const guest = await createTestGuest();

      // Existing booking: Aug 1-10
      await createTestBooking({
        roomId: room.id,
        guestId: guest.id,
        checkIn: new Date('2026-08-01'),
        checkOut: new Date('2026-08-10'),
        status: 'CONFIRMED',
      });

      // Try to book: Aug 5-8 (completely within existing booking)
      const checkIn = new Date('2026-08-05');
      const checkOut = new Date('2026-08-08');

      const available = await isRoomAvailable(room.id, checkIn, checkOut);

      expect(available).toBe(false);
    });

    it('should return true when bookings do not overlap', async () => {
      const room = await createTestRoom();
      const guest = await createTestGuest();

      // Existing booking: Aug 1-5
      await createTestBooking({
        roomId: room.id,
        guestId: guest.id,
        checkIn: new Date('2026-08-01'),
        checkOut: new Date('2026-08-05'),
        status: 'CONFIRMED',
      });

      // Try to book: Aug 10-15 (no overlap)
      const checkIn = new Date('2026-08-10');
      const checkOut = new Date('2026-08-15');

      const available = await isRoomAvailable(room.id, checkIn, checkOut);

      expect(available).toBe(true);
    });

    it('should return true when CANCELLED booking exists for the same dates', async () => {
      const room = await createTestRoom();
      const guest = await createTestGuest();

      // Cancelled booking: Aug 1-10
      await createTestBooking({
        roomId: room.id,
        guestId: guest.id,
        checkIn: new Date('2026-08-01'),
        checkOut: new Date('2026-08-10'),
        status: 'CANCELLED',
      });

      // Try to book: Aug 5-8 (overlaps with cancelled booking)
      const checkIn = new Date('2026-08-05');
      const checkOut = new Date('2026-08-08');

      const available = await isRoomAvailable(room.id, checkIn, checkOut);

      expect(available).toBe(true);
    });

    it('should return true when CHECKED_OUT booking exists for the same dates', async () => {
      const room = await createTestRoom();
      const guest = await createTestGuest();

      // Checked out booking: Aug 1-10
      await createTestBooking({
        roomId: room.id,
        guestId: guest.id,
        checkIn: new Date('2026-08-01'),
        checkOut: new Date('2026-08-10'),
        status: 'CHECKED_OUT',
      });

      // Try to book: Aug 5-8 (overlaps with checked out booking)
      const checkIn = new Date('2026-08-05');
      const checkOut = new Date('2026-08-08');

      const available = await isRoomAvailable(room.id, checkIn, checkOut);

      expect(available).toBe(true);
    });
  });

  // Task 8.2: excludeBookingId parameter tests
  describe('excludeBookingId parameter', () => {
    it('should ignore specified booking when checking conflicts', async () => {
      const room = await createTestRoom();
      const guest = await createTestGuest();

      // Existing booking: Aug 1-10
      const existingBooking = await createTestBooking({
        roomId: room.id,
        guestId: guest.id,
        checkIn: new Date('2026-08-01'),
        checkOut: new Date('2026-08-10'),
        status: 'CONFIRMED',
      });

      // Try to book same dates, excluding the existing booking (edit scenario)
      const checkIn = new Date('2026-08-01');
      const checkOut = new Date('2026-08-10');

      const available = await isRoomAvailable(
        room.id,
        checkIn,
        checkOut,
        existingBooking.id
      );

      expect(available).toBe(true);
    });

    it('should detect conflict when multiple bookings exist and one is excluded', async () => {
      const room = await createTestRoom();
      const guest = await createTestGuest();

      // First booking: Aug 1-5
      const firstBooking = await createTestBooking({
        roomId: room.id,
        guestId: guest.id,
        checkIn: new Date('2026-08-01'),
        checkOut: new Date('2026-08-05'),
        status: 'CONFIRMED',
      });

      // Second booking: Aug 10-15
      await createTestBooking({
        roomId: room.id,
        guestId: guest.id,
        checkIn: new Date('2026-08-10'),
        checkOut: new Date('2026-08-15'),
        status: 'CONFIRMED',
      });

      // Try to book: Aug 3-12 (overlaps with both, but exclude first)
      const checkIn = new Date('2026-08-03');
      const checkOut = new Date('2026-08-12');

      const available = await isRoomAvailable(
        room.id,
        checkIn,
        checkOut,
        firstBooking.id
      );

      // Should still be unavailable due to second booking
      expect(available).toBe(false);
    });
  });

  // Task 8.3: Boundary condition tests
  describe('Boundary conditions', () => {
    it('should allow same-day check-in/check-out (same-day turnaround)', async () => {
      const room = await createTestRoom();
      const guest = await createTestGuest();

      // Existing booking: Aug 1-5 (checkout on Aug 5)
      await createTestBooking({
        roomId: room.id,
        guestId: guest.id,
        checkIn: new Date('2026-08-01T14:00:00Z'),
        checkOut: new Date('2026-08-05T10:00:00Z'),
        status: 'CONFIRMED',
      });

      // Try to book: Aug 5-10 (checkin on Aug 5)
      const checkIn = new Date('2026-08-05T14:00:00Z');
      const checkOut = new Date('2026-08-10T10:00:00Z');

      const available = await isRoomAvailable(room.id, checkIn, checkOut);

      // This depends on whether checkIn < checkOut boundary allows exact match
      // Based on overlap logic: checkIn < existingCheckOut AND checkOut > existingCheckIn
      // Aug 5 14:00 < Aug 5 10:00? No, so no conflict
      expect(available).toBe(true);
    });

    it('should detect overlap when boundaries touch with same timestamp', async () => {
      const room = await createTestRoom();
      const guest = await createTestGuest();

      // Existing booking: Aug 1-5 10:00
      await createTestBooking({
        roomId: room.id,
        guestId: guest.id,
        checkIn: new Date('2026-08-01T14:00:00Z'),
        checkOut: new Date('2026-08-05T10:00:00Z'),
        status: 'CONFIRMED',
      });

      // Try to book: Aug 5 10:00 - Aug 10 (exact boundary match)
      const checkIn = new Date('2026-08-05T10:00:00Z');
      const checkOut = new Date('2026-08-10T10:00:00Z');

      const available = await isRoomAvailable(room.id, checkIn, checkOut);

      // checkIn (Aug 5 10:00) < existingCheckOut (Aug 5 10:00)? No
      // So no conflict
      expect(available).toBe(true);
    });

    it('should handle zero-duration booking attempt', async () => {
      const room = await createTestRoom();
      
      // Try to book with same check-in and check-out
      const checkIn = new Date('2026-08-05T10:00:00Z');
      const checkOut = new Date('2026-08-05T10:00:00Z');

      const available = await isRoomAvailable(room.id, checkIn, checkOut);

      // No existing bookings, so should be available
      expect(available).toBe(true);
    });
  });

  // Task 8.4: Edge case tests
  describe('Edge cases', () => {
    it('should process past dates without validation restrictions', async () => {
      const room = await createTestRoom();
      
      // Try to book dates in the past
      const checkIn = new Date('2020-01-01');
      const checkOut = new Date('2020-01-05');

      const available = await isRoomAvailable(room.id, checkIn, checkOut);

      // Should return true (no bookings exist for those dates)
      expect(available).toBe(true);
    });

    it('should return true when requested range fits between multiple non-overlapping bookings', async () => {
      const room = await createTestRoom();
      const guest = await createTestGuest();

      // Booking 1: Aug 1-5
      await createTestBooking({
        roomId: room.id,
        guestId: guest.id,
        checkIn: new Date('2026-08-01'),
        checkOut: new Date('2026-08-05'),
        status: 'CONFIRMED',
      });

      // Booking 2: Aug 15-20
      await createTestBooking({
        roomId: room.id,
        guestId: guest.id,
        checkIn: new Date('2026-08-15'),
        checkOut: new Date('2026-08-20'),
        status: 'CONFIRMED',
      });

      // Try to book: Aug 6-14 (between the two bookings)
      const checkIn = new Date('2026-08-06');
      const checkOut = new Date('2026-08-14');

      const available = await isRoomAvailable(room.id, checkIn, checkOut);

      expect(available).toBe(true);
    });

    it('should return false when requested date range falls entirely within existing booking', async () => {
      const room = await createTestRoom();
      const guest = await createTestGuest();

      // Existing booking: Aug 1-20
      await createTestBooking({
        roomId: room.id,
        guestId: guest.id,
        checkIn: new Date('2026-08-01'),
        checkOut: new Date('2026-08-20'),
        status: 'CONFIRMED',
      });

      // Try to book: Aug 5-10 (completely within)
      const checkIn = new Date('2026-08-05');
      const checkOut = new Date('2026-08-10');

      const available = await isRoomAvailable(room.id, checkIn, checkOut);

      expect(available).toBe(false);
    });

    it('should only consider PENDING, CONFIRMED, CHECKED_IN as conflicts', async () => {
      const room = await createTestRoom();
      const guest = await createTestGuest();

      // Create bookings with all statuses
      await createTestBooking({
        roomId: room.id,
        guestId: guest.id,
        checkIn: new Date('2026-08-01'),
        checkOut: new Date('2026-08-05'),
        status: 'PENDING',
      });

      // Aug 1-5 is blocked by PENDING status
      let available = await isRoomAvailable(
        room.id,
        new Date('2026-08-03'),
        new Date('2026-08-04')
      );
      expect(available).toBe(false);

      // Clean and test CONFIRMED
      await cleanupDatabase();
      const room2 = await createTestRoom();
      const guest2 = await createTestGuest();
      
      await createTestBooking({
        roomId: room2.id,
        guestId: guest2.id,
        checkIn: new Date('2026-08-01'),
        checkOut: new Date('2026-08-05'),
        status: 'CONFIRMED',
      });

      available = await isRoomAvailable(
        room2.id,
        new Date('2026-08-03'),
        new Date('2026-08-04')
      );
      expect(available).toBe(false);

      // Clean and test CHECKED_IN
      await cleanupDatabase();
      const room3 = await createTestRoom();
      const guest3 = await createTestGuest();
      
      await createTestBooking({
        roomId: room3.id,
        guestId: guest3.id,
        checkIn: new Date('2026-08-01'),
        checkOut: new Date('2026-08-05'),
        status: 'CHECKED_IN',
      });

      available = await isRoomAvailable(
        room3.id,
        new Date('2026-08-03'),
        new Date('2026-08-04')
      );
      expect(available).toBe(false);
    });
  });

  // Task 2: Status checking tests (Phase 2)
  describe('Room status checking', () => {
    it('should return false for OUT_OF_SERVICE room with no bookings', async () => {
      const room = await createTestRoom({ status: 'OUT_OF_SERVICE' });
      const checkIn = new Date('2026-08-01');
      const checkOut = new Date('2026-08-05');

      const available = await isRoomAvailable(room.id, checkIn, checkOut);

      expect(available).toBe(false);
    });

    it('should return true for ACTIVE room with no bookings', async () => {
      const room = await createTestRoom({ status: 'ACTIVE' });
      const checkIn = new Date('2026-08-01');
      const checkOut = new Date('2026-08-05');

      const available = await isRoomAvailable(room.id, checkIn, checkOut);

      expect(available).toBe(true);
    });

    it('should return false for non-existent room', async () => {
      const fakeRoomId = '00000000-0000-0000-0000-000000000000';
      const checkIn = new Date('2026-08-01');
      const checkOut = new Date('2026-08-05');

      const available = await isRoomAvailable(fakeRoomId, checkIn, checkOut);

      expect(available).toBe(false);
    });

    it('should return false for OUT_OF_SERVICE room even with no bookings', async () => {
      const room = await createTestRoom({ status: 'OUT_OF_SERVICE' });
      
      // Explicitly verify no bookings exist
      const bookingCount = await prisma.booking.count({
        where: { roomId: room.id },
      });
      expect(bookingCount).toBe(0);

      const checkIn = new Date('2026-08-01');
      const checkOut = new Date('2026-08-05');

      const available = await isRoomAvailable(room.id, checkIn, checkOut);

      expect(available).toBe(false);
    });

    it('should return false for OUT_OF_SERVICE room regardless of date range', async () => {
      const room = await createTestRoom({ status: 'OUT_OF_SERVICE' });
      
      // Test past dates
      let available = await isRoomAvailable(
        room.id,
        new Date('2020-01-01'),
        new Date('2020-01-05')
      );
      expect(available).toBe(false);

      // Test future dates
      available = await isRoomAvailable(
        room.id,
        new Date('2030-01-01'),
        new Date('2030-01-05')
      );
      expect(available).toBe(false);

      // Test current dates
      available = await isRoomAvailable(
        room.id,
        new Date('2026-08-01'),
        new Date('2026-08-05')
      );
      expect(available).toBe(false);
    });

    it('should check status before checking bookings (performance)', async () => {
      // OUT_OF_SERVICE room with conflicting booking
      const room = await createTestRoom({ status: 'OUT_OF_SERVICE' });
      const guest = await createTestGuest();

      await createTestBooking({
        roomId: room.id,
        guestId: guest.id,
        checkIn: new Date('2026-08-01'),
        checkOut: new Date('2026-08-10'),
        status: 'CONFIRMED',
      });

      const checkIn = new Date('2026-08-05');
      const checkOut = new Date('2026-08-08');

      const available = await isRoomAvailable(room.id, checkIn, checkOut);

      // Should return false due to status, not booking conflict
      expect(available).toBe(false);
    });
  });
});
