import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma client
// Ensures DATABASE_URL is read from process.env at runtime
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function isRoomAvailable(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
): Promise<boolean> {
  // Check room status first - OUT_OF_SERVICE rooms are never available
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { status: true },
  });

  if (!room || room.status !== 'ACTIVE') {
    return false;
  }

  // Check for overlapping bookings
  const conflict = await prisma.booking.findFirst({
    where: {
      roomId,
      status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
  });
  return !conflict;
}