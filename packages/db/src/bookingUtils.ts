import { PrismaClient } from '@prisma/client';

/**
 * Generates a unique, human-readable booking reference code in the format:
 * TVL-YYYY-XXXX (e.g. TVL-2026-0001)
 */
export async function generateBookingReference(prisma: PrismaClient): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TVL-${year}-`;

  // Find the highest existing booking reference for the current year
  const lastBooking = await prisma.booking.findFirst({
    where: {
      reference: {
        startsWith: prefix,
      },
    },
    orderBy: {
      reference: 'desc',
    },
    select: {
      reference: true,
    },
  });

  let nextSequence = 1;
  if (lastBooking && lastBooking.reference) {
    const parts = lastBooking.reference.split('-');
    if (parts.length === 3) {
      const lastNum = parseInt(parts[2], 10);
      if (!isNaN(lastNum)) {
        nextSequence = lastNum + 1;
      }
    }
  }

  const paddedSeq = nextSequence.toString().padStart(4, '0');
  return `${prefix}${paddedSeq}`;
}

/**
 * Calculates total booking amount given stay check-in/check-out dates and room base rate.
 */
export function calculateBookingTotal(checkIn: Date | string, checkOut: Date | string, baseRate: number | string): number {
  const checkInTime = new Date(checkIn).getTime();
  const checkOutTime = new Date(checkOut).getTime();

  if (isNaN(checkInTime) || isNaN(checkOutTime) || checkInTime >= checkOutTime) {
    return 0;
  }

  const diffMs = checkOutTime - checkInTime;
  const nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const rate = typeof baseRate === 'string' ? parseFloat(baseRate) : baseRate;

  return Number((nights * rate).toFixed(2));
}
