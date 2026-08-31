import { PrismaClient } from '@prisma/client';

/**
 * Clean & format Database URL for Supabase PgBouncer Pooler (port 6543).
 * Prevents Postgres error 26000: 'prepared statement "s0" does not exist' by ensuring
 * pgbouncer=true and statement_cache_size=0 options are present.
 */
function getFormattedDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // If using Supabase transaction pooler port 6543, disable statement caching for PgBouncer
  if (url.includes(':6543/') || url.includes('pgbouncer=true')) {
    if (!url.includes('statement_cache_size=0')) {
      url += url.includes('?') ? '&statement_cache_size=0' : '?statement_cache_size=0';
    }
    if (!url.includes('pgbouncer=true')) {
      url += '&pgbouncer=true';
    }
  }

  return url;
}

// Singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: getFormattedDatabaseUrl(),
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